-- Packlistor: egna mallar som sparas på kontot, inte på en tur. Personliga.
--
-- Bara ägaren ser och ändrar sina mallar, även när man delar en tur med någon. En mall skapas ur en tur man är med i
-- (spara_packmall) och läggs i en tur man får ändra (anvand_packmall). Raderna kopieras åt båda hållen, så att en
-- ändring i mallen inte ändrar turen och tvärtom.
--
-- Mallen tar med det jag bär, det gruppen behöver (gemensamt) och det alla ska ha, men inte det andra i gruppen bär
-- själva. På rader som alla ska ha sparas min egen modell (packstatus) för sig, så att den blir min modell igen i nästa
-- tur och raden heter som förut för de andra. Vem som bar en gemensam rad sparas inte.

-- ─── Mallar ──────────────────────────────────────────────────────────────────
create table public.packmallar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Sparas utan mellanslag i början och slutet, så att samma namn inte går att spara två gånger.
  namn text not null check (namn = btrim(namn) and namn <> '' and char_length(namn) <= 80),
  -- Turen mallen sparades från, som text, så att den står kvar när turen tas bort.
  fran_tur_namn text check (char_length(fran_tur_namn) <= 120),
  skapad timestamptz not null default now(),
  -- Gör det möjligt för raderna att kräva samma ägare som mallen.
  constraint packmallar_id_user unique (id, user_id)
);

-- Ett namn en gång per person, oavsett stora och små bokstäver.
create unique index packmallar_unikt_namn on public.packmallar (user_id, lower(namn));

-- ─── Raderna ─────────────────────────────────────────────────────────────────
-- Samma gränser som packrader.
create table public.packmallrader (
  id uuid primary key default gen_random_uuid(),
  mall_id uuid not null,
  user_id uuid not null default auth.uid(),
  namn text not null check (btrim(namn) <> '' and char_length(namn) <= 120),
  kategori text not null default 'ovrigt' references public.kategorier (nyckel),
  underkategori text,
  produkt_id uuid references public.produkter (id) on delete set null,
  antal int not null default 1 check (antal between 0 and 999),
  vikt_g int check (vikt_g between 0 and 100000),
  typ text not null default 'ryggsack' check (typ in ('ryggsack', 'kropp', 'forbrukas')),
  alla boolean not null default false,
  gemensam boolean not null default false,
  notering text check (char_length(notering) <= 300),
  -- Min egen modell på en rad som alla ska ha, till exempel min sovsäck. Bara på sådana rader.
  egen_namn text check (btrim(egen_namn) <> '' and char_length(egen_namn) <= 120),
  egen_vikt_g int check (egen_vikt_g between 0 and 100000),
  egen_produkt_id uuid references public.produkter (id) on delete set null,
  sortering int not null default 0 check (sortering between 0 and 10000),
  constraint packmallrader_egen_bara_alla check (alla or (egen_namn is null and egen_vikt_g is null and egen_produkt_id is null)),
  constraint packmallrader_gemensam_eller_alla check (not (gemensam and alla)),
  constraint packmallrader_underkategori_fkey foreign key (kategori, underkategori)
    references public.underkategorier (kategori, nyckel),
  -- Raden hör till en mall med samma ägare, och försvinner med mallen.
  constraint packmallrader_samma_agare foreign key (mall_id, user_id)
    references public.packmallar (id, user_id) on delete cascade
);

create index packmallrader_mall on public.packmallrader (mall_id, user_id);

-- ─── Rättigheter ─────────────────────────────────────────────────────────────
revoke all on public.packmallar, public.packmallrader from public, anon, authenticated;
grant select, insert, update, delete on public.packmallar, public.packmallrader to authenticated;

alter table public.packmallar enable row level security;
alter table public.packmallrader enable row level security;

-- Bara ägaren, och en rad kan inte flyttas till någon annan.
create policy "egna packmallar" on public.packmallar for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "egna packmallrader" on public.packmallrader for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ─── Spara en tur som mall ───────────────────────────────────────────────────
-- Var och en i turen, även en läsare, får spara turens packlista som en egen mall. Körs som den inloggade (security
-- invoker), så RLS gäller: turens rader läses bara av medlemmar, och mallen blir den inloggades.
create function public.spara_packmall(t uuid, mall_namn text) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  nytt_namn text := btrim(mall_namn);
  jag uuid;
  mallen uuid;
