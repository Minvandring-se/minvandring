-- Varukatalogen: märkesvaror från butiken (bröd, ost, korv, snabbmat, tuber, mellanmål och drycker)
-- med näring per 100 g och allergener. Den fylls bara via migreringar från CSV-filerna i supabase/katalog/varor
-- (npm run varukatalog), som matkatalogen.
--
-- En vara i en tur (varor) och en rad i ett recept (receptrader) kan peka på varan den valdes från. Då räknar appen
-- med varans allergener och kostval för egna rätter. Utan koppling är allergenerna okända, och okänt räknas aldrig
-- som att något passar.
--
-- Datumet ligger efter de okörda migreringarna i PR 2–4 (20261125210000–03).

create table public.varukatalog (
  id uuid primary key default gen_random_uuid(),
  marke text not null check (btrim(marke) <> '' and char_length(marke) <= 80),
  namn text not null check (btrim(namn) <> '' and char_length(namn) <= 120),
  kategori text not null check (kategori in ('brod', 'frukost', 'ost_mejeri', 'korv_chark', 'snabbmat', 'tuber_smaksattning', 'mellanmal', 'drycker')),
  forpackning_g int not null check (forpackning_g between 1 and 20000),
  portion_g numeric(6, 2) check (portion_g between 0 and 5000),
  kcal_per_100g int not null check (kcal_per_100g between 0 and 900),
  protein_per_100g numeric(5, 2) check (protein_per_100g between 0 and 100),
  fett_per_100g numeric(5, 2) check (fett_per_100g between 0 and 100),
  kolhydrater_per_100g numeric(5, 2) check (kolhydrater_per_100g between 0 and 100),
  fiber_per_100g numeric(5, 2) check (fiber_per_100g between 0 and 100),
  socker_per_100g numeric(5, 2) check (socker_per_100g between 0 and 100),
  salt_per_100g numeric(5, 2) check (salt_per_100g between 0 and 100),
  vatten_ml int check (vatten_ml between 0 and 100000),
  tillagning text check (char_length(tillagning) <= 500),
  vegetarisk boolean,
  vegansk boolean,
  glutenfri boolean,
  laktosfri boolean,
  -- Tom (null) betyder okänt, en tom lista att varan inte innehåller någon av de 14.
  allergener public.allergenlista,
  spar public.allergenlista,
  haller_utan_kyl boolean,
  ean text check (ean ~ '^\d{8,14}$'),
  pris_sek_ca numeric(8, 2) check (pris_sek_ca >= 0),
  pris_kalla text check (pris_kalla ~ '^https?://'),
  kalla text not null check (kalla ~ '^https?://')
);

create unique index varukatalog_unik on public.varukatalog (lower(marke), lower(namn));

-- Inloggade läser. Ingen ändrar via API:t: katalogen fylls bara via migreringar.
revoke all on public.varukatalog from public, anon, authenticated;
grant select on public.varukatalog to authenticated;

alter table public.varukatalog enable row level security;

create policy "inloggade läser varukatalogen" on public.varukatalog for select to authenticated
  using (true);

-- ─── Kopplingen från turens varor och receptens rader ───────────────────────
-- Försvinner en vara ur katalogen blir kopplingen tom, och varan i turen eller receptet finns kvar.
alter table public.varor add column varukatalog_id uuid references public.varukatalog (id) on delete set null;
alter table public.receptrader add column varukatalog_id uuid references public.varukatalog (id) on delete set null;

create index varor_varukatalog on public.varor (varukatalog_id) where varukatalog_id is not null;
create index receptrader_varukatalog on public.receptrader (varukatalog_id) where varukatalog_id is not null;

