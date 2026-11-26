-- Mängden som bockades av i inköpslistan. Ändras mängden efteråt (till exempel när en rätt läggs i en måltid till)
-- visar appen raden som oavbockad, med mängden från när den bockades av, så att det nya inte ser köpt ut.
--
-- Texten är mängden som den stod i listan, till exempel "1 dl", "270 g och 2 msk" eller "2 påsar". Tom text betyder
-- en vara utan mängd, till exempel salt. Bockarna som finns får null, och appen räknar dem som avbockade oavsett mängd.
alter table public.inkop_klart
  add column mangd text check (char_length(mangd) <= 200);

-- En bock ändras inte. bocka_inkop tar bort personens gamla bock för varan eller påsen och lägger, när klart är
-- sant, en ny med mängden, i en transaktion så att bocken inte försvinner om det andra steget inte går igenom.
-- Security invoker: policyerna på inkop_klart gäller som förut (owner och editor bockar åt alla, var och en åt sig
-- själv). Rättigheterna på tabellen är oförändrade (select, insert och delete, ingen update).
create function public.bocka_inkop(t uuid, deltagare uuid, vara uuid, ratt uuid, klart boolean, ny_mangd text) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if (vara is null) = (ratt is null) then
    raise exception 'Ange antingen en vara eller en påse';
  end if;
  delete from public.inkop_klart k
    where k.tur_id = t and k.deltagare_id = deltagare
      and (k.vara_id = vara or k.ratt_id = ratt);
  if klart then
    insert into public.inkop_klart (tur_id, deltagare_id, vara_id, ratt_id, mangd) values (t, deltagare, vara, ratt, ny_mangd);
  end if;
end;
$$;

revoke all on function public.bocka_inkop(uuid, uuid, uuid, uuid, boolean, text) from public, anon;
grant execute on function public.bocka_inkop(uuid, uuid, uuid, uuid, boolean, text) to authenticated;
