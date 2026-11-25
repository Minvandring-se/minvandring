-- Rättningar från felsökningen av matdelen (Claude outputs/felsokning/matdelen.md): B5, B6, B7, B13 och K10.
-- Bygger inte på 20261125100000_inkop_klart_mangd.sql (PR 2), men har datumet direkt efter den, så att den körs efter den.

-- ─── B6: ett konto som raderas ───────────────────────────────────────────────
-- Förut stoppade turer.skapad_av raderingen av ett konto som hade skapat en tur, och deltagare.user_id (on delete
-- set null) krockade med skydda_deltagare, som inte låter någon flytta en deltagare. Nu gäller:
--   - Personens deltagarrader tas bort, och med dem kostbehoven, ätarna och bockarna (deras främmande nycklar
--     har redan on delete cascade). Raderna hen bar blir utan bärare.
--   - Var personen ensam ägare blir nästa deltagare med konto ägare, den som kom med först.
--   - Finns ingen annan med konto raderas turen.
--   - Turen som personen skapade finns kvar utan skapare.

-- När deltagaren kom med, för att välja nästa ägare. Rader som redan finns får samma tid och ordnas efter sortering.
alter table public.deltagare add column skapad timestamptz not null default now();

alter table public.turer
  alter column skapad_av drop not null,
  drop constraint turer_skapad_av_fkey,
  add constraint turer_skapad_av_fkey foreign key (skapad_av) references auth.users (id) on delete set null;

alter table public.deltagare
  drop constraint deltagare_user_id_fkey,
  add constraint deltagare_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade;

-- Samma som i 20261116000000_ta_over_deltagare.sql, med ett undantag: när ett konto raderas byter
-- konto_raderas ägare. Det sker utan inloggning (auth.uid() är tom) och utan API:ts roller anon och authenticated,
-- alltså bara när Supabase själv raderar kontot eller någon med åtkomst till databasen gör det.
create or replace function public.skydda_deltagare() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  andra_agare int;
  systemet boolean := auth.uid() is null and coalesce(current_setting('role', true), 'none') not in ('anon', 'authenticated');
begin
  if tg_op = 'UPDATE' then
    if new.tur_id <> old.tur_id then
      raise exception 'Det går inte att flytta en deltagare';
    end if;
    if new.user_id is distinct from old.user_id
       and not (old.user_id is null and old.typ = 'person' and new.user_id = auth.uid()) then
      raise exception 'Det går inte att flytta en deltagare';
    end if;
    if new.roll <> old.roll and not public.ar_agare(old.tur_id) and not systemet then
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

-- Före raderingen av kontot: ny ägare där personen var ensam ägare, eller turen bort när ingen annan har konto.
-- Själva deltagarraderna tas bort av den främmande nyckeln efteråt.
create function public.konto_raderas() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  d record;
  nasta uuid;
begin
  for d in select x.id, x.tur_id from public.deltagare x where x.user_id = old.id and x.roll = 'owner' loop
    continue when exists (select 1 from public.deltagare y where y.tur_id = d.tur_id and y.roll = 'owner' and y.id <> d.id);
    select y.id into nasta from public.deltagare y
      where y.tur_id = d.tur_id and y.id <> d.id and y.user_id is not null
      order by y.skapad, y.sortering, y.id
      limit 1;
    if nasta is null then
      delete from public.turer where id = d.tur_id;
    else
      update public.deltagare set roll = 'owner' where id = nasta;
    end if;
  end loop;
  return old;
end;
$$;

create trigger konto_raderas before delete on auth.users
  for each row execute function public.konto_raderas();

revoke all on function public.konto_raderas() from public, anon, authenticated;

-- ─── B5: bara personer bär ───────────────────────────────────────────────────
-- En hund kunde stå som bärare, och en person som blev hund behöll raderna hen bar.
update public.maltider m set bars_av = null
  from public.deltagare d where d.id = m.bars_av and d.typ <> 'person';