-- ─── Egen rätt ───────────────────────────────────────────────────────────────
-- Samma som i 20261125210001_konto_och_matregler.sql (där ett tömt fält tömmer kcal och protein), med en skillnad:
-- en rad kan ha "varukatalog", varan i katalogen som den valdes från. Den sparas på varan i turen när nyckeln
-- finns, även som null (då tas kopplingen bort).
create or replace function public.spara_egen_ratt(
  t uuid,
  r uuid,
  ratt_namn text,
  rader jsonb,
  dag_nr int default null,
  maltid_typ text default null,
  plats int default 0
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  ratten uuid := r;
  nytt_namn text := btrim(ratt_namn);
  rad record;
  varan uuid;
  gram int;
  mangd numeric;
begin
  if nytt_namn is null or nytt_namn = '' or char_length(nytt_namn) > 80 then
    raise exception 'Rätten behöver ett namn på högst 80 tecken';
  end if;
  if jsonb_typeof(rader) is distinct from 'array' then
    raise exception 'Ingredienserna ska vara en lista';
  end if;

  if ratten is null then
    insert into public.ratter (tur_id, namn) values (t, nytt_namn) returning id into ratten;
  else
    -- RLS släpper bara fram rätten för owner och editor. Påsar ur katalogen ändras inte här.
    update public.ratter set namn = nytt_namn where id = ratten and tur_id = t and matprodukt_id is null;
    if not found then
      raise exception 'Rätten gick inte att ändra';
    end if;
    delete from public.ingredienser where ratt_id = ratten;
  end if;

  for rad in
    select e.nr, btrim(e.el ->> 'vara') as vara, (e.el ->> 'mangd')::numeric as mangd, e.el ->> 'enhet' as enhet,
           (e.el ->> 'gram')::int as gram, (e.el ->> 'kcal')::int as kcal, (e.el ->> 'protein')::numeric as protein,
           e.el ? 'kcal' as har_kcal, e.el ? 'protein' as har_protein,
           (e.el ->> 'varukatalog')::uuid as varukatalog, e.el ? 'varukatalog' as har_varukatalog
    from jsonb_array_elements(rader) with ordinality as e(el, nr)
    order by e.nr
  loop
    if rad.vara is null or rad.vara = '' or char_length(rad.vara) > 80 then
      raise exception 'Ingrediens %: namnet saknas eller är för långt', rad.nr;
    end if;
    if (rad.mangd is null) <> (rad.enhet is null) then
      raise exception 'Ingrediens %: mängd och enhet anges tillsammans', rad.nr;
    end if;
    -- Mängden sparas med två decimaler, så gram räknas från den avrundade mängden.
    mangd := round(rad.mangd, 2);
    if mangd is not null and mangd not between 0.01 and 10000 then
      raise exception 'Ingrediens %: mängden ska vara mellan 0,01 och 10000', rad.nr;
    end if;
    gram := case rad.enhet when 'g' then round(mangd) when 'kg' then round(mangd * 1000) else rad.gram end;
    if gram is not null and gram not between 1 and 5000 then
      raise exception 'Ingrediens %: gram per portion ska vara mellan 1 och 5000', rad.nr;
    end if;
    if rad.kcal not between 0 and 900 then
      raise exception 'Ingrediens %: kcal per 100 g ska vara mellan 0 och 900', rad.nr;
    end if;
    if rad.protein not between 0 and 100 then
      raise exception 'Ingrediens %: protein per 100 g ska vara mellan 0 och 100', rad.nr;
    end if;

    select v.id into varan from public.varor v
      where v.tur_id = t and lower(v.namn) = lower(rad.vara)
      order by v.id limit 1;
    if varan is null then
      insert into public.varor (tur_id, namn, kcal_per_100g, protein_per_100g, varukatalog_id)
        values (t, rad.vara, rad.kcal, rad.protein, rad.varukatalog)
        returning id into varan;
    elsif rad.har_kcal or rad.har_protein or rad.har_varukatalog then
      update public.varor
        set kcal_per_100g = case when rad.har_kcal then rad.kcal else kcal_per_100g end,
            protein_per_100g = case when rad.har_protein then rad.protein else protein_per_100g end,
            varukatalog_id = case when rad.har_varukatalog then rad.varukatalog else varukatalog_id end
        where id = varan;
    end if;

    -- Samma vara två gånger stoppas, som i formuläret och i receptrader.
    if exists (select 1 from public.ingredienser i where i.ratt_id = ratten and i.vara_id = varan) then
      raise exception 'Ingrediens %: % står två gånger', rad.nr, rad.vara;
    end if;
    -- Enhetens check stoppar okända enheter.
    insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion, mangd, enhet)
      values (t, ratten, varan, gram, mangd, rad.enhet);
  end loop;

  if dag_nr is not null or maltid_typ is not null then
    insert into public.maltider (tur_id, dag, maltid, ratt_id, sortering) values (t, dag_nr, maltid_typ, ratten, plats);
  end if;

  return ratten;
end;
$$;

-- ─── Recept ──────────────────────────────────────────────────────────────────
-- Samma som i 20261124230000_handlingslista.sql, och raderna kan peka på en vara i katalogen.
create or replace function public.spara_recept(r uuid, recept_namn text, rader jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  receptet uuid := r;
begin
  if jsonb_typeof(rader) is distinct from 'array' then
    raise exception 'Raderna ska vara en lista';
  end if;

  if receptet is null then
    insert into public.recept (namn) values (btrim(recept_namn)) returning id into receptet;
  else
    -- RLS släpper bara fram ens egna recept.
    update public.recept set namn = btrim(recept_namn) where id = receptet;
    if not found then
      raise exception 'Receptet gick inte att ändra';
    end if;
    delete from public.receptrader where recept_id = receptet;
  end if;

  insert into public.receptrader (recept_id, vara, mangd, enhet, gram_per_portion, kcal_per_100g, protein_per_100g, sortering, varukatalog_id)
    select receptet, x.vara, x.mangd, x.enhet,
           case x.enhet when 'g' then round(x.mangd)::int when 'kg' then round(x.mangd * 1000)::int else x.gram end,
           x.kcal, x.protein, x.nr - 1, x.varukatalog
    from jsonb_array_elements(rader) with ordinality as e(el, nr)
    -- Mängden sparas med två decimaler, så gram räknas från den avrundade mängden.
    cross join lateral (
      select btrim(e.el ->> 'vara') as vara, round((e.el ->> 'mangd')::numeric, 2) as mangd, e.el ->> 'enhet' as enhet,
             (e.el ->> 'gram')::int as gram, (e.el ->> 'kcal')::int as kcal, (e.el ->> 'protein')::numeric as protein,
             (e.el ->> 'varukatalog')::uuid as varukatalog, e.nr
    ) x;

  return receptet;
end;
$$;
