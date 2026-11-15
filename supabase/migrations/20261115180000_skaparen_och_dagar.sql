-- 1. Den som skapat en tur ser den inte längre efter att ha lämnat den eller tagits bort.
--    Förut släppte policyn igenom skaparen även utan deltagarrad (skapad_av = auth.uid()).
--    Undantaget fanns för att appen läste tillbaka den nya raden direkt när turen skapades.
--    Nu väljer appen turens id själv och läser inte tillbaka raden, så undantaget behövs inte.
drop policy "medlemmar ser turen" on public.turer;
create policy "medlemmar ser turen" on public.turer for select to authenticated
  using (public.ar_medlem(id));

-- 2. Antal vandringsdagar är tomt tills någon anger det, i stället för standardvärdet 3.
--    Befintliga turer behåller sina värden. Kontrollen 1–30 gäller fortfarande när ett värde finns.
alter table public.turer
  alter column dagar drop default,
  alter column dagar drop not null;
