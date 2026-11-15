-- Den som går med via länken kan ta över en person utan konto i stället för att bli en ny deltagare.
-- Då blir det ingen dubblett, och det som pekar på personen (bärs av, packstatus, ansvarig, bärvikt, matandel)
-- följer med, eftersom raden i deltagare är densamma.

-- ─── Koden till turen, med gränsen för felaktiga försök ──────────────────────
-- Används av inbjudan och ga_med. Returnerar turens id, eller null om koden är fel.
-- Fel kod ger null i stället för ett fel, så att försöket sparas (ett fel skulle ångra det).
create function public.tur_for_kod(kod text) returns uuid
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
  select i.tur_id into t from public.inbjudningar i where i.kod = trim(tur_for_kod.kod);
  if t is null then
    insert into public.inbjudningsforsok (user_id) values (anvandare);
  end if;
  return t;
end;
$$;
revoke execute on function public.tur_for_kod(text) from public, anon, authenticated;

-- ─── Vad länken gäller, innan man går med ────────────────────────────────────
-- Turens namn, om man redan är med, och personerna utan konto som man kan vara.
-- Den som har länken kan redan gå med och se alla deltagare, så det här ger ingen ny åtkomst.
create function public.inbjudan(kod text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  t uuid := public.tur_for_kod(kod);
begin
  if t is null then
    return null;
  end if;
  return jsonb_build_object(
    'tur_id', t,
    'namn', (select u.namn from public.turer u where u.id = t),
    'redan_med', exists (select 1 from public.deltagare d where d.tur_id = t and d.user_id = auth.uid()),
    'personer', coalesce(
      (select jsonb_agg(jsonb_build_object('id', d.id, 'namn', d.namn) order by d.sortering, d.namn)
         from public.deltagare d
        where d.tur_id = t and d.user_id is null and d.typ = 'person'),
      '[]'::jsonb
    )
  );
end;
$$;
revoke execute on function public.inbjudan(text) from public, anon;
grant execute on function public.inbjudan(text) to authenticated;

-- ─── Skyddet för deltagare: en rad utan konto får kopplas till den inloggade själv ──
-- I övrigt som förut: ingen får flytta en deltagare, bara owner ändrar roller och turen har alltid en owner.
-- Den som redan är med i turen kan inte ta över någon, eftersom en användare bara får ha en rad per tur.
create or replace function public.skydda_deltagare() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  andra_agare int;
begin
  if tg_op = 'UPDATE' then
    if new.tur_id <> old.tur_id then
      raise exception 'Det går inte att flytta en deltagare';
    end if;
    if new.user_id is distinct from old.user_id
       and not (old.user_id is null and old.typ = 'person' and new.user_id = auth.uid()) then
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

-- ─── Gå med, som ny deltagare eller genom att ta över en person utan konto ───
-- som = deltagaren man tar över. Utan den blir man en ny deltagare, som förut.
-- Returnerar turens id, eller null om koden är fel.
drop function public.ga_med(text);
create function public.ga_med(kod text, som uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t uuid := public.tur_for_kod(kod);
  anvandare uuid := auth.uid();
  profilnamn text;
begin
  if t is null then
    return null;
  end if;
  if exists (select 1 from public.deltagare d where d.tur_id = t and d.user_id = anvandare) then
    return t;
  end if;
  select p.namn into profilnamn from public.profiler p where p.id = anvandare;

  if som is not null then
    update public.deltagare d
       set user_id = anvandare, namn = coalesce(profilnamn, d.namn)
     where d.id = som and d.tur_id = t and d.user_id is null and d.typ = 'person';
    if not found then
      raise exception 'Den deltagaren går inte att ta över';
    end if;
    return t;
  end if;

  insert into public.deltagare (tur_id, user_id, namn, sortering)
  values (
    t,
    anvandare,
    coalesce(profilnamn, 'Ny deltagare'),
    (select coalesce(max(d.sortering), 0) + 1 from public.deltagare d where d.tur_id = t)
  )
  on conflict (tur_id, user_id) do nothing;
  return t;
end;
$$;
revoke execute on function public.ga_med(text, uuid) from public, anon;
grant execute on function public.ga_med(text, uuid) to authenticated;
