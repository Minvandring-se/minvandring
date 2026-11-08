-- Grunden för Min Vandring version 1.
-- Allt hör till en tur. Den som är deltagare i turen (har en rad i deltagare med sitt user_id) får läsa och ändra allt i turen.
-- Kör filen i Supabase: SQL Editor → New query → klistra in → Run. Eller med Supabase CLI: supabase db push.

-- ─── Profiler ────────────────────────────────────────────────────────────────
create table public.profiler (
  id uuid primary key references auth.users (id) on delete cascade,
  namn text not null default '',
  skapad timestamptz not null default now()
);

-- En profil skapas automatiskt när någon loggar in första gången.
create function public.ny_anvandare() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiler (id, namn)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'namn', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger skapa_profil after insert on auth.users
  for each row execute function public.ny_anvandare();

-- ─── Turer och deltagare ─────────────────────────────────────────────────────
create table public.turer (
  id uuid primary key default gen_random_uuid(),
  namn text not null,
  destination text,
  startpunkt text,
  avresa date,
  hemkomst date,
  dagar int not null default 3 check (dagar between 1 and 30),
  reservdagar int not null default 1 check (reservdagar between 0 and 10),
  -- Koden i inbjudningslänken (minvandring.se/ga-med/KOD).
  inbjudningskod text not null unique default upper(substr(md5(random()::text), 1, 6)),
  skapad_av uuid not null default auth.uid() references auth.users (id),
  skapad timestamptz not null default now()
);

create table public.deltagare (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  -- Tomt för hundar och för deltagare som inte har gått med själva än.
  user_id uuid references auth.users (id) on delete set null,
  namn text not null,
  typ text not null default 'person' check (typ in ('person', 'hund')),
  max_barvikt_kg numeric(4, 1) not null default 20,
  -- Andel av maten (0–1). Tomt betyder att resten delas lika mellan personerna.
  matandel numeric(4, 3) check (matandel between 0 and 1),
  -- Bara för hundar: egen mat per dag i gram.
  hundmat_per_dag_g int,
  sortering int not null default 0,
  unique (tur_id, user_id)
);

-- Är den inloggade deltagare i turen? Security definer så att policyn på deltagare inte frågar sig själv i en loop.
create function public.ar_medlem(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.deltagare d where d.tur_id = t and d.user_id = auth.uid());
$$;

-- Den som skapar en tur blir automatiskt deltagare.
create function public.ny_tur() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.deltagare (tur_id, user_id, namn)
  values (new.id, new.skapad_av, coalesce((select p.namn from public.profiler p where p.id = new.skapad_av), 'Jag'));
  return new;
end;
$$;

create trigger skapa_deltagare after insert on public.turer
  for each row execute function public.ny_tur();

