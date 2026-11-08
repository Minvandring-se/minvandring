# Min Vandring

Svensk webbapp (minvandring.se) för att planera vandringar tillsammans: vem som följer med, packning med vikt per ryggsäck, mat med inköpslista, rutt och säkerhet. Vi bygger inte en egen ledguide. Leder hittar man i Naturkartan och liknande. Vår styrka är planeringen i gruppen.

Byggs av Andreas och Oscar. Version 1 beskrivs i `docs/version-1.md`. Bygg inget utanför version 1 utan att fråga.

## Regler

- All text i appen är på svenska. Sökvägar skrivs utan å/ä/ö (t.ex. `ga-med`, `logga-in`).
- Mobilen först: appen används i telefonen när man packar och på fjället. Tryckytor minst 44 px höga, inga breda tabeller som kräver sidscroll.
- Nycklar ligger i `.env.local`, aldrig i koden. Nya miljövariabler läggs till i både `.env.example` och `src/vite-env.d.ts`.
- Jobba på en egen branch och öppna en pull request, aldrig direkt på main. Små commits med beskrivande meddelanden på svenska.
- Databasändringar körs med Supabase CLI mot det riktiga projektet: `npx supabase db push --remote` (utan `--remote` försöker den nå en lokal databas).
- Supabase: varje ny tabell får RLS och policies i samma migration. Allt som hör till en tur skyddas med `public.ar_medlem(tur_id)`. Nya migrationer läggs i `supabase/migrations/` med datum först i filnamnet. Ändra aldrig en migration som redan körts, skriv en ny.
- Beräkningar (vikt, mat, kalorier, tider) skrivs som rena funktioner i `src/lib/` med tester bredvid (`*.test.ts`). Komponenterna ska bara visa och spara.
- Kör `npm run build`, `npm test` och `npm run lint` innan du säger att något är klart.

## Texter och ton

- Korta meningar på vardaglig svenska. Inga tankstreck (– eller —) som paus i synliga texter.
- Bindestreck i ord och intervall (t.ex. "1–4 personer") är okej.

## Teknik

- Vite + React + TypeScript, React Router (paketet `react-router`)
- Tailwind CSS v4 (via `@tailwindcss/vite`, ingen `tailwind.config`). Färger och skuggor ligger som variabler i `src/index.css`. Använd dem (`bg-primary`, `text-muted-foreground`, `shadow-soft`) i stället för Tailwinds egna färger.
- Enkla komponenter i shadcn-stil i `src/components/ui/` (`Button`, `Input`, `Card`). Ikoner från `lucide-react`.
- Supabase (`src/lib/supabase.ts`) för databas, inloggning med mejllänk och realtid. `supabase` är `null` när nycklarna saknas, så appen startar ändå.
- PWA via `vite-plugin-pwa` (manifestet i `vite.config.ts`, ikonerna i `public/`).
- Driftsätts på Vercel. `vercel.json` skickar alla sökvägar till `index.html`.

## Datamodell (version 1)

Se `supabase/migrations/`. Åtkomstkontrollen testas i `supabase/rls.test.ts` (Postgres i minnet via PGlite). Ny policy eller tabell = nytt test där.

- `turer`: namn, destination, datum, dagar, reservdagar, inbjudningskod
- `deltagare`: personer och hundar i en tur. `roll` är `owner` (ägare), `editor` (redigerare) eller `viewer` (läsare). Skaparen blir owner, den som går med via länk blir editor. Regler: `public.kan_andra(tur_id)` för owner och editor, `public.ar_agare(tur_id)` för owner. Viewer får bara bocka av sin egen packning. `user_id` är tomt för hundar och för den som inte gått med själv. `matandel` tom = dela lika.
- `packrader` och `packstatus`: packlistan. `alla = true` betyder att varje person har en egen. `typ` är `ryggsack`, `kropp` eller `forbrukas`.
- `varor`, `ratter`, `ingredienser`, `maltider`: maten. En vara (med kcal) finns en gång per tur och används av recepten.

## Viktlogik

`src/lib/vikt.ts` (från kalkylarket som appen ersätter):

- Basvikt = saker i ryggsäcken. Kläder på kroppen och förbrukningsvaror räknas för sig.
- "Alla"-saker räknas för varje person men inte för hundar.
- Maten delas efter `matandel`. Hundar bär sin egen hundmat.
- Bränsle bärs av den som bär köket (kommer i version 1).
