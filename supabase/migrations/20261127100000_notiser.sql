-- Notiser: klockan uppe till höger med det som har hänt. Steg 1 i planen för notiser, vänner, grupper och påminnelser.
--
-- En rad är en notis till en person. Bara personen själv ser, markerar som läst och tar bort sina notiser.
-- Ingen kan skapa en notis direkt: de skapas av databasens egna triggrar och funktioner, som skriver texten och
-- sidan den leder till. Appen visar dem bara.
--
-- Den första sorten är "Anna gick med i Kungsleden 2026", till ägare och redigerare, när någon går med i turen
-- själv via inbjudningslänken (som ny deltagare eller genom att ta över en person utan konto).

-- ─── Notiserna ───────────────────────────────────────────────────────────────
-- Sorterna står också i NOTISTYPER i src/lib/notiser.ts, och ett test kontrollerar att de stämmer överens.
create table public.notiser (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  typ text not null check (typ in ('gick_med')),
  text text not null check (btrim(text) <> '' and char_length(text) <= 300),
  -- En sökväg inom appen, aldrig en annan webbplats.
  lank text check (lank ~ '^/[^/\\]'),
  -- Notiser från en person försvinner när personen raderar sitt konto, så att namnet inte ligger kvar.
  fran_user_id uuid references auth.users (id) on delete cascade,
  tur_id uuid references public.turer (id) on delete cascade,
  -- När notisen lästes. Tom betyder oläst.
  last timestamptz,
  skapad timestamptz not null default now()
);
create index notiser_user_id_skapad on public.notiser (user_id, skapad desc);
create index notiser_tur_id on public.notiser (tur_id);

revoke all on public.notiser from public, anon, authenticated;
-- Läsa, ta bort och markera som läst. Inget annat går att ändra, och inget går att skapa från appen.
grant select, delete on public.notiser to authenticated;
grant update (last) on public.notiser to authenticated;
alter table public.notiser enable row level security;

create policy "ser sina egna" on public.notiser for select to authenticated using (user_id = auth.uid());
create policy "markerar sina egna som lästa" on public.notiser for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tar bort sina egna" on public.notiser for delete to authenticated using (user_id = auth.uid());

-- Nya notiser syns direkt i klockan. Nya och ändrade rader skickas bara till den som får läsa dem. En borttagning
-- går inte att begränsa till mottagaren, så appen lyssnar inte på borttagningar. Sätt inte replica identity till full.
alter publication supabase_realtime add table public.notiser;

-- ─── Någon gick med i turen ──────────────────────────────────────────────────
-- Körs när en rad i deltagare får ett konto: en ny deltagare med konto, eller en person utan konto som tas över.
-- Bara när personen gick med själv (raden är den inloggades egen) och inte är ägare. Den som skapar en tur blir
-- ägare och får därför ingen notis om sig själv. Notisen går till turens ägare och redigerare med konto, utom
-- personen själv. Security definer, eftersom den som går med inte får skapa notiser åt andra.
-- Den som lämnar och går med igen ger ingen ny notis samma dygn, så att ingen kan fylla klockan hos ägaren.
create function public.notis_gick_med() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id is null or new.user_id is distinct from auth.uid() or new.roll = 'owner' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.user_id is not null then
    return new;
  end if;
  insert into public.notiser (user_id, typ, text, lank, fran_user_id, tur_id)
  select d.user_id, 'gick_med', new.namn || ' gick med i ' || t.namn, '/tur/' || t.id || '#deltagare', new.user_id, t.id
    from public.deltagare d
    join public.turer t on t.id = d.tur_id
   where d.tur_id = new.tur_id
     and d.user_id is not null
     and d.user_id <> new.user_id
     and d.roll in ('owner', 'editor')
     and not exists (
       select 1 from public.notiser n
        where n.user_id = d.user_id and n.tur_id = new.tur_id and n.fran_user_id = new.user_id
          and n.typ = 'gick_med' and n.skapad > now() - interval '1 day'
     );
  return new;
end;
$$;
revoke execute on function public.notis_gick_med() from public, anon, authenticated;
create trigger notis_gick_med after insert or update of user_id on public.deltagare
  for each row execute function public.notis_gick_med();

-- En deltagare som tas bort ur turen, eller lämnar den, förlorar sina notiser om turen.
create function public.notiser_bort_med_deltagare() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.user_id is not null then
    delete from public.notiser where tur_id = old.tur_id and user_id = old.user_id;
  end if;
  return old;
end;
$$;
revoke execute on function public.notiser_bort_med_deltagare() from public, anon, authenticated;
create trigger notiser_bort_med_deltagare after delete on public.deltagare
  for each row execute function public.notiser_bort_med_deltagare();
