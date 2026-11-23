-- Egna recept: rätter med ingredienser som sparas på kontot, inte på en tur. Personliga.
-- Döps om med ett nytt datum precis innan den körs, så att den kommer efter de migreringar som har körts.
--
-- Bara ägaren ser och ändrar sina recept, även när man delar en tur med någon. När ett recept läggs i en tur
-- kopieras det till turens rätter (ratter, varor och ingredienser) med turens vanliga policyer, så att en senare
-- ändring i receptet inte ändrar turen. Här behövs därför ingen koppling mellan recept och turer.

-- ─── Recept ────────────────────────────────────────────────────────────────
create table public.recept (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Sparas utan mellanslag i början och slutet, så att samma namn inte går att spara två gånger.
  namn text not null check (namn = btrim(namn) and namn <> '' and char_length(namn) <= 80),
  skapad timestamptz not null default now(),
  -- Gör det möjligt för raderna att kräva samma ägare som receptet.
  constraint recept_id_user unique (id, user_id)
);

-- Ett namn en gång per person, oavsett stora och små bokstäver.
create unique index recept_unikt_namn on public.recept (user_id, lower(namn));

-- ─── Ingredienserna ────────────────────────────────────────────────────────
-- Samma gränser som i formuläret för egna rätter (src/lib/mat.ts, tolkaRattformular).
create table public.receptrader (
  id uuid primary key default gen_random_uuid(),
  recept_id uuid not null,
  user_id uuid not null default auth.uid(),
  vara text not null check (vara = btrim(vara) and vara <> '' and char_length(vara) <= 80),
  gram_per_portion int not null check (gram_per_portion between 1 and 5000),
  kcal_per_100g int check (kcal_per_100g between 0 and 900),
  protein_per_100g numeric(4, 1) check (protein_per_100g between 0 and 100),
  sortering int not null default 0,
  -- Raden hör till ett recept med samma ägare, och försvinner med receptet.
  constraint receptrader_samma_agare foreign key (recept_id, user_id)
    references public.recept (id, user_id) on delete cascade
);

-- En vara en gång per recept. user_id ingår, så att ingen kan se vilka varor som finns i någon annans recept
-- genom att försöka lägga in en rad i det och jämföra felen.
create unique index receptrader_unik_vara on public.receptrader (recept_id, user_id, lower(vara));

-- ─── Rättigheter ───────────────────────────────────────────────────────────
revoke all on public.recept, public.receptrader from public, anon, authenticated;
grant select, insert, update, delete on public.recept, public.receptrader to authenticated;

alter table public.recept enable row level security;
alter table public.receptrader enable row level security;

-- Bara ägaren, och en rad kan inte flyttas till någon annan.
create policy "egna recept" on public.recept for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "egna receptrader" on public.receptrader for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
