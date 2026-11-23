-- Skafferiet: påsar ur matkatalogen som man har hemma, och favoriter. Båda är personliga.
-- Döps om med ett nytt datum precis innan den körs, så att den kommer efter de migreringar som har körts.
--
-- Bara ägaren ser och ändrar sina rader, även när man delar en tur med någon. Ingen annan når dem,
-- inte heller via matplanen: inköpslistan visar bara ens eget skafferi.

-- ─── Har hemma ─────────────────────────────────────────────────────────────
create table public.skafferi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Påsen försvinner ur skafferiet om den tas bort ur katalogen.
  matprodukt_id uuid not null references public.matprodukter (id) on delete cascade,
  antal int not null default 1 check (antal between 1 and 999),
  -- Frivilligt. Ett datum som har passerat räknas inte som att man har påsen hemma.
  bast_fore date,
  skapad timestamptz not null default now(),
  -- En rad per påse. Fler påsar är ett högre antal.
  constraint skafferi_en_per_pase unique (user_id, matprodukt_id)
);

-- ─── Favoriter ─────────────────────────────────────────────────────────────
create table public.matfavoriter (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  matprodukt_id uuid not null references public.matprodukter (id) on delete cascade,
  skapad timestamptz not null default now(),
  primary key (user_id, matprodukt_id)
);

create index skafferi_matprodukt_id on public.skafferi (matprodukt_id);
create index matfavoriter_matprodukt_id on public.matfavoriter (matprodukt_id);

-- ─── Rättigheter ───────────────────────────────────────────────────────────
revoke all on public.skafferi, public.matfavoriter from public, anon, authenticated;
grant select, insert, update, delete on public.skafferi to authenticated;
-- En favorit ändras inte, den läggs till eller tas bort.
grant select, insert, delete on public.matfavoriter to authenticated;

alter table public.skafferi enable row level security;
alter table public.matfavoriter enable row level security;

-- Bara ägaren, och en rad kan inte flyttas till någon annan.
create policy "eget skafferi" on public.skafferi for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "egna favoriter" on public.matfavoriter for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
