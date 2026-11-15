-- Säkrare inbjudningar.
-- 1. Lång slumpkod (18 slumpbyte, 24 url-säkra tecken) i stället för 6 hex-tecken från md5(random()).
-- 2. Koden ligger i en egen tabell som bara ägare och redigerare kan läsa. Ingen kan ändra den direkt.
-- 3. Ägaren kan byta koden med ny_inbjudningskod. Då slutar den gamla länken fungera.
-- 4. ga_med tillåter högst 10 felaktiga koder per konto och timme.
-- Alla befintliga koder byts ut, så gamla länkar slutar fungera.

create extension if not exists pgcrypto with schema extensions;

-- En ny slumpkod, url-säker base64 utan utfyllnad.
create function public.slumpkod() returns text
language sql volatile set search_path = '' as $$
  select translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');
$$;
revoke execute on function public.slumpkod() from public, anon, authenticated;

-- ─── Inbjudningar ────────────────────────────────────────────────────────────
create table public.inbjudningar (
  tur_id uuid primary key references public.turer (id) on delete cascade,
  kod text not null unique default public.slumpkod()
);
alter table public.inbjudningar enable row level security;
revoke all on public.inbjudningar from anon, authenticated;
grant select on public.inbjudningar to authenticated;
create policy "ägare och redigerare ser koden" on public.inbjudningar for select to authenticated
  using (public.kan_andra(tur_id));

-- Nya koder för alla befintliga turer. Den gamla kolumnen tas bort.
insert into public.inbjudningar (tur_id) select id from public.turer;
alter table public.turer drop column inbjudningskod;

-- Varje ny tur får en inbjudan.
create function public.ny_inbjudan() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.inbjudningar (tur_id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.ny_inbjudan() from public, anon, authenticated;
create trigger skapa_inbjudan after insert on public.turer
  for each row execute function public.ny_inbjudan();

-- Ägaren byter koden. Den gamla slutar fungera direkt.
create function public.ny_inbjudningskod(t uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  ny text;
begin
  if not public.ar_agare(t) then
    raise exception 'Bara ägaren kan skapa en ny länk';
  end if;
  insert into public.inbjudningar (tur_id, kod) values (t, public.slumpkod())
  on conflict (tur_id) do update set kod = excluded.kod
  returning kod into ny;
  return ny;
end;
$$;
revoke execute on function public.ny_inbjudningskod(uuid) from public, anon;
grant execute on function public.ny_inbjudningskod(uuid) to authenticated;

-- ─── Felaktiga försök i ga_med ───────────────────────────────────────────────
-- Ingen roll får läsa eller skriva här. Bara ga_med (security definer) använder tabellen.
create table public.inbjudningsforsok (
  user_id uuid not null references auth.users (id) on delete cascade,
  tid timestamptz not null default now()
);
create index inbjudningsforsok_user_tid on public.inbjudningsforsok (user_id, tid);
alter table public.inbjudningsforsok enable row level security;
revoke all on public.inbjudningsforsok from anon, authenticated;

-- Gå med i en tur med inbjudningskoden. Returnerar turens id, eller null om koden är fel.
-- Fel kod ger null i stället för ett fel, så att försöket sparas (ett fel skulle ångra det).
create or replace function public.ga_med(kod text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t uuid;
  anvandare uuid := auth.uid();
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  delete from public.inbjudningsforsok f where f.user_id = anvandare and f.tid < now() - interval '1 day';
  if (select count(*) from public.inbjudningsforsok f where f.user_id = anvandare and f.tid > now() - interval '1 hour') >= 10 then
    raise exception 'För många försök. Vänta en stund och försök igen.';
  end if;
  select i.tur_id into t from public.inbjudningar i where i.kod = trim(ga_med.kod);
  if t is null then
    insert into public.inbjudningsforsok (user_id) values (anvandare);
    return null;
  end if;
  insert into public.deltagare (tur_id, user_id, namn, sortering)
  values (
    t,
    anvandare,
    coalesce((select p.namn from public.profiler p where p.id = anvandare), 'Ny deltagare'),
    (select coalesce(max(d.sortering), 0) + 1 from public.deltagare d where d.tur_id = t)
  )
  on conflict (tur_id, user_id) do nothing;
  return t;
end;
$$;
