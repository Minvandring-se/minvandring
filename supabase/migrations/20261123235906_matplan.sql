-- Matplanen: en katalog med färdiga påsar, flera rätter per måltid och kostbehov per deltagare.
-- Döps om med ett nytt datum precis innan den körs, så att den kommer efter de migreringar som har körts.
--
-- matprodukter fylls bara via migreringar från supabase/katalog/mat/. Alla inloggade läser, ingen användare skriver.
-- ratter, varor, ingredienser och maltider har redan sina policyer: medlemmar ser, owner och editor ändrar.
-- Här kommer nya kolumner och främmande nycklar som kräver att allt i en matplan hör till samma tur.
-- kostbehov är känsliga uppgifter som bygger på samtycke: bara deltagarna i samma tur ser dem, och bara personen själv anger dem.

-- ─── Allergener ──────────────────────────────────────────────────────────────
-- EU:s 14 allergener. Samma nycklar som i src/lib/kost.ts.
create domain public.allergenlista as text[] check (value <@ array[
  'gluten', 'kraftdjur', 'agg', 'fisk', 'jordnotter', 'soja', 'mjolk',
  'notter', 'selleri', 'senap', 'sesam', 'svaveldioxid', 'lupin', 'blotdjur'
]::text[]);

-- ─── Matkatalogen ────────────────────────────────────────────────────────────
create table public.matprodukter (
  id uuid primary key default gen_random_uuid(),
  marke text not null check (btrim(marke) <> ''),
  namn text not null check (btrim(namn) <> ''),
  maltid text not null check (maltid in ('frukost', 'lunch_middag', 'dessert', 'mellanmal')),
  -- Tomt när det inte framgår.
  torkning text check (torkning in ('frystorkad', 'lufttorkad')),
  -- Hela påsen.
  vikt_torr_g int not null check (vikt_torr_g > 0),
  portioner int not null default 1 check (portioner between 1 and 10),
  -- Näringen för hela påsen, som den står på förpackningen. Kcal per 100 g räknas ut i src/lib.
  kcal int not null check (kcal > 0),
  protein_g numeric(5, 1) check (protein_g >= 0),
  fett_g numeric(5, 1) check (fett_g >= 0),
  kolhydrater_g numeric(5, 1) check (kolhydrater_g >= 0),
  vatten_ml int check (vatten_ml >= 0),
  tillagning_vatten text check (tillagning_vatten in ('varmt', 'kallt', 'varmt_eller_kallt', 'inget')),
  tillagning_min int check (tillagning_min >= 0),
  -- Tomt betyder okänt. Okänt räknas aldrig som att påsen passar.
  vegetarisk boolean,
  vegansk boolean,
  glutenfri boolean,
  laktosfri boolean,
  -- Tomt betyder okänt. En tom lista betyder att påsen inte innehåller någon av de 14.
  allergener public.allergenlista,
  -- Kan innehålla spår av. Räknas inte som att påsen innehåller allergenen när man filtrerar.
  spar public.allergenlista,
  pris_sek_ca int check (pris_sek_ca >= 0),
  -- Butikens produktsida när priset kommer från en butik i stället för tillverkaren. Tomt annars.
  pris_kalla text check (pris_kalla ~ '^https?://'),
  kalla text not null check (kalla ~ '^https?://'),
  kontrollerad date,
  skapad timestamptz not null default now(),
  constraint matprodukter_vegansk_ar_vegetarisk check (vegansk is not true or vegetarisk is true),
  constraint matprodukter_pris_kalla_kraver_pris check (pris_kalla is null or pris_sek_ca is not null)
);

-- Samma påse ska inte kunna läggas in två gånger.
create unique index matprodukter_unik on public.matprodukter (lower(marke), lower(namn));

-- ─── Samma tur ───────────────────────────────────────────────────────────────
-- Gör det möjligt för främmande nycklar att kräva att två rader hör till samma tur.
alter table public.deltagare add constraint deltagare_id_tur unique (id, tur_id);
alter table public.ratter add constraint ratter_id_tur unique (id, tur_id);
alter table public.varor add constraint varor_id_tur unique (id, tur_id);

-- ─── Varor ───────────────────────────────────────────────────────────────────
alter table public.varor add column protein_per_100g numeric(4, 1) check (protein_per_100g >= 0);

-- Den ansvariga måste vara med i samma tur.
update public.varor v set ansvarig = null
  where ansvarig is not null and not exists (select 1 from public.deltagare d where d.id = v.ansvarig and d.tur_id = v.tur_id);
alter table public.varor
  drop constraint varor_ansvarig_fkey,
  add constraint varor_ansvarig_samma_tur foreign key (ansvarig, tur_id)
    references public.deltagare (id, tur_id) on delete set null (ansvarig);

