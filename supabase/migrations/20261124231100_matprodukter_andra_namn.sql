-- Andra namn på påsarna i matkatalogen, till exempel det svenska ("Viltgryta" för Real Turmat Reindeer Stew).
-- De används bara för sökningen och för att visa det första under namnet, aldrig för allergener eller kost.
-- Värdena läggs in med seed-migreringen efter den här (20261124231101_matkatalog_andra_namn.sql), från kolumnen
-- andra_namn i CSV:erna i supabase/katalog/mat/.
-- Rättigheterna är som för resten av tabellen: inloggade läser, ingen roll skriver.
alter table public.matprodukter
  add column andra_namn text[] not null default '{}' check (cardinality(andra_namn) <= 30);
