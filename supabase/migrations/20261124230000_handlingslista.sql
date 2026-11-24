-- Handlingslistan: ingredienser skrivs med mängd och enhet (2 dl, 1 st, 1 msk), gram är frivilligt, en egen rätt
-- och ett recept får sakna ingredienser, och varje vara kan få en butiksavdelning.
--
-- Inga rader tas bort. Befintliga ingredienser och receptrader får mängden i gram (mangd = gram, enhet = g), så att
-- de visas som förut.

-- ─── Mängd och enhet ─────────────────────────────────────────────────────────
-- Enheterna är desamma som i src/lib/handla.ts, och ett test kontrollerar att de stämmer överens.
-- mangd och enhet sätts tillsammans. gram_per_portion är vikten som energin och matvikten räknas med. För g och kg
-- räknas den ut i spara-funktionerna. För övriga enheter är den frivillig.
alter table public.ingredienser
  alter column gram_per_portion drop not null,
  add column mangd numeric(7, 2) check (mangd > 0 and mangd <= 10000),
  add column enhet text check (enhet in ('g', 'kg', 'dl', 'ml', 'st', 'msk', 'tsk')),
  add constraint ingredienser_mangd_och_enhet check ((mangd is null) = (enhet is null));

alter table public.receptrader
  alter column gram_per_portion drop not null,
  add column mangd numeric(7, 2) check (mangd > 0 and mangd <= 10000),
  add column enhet text check (enhet in ('g', 'kg', 'dl', 'ml', 'st', 'msk', 'tsk')),
  add constraint receptrader_mangd_och_enhet check ((mangd is null) = (enhet is null));

update public.ingredienser set mangd = gram_per_portion, enhet = 'g' where gram_per_portion between 1 and 10000;
update public.receptrader set mangd = gram_per_portion, enhet = 'g' where gram_per_portion between 1 and 10000;

-- För g och kg är gram samma sak som mängden, så de två kan inte visa olika vikt.
alter table public.ingredienser add constraint ingredienser_gram_av_mangd check (
  enhet is null or enhet not in ('g', 'kg') or gram_per_portion = round(mangd * case enhet when 'kg' then 1000 else 1 end)
);
alter table public.receptrader add constraint receptrader_gram_av_mangd check (
  enhet is null or enhet not in ('g', 'kg') or gram_per_portion = round(mangd * case enhet when 'kg' then 1000 else 1 end)
);

-- ─── Butiksavdelning ─────────────────────────────────────────────────────────
-- Var varan finns i butiken, så att handlingslistan kan sorteras som en runda i butiken. Tom: appen gissar utifrån
-- namnet. Nycklarna står i src/lib/handla.ts, och ett test kontrollerar att de stämmer överens.
alter table public.varor
  add column avdelning text check (avdelning in (
    'frukt_gront', 'brod', 'mejeri', 'kott_fisk', 'torrvaror', 'skafferi', 'fryst', 'snacks', 'dryck', 'friluft', 'ovrigt'
  ));

-- ─── Egen rätt ───────────────────────────────────────────────────────────────
-- Samma som förut (20261124120001_spara_ratt_och_recept.sql), med tre skillnader:
--   1. Rätten får sakna ingredienser. Då har den bara ett namn, till exempel "Fika hos mormor".
--   2. Varje rad har mängd och enhet. Gram räknas ut för g och kg och är frivilligt för övriga enheter.
--   3. Gram och mängd får båda saknas, för det man bara vill komma ihåg att ta med, till exempel salt.
-- Raderna kommer som [{"vara": "Mjölk", "mangd": 2, "enhet": "dl", "gram": 200, "kcal": 64, "protein": 3.4}].
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
           (e.el ->> 'gram')::int as gram, (e.el ->> 'kcal')::int as kcal, (e.el ->> 'protein')::numeric as protein
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
      insert into public.varor (tur_id, namn, kcal_per_100g, protein_per_100g)
        values (t, rad.vara, rad.kcal, rad.protein)
        returning id into varan;
    elsif rad.kcal is not null or rad.protein is not null then
      update public.varor
        set kcal_per_100g = coalesce(rad.kcal, kcal_per_100g),
            protein_per_100g = coalesce(rad.protein, protein_per_100g)
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
-- Samma som förut, men receptet får sakna rader, och raderna har mängd och enhet. Gram räknas ut för g och kg.
-- Tabellens egna gränser (vara, gram, mängd, enhet, kcal, protein och en vara per recept) gäller.
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

  insert into public.receptrader (recept_id, vara, mangd, enhet, gram_per_portion, kcal_per_100g, protein_per_100g, sortering)
    select receptet, x.vara, x.mangd, x.enhet,
           case x.enhet when 'g' then round(x.mangd)::int when 'kg' then round(x.mangd * 1000)::int else x.gram end,
           x.kcal, x.protein, x.nr - 1
    from jsonb_array_elements(rader) with ordinality as e(el, nr)
    -- Mängden sparas med två decimaler, så gram räknas från den avrundade mängden.
    cross join lateral (
      select btrim(e.el ->> 'vara') as vara, round((e.el ->> 'mangd')::numeric, 2) as mangd, e.el ->> 'enhet' as enhet,
             (e.el ->> 'gram')::int as gram, (e.el ->> 'kcal')::int as kcal, (e.el ->> 'protein')::numeric as protein, e.nr
    ) x;

  return receptet;
end;
$$;
