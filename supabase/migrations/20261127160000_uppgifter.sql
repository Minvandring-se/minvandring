-- Att göra i turen: uppgifter som gruppen ska fixa före avfärd, till exempel att boka stugor eller köpa gas, med vem
-- som gör det och när. Alla i turen ser listan, ägare och redigerare ändrar den, och den som är ansvarig, även en
-- läsare, bockar av sin egen uppgift med public.bocka_uppgift.
create table public.uppgifter (
  id uuid primary key default gen_random_uuid(),
  tur_id uuid not null references public.turer (id) on delete cascade,
  text text not null check (text = btrim(text) and text <> '' and char_length(text) <= 200),
  -- Personen i turen som gör det. Tomt betyder att ingen har tagit den än.
  ansvarig uuid,
  klart_till date,
  klar boolean not null default false,
  sortering int not null default 0 check (sortering between 0 and 100000),
  skapad timestamptz not null default now(),
  constraint uppgifter_id_tur unique (id, tur_id),
  -- Den ansvarige måste vara med i samma tur, och uppgiften blir utan ansvarig när personen tas bort.
  constraint uppgifter_ansvarig_samma_tur foreign key (ansvarig, tur_id)
    references public.deltagare (id, tur_id) on delete set null (ansvarig)
);

create index uppgifter_tur on public.uppgifter (tur_id);
create index uppgifter_ansvarig on public.uppgifter (ansvarig, tur_id) where ansvarig is not null;

-- Bara personer är ansvariga, inte hundar.
create function public.bara_personer_ansvarar() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.ansvarig is not null and not exists
     (select 1 from public.deltagare d where d.id = new.ansvarig and d.typ = 'person') then
    raise exception 'Bara personer kan vara ansvariga' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bara_personer_ansvarar before insert or update of ansvarig on public.uppgifter
  for each row execute function public.bara_personer_ansvarar();

-- Blir en person en hund slutar den att vara ansvarig.
create function public.hund_ansvarar_inte() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.typ <> 'person' and old.typ = 'person' then
    update public.uppgifter set ansvarig = null where ansvarig = new.id;
  end if;
  return new;
end;
$$;

create trigger hund_ansvarar_inte after update of typ on public.deltagare
  for each row execute function public.hund_ansvarar_inte();

revoke all on function public.bara_personer_ansvarar() from public, anon, authenticated;
revoke all on function public.hund_ansvarar_inte() from public, anon, authenticated;

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke all on public.uppgifter from public, anon, authenticated;
grant select, insert, update, delete on public.uppgifter to authenticated;
alter table public.uppgifter enable row level security;

create policy "medlemmar ser" on public.uppgifter for select to authenticated using (public.ar_medlem(tur_id));
create policy "owner och editor lägger till" on public.uppgifter for insert to authenticated with check (public.kan_andra(tur_id));
create policy "owner och editor ändrar" on public.uppgifter for update to authenticated
  using (public.kan_andra(tur_id)) with check (public.kan_andra(tur_id));
create policy "owner och editor tar bort" on public.uppgifter for delete to authenticated using (public.kan_andra(tur_id));

-- ─── Bocka av sin egen uppgift ───────────────────────────────────────────────
-- Den ansvarige, även en läsare, bockar av eller ångrar sin egen uppgift. Funktionen ändrar bara klar och bara när
-- den inloggade är ansvarig. Ger true när uppgiften ändrades.
create function public.bocka_uppgift(u uuid, ar_klar boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.uppgifter g set klar = ar_klar
    from public.deltagare d
    where g.id = u and d.id = g.ansvarig and d.tur_id = g.tur_id and d.user_id = auth.uid();
  return found;
end;
$$;

revoke execute on function public.bocka_uppgift(uuid, boolean) from public, anon;
grant execute on function public.bocka_uppgift(uuid, boolean) to authenticated;

-- Ändringar syns direkt för de andra i turen. Replica identity lämnas som default, så att en borttagning bara
-- skickar id.
alter publication supabase_realtime add table public.uppgifter;
