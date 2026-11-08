-- Fas 1: roller i turen (owner, editor, viewer) och skärpta regler.
--   owner  äger turen. Kan ändra allt, ändra roller, ta bort deltagare och radera turen.
--   editor kan ändra turen och allt i den (packning, mat, rutt). Kan lägga till hundar och platshållare.
--   viewer ser allt men kan bara bocka av sin egen packning och lämna turen.
-- Den som skapar en tur blir owner. Den som går med via inbjudan blir editor.

-- ─── Roller ──────────────────────────────────────────────────────────────────
alter table public.deltagare
  add column roll text not null default 'editor' check (roll in ('owner', 'editor', 'viewer'));

-- Turer som redan finns: skaparen blir owner.
update public.deltagare d set roll = 'owner'
  from public.turer t
  where t.id = d.tur_id and d.user_id = t.skapad_av;

-- Den inloggades roll i turen, eller null om hen inte är med.
create function public.min_roll(t uuid) returns text
language sql stable security definer set search_path = '' as $$
  select d.roll from public.deltagare d where d.tur_id = t and d.user_id = auth.uid();
$$;

create function public.kan_andra(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.min_roll(t) in ('owner', 'editor'), false);
$$;

create function public.ar_agare(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.min_roll(t) = 'owner', false);
$$;

grant execute on function public.min_roll(uuid), public.kan_andra(uuid), public.ar_agare(uuid) to authenticated;

-- Skaparen blir owner.
create or replace function public.ny_tur() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.deltagare (tur_id, user_id, namn, roll)
  values (new.id, new.skapad_av, coalesce((select p.namn from public.profiler p where p.id = new.skapad_av), 'Jag'), 'owner');
  return new;
end;
$$;

-- ─── Skydd för deltagare som RLS inte klarar själv ──────────────────────────
-- Bara owner får ändra roller. Ingen får byta vem en rad tillhör (user_id), det sker bara via ga_med.
-- En tur måste alltid ha minst en owner.
create function public.skydda_deltagare() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  andra_agare int;
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.tur_id <> old.tur_id then
      raise exception 'Det går inte att flytta en deltagare';
    end if;
    if new.roll <> old.roll and not public.ar_agare(old.tur_id) then
      raise exception 'Bara ägaren kan ändra roller';
    end if;
  end if;

  if old.roll = 'owner' and (tg_op = 'DELETE' or new.roll <> 'owner') then
    select count(*) into andra_agare from public.deltagare
      where tur_id = old.tur_id and roll = 'owner' and id <> old.id;
    -- När hela turen raderas tas deltagarna bort i samma veva. Då finns turen inte längre.
    if andra_agare = 0 and exists (select 1 from public.turer where id = old.tur_id) then
      raise exception 'Turen måste ha minst en ägare';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger skydda_deltagare before update or delete on public.deltagare
  for each row execute function public.skydda_deltagare();

-- Nya rader i deltagare får inte ge åtkomst åt någon annan. Riktiga användare går med via ga_med.
create function public.ny_deltagare_utan_konto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- ga_med och ny_tur körs som security definer och sätter user_id själva. Andra insättningar får inte göra det.
  if new.user_id is not null and new.user_id <> auth.uid() then
    raise exception 'Bjud in med länken i stället';
  end if;
  return new;
end;
$$;

create trigger ny_deltagare_utan_konto before insert on public.deltagare
  for each row execute function public.ny_deltagare_utan_konto();

-- Namnet i profilen följer med till alla turer man är med i.
create function public.synka_namn() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.namn is distinct from old.namn then
    update public.deltagare set namn = new.namn where user_id = new.id;
  end if;
  return new;
end;
$$;

create trigger synka_namn after update on public.profiler
  for each row execute function public.synka_namn();

-- ─── Nya policies ────────────────────────────────────────────────────────────
-- Turer: alla medlemmar ser, owner och editor ändrar, bara owner raderar.
drop policy "medlemmar ändrar turen" on public.turer;
drop policy "skaparen tar bort turen" on public.turer;
create policy "owner och editor ändrar turen" on public.turer for update to authenticated
  using (public.kan_andra(id)) with check (public.kan_andra(id));
create policy "owner raderar turen" on public.turer for delete to authenticated
  using (public.ar_agare(id));

-- Deltagare
drop policy "medlemmar" on public.deltagare;
create policy "medlemmar ser deltagare" on public.deltagare for select to authenticated
  using (public.ar_medlem(tur_id));
create policy "owner och editor lägger till hundar och platshållare" on public.deltagare for insert to authenticated
  with check (public.kan_andra(tur_id) and user_id is null and roll <> 'owner');
create policy "owner och editor ändrar deltagare" on public.deltagare for update to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));
create policy "ta bort deltagare eller lämna turen" on public.deltagare for delete to authenticated
  using (
    public.ar_agare(tur_id)
    or (public.kan_andra(tur_id) and user_id is null)
    or user_id = auth.uid()
  );

-- Packning, mat: alla medlemmar ser, owner och editor ändrar.
drop policy "medlemmar" on public.packrader;
drop policy "medlemmar" on public.varor;
drop policy "medlemmar" on public.ratter;
drop policy "medlemmar" on public.maltider;
drop policy "medlemmar" on public.ingredienser;
drop policy "medlemmar" on public.packstatus;

create policy "medlemmar ser" on public.packrader for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor ändrar" on public.packrader for all to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));

create policy "medlemmar ser" on public.varor for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor ändrar" on public.varor for all to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));

create policy "medlemmar ser" on public.ratter for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor ändrar" on public.ratter for all to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));

create policy "medlemmar ser" on public.maltider for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor ändrar" on public.maltider for all to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));

create policy "medlemmar ser" on public.ingredienser for select to authenticated
  using (public.ar_medlem((select r.tur_id from public.ratter r where r.id = ratt_id)));
create policy "owner och editor ändrar" on public.ingredienser for all to authenticated
  using (public.kan_andra((select r.tur_id from public.ratter r where r.id = ratt_id)))
  with check (public.kan_andra((select r.tur_id from public.ratter r where r.id = ratt_id)));

-- Packstatus: owner och editor ändrar allas. Alla, även viewer, får bocka av sin egen packning.
create policy "medlemmar ser" on public.packstatus for select to authenticated
  using (public.ar_medlem((select r.tur_id from public.packrader r where r.id = packrad_id)));
create policy "owner, editor eller egen bock" on public.packstatus for all to authenticated
  using (
    public.kan_andra((select r.tur_id from public.packrader r where r.id = packrad_id))
    or exists (select 1 from public.deltagare d where d.id = deltagare_id and d.user_id = auth.uid())
  )
  with check (
    public.kan_andra((select r.tur_id from public.packrader r where r.id = packrad_id))
    or exists (
      select 1 from public.deltagare d join public.packrader r on r.tur_id = d.tur_id
      where d.id = deltagare_id and r.id = packrad_id and d.user_id = auth.uid()
    )
  );
