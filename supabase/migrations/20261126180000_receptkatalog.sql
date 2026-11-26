-- MinVandrings recept: en receptkatalog med ingredienser och steg, skriven med egna ord utifrån idéer från andra
-- (källan står i inspirerat_av). Den fylls bara via migreringar från CSV-filerna i supabase/katalog/recept
-- (npm run receptkatalog), som matkatalogen och varukatalogen.
--
-- Inloggade läser. Ingen skriver via API:t. När ett recept läggs i en tur eller sparas som eget recept kopierar appen
-- det till turens rätter eller till ens egna recept, så katalogen ändras aldrig av användarna.
--
-- En ingrediens kan kopplas till ett livsmedel eller en märkesvara. Då räknar appen med dess allergener och kostval.
-- Utan koppling är allergenerna okända, och okänt räknas aldrig som att receptet passar.
--
-- Datumet ligger efter den senaste migreringen i main och i PR #206 (20261126163444_katalog_understall).

create table public.receptkatalog (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 60),
  namn text not null check (btrim(namn) <> '' and char_length(namn) <= 80),
  maltid text not null check (maltid in ('frukost', 'lunch', 'middag', 'mellanmal', 'dryck')),
  portioner int not null check (portioner between 1 and 50),
  kok_kravs boolean not null,
  torkning_hemma boolean not null,
  beskrivning text not null check (btrim(beskrivning) <> '' and char_length(beskrivning) <= 300),
  -- fran_kallan: källans mängder. egna: källan saknade mängder, så vi satte dem.
  mangder text not null check (mangder in ('fran_kallan', 'egna')),
  inspirerat_av text not null check (btrim(inspirerat_av) <> '' and char_length(inspirerat_av) <= 80),
  inspirerat_av_url text not null check (inspirerat_av_url ~ '^https://\S+$' and char_length(inspirerat_av_url) <= 300),
  -- otestat tills någon av grundarna har lagat rätten.
  status text not null check (status in ('otestat', 'testat'))
);

create table public.receptkatalog_ingredienser (
  recept_id text not null references public.receptkatalog (id) on delete cascade,
  ordning int not null check (ordning between 1 and 99),
  ingrediens text not null check (btrim(ingrediens) <> '' and char_length(ingrediens) <= 80),
  -- För hela receptet, alla portioner. Mängd och enhet anges tillsammans.
  mangd numeric(8, 2) check (mangd > 0 and mangd <= 10000),
  enhet text check (enhet in ('g', 'kg', 'dl', 'ml', 'st', 'msk', 'tsk', 'krm')),
  -- hemma: i påsen hemma. separat: packas för sig. pa_plats: vatten, som inte köps eller bärs.
  packas text not null check (packas in ('hemma', 'separat', 'pa_plats')),
  kommentar text check (char_length(kommentar) <= 120),
  -- Försvinner livsmedlet eller varan blir kopplingen tom, och ingrediensen räknas som okänd.
  livsmedel_nummer int references public.livsmedel (nummer) on delete set null,
  varukatalog_id uuid references public.varukatalog (id) on delete set null,
  primary key (recept_id, ordning),
  check ((mangd is null) = (enhet is null)),
  check (livsmedel_nummer is null or varukatalog_id is null)
);

create table public.receptkatalog_steg (
  recept_id text not null references public.receptkatalog (id) on delete cascade,
  steg_nr int not null check (steg_nr between 1 and 99),
  var text not null check (var in ('hemma', 'turen')),
  steg text not null check (btrim(steg) <> '' and char_length(steg) <= 400),
  -- Minuter, eller ett intervall med kort streck: 5 eller 5–10.
  tid_min text check (tid_min ~ '^\d{1,4}(–\d{1,4})?$'),
  primary key (recept_id, steg_nr)
);

create index receptkatalog_ingredienser_livsmedel on public.receptkatalog_ingredienser (livsmedel_nummer) where livsmedel_nummer is not null;
create index receptkatalog_ingredienser_varukatalog on public.receptkatalog_ingredienser (varukatalog_id) where varukatalog_id is not null;

-- Inloggade läser. Ingen ändrar via API:t: katalogen fylls bara via migreringar.
revoke all on public.receptkatalog, public.receptkatalog_ingredienser, public.receptkatalog_steg from public, anon, authenticated;
grant select on public.receptkatalog, public.receptkatalog_ingredienser, public.receptkatalog_steg to authenticated;

alter table public.receptkatalog enable row level security;
alter table public.receptkatalog_ingredienser enable row level security;
alter table public.receptkatalog_steg enable row level security;

create policy "inloggade läser receptkatalogen" on public.receptkatalog for select to authenticated
  using (true);
create policy "inloggade läser receptkatalogens ingredienser" on public.receptkatalog_ingredienser for select to authenticated
  using (true);
create policy "inloggade läser receptkatalogens steg" on public.receptkatalog_steg for select to authenticated
  using (true);