-- Gå med i en tur med inbjudningskoden. Returnerar turens id.
create function public.ga_med(kod text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  t uuid;
begin
  if auth.uid() is null then
    raise exception 'Du måste vara inloggad';
  end if;
  select id into t from public.turer where inbjudningskod = upper(trim(kod));
  if t is null then
    raise exception 'Hittar ingen tur med koden %', kod;
  end if;
  insert into public.deltagare (tur_id, user_id, namn, sortering)
  values (
    t,
    auth.uid(),
    coalesce((select p.namn from public.profiler p where p.id = auth.uid()), 'Ny deltagare'),
    (select coalesce(max(sortering), 0) + 1 from public.deltagare where tur_id = t)
  )
  on conflict (tur_id, user_id) do nothing;
  return t;
end;
$$;

-- ─── Packning ────────────────────────────────────────────────────────────────
create table public.packrader (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  kategori text not null default 'Övrigt',
  namn text not null,
  antal int not null default 1 check (antal >= 0),
  vikt_g int check (vikt_g >= 0),
  -- Vem som bär saken. Tomt + alla = true betyder att varje person har en egen.
  bars_av uuid references public.deltagare (id) on delete set null,
  alla boolean not null default false,
  typ text not null default 'ryggsack' check (typ in ('ryggsack', 'kropp', 'forbrukas')),
  med boolean not null default true,
  notering text,
  sortering int not null default 0
);

create table public.packstatus (
  packrad_id uuid not null references public.packrader (id) on delete cascade,
  deltagare_id uuid not null references public.deltagare (id) on delete cascade,
  packad boolean not null default false,
  primary key (packrad_id, deltagare_id)
);

-- ─── Mat ─────────────────────────────────────────────────────────────────────
create table public.varor (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  namn text not null,
  kategori text,
  kcal_per_100g int,
  -- Mängd utöver recepten, t.ex. kaffe och saft.
  extra_g int not null default 0,
  varifran text check (varifran in ('kopa', 'hemifran')),
  ansvarig uuid references public.deltagare (id) on delete set null,
  klart boolean not null default false,
  notering text,
  unique (tur_id, namn)
);

create table public.ratter (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  namn text not null,
  kokas boolean not null default false,
  unique (tur_id, namn)
);

create table public.ingredienser (
  id uuid primary key default gen_random_uuid(),
  ratt_id uuid not null references public.ratter (id) on delete cascade,
  vara_id uuid not null references public.varor (id) on delete cascade,
  gram_per_portion int not null check (gram_per_portion >= 0)
);

create table public.maltider (
  tur_id uuid not null references public.turer (id) on delete cascade,
  -- Dag 1, 2, 3 … Reservdagar ligger efter vandringsdagarna.
  dag int not null check (dag >= 1),
  maltid text not null check (maltid in ('frukost', 'lunch', 'middag', 'mellanmal')),
  ratt_id uuid references public.ratter (id) on delete set null,
  primary key (tur_id, dag, maltid)
);

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
-- Inga anonyma anrop. Inloggade får bara det som policyerna nedan släpper igenom.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on
  public.profiler, public.turer, public.deltagare, public.packrader, public.packstatus,
  public.varor, public.ratter, public.ingredienser, public.maltider
to authenticated;
grant execute on function public.ga_med(text) to authenticated;
grant execute on function public.ar_medlem(uuid) to authenticated;

alter table public.profiler enable row level security;
alter table public.turer enable row level security;
alter table public.deltagare enable row level security;
alter table public.packrader enable row level security;
alter table public.packstatus enable row level security;
alter table public.varor enable row level security;
alter table public.ratter enable row level security;
alter table public.ingredienser enable row level security;
alter table public.maltider enable row level security;

-- Profiler: man ser och ändrar bara sin egen.
create policy "egen profil" on public.profiler for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Turer
create policy "medlemmar ser turen" on public.turer for select to authenticated
  using (public.ar_medlem(id) or skapad_av = auth.uid());
create policy "skapa tur" on public.turer for insert to authenticated
  with check (skapad_av = auth.uid());
create policy "medlemmar ändrar turen" on public.turer for update to authenticated
  using (public.ar_medlem(id)) with check (public.ar_medlem(id));
create policy "skaparen tar bort turen" on public.turer for delete to authenticated
  using (skapad_av = auth.uid());

-- Allt som hör till en tur
create policy "medlemmar" on public.deltagare for all to authenticated
  using (public.ar_medlem(tur_id)) with check (public.ar_medlem(tur_id));
create policy "medlemmar" on public.packrader for all to authenticated
  using (public.ar_medlem(tur_id)) with check (public.ar_medlem(tur_id));
create policy "medlemmar" on public.varor for all to authenticated
  using (public.ar_medlem(tur_id)) with check (public.ar_medlem(tur_id));
create policy "medlemmar" on public.ratter for all to authenticated
  using (public.ar_medlem(tur_id)) with check (public.ar_medlem(tur_id));
create policy "medlemmar" on public.maltider for all to authenticated
  using (public.ar_medlem(tur_id)) with check (public.ar_medlem(tur_id));

create policy "medlemmar" on public.packstatus for all to authenticated
  using (public.ar_medlem((select r.tur_id from public.packrader r where r.id = packrad_id)))
  with check (public.ar_medlem((select r.tur_id from public.packrader r where r.id = packrad_id)));
create policy "medlemmar" on public.ingredienser for all to authenticated
  using (public.ar_medlem((select r.tur_id from public.ratter r where r.id = ratt_id)))
  with check (public.ar_medlem((select r.tur_id from public.ratter r where r.id = ratt_id)));

-- Realtid: packstatus och packrader uppdateras live hos alla i turen.
alter publication supabase_realtime add table public.packstatus, public.packrader;
