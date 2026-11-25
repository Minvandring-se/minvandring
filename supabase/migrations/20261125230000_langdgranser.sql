-- Längdgränser på de äldsta textkolumnerna, samma som formulären (säkerhetsgranskningen 26 november, punkt 7).
-- Utan dem kan en inloggad användare spara hur stora texter som helst i sina turer via API:t.
-- Ingen befintlig rad är längre än gränsen (kontrollerat i databasen 26 november), så gränserna kontrolleras direkt.

alter table public.turer
  add constraint turer_namn_langd check (char_length(namn) <= 80),
  add constraint turer_destination_langd check (char_length(destination) <= 80),
  add constraint turer_startpunkt_langd check (char_length(startpunkt) <= 80);

-- Namnet i Profil, Skapa konto och deltagarlistan är högst 40 tecken. Deltagarens namn följer profilen (synka_namn
-- och ga_med), så båda gränserna måste vara lika.
alter table public.profiler add constraint profiler_namn_langd check (char_length(namn) <= 40);
alter table public.deltagare add constraint deltagare_namn_langd check (char_length(namn) <= 40);

alter table public.ratter add constraint ratter_namn_langd check (char_length(namn) <= 80);
alter table public.varor
  add constraint varor_namn_langd check (char_length(namn) <= 80),
  add constraint varor_kategori_langd check (char_length(kategori) <= 80),
  add constraint varor_notering_langd check (char_length(notering) <= 300);

-- Namnet och anteckningen i förrådet är högst 80 och 300 tecken, som i formuläret. Packraden har samma gräns för
-- anteckningen, fast appen inte skriver någon där i dag.
alter table public.forradssaker
  add constraint forradssaker_namn_langd check (char_length(namn) <= 80),
  add constraint forradssaker_notering_langd check (char_length(notering) <= 300);
alter table public.packrader add constraint packrader_notering_langd check (char_length(notering) <= 300);

-- En påse läggs i turen som en rätt med namnet "Märke Namn", så tillsammans får de vara högst 80 tecken.
-- Den längsta i katalogen i dag har 77. Importen i src/lib/matkatalogimport.ts stoppar längre rader.
alter table public.matprodukter
  add constraint matprodukter_pasnamn_langd check (char_length(marke) + 1 + char_length(namn) <= 80);

-- ─── Nytt konto ──────────────────────────────────────────────────────────────
-- Profilnamnet kommer från formuläret eller, utan namn, från början av mejladressen, som kan vara upp till 64 tecken.
-- Det kortas till 40 och utan mellanslag före och efter, så att ett nytt konto aldrig stoppas av gränsen.
-- Samma som i 20261108000000_grund.sql annars.
create or replace function public.ny_anvandare() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiler (id, namn)
  values (new.id, btrim(left(btrim(coalesce(new.raw_user_meta_data ->> 'namn', split_part(new.email, '@', 1))), 40)));
  return new;
end;
$$;

revoke execute on function public.ny_anvandare() from public, anon, authenticated;
