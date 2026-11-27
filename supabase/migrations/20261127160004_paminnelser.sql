-- Påminnelser och det dagliga jobbet. Steg 6 i planen för notiser, vänner, grupper och påminnelser
-- (Claude outputs/notiser/plan.md). Bygger på mejl (20261127160003).
--
-- Egna påminnelser: en text och ett datum, frivilligt för en tur man är med i. Personliga: bara ägaren når sina
-- rader. På morgonen den valda dagen blir påminnelsen en notis (och ett mejl om man vill).
-- Automatiska påminnelser är ingen tabell: det dagliga jobbet skapar notiser med en nyckel, så att samma påminnelse
-- aldrig kommer två gånger. En vecka före och dagen före avresan, till deltagare med konto.
-- Jobbet städar också: förfrågningar och spärrar som har gått ut, dolda notiser om förfrågningar och lästa notiser
-- som är äldre än 90 dagar.

-- ─── Notiserna ───────────────────────────────────────────────────────────────
alter table public.notiser drop constraint notiser_typ_check;
alter table public.notiser add constraint notiser_typ_check
  check (typ in ('gick_med', 'vanforfragan', 'van_godkand', 'van_via_lank', 'tillagd_i_tur', 'paminnelse', 'auto_paminnelse'));

-- Nyckeln gör att samma påminnelse bara skapas en gång per person.
alter table public.notiser add column nyckel text check (nyckel is null or char_length(nyckel) <= 120);
create unique index notiser_nyckel on public.notiser (user_id, nyckel) where nyckel is not null;

-- ─── Egna påminnelser ────────────────────────────────────────────────────────
create table public.paminnelser (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tur_id uuid references public.turer (id) on delete cascade,
  text text not null check (btrim(text) <> '' and char_length(text) <= 200),
  datum date not null,
  klar boolean not null default false,
  -- När påminnelsen blev en notis. Tom tills dess.
  skickad timestamptz,
  skapad timestamptz not null default now()
);
create index paminnelser_user_id on public.paminnelser (user_id, datum);
create index paminnelser_tur_id on public.paminnelser (tur_id);
create index paminnelser_att_skicka on public.paminnelser (datum) where skickad is null and not klar;

revoke all on public.paminnelser from public, anon, authenticated;
grant select, delete on public.paminnelser to authenticated;
grant insert (tur_id, text, datum) on public.paminnelser to authenticated;
grant update (text, datum, klar) on public.paminnelser to authenticated;
alter table public.paminnelser enable row level security;

create policy "ser sina egna" on public.paminnelser for select to authenticated using (user_id = auth.uid());
create policy "skapar sina egna" on public.paminnelser for insert to authenticated
  with check (user_id = auth.uid() and (tur_id is null or public.ar_medlem(tur_id)));
create policy "ändrar sina egna" on public.paminnelser for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tar bort sina egna" on public.paminnelser for delete to authenticated using (user_id = auth.uid());

-- Den som lämnar en tur (eller tas bort) behåller sina påminnelser, men utan turen. Ett nytt datum gör att en
-- påminnelse kan komma igen.
create function public.paminnelser_utan_tur() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.user_id is not null then
    update public.paminnelser set tur_id = null where tur_id = old.tur_id and user_id = old.user_id;
  end if;
  return old;
end;
$$;
revoke execute on function public.paminnelser_utan_tur() from public, anon, authenticated;
create trigger paminnelser_utan_tur after delete on public.deltagare for each row execute function public.paminnelser_utan_tur();

create function public.paminnelse_nytt_datum() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.datum is distinct from old.datum then
    new.skickad := null;
  end if;
  return new;
end;
$$;
revoke execute on function public.paminnelse_nytt_datum() from public, anon, authenticated;
create trigger paminnelse_nytt_datum before update on public.paminnelser for each row execute function public.paminnelse_nytt_datum();

-- ─── Mejl för påminnelserna ──────────────────────────────────────────────────
-- Samma regler som förut, och påminnelserna följer sina två val (egna på, automatiska av som standard).
create or replace function public.notis_mejl() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  val public.notisinstallningar;
  bekraftad boolean;
  senaste_dygnet integer;
begin
  if new.typ not in ('tillagd_i_tur', 'vanforfragan', 'paminnelse', 'auto_paminnelse') then
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
    when new.typ = 'paminnelse' and not coalesce(val.mejl_paminnelser, true) then 'hoppas_over'
    when new.typ = 'auto_paminnelse' and not coalesce(val.mejl_auto_paminnelser, false) then 'hoppas_over'
    when senaste_dygnet >= 10 then 'hoppas_over'
    else 'ska'
  end;
  return new;
end;
$$;
revoke execute on function public.notis_mejl() from public, anon, authenticated;

-- ─── Det dagliga jobbet ──────────────────────────────────────────────────────
-- Körs kl. 05.00 UTC. Dagen räknas i svensk tid. Kan köras flera gånger samma dag utan att något kommer två gånger.
create function public.dagliga_paminnelser() returns void
language plpgsql security definer set search_path = '' as $$
declare
  idag date := (now() at time zone 'Europe/Stockholm')::date;
begin
  -- Egna påminnelser, den valda dagen (eller senare, om jobbet har missat en dag).
  with nya as (
    update public.paminnelser p set skickad = now()
     where p.datum <= idag and p.skickad is null and not p.klar
     returning p.id, p.user_id, p.tur_id, p.text
  )
  insert into public.notiser (user_id, typ, text, lank, tur_id, nyckel)
  select nya.user_id, 'paminnelse', 'Påminnelse: ' || nya.text,
         case when nya.tur_id is null then '/hem' else '/tur/' || nya.tur_id end,
         nya.tur_id, 'paminnelse:' || nya.id || ':' || idag
    from nya
  on conflict (user_id, nyckel) where nyckel is not null do nothing;

  -- En vecka före och dagen före avresan, till deltagare med konto som är kvar i turen.
  insert into public.notiser (user_id, typ, text, lank, tur_id, nyckel)
  select d.user_id, 'auto_paminnelse',
         case when t.avresa = idag + 1 then 'I morgon börjar ' || t.namn || '.' else t.namn || ' börjar om en vecka.' end,
         '/tur/' || t.id, t.id,
         'auto:' || t.id || ':' || (t.avresa - idag)
    from public.turer t
    join public.deltagare d on d.tur_id = t.id and d.user_id is not null
   where t.avresa in (idag + 1, idag + 7)
  on conflict (user_id, nyckel) where nyckel is not null do nothing;

  -- Städningen.
  perform public.stada_vanner();
  delete from public.notiser where typ = 'vanforfragan' and vanforfragan_id is null and skapad <= now() - interval '30 days';
  delete from public.notiser where last is not null and last <= now() - interval '90 days';
  delete from public.tillagd_sparr where senaste <= now() - interval '1 day';
end;
$$;
revoke execute on function public.dagliga_paminnelser() from public, anon, authenticated;

do $$
begin
  if to_regnamespace('cron') is not null then
    perform cron.schedule('paminnelser', '0 5 * * *', 'select public.dagliga_paminnelser()');
  end if;
end;
$$;
