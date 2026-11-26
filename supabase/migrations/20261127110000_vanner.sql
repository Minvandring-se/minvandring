-- Vänner: vänförfrågan via mejladress eller till någon man har vandrat med, vänlänk, godkänn och neka i notiserna,
-- och sidan Vänner. Steg 2 i planen för notiser, vänner, grupper och påminnelser.
--
-- Tabellerna nås bara genom funktionerna här. Ingen roll har rättigheter på dem, så RLS släpper inte fram något.
--
-- En förfrågan via mejladress får aldrig avslöja om adressen har ett konto. Den som skickar får alltid samma svar,
-- och ser alltid samma "Väntar på svar" med adressen, vare sig adressen har ett konto, mottagaren har nekat eller
-- ni redan är vänner. En förfrågan försvinner 30 dagar efter att den skickades, och en nekad 30 dagar efter att den
-- nekades. Med den försvinner också mejladressen.

-- ─── Förfrågningar ───────────────────────────────────────────────────────────
create table public.vanforfragningar (
  id uuid primary key default gen_random_uuid(),
  fran_user_id uuid not null references auth.users (id) on delete cascade,
  -- Mottagarens konto. Tomt när adressen inte har något konto. Den som skickar får aldrig se det.
  till_user_id uuid references auth.users (id) on delete cascade,
  -- Adressen som skrevs, i små bokstäver. Bara när förfrågan skickades via mejladress.
  till_epost text check (char_length(till_epost) <= 254),
  skapad timestamptz not null default now(),
  -- När mottagaren nekade. Den som skickar ser ingen skillnad.
  nekad timestamptz,
  -- När den som skickade ångrade en nekad förfrågan. Raden döljs men finns kvar i 30 dagar, så att ett ångrat och
  -- omskickat försök inte ger mottagaren en ny notis.
  angrad timestamptz,
  check (till_user_id is not null or till_epost is not null),
  check (till_user_id is distinct from fran_user_id)
);
create index vanforfragningar_fran on public.vanforfragningar (fran_user_id);
create index vanforfragningar_till on public.vanforfragningar (till_user_id);
create unique index vanforfragningar_en_per_adress on public.vanforfragningar (fran_user_id, till_epost) where till_epost is not null;
create unique index vanforfragningar_en_per_person on public.vanforfragningar (fran_user_id, till_user_id) where till_epost is null;

revoke all on public.vanforfragningar from public, anon, authenticated;
alter table public.vanforfragningar enable row level security;

-- ─── Vänskap ─────────────────────────────────────────────────────────────────
-- Ett par finns bara en gång, med det minsta id:t först, oavsett vem som frågade.
create table public.vanskap (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  skapad timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);
create index vanskap_user_b on public.vanskap (user_b);

revoke all on public.vanskap from public, anon, authenticated;
alter table public.vanskap enable row level security;

-- ─── Vänlänkar ───────────────────────────────────────────────────────────────
-- En länk per person, som gäller i 7 dagar. En ny länk gör den gamla ogiltig.
create table public.vanlankar (
  user_id uuid primary key references auth.users (id) on delete cascade,
  kod text not null unique check (kod ~ '^[0-9a-f]{32}$'),
  giltig_till timestamptz not null
);

revoke all on public.vanlankar from public, anon, authenticated;
alter table public.vanlankar enable row level security;

-- ─── Försök ──────────────────────────────────────────────────────────────────
-- Räknar förfrågningar (högst 20 per dygn) och felaktiga vänlänkar (högst 10 per timme), som inbjudningsforsok.
create table public.vanforsok (
  user_id uuid not null references auth.users (id) on delete cascade,
  typ text not null check (typ in ('forfragan', 'lank')),
  tid timestamptz not null default now()
);
create index vanforsok_user_id on public.vanforsok (user_id, typ, tid);

revoke all on public.vanforsok from public, anon, authenticated;
alter table public.vanforsok enable row level security;

-- ─── Notiser om vänner ───────────────────────────────────────────────────────
-- En notis om en förfrågan försvinner med förfrågan: när den besvaras, ångras eller blir för gammal.
alter table public.notiser add column vanforfragan_id uuid references public.vanforfragningar (id) on delete cascade;
create index notiser_vanforfragan_id on public.notiser (vanforfragan_id);
alter table public.notiser drop constraint notiser_typ_check;
alter table public.notiser add constraint notiser_typ_check
  check (typ in ('gick_med', 'vanforfragan', 'van_godkand', 'van_via_lank'));

