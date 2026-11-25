-- Vem bär och vem äter: varje rad i matplanen (maltider) kan ha en deltagare som bär den och en lista med dem som
-- äter den. En tom lista betyder att alla äter.
--
-- bars_av ersätter ratter.ansvarig och varor.ansvarig i Vem tar med vad. De kolumnerna står kvar för inköpslistan
-- tills den bygger på bars_av, och tas sedan bort (se docs/att-ta-senare.md).

-- ─── Vem bär ─────────────────────────────────────────────────────────────────
-- Den som bär måste vara med i samma tur. Tas den bort ur turen blir raden utan bärare och ligger kvar.
alter table public.maltider
  add column bars_av uuid,
  add constraint maltider_bars_av_samma_tur foreign key (bars_av, tur_id)
    references public.deltagare (id, tur_id) on delete set null (bars_av);

create index maltider_bars_av on public.maltider (bars_av) where bars_av is not null;

-- Det som redan är bestämt följer med: påsens ansvarig, och för en egen rätt den ansvariga om alla rättens varor
-- har samma. Har varorna olika ansvariga, eller saknar någon ansvarig, blir raden utan bärare.
update public.maltider m set bars_av = r.ansvarig
  from public.ratter r
  where r.id = m.ratt_id and r.matprodukt_id is not null and r.ansvarig is not null;

update public.maltider m set bars_av = e.ansvarig
  from (
    select i.ratt_id, min(v.ansvarig::text)::uuid as ansvarig
    from public.ingredienser i
    join public.varor v on v.id = i.vara_id
    group by i.ratt_id
    having count(*) filter (where v.ansvarig is null) = 0 and count(distinct v.ansvarig) = 1
  ) e
  where e.ratt_id = m.ratt_id and m.bars_av is null;

-- ─── Vem äter ────────────────────────────────────────────────────────────────
-- Gör det möjligt för främmande nycklar att kräva att raden och måltiden hör till samma tur.
alter table public.maltider add constraint maltider_id_tur unique (id, tur_id);

-- De som äter en rad i matplanen. Ingen rad för en måltid betyder att alla i turen äter den.
-- Raderna försvinner med måltidsraden och med deltagaren.
create table public.maltid_atare (
  maltid_id uuid not null,
  deltagare_id uuid not null,
  tur_id uuid not null references public.turer (id) on delete cascade,
  primary key (maltid_id, deltagare_id),
  constraint maltid_atare_maltid_samma_tur foreign key (maltid_id, tur_id)
    references public.maltider (id, tur_id) on delete cascade,
  constraint maltid_atare_deltagare_samma_tur foreign key (deltagare_id, tur_id)
    references public.deltagare (id, tur_id) on delete cascade
);

create index maltid_atare_tur on public.maltid_atare (tur_id);

-- Bara personer äter rätterna. Hundens mat räknas för sig (deltagare.hundmat_per_dag_g).
create function public.bara_personer_ater() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.deltagare d where d.id = new.deltagare_id and d.typ = 'person') then
    raise exception 'Bara personer kan äta en rätt' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bara_personer_ater before insert or update on public.maltid_atare
  for each row execute function public.bara_personer_ater();

revoke all on function public.bara_personer_ater() from public, anon, authenticated;

-- Blir en person en hund (ägaren kan ändra typen) slutar den att äta rätterna.
create function public.hund_ater_inte() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.typ <> 'person' and old.typ = 'person' then
    delete from public.maltid_atare where deltagare_id = new.id;
  end if;
  return new;
end;
$$;

create trigger hund_ater_inte after update of typ on public.deltagare
  for each row execute function public.hund_ater_inte();

revoke all on function public.hund_ater_inte() from public, anon, authenticated;

-- ─── Rättigheter för maltid_atare ────────────────────────────────────────────
-- Medlemmar ser. Ägare och redigerare lägger till och tar bort. En rad ändras inte, den tas bort och läggs till.
revoke all on public.maltid_atare from public, anon, authenticated;
grant select, insert, delete on public.maltid_atare to authenticated;

alter table public.maltid_atare enable row level security;

create policy "medlemmar ser" on public.maltid_atare for select to authenticated
  using (public.ar_medlem(tur_id));
create policy "owner och editor lägger till" on public.maltid_atare for insert to authenticated
  with check (public.kan_andra(tur_id));
create policy "owner och editor tar bort" on public.maltid_atare for delete to authenticated
  using (public.kan_andra(tur_id));

-- ─── Ta och släppa en rad själv ──────────────────────────────────────────────
-- Alla som är med i turen, även läsare, får ta en rad i matplanen som ingen bär, och släppa en rad de själva bär.
-- Man kan bara ta en rad åt sig själv. Ägare och redigerare ändrar bars_av som förut, med policyn på maltider.
-- ta_ratt svarar true när man bär raden efteråt, och false när någon annan redan bär den.
create function public.ta_ratt(rad uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  mig uuid;
begin
  select d.id into mig
    from public.maltider m
    join public.deltagare d on d.tur_id = m.tur_id and d.user_id = auth.uid()
    where m.id = rad;
  if mig is null then
    raise exception 'Inte med i turen' using errcode = '42501';
  end if;
  update public.maltider set bars_av = mig where id = rad and (bars_av is null or bars_av = mig);
  return found;
end;
$$;

revoke all on function public.ta_ratt(uuid) from public, anon;
grant execute on function public.ta_ratt(uuid) to authenticated;

-- Svarar true när raden blev utan bärare, och false när man inte bar den.
create function public.slapp_ratt(rad uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  mig uuid;
begin
  select d.id into mig
    from public.maltider m
    join public.deltagare d on d.tur_id = m.tur_id and d.user_id = auth.uid()
    where m.id = rad;
  if mig is null then
    raise exception 'Inte med i turen' using errcode = '42501';
  end if;
  update public.maltider set bars_av = null where id = rad and bars_av = mig;
  return found;
end;
$$;

revoke all on function public.slapp_ratt(uuid) from public, anon;
grant execute on function public.slapp_ratt(uuid) to authenticated;
