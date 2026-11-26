-- Vikten i gram för en ingrediens i MinVandrings recept, för hela mängden. Frivillig. Appen räknar kcal per portion
-- från vikten och kcal per 100 g i det kopplade livsmedlet eller märkesvaran. När enheten är g eller kg räknas vikten
-- ur mängden, så då lämnas gram tom. Fylls bara via migreringar från supabase/katalog/recept/ingredienser.csv.
--
-- Rättigheterna och RLS på tabellen gäller som förut: inloggade läser, ingen skriver via API:t.

alter table public.receptkatalog_ingredienser
  add column gram numeric(7, 1) check (gram > 0 and gram <= 20000),
  add constraint gram_bara_utan_viktenhet check (gram is null or enhet is null or enhet not in ('g', 'kg'));
