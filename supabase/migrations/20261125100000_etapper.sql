-- Dagsetapper: en rad per dag i turen med var man går från och till, sträckan och var man sover.
-- Alla i turen ser etapperna, ägare och redigerare ändrar dem. En rad kan finnas för en dag efter turens sista
-- vandringsdag, om antalet dagar har minskats. Appen visar den då för sig.

create table public.etapper (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  dag int not null check (dag between 1 and 30),
  fran text check (fran is null or (btrim(fran) <> '' and char_length(fran) <= 80)),
  till text check (till is null or (btrim(till) <> '' and char_length(till) <= 80)),
  km numeric(4, 1) check (km is null or (km > 0 and km <= 99.9)),
  -- Var man sover efter dagens etapp. Tomt sista dagen när man åker hem.
  natt text check (natt is null or (btrim(natt) <> '' and char_length(natt) <= 80)),
  boende text check (boende in ('stuga', 'talt', 'annat')),
  -- Bara stugor och annat boende bokas.
  bokad boolean not null default false check (not bokad or coalesce(boende in ('stuga', 'annat'), false)),
  notering text check (notering is null or (btrim(notering) <> '' and char_length(notering) <= 300)),
  unique (tur_id, dag)
);

revoke all on public.etapper from anon;
grant select, insert, update, delete on public.etapper to authenticated;
alter table public.etapper enable row level security;

create policy "medlemmar ser" on public.etapper for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor lägger till" on public.etapper for insert to authenticated with check (public.kan_andra(tur_id));
create policy "owner och editor ändrar" on public.etapper for update to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));
create policy "owner och editor tar bort" on public.etapper for delete to authenticated using (public.kan_andra(tur_id));

-- Ändringar syns direkt för de andra i turen. Sätt inte replica identity full: en borttagning skickas till alla
-- som lyssnar, och då skulle hela raden följa med i stället för bara id.
alter publication supabase_realtime add table public.etapper;