create function public.bara_personer_bar() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.bars_av is not null and not exists
     (select 1 from public.deltagare d where d.id = new.bars_av and d.typ = 'person') then
    raise exception 'Bara personer kan bära en rätt' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bara_personer_bar before insert or update of bars_av on public.maltider
  for each row execute function public.bara_personer_bar();

revoke all on function public.bara_personer_bar() from public, anon, authenticated;

-- Blir en person en hund slutar den att äta, köpa och bära. Samma som i 20261124230000_handlingslista.sql, och nu
-- också raderna hen bar.
create or replace function public.hund_ater_inte() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.typ <> 'person' and old.typ = 'person' then
    delete from public.maltid_atare where deltagare_id = new.id;
    delete from public.inkop_klart where deltagare_id = new.id;
    update public.maltider set bars_av = null where bars_av = new.id;
  end if;
  return new;
end;
$$;

-- ─── K10: det appen inte gör ─────────────────────────────────────────────────
-- En bock på en rätt gäller bara påsar ur matkatalogen. Egna rätter bockas av per vara.
create or replace function public.bara_personer_koper() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from public.deltagare d where d.id = new.deltagare_id and d.typ = 'person') then
    raise exception 'Bara personer kan bocka av det de köper' using errcode = '23514';
  end if;
  if new.ratt_id is not null and not exists (select 1 from public.ratter r where r.id = new.ratt_id and r.matprodukt_id is not null) then
    raise exception 'Bara påsar bockas av som rätt. Egna rätter bockas av per vara' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- En påse ur matkatalogen har inga ingredienser, och en rätt med ingredienser blir inte en påse.
create function public.pase_utan_ingredienser() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_table_name = 'ingredienser' then
    if exists (select 1 from public.ratter r where r.id = new.ratt_id and r.matprodukt_id is not null) then
      raise exception 'En påse ur matkatalogen har inga ingredienser' using errcode = '23514';
    end if;
  elsif new.matprodukt_id is not null and exists (select 1 from public.ingredienser i where i.ratt_id = new.id) then
    raise exception 'En rätt med ingredienser kan inte bli en påse' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger pase_utan_ingredienser before insert or update of ratt_id on public.ingredienser
  for each row execute function public.pase_utan_ingredienser();
create trigger pase_utan_ingredienser before update of matprodukt_id on public.ratter
  for each row execute function public.pase_utan_ingredienser();

revoke all on function public.pase_utan_ingredienser() from public, anon, authenticated;

-- ─── B13: samma gränser i tabellerna som i spara_egen_ratt ───────────────────
-- Förut fanns gränserna bara i funktionen, så ett direkt anrop till API:t kunde spara till exempel 2 000 000 gram.
-- not valid: gränserna gäller nya och ändrade rader. Den 25 november fanns inga rader utanför dem i databasen, men
-- en gammal rad ska inte stoppa migreringen. Kontrollera med validate constraint när det passar.
alter table public.ingredienser add constraint ingredienser_gram_granser check (gram_per_portion between 1 and 5000) not valid;
alter table public.varor
  add constraint varor_kcal_granser check (kcal_per_100g between 0 and 900) not valid,
  add constraint varor_protein_granser check (protein_per_100g between 0 and 100) not valid;

-- ─── B7: ett tömt fält tömmer värdet ─────────────────────────────────────────
-- Samma som i 20261124230000_handlingslista.sql, med en skillnad: kcal och protein för en vara som redan finns
-- skrivs över med det som står i formuläret, även när fältet är tomt. Förut behölls det gamla värdet, så det gick
-- inte att ta bort. En rad utan nyckeln kcal eller protein behåller värdet som förut.
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
           e.el ? 'kcal' as har_kcal, e.el ? 'protein' as har_protein
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
    elsif rad.har_kcal or rad.har_protein then
      update public.varor
        set kcal_per_100g = case when rad.har_kcal then rad.kcal else kcal_per_100g end,
            protein_per_100g = case when rad.har_protein then rad.protein else protein_per_100g end
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
