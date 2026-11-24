-- Baslivsmedel från Livsmedelsverkets livsmedelsdatabas (CC BY 4.0), för förslag med näringsvärden när man skriver
-- ingredienser i egna rätter och recept. Tabellen fylls bara via seed-migreringar som skapas från
-- supabase/katalog/livsmedel/livsmedel.csv med "npm run livsmedel". Se docs/katalog/livsmedel.md.
--
-- Alla näringsvärden gäller 100 g. Ett värde som saknas hos Livsmedelsverket är null, aldrig 0. Appen använder
-- kcal och protein. Fett, kolhydrater, fiber, sockerarter, salt och vatten sparas för senare.

create table public.livsmedel (
  -- Livsmedelsverkets livsmedelsnummer.
  nummer int primary key check (nummer > 0),
  namn text not null check (length(btrim(namn)) between 1 and 200),
  -- Livsmedelsverkets gruppindelning (LanguaL A), till exempel "Pasta".
  grupp text check (length(grupp) <= 200),
  -- Torrt, rått eller tillagat, utläst ur namnet. Null när det inte går att avgöra.
  tillstand text check (tillstand in ('torr', 'ra', 'tillagad')),
  kcal_per_100g int check (kcal_per_100g between 0 and 900),
  protein_per_100g numeric(4, 1) check (protein_per_100g between 0 and 100),
  fett_per_100g numeric(4, 1) check (fett_per_100g between 0 and 100),
  -- Kolhydrater, tillgängliga.
  kolhydrater_per_100g numeric(4, 1) check (kolhydrater_per_100g between 0 and 100),
  fiber_per_100g numeric(4, 1) check (fiber_per_100g between 0 and 100),
  -- Sockerarter, totalt.
  sockerarter_per_100g numeric(4, 1) check (sockerarter_per_100g between 0 and 100),
  -- Salt, NaCl.
  salt_per_100g numeric(5, 2) check (salt_per_100g between 0 and 100),
  vatten_per_100g numeric(4, 1) check (vatten_per_100g between 0 and 100),
  -- Datumet för livsmedlets version hos Livsmedelsverket.
  version date
);

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
-- Inloggade läser. Ingen roll får skriva: tabellen fylls bara via migreringar. anon når den inte.
revoke all on public.livsmedel from public, anon, authenticated;
grant select on public.livsmedel to authenticated;

alter table public.livsmedel enable row level security;

create policy "inloggade läser livsmedlen" on public.livsmedel for select to authenticated
  using (true);
