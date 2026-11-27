-- Mejl om notiser. Steg 5 i planen för notiser, vänner, grupper och påminnelser (Claude outputs/notiser/plan.md).
--
-- En notis som personen vill ha som mejl får mejl = 'ska' när den skapas. Ett schemalagt jobb (pg_cron, varannan
-- minut) anropar Edge Function skicka-mejl när något väntar. Funktionen hämtar kön med mejlko(), skickar via Resend
-- och markerar varje notis med mejl_markera(). Mejl går bara till bekräftade adresser hos personer med konto, aldrig
-- till en adress som någon har skrivit in, och aldrig för en notis som redan är läst eller dold. Varje mejl har en
-- länk för att avregistrera sig, som fungerar utan inloggning (avregistrera).
--
-- Adressen till funktionen och hemligheten som jobbet skickar med ligger i Supabase Vault (skicka_mejl_url och
-- cron_hemlighet), inte här. Innan de finns gör jobbet ingenting.

-- ─── Inställningarna ─────────────────────────────────────────────────────────
-- En rad per person. Saknas raden gäller standardvärdena. Kolumnerna för påminnelser används från steg 6.
create table public.notisinstallningar (
  user_id uuid primary key references auth.users (id) on delete cascade,
  mejl_tillagd_i_tur boolean not null default true,
  mejl_vanforfragan boolean not null default true,
  mejl_paminnelser boolean not null default true,
  mejl_auto_paminnelser boolean not null default false,
  -- När personen tryckte på avregistreringslänken. Då går inga mejl alls tills hen slår på dem igen.
  avregistrerad timestamptz,
  -- Koden i avregistreringslänken. Lång och slumpad, så att ingen kan gissa någon annans.
  avregistreringskod text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  andrad timestamptz not null default now()
);

revoke all on public.notisinstallningar from public, anon, authenticated;
-- Läsa sin rad, och skapa och ändra valen. Avregistreringen och koden ändras bara av funktionerna nedan.
grant select on public.notisinstallningar to authenticated;
grant insert (user_id, mejl_tillagd_i_tur, mejl_vanforfragan, mejl_paminnelser, mejl_auto_paminnelser) on public.notisinstallningar to authenticated;
grant update (mejl_tillagd_i_tur, mejl_vanforfragan, mejl_paminnelser, mejl_auto_paminnelser) on public.notisinstallningar to authenticated;
alter table public.notisinstallningar enable row level security;

create policy "ser sina egna" on public.notisinstallningar for select to authenticated using (user_id = auth.uid());
create policy "skapar sina egna" on public.notisinstallningar for insert to authenticated with check (user_id = auth.uid());
create policy "ändrar sina egna" on public.notisinstallningar for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Mejlstatus på notiserna ─────────────────────────────────────────────────
-- ska: väntar på att mejlas. skickat: mejlat. hoppas_over: ska inte mejlas. fel: misslyckades, försöks igen högst
-- tre gånger. Tom: den sortens notis mejlas aldrig. Appen kan inte ändra kolumnerna (bara last är öppen).
alter table public.notiser add column mejl text check (mejl in ('ska', 'skickat', 'hoppas_over', 'fel'));
alter table public.notiser add column mejl_forsok smallint not null default 0;
create index notiser_mejlko on public.notiser (skapad) where mejl in ('ska', 'fel');

-- Sätter mejl när notisen skapas. Bara notiser om att någon lade till en i en tur och om vänförfrågningar mejlas än.
-- Högst tio mejl per dygn till samma person; resten blir bara notiser i appen.
create function public.notis_mejl() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  val public.notisinstallningar;
  bekraftad boolean;
  senaste_dygnet integer;
begin
  if new.typ not in ('tillagd_i_tur', 'vanforfragan') then
    new.mejl := null;
    return new;
  end if;
  select * into val from public.notisinstallningar where user_id = new.user_id;
  select u.email_confirmed_at is not null into bekraftad from auth.users u where u.id = new.user_id;
  select count(*) into senaste_dygnet from public.notiser n
   where n.user_id = new.user_id and n.mejl in ('ska', 'skickat') and n.skapad > now() - interval '1 day';
  new.mejl := case
    when not coalesce(bekraftad, false) then 'hoppas_over'
    when val.avregistrerad is not null then 'hoppas_over'
    when new.typ = 'tillagd_i_tur' and not coalesce(val.mejl_tillagd_i_tur, true) then 'hoppas_over'
    when new.typ = 'vanforfragan' and not coalesce(val.mejl_vanforfragan, true) then 'hoppas_over'
    when senaste_dygnet >= 10 then 'hoppas_over'
    else 'ska'
  end;
  return new;
end;
$$;
revoke execute on function public.notis_mejl() from public, anon, authenticated;
create trigger notis_mejl before insert on public.notiser for each row execute function public.notis_mejl();