-- ─── Rätter ──────────────────────────────────────────────────────────────────
-- En rätt kan vara en påse ur katalogen. Den har då inga ingredienser, och ansvarig och klart gäller påsarna
-- i inköpslistan. För egna rätter står ansvarig och klart på varorna.
-- restrict: en påse som finns i en matplan går inte att ta bort ur katalogen utan att man bestämmer vad som ska hända.
alter table public.ratter
  add column matprodukt_id uuid references public.matprodukter (id) on delete restrict,
  add column ansvarig uuid,
  add column klart boolean not null default false,
  add constraint ratter_ansvarig_samma_tur foreign key (ansvarig, tur_id)
    references public.deltagare (id, tur_id) on delete set null (ansvarig);

-- En påse förekommer en gång per tur. Den kan sedan ligga i hur många måltider som helst.
create unique index ratter_en_per_pase on public.ratter (tur_id, matprodukt_id) where matprodukt_id is not null;

-- ─── Ingredienser ────────────────────────────────────────────────────────────
-- Förut kunde en ingrediens peka på en vara i en annan tur. Nu har ingrediensen turens id,
-- och både rätten och varan måste höra till den turen.
alter table public.ingredienser add column tur_id uuid;
delete from public.ingredienser i
  using public.ratter r, public.varor v
  where r.id = i.ratt_id and v.id = i.vara_id and r.tur_id <> v.tur_id;
update public.ingredienser i set tur_id = r.tur_id from public.ratter r where r.id = i.ratt_id;

alter table public.ingredienser
  alter column tur_id set not null,
  drop constraint ingredienser_ratt_id_fkey,
  drop constraint ingredienser_vara_id_fkey,
  add constraint ingredienser_tur_fkey foreign key (tur_id) references public.turer (id) on delete cascade,
  add constraint ingredienser_ratt_samma_tur foreign key (ratt_id, tur_id)
    references public.ratter (id, tur_id) on delete cascade,
  add constraint ingredienser_vara_samma_tur foreign key (vara_id, tur_id)
    references public.varor (id, tur_id) on delete cascade;

create index ingredienser_ratt_id on public.ingredienser (ratt_id);

-- Policyerna läser turen direkt från raden i stället för via rätten.
drop policy "medlemmar ser" on public.ingredienser;
drop policy "owner och editor ändrar" on public.ingredienser;
create policy "medlemmar ser" on public.ingredienser for select to authenticated
  using (public.ar_medlem(tur_id));
create policy "owner och editor ändrar" on public.ingredienser for all to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));

-- ─── Måltider ────────────────────────────────────────────────────────────────
-- Flera rätter per måltid. En måltid utan rätt är ingen rad, och en måltid kan inte peka på en rätt i en annan tur.
delete from public.maltider where ratt_id is null;
delete from public.maltider m using public.ratter r where r.id = m.ratt_id and r.tur_id <> m.tur_id;

alter table public.maltider
  drop constraint maltider_pkey,
  drop constraint maltider_ratt_id_fkey;
alter table public.maltider
  add column id uuid not null default gen_random_uuid() primary key,
  add column sortering int not null default 0,
  alter column ratt_id set not null,
  add constraint maltider_ratt_samma_tur foreign key (ratt_id, tur_id)
    references public.ratter (id, tur_id) on delete cascade;

create index maltider_tur_dag on public.maltider (tur_id, dag);

-- ─── Kostbehov ───────────────────────────────────────────────────────────────
-- Uppgifter om hälsa, och därför känsliga. De bygger på personens eget samtycke, som gäller per tur.
-- Läsa: deltagarna i samma tur. Skapa, ändra och ta bort: bara personen själv, alltså deltagaren vars user_id är
-- den inloggade. Ingen annan, inte ens ägaren, anger kostbehov åt någon, och personer utan konto har inga.
-- Raden försvinner med deltagaren. Att ta bort raden är att återkalla samtycket.
create table public.kostbehov (
  deltagare_id uuid primary key references public.deltagare (id) on delete cascade,
  vegetarisk boolean not null default false,
  vegansk boolean not null default false,
  glutenfri boolean not null default false,
  laktosfri boolean not null default false,
  -- Allergener som personen inte tål.
  utan public.allergenlista not null default '{}',
  -- När personen senast samtyckte, det vill säga sparade. Har inget standardvärde: appen skickar det bara när
  -- kryssrutan för samtycke är ikryssad.
  samtycke_tid timestamptz not null
);

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke all on public.matprodukter, public.kostbehov from public, anon, authenticated;
grant select on public.matprodukter to authenticated;
grant select, insert, update, delete on public.kostbehov to authenticated;

alter table public.matprodukter enable row level security;
alter table public.kostbehov enable row level security;

-- Katalogen: inloggade läser. Det finns ingen policy för att skriva.
create policy "inloggade läser matkatalogen" on public.matprodukter for select to authenticated
  using (true);

create policy "medlemmar ser kostbehoven" on public.kostbehov for select to authenticated
  using (public.ar_medlem((select d.tur_id from public.deltagare d where d.id = deltagare_id)));

create policy "bara egna kostbehov" on public.kostbehov for all to authenticated
  using (exists (select 1 from public.deltagare d where d.id = deltagare_id and d.user_id = (select auth.uid())))
  with check (exists (select 1 from public.deltagare d where d.id = deltagare_id and d.user_id = (select auth.uid())));
