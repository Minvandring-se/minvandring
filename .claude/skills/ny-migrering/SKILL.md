---
name: ny-migrering
description: Skriv en ny Supabase-migrering för MinVandring med GRANT, RLS-policyer och test. Använd den varje gång en tabell, kolumn, policy, funktion eller lagringsregel ska läggas till eller ändras i databasen.
---

# Ny migrering

Reglerna står i `CLAUDE.md` under "Supabase och databas" och "Säkerhet". Den här skillen är ordningen att göra det i.

## 1. Läs först

- De senaste filerna i `supabase/migrations/`, för namn på tabeller, kolumner och hjälpfunktioner. Följ dem.
- Den del av `supabase/rls.test.ts` som ligger närmast det du ska bygga.

## 2. Skriv migreringen

- Ny fil i `supabase/migrations/` med datum och tid först, till exempel `20261122140000_packrader_fran_forrad.sql`. Tidsstämpeln måste vara senare än den senaste migreringen.
- Ändra aldrig en migrering som redan har körts. Skriv en ny.
- Namn utan å, ä och ö, på svenska, i samma stil som de som finns.

Varje ny tabell ska ha:

- `alter table ... enable row level security`.
- `grant` till `authenticated` för just de operationer som behövs. Till `anon` bara om det verkligen behövs, och motivera det i en kommentar.
- Policyer per operation:
  - läsa det som hör till en tur: `public.ar_medlem(tur_id)`
  - ändra det som hör till en tur: `public.kan_andra(tur_id)` (owner och editor)
  - det bara ägaren får göra: `public.ar_agare(tur_id)`
  - det som är en persons eget: `user_id = auth.uid()`
- Främmande nycklar med genomtänkt `on delete`.

Nya funktioner: stäng dem för `public` och `anon` och öppna bara för den roll som ska anropa dem, som i `20261115000000_stang_funktioner.sql`.

## 3. Skriv testerna

Ny tabell eller policy betyder nya tester i `supabase/rls.test.ts`. Använd hjälparna som finns (`som`, `somAnon`, `forvantaFel`, `skapaTur`). Testa det som gäller för ändringen:

- användare A kan inte läsa eller ändra användare B:s tur
- viewer kan läsa men inte ändra, editor kan ändra, bara owner kan det som är ägarens
- en borttagen deltagare förlorar åtkomsten
- privata uppgifter syns bara för den som äger dem
- `anon` når ingenting

Kör `npm test`.

## 4. Låt rls-granskaren läsa

Starta agenten `rls-granskare` på migreringen och testerna. Rätta det den hittar.

## 5. Visa SQL och vänta

Visa hela migreringen för användaren och vänta på ok. Kör den inte innan dess.

## 6. Kör

- Bara en av grundarna kör migreringar åt gången. Fråga om det är oklart.
- `npx supabase db push --remote`. Utan `--remote` försöker den nå en lokal databas.
- Inga ändringar för hand i SQL Editor.

## 7. Efteråt

- Uppdatera tabellistan i `CLAUDE.md` om en tabell har tillkommit.
- Nya typer läggs i `src/lib/typer.ts`.
