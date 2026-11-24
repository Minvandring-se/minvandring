-- En egen rätt och ett recept sparas med alla ingredienser i en funktion, alltså i en transaktion.
-- Förut sparade appen rätten, varorna och ingredienserna i flera anrop och tog bort de gamla ingredienserna först.
-- Föll ett senare anrop (nätet, ett felaktigt värde) blev rätten eller receptet kvar utan ingredienser.
-- Nu sparas allt eller ingenting.
--
-- Båda funktionerna körs som den inloggade (security invoker), som ta_bort_egen_ratt, så RLS gäller som vanligt:
--   spara_egen_ratt  bara owner och editor i turen (kan_andra), och bara egna rätter, inte påsar ur katalogen.
--   spara_recept     bara ens egna recept (user_id = auth.uid()).
--
-- Ingredienserna kommer som en lista i jsonb: [{"vara": "Havregryn", "gram": 90, "kcal": 380, "protein": 12.5}].
-- kcal och protein per 100 g får vara null. Gränserna är desamma som i formuläret (src/lib/mat.ts) och i receptrader.

-- ─── Egen rätt ───────────────────────────────────────────────────────────────
-- r = null skapar en ny rätt, annars ändras rätten r i turen t och får alla sina ingredienser på nytt.
-- Med dag_nr och maltid_typ läggs rätten också i måltiden, sist på platsen plats, i samma transaktion.
-- Varor som redan finns i turen (samma namn oavsett stora och små bokstäver) används igen och får de nya
-- värdena för kcal och protein när de är ifyllda.
create function public.spara_egen_ratt(
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
begin
  if nytt_namn is null or nytt_namn = '' or char_length(nytt_namn) > 80 then
    raise exception 'Rätten behöver ett namn på högst 80 tecken';
  end if;
  if jsonb_typeof(rader) is distinct from 'array' or jsonb_array_length(rader) = 0 then
    raise exception 'Rätten behöver minst en ingrediens';
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
    select e.nr, btrim(e.el ->> 'vara') as vara, (e.el ->> 'gram')::int as gram,
           (e.el ->> 'kcal')::int as kcal, (e.el ->> 'protein')::numeric as protein
    from jsonb_array_elements(rader) with ordinality as e(el, nr)
    order by e.nr
  loop
    if rad.vara is null or rad.vara = '' or char_length(rad.vara) > 80 then
      raise exception 'Ingrediens %: namnet saknas eller är för långt', rad.nr;
    end if;
    if rad.gram is null or rad.gram not between 1 and 5000 then
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
    insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values (t, ratten, varan, rad.gram);
  end loop;

  if dag_nr is not null or maltid_typ is not null then
    insert into public.maltider (tur_id, dag, maltid, ratt_id, sortering) values (t, dag_nr, maltid_typ, ratten, plats);
  end if;

  return ratten;
end;
$$;

-- ─── Recept ──────────────────────────────────────────────────────────────────
-- r = null skapar ett nytt recept, annars ändras receptet r och får alla sina rader på nytt, i listans ordning.
-- Tabellernas egna gränser (namn, vara, gram, kcal, protein, ett namn per person och en vara per recept) gäller.
create function public.spara_recept(r uuid, recept_namn text, rader jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  receptet uuid := r;
begin
  if jsonb_typeof(rader) is distinct from 'array' or jsonb_array_length(rader) = 0 then
    raise exception 'Receptet behöver minst en ingrediens';
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

  insert into public.receptrader (recept_id, vara, gram_per_portion, kcal_per_100g, protein_per_100g, sortering)
    select receptet, btrim(e.el ->> 'vara'), (e.el ->> 'gram')::int, (e.el ->> 'kcal')::int,
           (e.el ->> 'protein')::numeric, e.nr - 1
    from jsonb_array_elements(rader) with ordinality as e(el, nr);

  return receptet;
end;
$$;

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke execute on function public.spara_egen_ratt(uuid, uuid, text, jsonb, int, text, int) from public, anon;
grant execute on function public.spara_egen_ratt(uuid, uuid, text, jsonb, int, text, int) to authenticated;
revoke execute on function public.spara_recept(uuid, text, jsonb) from public, anon;
grant execute on function public.spara_recept(uuid, text, jsonb) to authenticated;
