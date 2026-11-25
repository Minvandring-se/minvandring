-- Real Turmat "Potato garam masala" (Real Turmat gryte, 6024) är samma påse som "Field Meal Potato Garam Masala"
-- (8025): samma vikt, energi och näring. Raden är borttagen ur supabase/katalog/mat/real-turmat.csv, och seeden
-- uppdaterar bara och lägger till, så den tas bort här. Den 25 november pekade ingen rätt, inget skafferi och ingen
-- favorit på den. Gör någon det när migreringen körs stoppar främmande nycklarna borttagningen av en rätt, och
-- skafferi och favoriter försvinner med påsen (on delete cascade).
delete from public.matprodukter
  where lower(marke) = 'real turmat' and lower(namn) = 'potato garam masala'
    and not exists (select 1 from public.ratter r where r.matprodukt_id = matprodukter.id);
