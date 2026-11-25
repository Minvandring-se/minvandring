-- Mängden som bockades av i inköpslistan. Ändras mängden efteråt (till exempel när en rätt läggs i en måltid till)
-- visar appen raden som oavbockad, med mängden från när den bockades av, så att det nya inte ser köpt ut.
--
-- Texten är mängden som den stod i listan, till exempel "1 dl", "270 g och 2 msk" eller "2 påsar". Tom text betyder
-- en vara utan mängd, till exempel salt. Bockarna som finns får null, och appen räknar dem som avbockade oavsett mängd.
--
-- En bock ändras inte: appen tar bort den gamla och lägger en ny när mängden har ändrats. Rättigheterna och
-- policyerna på inkop_klart är därför desamma som förut (select, insert och delete, ingen update).
alter table public.inkop_klart
  add column mangd text check (char_length(mangd) <= 200);