-- ─── Avregistrering ──────────────────────────────────────────────────────────
-- Koden i länken för en person. Skapar raden med standardvärdena om den saknas.
create function public.avregistreringskod(anvandare uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  kod text;
begin
  insert into public.notisinstallningar (user_id) values (anvandare) on conflict (user_id) do nothing;
  select n.avregistreringskod into kod from public.notisinstallningar n where n.user_id = anvandare;
  return kod;
end;
$$;
revoke execute on function public.avregistreringskod(uuid) from public, anon, authenticated;

-- Länken i mejlen. Fungerar utan inloggning och ändrar bara raden med koden. Svarar likadant oavsett om koden finns,
-- så att ingen kan pröva sig fram till koder.
create function public.avregistrera(kod text) returns void
language sql security definer set search_path = '' as $$
  update public.notisinstallningar
     set avregistrerad = coalesce(avregistrerad, now()), andrad = now()
   where avregistreringskod = kod and char_length(kod) = 48;
$$;
revoke execute on function public.avregistrera(text) from public;
grant execute on function public.avregistrera(text) to anon, authenticated;

-- Slår på mejlen igen för den inloggade efter en avregistrering.
create function public.mejl_pa_igen() returns void
language sql security definer set search_path = '' as $$
  update public.notisinstallningar set avregistrerad = null, andrad = now() where user_id = auth.uid();
$$;
revoke execute on function public.mejl_pa_igen() from public, anon;
grant execute on function public.mejl_pa_igen() to authenticated;

-- ─── Kön för Edge Function skicka-mejl ───────────────────────────────────────
-- Notiserna som ska mejlas, äldst först, med den bekräftade adressen och koden för avregistrering. Lästa och dolda
-- notiser, avregistrerade personer och notiser som har misslyckats tre gånger hoppas över. Bara service_role (Edge
-- Function) anropar den.
create function public.mejlko(antal integer default 20)
returns table (id uuid, typ text, text text, lank text, epost text, kod text)
language plpgsql security definer set search_path = '' as $$
begin
  update public.notiser n set mejl = 'hoppas_over'
   where n.mejl in ('ska', 'fel')
     and (n.last is not null
       or n.mejl_forsok >= 3
       or (n.typ = 'vanforfragan' and n.vanforfragan_id is null)
       or exists (select 1 from public.notisinstallningar s where s.user_id = n.user_id and s.avregistrerad is not null)
       or not exists (select 1 from auth.users u where u.id = n.user_id and u.email_confirmed_at is not null));
  return query
    select n.id, n.typ, n.text, n.lank, u.email::text, public.avregistreringskod(n.user_id)
      from public.notiser n
      join auth.users u on u.id = n.user_id
     where n.mejl in ('ska', 'fel')
     order by n.skapad
     limit greatest(1, least(antal, 50));
end;
$$;

-- Markerar en notis som mejlad, eller som misslyckad så att den försöks igen.
create function public.mejl_markera(notis uuid, ok boolean) returns void
language sql security definer set search_path = '' as $$
  update public.notiser
     set mejl = case when ok then 'skickat' else 'fel' end,
         mejl_forsok = mejl_forsok + case when ok then 0 else 1 end
   where id = notis and mejl in ('ska', 'fel');
$$;

revoke execute on function public.mejlko(integer) from public, anon, authenticated;
revoke execute on function public.mejl_markera(uuid, boolean) from public, anon, authenticated;
grant execute on function public.mejlko(integer) to service_role;
grant execute on function public.mejl_markera(uuid, boolean) to service_role;

-- ─── Det schemalagda jobbet ──────────────────────────────────────────────────
-- Anropar skicka-mejl när något väntar. Adressen och hemligheten läses ur Vault. Saknas de gör jobbet ingenting.
create function public.kor_mejlko() returns void
language plpgsql security definer set search_path = '' as $$
declare
  adress text;
  hemlighet text;
begin
  if not exists (select 1 from public.notiser where mejl in ('ska', 'fel')) then
    return;
  end if;
  select decrypted_secret into adress from vault.decrypted_secrets where name = 'skicka_mejl_url';
  select decrypted_secret into hemlighet from vault.decrypted_secrets where name = 'cron_hemlighet';
  if adress is null or hemlighet is null then
    return;
  end if;
  perform net.http_post(
    url := adress,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || hemlighet),
    body := '{}'::jsonb
  );
end;
$$;
revoke execute on function public.kor_mejlko() from public, anon, authenticated;

-- pg_cron och pg_net finns i Supabase. Där de saknas (testet i PGlite har egna kopior) görs inget här.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  end if;
  if to_regnamespace('cron') is not null then
    perform cron.schedule('skicka-mejl', '*/2 * * * *', 'select public.kor_mejlko()');
  end if;
end;
$$;
