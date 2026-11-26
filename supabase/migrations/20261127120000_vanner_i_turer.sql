-- Vänner i turer: en ägare eller redigerare lägger till sina vänner direkt i en tur, utan inbjudningslänk. Steg 3 i
-- planen för notiser, vänner, grupper och påminnelser.
--
-- Bara godkända vänner till den som lägger till, och bara till en tur där den personen får ändra (kan_andra). De
-- läggs till som redigerare, samma som via länken, och får notisen "Oscar lade till dig i Kungsleden 2026". Den som
-- har lagts till kan alltid lämna turen själv, som i dag.

-- ─── Notisen ─────────────────────────────────────────────────────────────────
alter table public.notiser drop constraint notiser_typ_check;
alter table public.notiser add constraint notiser_typ_check
  check (typ in ('gick_med', 'vanforfragan', 'van_godkand', 'van_via_lank', 'tillagd_i_tur'));

-- ─── Spärren mot deltagare med någon annans konto ────────────────────────────
-- Som förut får ingen lägga in en deltagare med någon annans konto. Undantaget är lagg_till_vanner, som sätter
-- inställningen till turens id i sin egen transaktion och tar bort den efteråt. RLS-policyn för insert kräver
-- dessutom fortfarande att user_id är tomt för insättningar direkt från appen.
create or replace function public.ny_deltagare_utan_konto() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is not null and new.user_id <> auth.uid()
     and coalesce(current_setting('minvandring.lagg_till_vanner', true), '') <> new.tur_id::text then
    raise exception 'Bjud in med länken i stället';
  end if;
  return new;
end;
$$;
revoke execute on function public.ny_deltagare_utan_konto() from public, anon, authenticated;

-- ─── Lägg till vänner i en tur ───────────────────────────────────────────────
-- Lägger till de av personerna som är den inloggades vänner och inte redan är med. Andra hoppas över utan fel, så
-- att funktionen inte avslöjar något om dem. Ger antalet som lades till. Högst 50 åt gången.
-- Notisen kommer högst en gång per dygn för samma tur från samma person, även om någon lämnar och läggs till igen.
create function public.lagg_till_vanner(tur uuid, personer uuid[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  turnamn text;
  avsandare text;
  p uuid;
  antal integer := 0;
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  if not public.kan_andra(tur) then
    raise exception 'Bara ägare och redigerare kan lägga till vänner';
  end if;
  if coalesce(cardinality(personer), 0) > 50 then
    raise exception 'Högst 50 åt gången';
  end if;
  select t.namn into turnamn from public.turer t where t.id = tur;
  avsandare := public.profilnamn(anvandare);
  perform set_config('minvandring.lagg_till_vanner', tur::text, true);
  for p in select distinct x from unnest(personer) x where x is not null and x <> anvandare loop
    continue when not public.ar_vanner(anvandare, p);
    continue when exists (select 1 from public.deltagare d where d.tur_id = tur and d.user_id = p);
    insert into public.deltagare (tur_id, user_id, namn, roll, sortering)
    values (
      tur, p, public.profilnamn(p), 'editor',
      (select coalesce(max(d.sortering), 0) + 1 from public.deltagare d where d.tur_id = tur)
    );
    antal := antal + 1;
    if not exists (
      select 1 from public.notiser n
       where n.user_id = p and n.tur_id = tur and n.fran_user_id = anvandare and n.typ = 'tillagd_i_tur'
         and n.skapad > now() - interval '1 day'
    ) then
      insert into public.notiser (user_id, typ, text, lank, fran_user_id, tur_id)
      values (p, 'tillagd_i_tur', avsandare || ' lade till dig i ' || turnamn, '/tur/' || tur, anvandare, tur);
    end if;
  end loop;
  perform set_config('minvandring.lagg_till_vanner', '', true);
  return antal;
end;
$$;

revoke execute on function public.lagg_till_vanner(uuid, uuid[]) from public, anon;
grant execute on function public.lagg_till_vanner(uuid, uuid[]) to authenticated;
