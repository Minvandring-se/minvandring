-- Jetboil Zip 0,8 l togs bort ur supabase/katalog/kok.csv: Jetboil anger både 324 och 340 g.
-- Saker i förrådet som pekar på produkten behåller sina uppgifter men tappar kopplingen (on delete set null).
delete from public.produkter
where lower(marke) = 'jetboil' and lower(modell) = 'zip' and lower(coalesce(version, '')) = '0,8 l';