-- ─── Hjälpfunktioner, bara för funktionerna här ──────────────────────────────
create function public.ar_van(annan_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.vanskap v
     where v.user_a = least(auth.uid(), annan_user_id) and v.user_b = greatest(auth.uid(), annan_user_id)
  );
$$;

-- Tar bort förfrågningar som är för gamla, och gamla försök. Notiserna om dem försvinner med dem.
create function public.stada_vanner() returns void
language sql security definer set search_path = '' as $$
  delete from public.vanforfragningar where coalesce(nekad, skapad) < now() - interval '30 days';
  delete from public.vanforsok where tid < now() - interval '1 day';
$$;

-- Låser paret i transaktionen, så att två som frågar varandra samtidigt hanteras en i taget.
create function public.las_vanpar(a uuid, b uuid) returns void
language sql set search_path = '' as $$
  select pg_advisory_xact_lock(hashtextextended(least(a, b)::text || greatest(a, b)::text, 0));
$$;

-- Gör två personer till vänner en gång, och tar bort förfrågningarna mellan dem (och notiserna om dem).
create function public.skapa_vanskap(a uuid, b uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.vanskap (user_a, user_b) values (least(a, b), greatest(a, b)) on conflict do nothing;
  delete from public.vanforfragningar f
   where (f.fran_user_id = a and f.till_user_id = b) or (f.fran_user_id = b and f.till_user_id = a);
$$;

create function public.profilnamn(id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(btrim(p.namn), ''), 'Någon') from public.profiler p where p.id = profilnamn.id;
$$;

-- Spärren för förfrågningar: högst 20 per dygn, räknat på alla försök, så att den inte avslöjar något.
create function public.rakna_vanforfragan(anvandare uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.vanforsok f where f.user_id = anvandare and f.typ = 'forfragan' and f.tid > now() - interval '1 day') >= 20 then
    raise exception 'För många vänförfrågningar. Vänta till i morgon och försök igen.';
  end if;
  insert into public.vanforsok (user_id, typ) values (anvandare, 'forfragan');
end;
$$;

-- Det som händer när en ny förfrågan har sparats och mottagaren har ett konto:
-- 1. Har mottagaren redan frågat den som skickar blir de vänner, och mottagaren får "godkände".
-- 2. Är de redan vänner, har mottagaren nekat inom 30 dagar, eller väntar redan en annan förfrågan mellan dem,
--    får mottagaren ingen ny notis. Raden finns kvar som "Väntar på svar" hos den som skickade.
-- 3. Annars får mottagaren notisen "vill bli din vän".
create function public.hantera_vanforfragan(forfragan uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  f public.vanforfragningar;
  tidigare timestamptz;
begin
  select * into f from public.vanforfragningar where id = forfragan;
  if f.till_user_id is null then
    return;
  end if;
  if exists (
    select 1 from public.vanforfragningar r
     where r.fran_user_id = f.till_user_id and r.till_user_id = f.fran_user_id and r.angrad is null
  ) then
    perform public.skapa_vanskap(f.fran_user_id, f.till_user_id);
    insert into public.notiser (user_id, typ, text, lank, fran_user_id)
    values (f.till_user_id, 'van_godkand', 'Du och ' || public.profilnamn(f.fran_user_id) || ' är nu vänner', '/vanner', f.fran_user_id);
    return;
  end if;
  if exists (select 1 from public.vanskap v where v.user_a = least(f.fran_user_id, f.till_user_id) and v.user_b = greatest(f.fran_user_id, f.till_user_id)) then
    return;
  end if;
  select max(r.nekad) into tidigare from public.vanforfragningar r
   where r.fran_user_id = f.fran_user_id and r.till_user_id = f.till_user_id and r.id <> f.id and r.nekad is not null;
  if tidigare is not null then
    -- Nekad nyligen: den nya räknas som nekad samtidigt, och mottagaren ser den inte.
    update public.vanforfragningar set nekad = tidigare where id = f.id;
    return;
  end if;
  if exists (
    select 1 from public.vanforfragningar r
     where r.fran_user_id = f.fran_user_id and r.till_user_id = f.till_user_id and r.id <> f.id and r.nekad is null
  ) then
    return;
  end if;
  insert into public.notiser (user_id, typ, text, lank, fran_user_id, vanforfragan_id)
  values (f.till_user_id, 'vanforfragan', public.profilnamn(f.fran_user_id) || ' vill bli din vän', '/vanner', f.fran_user_id, f.id);
end;
$$;

-- ─── Skicka en förfrågan via mejladress ──────────────────────────────────────
-- Gör samma sak och svarar likadant vare sig adressen har ett konto eller inte. Bara exakt adress, oavsett stora
-- och små bokstäver. En förfrågan till ens egen adress sparas som en adress utan konto.
create function public.skicka_vanforfragan(epost text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  adress text := lower(btrim(epost));
  mottagare uuid;
  ny uuid;
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  if adress !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or char_length(adress) > 254 then
    raise exception 'Mejladressen ser inte rätt ut';
  end if;
  perform public.rakna_vanforfragan(anvandare);
  perform public.stada_vanner();
  select u.id into mottagare from auth.users u where lower(u.email) = adress and u.id <> anvandare limit 1;
  if mottagare is not null then
    perform public.las_vanpar(anvandare, mottagare);
  end if;
  -- Samma adress igen: den tidigare raden syns igen om den var ångrad, och inget mer händer.
  update public.vanforfragningar set angrad = null where fran_user_id = anvandare and till_epost = adress;
  if found then
    return;
  end if;
  insert into public.vanforfragningar (fran_user_id, till_user_id, till_epost) values (anvandare, mottagare, adress)
  returning id into ny;
  perform public.hantera_vanforfragan(ny);
end;
$$;

-- ─── Skicka en förfrågan till någon man har vandrat med ──────────────────────
create function public.skicka_vanforfragan_till(person uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  ny uuid;
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  if person is null or person = anvandare or not public.delar_tur(person) then
    raise exception 'Ni behöver vara med i samma tur';
  end if;
  perform public.rakna_vanforfragan(anvandare);
  perform public.stada_vanner();
  perform public.las_vanpar(anvandare, person);
  if public.ar_van(person) then
    return;
  end if;
  update public.vanforfragningar set angrad = null where fran_user_id = anvandare and till_user_id = person and till_epost is null;
  if found then
    return;
  end if;
  insert into public.vanforfragningar (fran_user_id, till_user_id) values (anvandare, person) returning id into ny;
  perform public.hantera_vanforfragan(ny);
end;
$$;

-- ─── Svara på en förfrågan ───────────────────────────────────────────────────
-- Bara mottagaren svarar. Ja gör er till vänner och ger den som frågade en notis. Nej märker förfrågan som nekad
-- (och andra väntande från samma person), tar bort notisen och säger inget till den som frågade.
create function public.svara_vanforfragan(forfragan uuid, ja boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  fran uuid;
begin
  select f.fran_user_id into fran from public.vanforfragningar f
   where f.id = forfragan and f.till_user_id = anvandare and f.nekad is null;
  if fran is null then
    raise exception 'Hittar ingen förfrågan';
  end if;
  perform public.las_vanpar(anvandare, fran);
  if ja then
    perform public.skapa_vanskap(anvandare, fran);
    insert into public.notiser (user_id, typ, text, lank, fran_user_id)
    values (fran, 'van_godkand', public.profilnamn(anvandare) || ' godkände din vänförfrågan', '/vanner', anvandare);
  else
    update public.vanforfragningar set nekad = now() where fran_user_id = fran and till_user_id = anvandare and nekad is null;
    delete from public.notiser n
     using public.vanforfragningar f
     where n.vanforfragan_id = f.id and f.fran_user_id = fran and f.till_user_id = anvandare;
  end if;
end;
$$;

-- ─── Ångra en skickad förfrågan ──────────────────────────────────────────────
-- En väntande tas bort, med notisen. En nekad döljs men finns kvar, så att den fortsätter att stoppa nya notiser.
create function public.angra_vanforfragan(forfragan uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.vanforfragningar set angrad = now()
   where id = forfragan and fran_user_id = auth.uid() and nekad is not null;
  if not found then
    delete from public.vanforfragningar where id = forfragan and fran_user_id = auth.uid();
  end if;
end;
$$;

-- ─── Vänlänken ───────────────────────────────────────────────────────────────
-- Ens nuvarande länk. Saknas den eller har den gått ut skapas en ny, så att en visad länk alltid fungerar.
create function public.min_vanlank() returns table (kod text, giltig_till timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Du måste vara inloggad';
  end if;
  insert into public.vanlankar as l (user_id, kod, giltig_till)
  values (auth.uid(), replace(gen_random_uuid()::text, '-', ''), now() + interval '7 days')
  on conflict (user_id) do update set kod = excluded.kod, giltig_till = excluded.giltig_till
   where l.giltig_till <= now();
  return query select l.kod, l.giltig_till from public.vanlankar l where l.user_id = auth.uid();
end;
$$;

-- En ny länk. Den gamla slutar fungera direkt.
create function public.ny_vanlank() returns table (kod text, giltig_till timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Du måste vara inloggad';
  end if;
  insert into public.vanlankar as l (user_id, kod, giltig_till)
  values (auth.uid(), replace(gen_random_uuid()::text, '-', ''), now() + interval '7 days')
  on conflict (user_id) do update set kod = excluded.kod, giltig_till = excluded.giltig_till;
  return query select l.kod, l.giltig_till from public.vanlankar l where l.user_id = auth.uid();
end;
$$;

-- Ägaren till en giltig länk, eller null. En felaktig eller gammal kod räknas, och efter 10 på en timme stoppas det.
-- Null i stället för ett fel, så att försöket sparas.
create function public.vanlank_agare(kod text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  agare uuid;
begin
  if anvandare is null then
    raise exception 'Du måste vara inloggad';
  end if;
  if (select count(*) from public.vanforsok f where f.user_id = anvandare and f.typ = 'lank' and f.tid > now() - interval '1 hour') >= 10 then
    raise exception 'För många försök. Vänta en stund och försök igen.';
  end if;
  select l.user_id into agare from public.vanlankar l where l.kod = lower(btrim(vanlank_agare.kod)) and l.giltig_till > now();
  if agare is null then
    insert into public.vanforsok (user_id, typ) values (anvandare, 'lank');
  end if;
  return agare;
end;
$$;

-- Vad sidan för en vänlänk visar: namnet, om det är ens egen länk och om ni redan är vänner. Null för en felaktig kod.
create function public.vanlank_info(kod text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  agare uuid := public.vanlank_agare(kod);
begin
  if agare is null then
    return null;
  end if;
  return jsonb_build_object('namn', public.profilnamn(agare), 'egen', agare = auth.uid(), 'redan_van', public.ar_van(agare));
end;
$$;

-- Bli vän via en länk: direkt, eftersom ägaren själv har delat länken. Ägaren får en notis. Null för en felaktig kod.
create function public.bli_van_via_lank(kod text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
  agare uuid := public.vanlank_agare(kod);
begin
  if agare is null then
    return null;
  end if;
  if agare = anvandare then
    raise exception 'Det är din egen vänlänk';
  end if;
  perform public.las_vanpar(anvandare, agare);
  if public.ar_van(agare) then
    return agare;
  end if;
  perform public.skapa_vanskap(anvandare, agare);
  insert into public.notiser (user_id, typ, text, lank, fran_user_id)
  values (agare, 'van_via_lank', public.profilnamn(anvandare) || ' blev din vän via din vänlänk', '/vanner', anvandare);
  return agare;
end;
$$;

-- ─── Ta bort en vän ──────────────────────────────────────────────────────────
-- Tar bort vänskapen och förfrågningarna mellan er. Den andra får ingen notis.
create function public.ta_bort_van(person uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  anvandare uuid := auth.uid();
begin
  delete from public.vanskap where user_a = least(anvandare, person) and user_b = greatest(anvandare, person);
  delete from public.vanforfragningar f
   where (f.fran_user_id = anvandare and f.till_user_id = person) or (f.fran_user_id = person and f.till_user_id = anvandare);
  -- Notiserna om vänskapen tas bort hos en själv. Den andras notiser rörs inte.
  delete from public.notiser n where n.user_id = anvandare and n.fran_user_id = person and n.typ in ('van_godkand', 'van_via_lank');
end;
$$;

-- ─── Listorna på sidan Vänner ────────────────────────────────────────────────
-- Vännerna: namn, om det finns en bild, antal turer ihop och den senaste av dem. Ingenting mer.
create function public.mina_vanner()
returns table (user_id uuid, namn text, bild_uppdaterad timestamptz, turer_ihop integer, senaste_tur text)
language sql stable security definer set search_path = '' as $$
  with v as (
    select case when x.user_a = auth.uid() then x.user_b else x.user_a end as id
      from public.vanskap x where auth.uid() in (x.user_a, x.user_b)
  ), ihop as (
    select annan.user_id as id, t.namn, t.avresa, t.skapad
      from public.deltagare jag
      join public.deltagare annan on annan.tur_id = jag.tur_id
      join public.turer t on t.id = jag.tur_id
     where jag.user_id = auth.uid() and annan.user_id in (select id from v)
  )
  select v.id, public.profilnamn(v.id), p.bild_uppdaterad,
         (select count(*)::integer from ihop i where i.id = v.id),
         (select i.namn from ihop i where i.id = v.id order by i.avresa desc nulls last, i.skapad desc limit 1)
    from v left join public.profiler p on p.id = v.id
   order by 2;
$$;

-- Förfrågningar till mig som väntar på svar, med namnet på den som frågade.
create function public.mina_forfragningar() returns table (id uuid, fran_user_id uuid, namn text, skapad timestamptz)
language sql stable security definer set search_path = '' as $$
  select f.id, f.fran_user_id, public.profilnamn(f.fran_user_id), f.skapad
    from public.vanforfragningar f
   where f.till_user_id = auth.uid() and f.nekad is null and f.skapad > now() - interval '30 days'
   order by f.skapad desc;
$$;

-- Förfrågningar jag har skickat: adressen, eller namnet för någon jag har vandrat med. Aldrig om adressen har ett
-- konto eller om förfrågan har nekats.
create function public.mina_skickade() returns table (id uuid, visas text, skapad timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  perform public.stada_vanner();
  return query
  select f.id, coalesce(f.till_epost, public.profilnamn(f.till_user_id)), f.skapad
    from public.vanforfragningar f
   where f.fran_user_id = auth.uid() and f.angrad is null
   order by f.skapad desc;
end;
$$;

-- Personer från gemensamma turer som inte är vänner än och som jag inte redan har frågat.
create function public.vandrat_ihop() returns table (user_id uuid, namn text, bild_uppdaterad timestamptz, turer_ihop integer)
language sql stable security definer set search_path = '' as $$
  select annan.user_id, public.profilnamn(annan.user_id), p.bild_uppdaterad, count(distinct annan.tur_id)::integer
    from public.deltagare jag
    join public.deltagare annan on annan.tur_id = jag.tur_id and annan.user_id is not null and annan.user_id <> jag.user_id
    left join public.profiler p on p.id = annan.user_id
   where jag.user_id = auth.uid()
     and not public.ar_van(annan.user_id)
     and not exists (
       select 1 from public.vanforfragningar f
        where f.fran_user_id = auth.uid() and f.till_user_id = annan.user_id and f.till_epost is null and f.angrad is null
     )
   group by annan.user_id, p.bild_uppdaterad
   order by 2;
$$;

-- ─── Profilbilder för vänner ─────────────────────────────────────────────────
-- Man ser bilden för dem man delar en tur med och för sina vänner. Andras profiler går fortfarande inte att läsa.
create function public.ser_profil(annan_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.delar_tur(annan_user_id) or public.ar_van(annan_user_id);
$$;

drop policy "profilbilder: läsa sin egen och turkamraters" on storage.objects;
create policy "profilbilder: läsa sin egen, turkamraters och vänners" on storage.objects for select to authenticated
  using (
    bucket_id = 'profilbilder'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or case
           when (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             then public.ser_profil(((storage.foldername(name))[1])::uuid)
           else false
         end
    )
  );

-- ─── Vem får anropa vad ──────────────────────────────────────────────────────
revoke execute on function
  public.stada_vanner(),
  public.las_vanpar(uuid, uuid),
  public.skapa_vanskap(uuid, uuid),
  public.profilnamn(uuid),
  public.rakna_vanforfragan(uuid),
  public.hantera_vanforfragan(uuid),
  public.vanlank_agare(text)
from public, anon, authenticated;

revoke execute on function
  public.ar_van(uuid),
  public.ser_profil(uuid),
  public.skicka_vanforfragan(text),
  public.skicka_vanforfragan_till(uuid),
  public.svara_vanforfragan(uuid, boolean),
  public.angra_vanforfragan(uuid),
  public.min_vanlank(),
  public.ny_vanlank(),
  public.vanlank_info(text),
  public.bli_van_via_lank(text),
  public.ta_bort_van(uuid),
  public.mina_vanner(),
  public.mina_forfragningar(),
  public.mina_skickade(),
  public.vandrat_ihop()
from public, anon;
grant execute on function
  public.ar_van(uuid),
  public.ser_profil(uuid),
  public.skicka_vanforfragan(text),
  public.skicka_vanforfragan_till(uuid),
  public.svara_vanforfragan(uuid, boolean),
  public.angra_vanforfragan(uuid),
  public.min_vanlank(),
  public.ny_vanlank(),
  public.vanlank_info(text),
  public.bli_van_via_lank(text),
  public.ta_bort_van(uuid),
  public.mina_vanner(),
  public.mina_forfragningar(),
  public.mina_skickade(),
  public.vandrat_ihop()
to authenticated;
