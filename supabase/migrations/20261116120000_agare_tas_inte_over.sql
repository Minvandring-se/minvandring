-- En person utan konto som fått rollen owner går inte att ta över via inbjudningslänken.
-- Annars kunde den som har länken välja personen i "Är du någon av de här?" och bli ägare av turen.
-- inbjudan visar inte längre sådana personer, och ga_med vägrar ta över dem. I övrigt som förut.

create or replace function public.inbjudan(kod text) returns jsonb
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
        where d.tur_id = t and d.user_id is null and d.typ = 'person' and d.roll <> 'owner'),
      '[]'::jsonb
    )
  );
end;
$$;

create or replace function public.ga_med(kod text, som uuid default null) returns uuid
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
     where d.id = som and d.tur_id = t and d.user_id is null and d.typ = 'person' and d.roll <> 'owner';
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