begin
  if nytt_namn is null or nytt_namn = '' or char_length(nytt_namn) > 80 then
    raise exception 'Mallen behöver ett namn på högst 80 tecken';
  end if;
  select d.id into jag from public.deltagare d where d.tur_id = t and d.user_id = auth.uid();
  if jag is null then
    raise exception 'Du är inte med i turen';
  end if;

  insert into public.packmallar (namn, fran_tur_namn)
    select nytt_namn, left(tu.namn, 120) from public.turer tu where tu.id = t
    returning id into mallen;

  insert into public.packmallrader
    (mall_id, namn, kategori, underkategori, produkt_id, antal, vikt_g, typ, alla, gemensam, notering,
     egen_namn, egen_vikt_g, egen_produkt_id, sortering)
  select mallen, r.namn, r.kategori, r.underkategori, r.produkt_id, r.antal, r.vikt_g, r.typ, r.alla, r.gemensam, r.notering,
         case when r.alla then s.namn end,
         case when r.alla and s.namn is not null then s.vikt_g end,
         case when r.alla and s.namn is not null then s.produkt_id end,
         least(row_number() over (order by r.sortering, r.namn), 10000)::int
    from public.packrader r
    left join public.packstatus s on s.packrad_id = r.id and s.deltagare_id = jag
    where r.tur_id = t and r.med and (r.alla or r.gemensam or r.bars_av = jag);

  return mallen;
end;
$$;

-- ─── Lägga en mall i en tur ──────────────────────────────────────────────────
-- Bara owner och editor (kan_andra) och bara en egen mall. Raderna läggs sist i turen. Det jag bar i mallen bär jag
-- i turen, gemensamma rader bärs av ingen ännu, och rader som alla ska ha blir sådana igen, med min modell som min
-- rad i packstatus. Körs som den inloggade, så RLS gäller även här. Ger antalet rader som lades till.
create function public.anvand_packmall(mall uuid, t uuid) returns int
language plpgsql security invoker set search_path = '' as $$
declare
  jag uuid;
  sist int;
  m record;
  raden uuid;
  antal_rader int := 0;
begin
  if not public.kan_andra(t) then
    raise exception 'Du kan inte ändra packlistan i turen';
  end if;
  if not exists (select 1 from public.packmallar p where p.id = mall and p.user_id = auth.uid()) then
    raise exception 'Mallen finns inte';
  end if;
  select d.id into jag from public.deltagare d where d.tur_id = t and d.user_id = auth.uid();
  select coalesce(max(r.sortering), 0) into sist from public.packrader r where r.tur_id = t;

  for m in
    select * from public.packmallrader r
    where r.mall_id = mall and r.user_id = auth.uid()
    order by r.sortering, r.namn
  loop
    antal_rader := antal_rader + 1;
    insert into public.packrader
      (tur_id, namn, kategori, underkategori, produkt_id, antal, vikt_g, typ, bars_av, alla, gemensam, notering, sortering)
    values (t, m.namn, m.kategori, m.underkategori, m.produkt_id, m.antal, m.vikt_g, m.typ,
            case when m.alla or m.gemensam then null else jag end,
            m.alla, m.gemensam, m.notering, sist + antal_rader)
    returning id into raden;
    -- Min egen modell blir min rad i packstatus, som när man väljer sin modell i packlistan.
    if m.alla and m.egen_namn is not null and jag is not null then
      insert into public.packstatus (packrad_id, deltagare_id, tur_id, namn, vikt_g, produkt_id)
        values (raden, jag, t, m.egen_namn, m.egen_vikt_g, m.egen_produkt_id);
    end if;
  end loop;
  return antal_rader;
end;
$$;

revoke execute on function public.spara_packmall(uuid, text) from public, anon;
grant execute on function public.spara_packmall(uuid, text) to authenticated;
revoke execute on function public.anvand_packmall(uuid, uuid) from public, anon;
grant execute on function public.anvand_packmall(uuid, uuid) to authenticated;
