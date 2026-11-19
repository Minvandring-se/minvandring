-- Mitt förråd: en gemensam produktkatalog och varje användares egna saker.
-- produkter fylls bara via migreringar. Alla inloggade får läsa, ingen användare får skriva.
-- forradssaker är privata: bara ägaren ser och ändrar sina saker, även när man delar en tur med någon.

-- ─── Kategorier ──────────────────────────────────────────────────────────────
-- Två nivåer. Nycklarna är samma som i src/lib/forrad.ts, där etiketter, ikoner och förvald typ står.
-- De ligger i egna tabeller så att främmande nycklar kan garantera att en kategori finns och att en
-- underkategori hör till rätt huvudkategori. En ny kategori blir då en rad, inte en ändrad check i varje tabell.
-- Ingen når tabellerna via API:t: appen läser listan ur koden, och kontrollen av främmande nycklar
-- görs av databasen själv.
create table public.kategorier (
  nyckel text primary key
);

create table public.underkategorier (
  -- Primärnyckeln gör att en underkategori bara kan höra till en huvudkategori.
  nyckel text primary key,
  kategori text not null references public.kategorier (nyckel),
  unique (kategori, nyckel)
);

insert into public.kategorier (nyckel) values
  ('packning'), ('talt'), ('sova'), ('kok'), ('vatten'), ('klader'), ('skor'), ('prylar'),
  ('sakerhet'), ('verktyg'), ('medicin'), ('hygien'), ('ovrigt');

insert into public.underkategorier (kategori, nyckel) values
  ('packning', 'ryggsack'), ('packning', 'dagsryggsack'), ('packning', 'packpasar'), ('packning', 'regnskydd'),
  ('packning', 'ryggsackstillbehor'),
  ('talt', 'talt'), ('talt', 'tarp'), ('talt', 'vindsack'), ('talt', 'hangmatta'), ('talt', 'talttillbehor'),
  ('sova', 'sovsack'), ('sova', 'quilt'), ('sova', 'liggunderlag'), ('sova', 'kudde'), ('sova', 'lakan'),
  ('kok', 'brannare'), ('kok', 'bransle'), ('kok', 'kastrull'), ('kok', 'kasa'), ('kok', 'bestick'), ('kok', 'kaffe'),
  ('kok', 'disk'),
  ('vatten', 'flaska'), ('vatten', 'dricksystem'), ('vatten', 'filter'), ('vatten', 'rening'), ('vatten', 'vattendunk'),
  ('klader', 'understall'), ('klader', 'mellanlager'), ('klader', 'isolering'), ('klader', 'vindklader'),
  ('klader', 'regnklader'), ('klader', 'byxor'), ('klader', 'trojor'), ('klader', 'underklader'), ('klader', 'strumpor'),
  ('klader', 'huvudbonad'), ('klader', 'handskar'), ('klader', 'myggklader'),
  ('skor', 'kangor'), ('skor', 'lagerskor'), ('skor', 'damasker'), ('skor', 'broddar'),
  ('prylar', 'pannlampa'), ('prylar', 'powerbank'), ('prylar', 'laddning'), ('prylar', 'solpanel'),
  ('prylar', 'kommunikation'), ('prylar', 'klocka'), ('prylar', 'ljud'), ('prylar', 'kamera'),
  ('sakerhet', 'karta'), ('sakerhet', 'eld'), ('sakerhet', 'nodutrustning'),
  ('verktyg', 'kniv'), ('verktyg', 'stavar'), ('verktyg', 'lagning'), ('verktyg', 'yxa'),
  ('medicin', 'forband'), ('medicin', 'skavsar'), ('medicin', 'mediciner'), ('medicin', 'salvor'),
  ('hygien', 'toalett'), ('hygien', 'tvatt'), ('hygien', 'personlig'), ('hygien', 'sol_mygg'),
  ('ovrigt', 'ovrigt');

-- ─── Produktkatalogen ────────────────────────────────────────────────────────
create table public.produkter (
  id uuid primary key default gen_random_uuid(),
  marke text not null check (btrim(marke) <> ''),
  modell text not null check (btrim(modell) <> ''),
  -- Årsmodell eller variant, till exempel "2026" eller "2 personer".
  version text,
  kategori text not null,
  underkategori text not null,
  -- Vikten med allt som följer med i förpackningen. Blir vikt_g när saken läggs i ett förråd.
  packvikt_g int not null check (packvikt_g > 0),
  -- Vikten med bara det nödvändigaste, om tillverkaren anger den.
  minvikt_g int check (minvikt_g > 0),
  pris_sek_ca int check (pris_sek_ca >= 0),
  ean text unique,
  -- Tillverkarens sida där uppgifterna är hämtade, och dagen de kontrollerades.
  kalla text not null check (kalla ~ '^https?://'),
  kontrollerad date not null,
  -- Egenskaper som bara finns i en viss underkategori, till exempel golvyta för tält.
  -- Valideras i src/lib/produktegenskaper.ts.
  egenskaper jsonb not null default '{}'::jsonb check (jsonb_typeof(egenskaper) = 'object'),
  skapad timestamptz not null default now(),
  foreign key (kategori, underkategori) references public.underkategorier (kategori, nyckel)
);

-- Samma produkt ska inte kunna läggas in två gånger.
create unique index produkter_unik on public.produkter (lower(marke), lower(modell), lower(coalesce(version, '')));

-- ─── Användarens egna saker ──────────────────────────────────────────────────
create table public.forradssaker (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Produkten saken valdes från. Uppgifterna kopieras in, så saken finns kvar även om produkten tas bort ur katalogen.
  produkt_id uuid references public.produkter (id) on delete set null,
  namn text not null check (btrim(namn) <> ''),
  kategori text not null references public.kategorier (nyckel),
  -- Frivillig. Är den satt måste den höra till kategorin. Är den tom kontrolleras bara kategorin.
  underkategori text,
  antal int not null default 1 check (antal >= 1),
  vikt_g int check (vikt_g >= 0),
  typ text not null default 'ryggsack' check (typ in ('ryggsack', 'kropp', 'forbrukas')),
  notering text,
  skapad timestamptz not null default now(),
  foreign key (kategori, underkategori) references public.underkategorier (kategori, nyckel)
);

create index forradssaker_user_id on public.forradssaker (user_id);

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke all on public.kategorier, public.underkategorier, public.produkter, public.forradssaker from public, anon, authenticated;
grant select on public.produkter to authenticated;
grant select, insert, update, delete on public.forradssaker to authenticated;

-- Kategoritabellerna har RLS påslaget utan policyer och utan grant: stängda för alla roller i API:t.
alter table public.kategorier enable row level security;
alter table public.underkategorier enable row level security;
alter table public.produkter enable row level security;
alter table public.forradssaker enable row level security;

-- Katalogen: inloggade läser. Det finns ingen policy för att skriva.
create policy "inloggade läser katalogen" on public.produkter for select to authenticated
  using (true);

-- Förrådet: bara ägaren, och en sak kan inte flyttas till någon annan.
create policy "egna saker" on public.forradssaker for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
