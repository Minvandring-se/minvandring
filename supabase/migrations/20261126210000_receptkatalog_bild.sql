-- Om ett av MinVandrings recept har en bild. Bilderna ligger i appen, i public/recept/ (<id>-kort-600.webp,
-- <id>-kort-1200.webp, <id>-vy-900.webp och <id>-vy-1800.webp), och görs med npm run receptbilder. Utan bild visar
-- appen den tecknade platshållaren. Fylls bara via migreringar från supabase/katalog/recept/recept.csv.
--
-- Rättigheterna och RLS på tabellen gäller som förut: inloggade läser, ingen skriver via API:t.

alter table public.receptkatalog add column bild boolean not null default false;
