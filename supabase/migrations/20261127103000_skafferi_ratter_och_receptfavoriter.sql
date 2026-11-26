-- Skafferiet får egna rätter hemma och favoritrecept. Båda är personliga, som skafferiet och matfavoriterna.
--
-- Egna rätter hemma (skafferiratter): en rätt man har lagat och har hemma, till exempel "Mammas korvstroganoff",
-- 5 portioner torkade i frysen. Antal portioner och frivilligt bäst före, som en påse. Namnet sparas alltid på raden.
-- Rätten kan kopplas till ett av ens egna recept eller till ett av MinVandrings recept, men behöver inte det.
-- Försvinner receptet blir kopplingen tom och rätten finns kvar.
--
-- Favoritrecept (receptfavoriter): en stjärna på ett eget recept eller på ett av MinVandrings recept.
--
-- Bara ägaren ser och ändrar sina rader, även när man delar en tur med någon. Raderna försvinner med kontot.

-- ─── Egna rätter hemma ─────────────────────────────────────────────────────
create table public.skafferiratter (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Sparas utan mellanslag i början och slutet, samma gräns som en egen rätt.
  namn text not null check (namn = btrim(namn) and namn <> '' and char_length(namn) <= 80),
  portioner int not null default 1 check (portioner between 1 and 999),
  -- Frivilligt. Ett datum som har passerat räknas inte som att man har rätten hemma.
  bast_fore date,
  -- Ett eget recept (samma ägare) eller ett av MinVandrings recept, aldrig båda.
  recept_id uuid,
  receptkatalog_id text references public.receptkatalog (id) on delete set null,
  skapad timestamptz not null default now(),
  constraint skafferiratter_eget_recept foreign key (recept_id, user_id)
    references public.recept (id, user_id) on delete set null (recept_id),
  constraint skafferiratter_ett_recept check (recept_id is null or receptkatalog_id is null)
);

-- En rad per rätt och person, oavsett stora och små bokstäver. Fler portioner är ett högre antal.
create unique index skafferiratter_unikt_namn on public.skafferiratter (user_id, lower(namn));
create index skafferiratter_recept_id on public.skafferiratter (recept_id) where recept_id is not null;
create index skafferiratter_receptkatalog_id on public.skafferiratter (receptkatalog_id) where receptkatalog_id is not null;

-- ─── Favoritrecept ─────────────────────────────────────────────────────────
create table public.receptfavoriter (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Ett eget recept (samma ägare) eller ett av MinVandrings recept, precis ett av dem. Stjärnan försvinner med receptet.
  recept_id uuid,
  receptkatalog_id text references public.receptkatalog (id) on delete cascade,
  skapad timestamptz not null default now(),
  constraint receptfavoriter_eget_recept foreign key (recept_id, user_id)
    references public.recept (id, user_id) on delete cascade,
  constraint receptfavoriter_ett_recept check ((recept_id is null) <> (receptkatalog_id is null))
);

-- En stjärna per recept och person.
create unique index receptfavoriter_unikt_eget on public.receptfavoriter (user_id, recept_id) where recept_id is not null;
create unique index receptfavoriter_unikt_katalog on public.receptfavoriter (user_id, receptkatalog_id) where receptkatalog_id is not null;
create index receptfavoriter_recept_id on public.receptfavoriter (recept_id) where recept_id is not null;
create index receptfavoriter_receptkatalog_id on public.receptfavoriter (receptkatalog_id) where receptkatalog_id is not null;

-- ─── Rättigheter ───────────────────────────────────────────────────────────
revoke all on public.skafferiratter, public.receptfavoriter from public, anon, authenticated;
grant select, insert, update, delete on public.skafferiratter to authenticated;
-- En stjärna ändras inte, den läggs till eller tas bort.
grant select, insert, delete on public.receptfavoriter to authenticated;

alter table public.skafferiratter enable row level security;
alter table public.receptfavoriter enable row level security;

-- Bara ägaren, och en rad kan inte flyttas till någon annan.
create policy "egna rätter hemma" on public.skafferiratter for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "egna favoritrecept" on public.receptfavoriter for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
