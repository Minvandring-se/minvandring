-- Anteckningar i en tur och lärdomar till nästa vandring.
--
-- anteckningar: var och en i turen, även en läsare, skriver egna anteckningar. En delad anteckning syns för alla
-- i turen, en privat bara för den som skrev den. Man ändrar bara sina egna. Ägaren kan ta bort andras delade
-- anteckningar, men aldrig se eller ta bort någon annans privata.
--
-- lardomar: personliga, som förrådet. Bara den som skrev en lärdom ser och ändrar den, även när man delar en tur.
-- En lärdom kan höra till en tur. Turens namn sparas när lärdomen skrivs, så att den visar varifrån den kom även
-- när turen är borttagen eller man inte längre är med i den.

-- ─── Anteckningar ───────────────────────────────────────────────────────────
create table public.anteckningar (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (btrim(text) <> '' and char_length(text) <= 2000),
  privat boolean not null default false,
  skapad timestamptz not null default now(),
  andrad timestamptz not null default now()
);
create index anteckningar_tur_id on public.anteckningar (tur_id);

revoke all on public.anteckningar from public, anon, authenticated;
-- Skribenten och tiderna sätts av databasen, och bara texten och privat-valet går att ändra.
grant select, delete on public.anteckningar to authenticated;
grant insert (id, tur_id, text, privat) on public.anteckningar to authenticated;
grant update (text, privat) on public.anteckningar to authenticated;
alter table public.anteckningar enable row level security;

create policy "medlemmar ser delade och sina egna" on public.anteckningar for select to authenticated
  using (public.ar_medlem(tur_id) and (not privat or user_id = auth.uid()));
create policy "medlemmar skriver egna" on public.anteckningar for insert to authenticated
  with check (public.ar_medlem(tur_id) and user_id = auth.uid());
create policy "var och en ändrar sina egna" on public.anteckningar for update to authenticated
  using (public.ar_medlem(tur_id) and user_id = auth.uid())
  with check (public.ar_medlem(tur_id) and user_id = auth.uid());
create policy "egna, och ägaren tar bort delade" on public.anteckningar for delete to authenticated
  using (public.ar_medlem(tur_id) and (user_id = auth.uid() or (public.ar_agare(tur_id) and not privat)));

create function public.anteckning_andrad() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.andrad := now();
  return new;
end;
$$;
revoke execute on function public.anteckning_andrad() from public, anon, authenticated;
create trigger anteckning_andrad before update on public.anteckningar
  for each row execute function public.anteckning_andrad();

-- En deltagare som tas bort ur turen förlorar sina privata anteckningar där. Ingen annan får se eller ta bort dem,
-- och de ska inte dyka upp igen om personen går med på nytt. De delade blir kvar hos gruppen.
create function public.privata_anteckningar_bort() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.user_id is not null then
    delete from public.anteckningar where tur_id = old.tur_id and user_id = old.user_id and privat;
  end if;
  return old;
end;
$$;
revoke execute on function public.privata_anteckningar_bort() from public, anon, authenticated;
create trigger privata_anteckningar_bort after delete on public.deltagare
  for each row execute function public.privata_anteckningar_bort();

-- Ändringar syns direkt för de andra i turen. Nya och ändrade rader skickas bara till dem som får läsa dem, så en
-- privat anteckning skickas bara till den som skrev den. En borttagning skickar bara id, till alla som lyssnar på
-- tabellen, eftersom replica identity inte är full. Sätt den inte till full: då skulle hela raden följa med.
alter publication supabase_realtime add table public.anteckningar;

-- ─── Lärdomar ───────────────────────────────────────────────────────────────
-- Ämnena står också i AMNEN i src/lib/lardomar.ts, och ett test kontrollerar att de stämmer överens.
create table public.lardomar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tur_id uuid references public.turer (id) on delete set null,
  tur_namn text,
  amne text not null check (amne in ('packning', 'mat', 'sova', 'klader', 'leden', 'ovrigt')),
  text text not null check (btrim(text) <> '' and char_length(text) <= 300),
  skapad timestamptz not null default now()
);
create index lardomar_user_id on public.lardomar (user_id);

revoke all on public.lardomar from public, anon, authenticated;
grant select, delete on public.lardomar to authenticated;
grant insert (id, tur_id, amne, text) on public.lardomar to authenticated;
grant update (amne, text) on public.lardomar to authenticated;
alter table public.lardomar enable row level security;

create policy "ägaren ser sina" on public.lardomar for select to authenticated using (user_id = auth.uid());
-- En lärdom kan bara knytas till en tur man är med i.
create policy "ägaren skriver sina" on public.lardomar for insert to authenticated
  with check (user_id = auth.uid() and (tur_id is null or public.ar_medlem(tur_id)));
create policy "ägaren ändrar sina" on public.lardomar for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ägaren tar bort sina" on public.lardomar for delete to authenticated using (user_id = auth.uid());

-- Turens namn hämtas av databasen. Den som skriver är med i turen och läser namnet med sina egna rättigheter.
create function public.lardom_tur_namn() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.tur_namn := case when new.tur_id is null then null else (select t.namn from public.turer t where t.id = new.tur_id) end;
  return new;
end;
$$;
revoke execute on function public.lardom_tur_namn() from public, anon, authenticated;
create trigger lardom_tur_namn before insert on public.lardomar
  for each row execute function public.lardom_tur_namn();
