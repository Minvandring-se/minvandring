-- Packlistan: rader med förrådets kategorier, gemensamma rader som en person bär åt gruppen, och var och ens egen
-- modell på rader som alla ska ha (till exempel Sovsäck). Allt i en packlista måste höra till samma tur.
-- Rättigheterna är som förut: alla i turen ser allt, ägare och redigerare ändrar raderna, och var och en, även en
-- läsare, ändrar sin egen bock och sin egen modell.

-- ─── Packrader ───────────────────────────────────────────────────────────────
-- Förrådets kategorier i stället för fri text. En kategori skriven som i förrådet behåller sin plats, och det som
-- inte är en kategori blir Övrigt.
alter table public.packrader alter column kategori drop default;
update public.packrader r set kategori = e.nyckel
  from (values
    ('packning', 'ryggsäck och packning'), ('talt', 'tält och vindskydd'), ('sova', 'sova'), ('kok', 'kök'),
    ('vatten', 'vatten'), ('klader', 'kläder'), ('skor', 'skor'), ('prylar', 'prylar och elektronik'),
    ('sakerhet', 'säkerhet och navigation'), ('verktyg', 'verktyg'), ('medicin', 'första hjälpen och medicin'),
    ('vinter', 'vinter'), ('hygien', 'hygien'), ('ovrigt', 'övrigt')
  ) as e (nyckel, etikett)
  where lower(btrim(r.kategori)) in (e.nyckel, e.etikett);
update public.packrader set kategori = 'ovrigt' where kategori not in (select nyckel from public.kategorier);
alter table public.packrader
  alter column kategori set default 'ovrigt',
  add constraint packrader_kategori_fkey foreign key (kategori) references public.kategorier (nyckel);

-- Frivillig, som i förrådet. Är den satt måste den höra till kategorin.
alter table public.packrader
  add column underkategori text,
  add constraint packrader_underkategori_fkey foreign key (kategori, underkategori)
    references public.underkategorier (kategori, nyckel);

-- Produkten i katalogen som saken kom från, om den kom därifrån. Namn och vikt kopieras in, så raden finns kvar
-- även om produkten tas bort ur katalogen.
alter table public.packrader add column produkt_id uuid references public.produkter (id) on delete set null;

-- En gemensam rad bärs av en person åt gruppen. En rad som alla ska ha kan inte samtidigt vara gemensam.
alter table public.packrader
  add column gemensam boolean not null default false,
  add constraint packrader_gemensam_eller_alla check (not (gemensam and alla));

-- Befintliga rader rättas först, så att villkoren går att lägga till.
update public.packrader set namn = 'Namnlös' where btrim(namn) = '';
update public.packrader set namn = left(btrim(namn), 120) where char_length(namn) > 120;
update public.packrader set vikt_g = null where vikt_g > 100000;
update public.packrader set antal = 999 where antal > 999;
alter table public.packrader
  add constraint packrader_namn check (btrim(namn) <> '' and char_length(namn) <= 120),
  add constraint packrader_vikt check (vikt_g <= 100000),
  add constraint packrader_antal check (antal <= 999);

-- Den som bär raden måste vara med i samma tur.
alter table public.packrader add constraint packrader_id_tur unique (id, tur_id);
update public.packrader r set bars_av = null
  where bars_av is not null and not exists (select 1 from public.deltagare d where d.id = r.bars_av and d.tur_id = r.tur_id);
alter table public.packrader
  drop constraint packrader_bars_av_fkey,
  add constraint packrader_bars_av_samma_tur foreign key (bars_av, tur_id)
    references public.deltagare (id, tur_id) on delete set null (bars_av);
create index packrader_bars_av on public.packrader (bars_av, tur_id) where bars_av is not null;

-- ─── Packstatus ──────────────────────────────────────────────────────────────
-- En rad per packrad och deltagare: bocken och, på rader som alla ska ha, personens egen modell och vikt.
alter table public.packstatus add column tur_id uuid;
update public.packstatus s set tur_id = r.tur_id from public.packrader r where r.id = s.packrad_id;
-- Rader där deltagaren inte är med i packradens tur går inte att rätta, så de tas bort.
delete from public.packstatus s
  where not exists (select 1 from public.deltagare d where d.id = s.deltagare_id and d.tur_id = s.tur_id);
alter table public.packstatus
  alter column tur_id set not null,
  drop constraint packstatus_packrad_id_fkey,
  drop constraint packstatus_deltagare_id_fkey,
  add constraint packstatus_packrad_samma_tur foreign key (packrad_id, tur_id)
    references public.packrader (id, tur_id) on delete cascade,
  add constraint packstatus_deltagare_samma_tur foreign key (deltagare_id, tur_id)
    references public.deltagare (id, tur_id) on delete cascade;

alter table public.packstatus
  add column namn text check (namn is null or (btrim(namn) <> '' and char_length(namn) <= 120)),
  add column vikt_g int check (vikt_g >= 0 and vikt_g <= 100000),
  add column produkt_id uuid references public.produkter (id) on delete set null;

create index packstatus_tur on public.packstatus (tur_id);
create index packstatus_deltagare on public.packstatus (deltagare_id, tur_id);

-- Samma regler som förut, men med turen på raden i stället för en fråga mot packrader.
drop policy "medlemmar ser" on public.packstatus;
drop policy "owner, editor eller egen bock" on public.packstatus;

create policy "medlemmar ser" on public.packstatus for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner, editor eller egen rad" on public.packstatus for all to authenticated
  -- De främmande nycklarna garanterar redan att deltagaren och packraden hör till turen. Villkoret på turen här är
  -- ett extra skydd om de någon gång ändras.
  using (
    public.kan_andra(tur_id)
    or exists (select 1 from public.deltagare d where d.id = deltagare_id and d.tur_id = packstatus.tur_id and d.user_id = auth.uid())
  )
  with check (
    public.kan_andra(tur_id)
    or exists (select 1 from public.deltagare d where d.id = deltagare_id and d.tur_id = packstatus.tur_id and d.user_id = auth.uid())
  );
