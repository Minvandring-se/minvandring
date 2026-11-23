-- Skydd efter granskningen av matplan:
-- 1. Kostbehov går inte att flytta till en annan deltagarrad, inte heller till ens egen rad i en annan tur,
--    eftersom samtycket gäller en tur.
-- 2. samtycke_tid sätts av databasen när raden sparas, så att tiden går att lita på. Appen sparar bara när
--    kryssrutan för samtycke är ikryssad.
-- 3. En egen rätt raderas i en funktion som också tar bort varorna som ingen annan rätt använder längre, i samma
--    transaktion och utifrån databasens läge i stället för appens. Funktionen körs som den inloggade (security
--    invoker), så RLS gäller som vanligt: bara owner och editor kan radera.

-- ─── Kostbehov ───────────────────────────────────────────────────────────────
create function public.skydda_kostbehov() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.deltagare_id <> old.deltagare_id then
    raise exception 'Kostbehov går inte att flytta';
  end if;
  new.samtycke_tid := now();
  return new;
end;
$$;

create trigger skydda_kostbehov before insert or update on public.kostbehov
  for each row execute function public.skydda_kostbehov();

-- ─── Radera en egen rätt ─────────────────────────────────────────────────────
create function public.ta_bort_egen_ratt(r uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  varor uuid[];
begin
  select array_agg(i.vara_id) into varor from public.ingredienser i where i.ratt_id = r;
  -- Påsar ur katalogen raderas inte här. Måltider och ingredienser försvinner med rätten (on delete cascade).
  delete from public.ratter where id = r and matprodukt_id is null;
  if not found then
    raise exception 'Rätten gick inte att radera';
  end if;
  -- Varor som ingen rätt använder längre och som inte har någon egen mängd (till exempel kaffe).
  delete from public.varor v
    where v.id = any(coalesce(varor, '{}'))
      and v.extra_g <= 0
      and not exists (select 1 from public.ingredienser i where i.vara_id = v.id);
end;
$$;

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke execute on function public.skydda_kostbehov() from public, anon, authenticated;
revoke execute on function public.ta_bort_egen_ratt(uuid) from public, anon;
grant execute on function public.ta_bort_egen_ratt(uuid) to authenticated;
