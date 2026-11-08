# CLAUDE.md – MinVandring.se

Svara alltid på svenska. All synlig text i appen ska vara på svenska.

## Om projektet
MinVandring.se är en svensk, mobilanpassad webbapp där vänner planerar flerdagsvandringar tillsammans: vandring, deltagare, packning, mat och lärdomar till nästa gång. Slogan: "Planera. Packa. Upplev."

Två grundare utvecklar med Cursor och Claude Code. Långsiktig vision finns i `docs/vision.md`. Läs den vid behov, men bygg bara det som hör till nuvarande mål.

**Nuvarande mål:** en stabil beta där riktiga svenska vandrare kan planera en riktig vandring tillsammans. Nästa steg baseras på faktisk användning.

## Teknik (faktisk, ändra inte utan att fråga)
- React + Vite + TypeScript + Tailwind CSS v4 + lucide-react
- Tailwind v4 via `@tailwindcss/vite`, ingen `tailwind.config`. Färger och skuggor ligger som variabler i `src/index.css`. Använd dem (`bg-primary`, `text-muted-foreground`) i stället för Tailwinds egna färger.
- Komponenter i shadcn-stil ligger i `src/components/ui/` (`Button`, `Input`, `Card`).
- React Router (paketet `react-router`). PWA via `vite-plugin-pwa`.
- Tester med Vitest, lint med oxlint.
- Supabase: Auth (inloggning med mejllänk), Postgres, Row Level Security, Realtime, projekt i eu-north-1 (Stockholm)
- Hosting: Vercel, kopplat till GitHub-repot Minvandring-se/minvandring. Merge till main publiceras automatiskt.
- Domän: www.minvandring.se är huvudadress, minvandring.se omdirigerar dit.
- Detta är INTE ett Next.js-projekt. Föreslå inte byte av ramverk.

## Miljövariabler
- `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` (Supabase publishable key) i `.env.local` och i Vercel.
- Nya miljövariabler läggs till i både `.env.example` och `src/vite-env.d.ts`.
- `.env.local` får aldrig committas.
- Secret- eller service_role-nycklar får aldrig användas i klientkoden.

## Supabase och databas
- Tabeller just nu (efter `grund` och `roller`): `profiler`, `turer`, `deltagare` (med `roll`), `packrader`, `packstatus`, `varor`, `ratter`, `ingredienser`, `maltider`.
- `deltagare.roll` är `owner` (ägare), `editor` (redigerare) eller `viewer` (läsare). Skaparen blir owner, den som går med via länk blir editor. Viewer får bara bocka av sin egen packning.
- "Automatically expose new tables" är avstängt och automatisk RLS är påslagen.
- Varje migrering som skapar en tabell måste därför innehålla GRANT till rollen `authenticated` (till `anon` bara om det verkligen behövs) och RLS-policyer som begränsar åtkomsten till rätt användare. Allt som hör till en tur läses med `public.ar_medlem(tur_id)`, ändras med `public.kan_andra(tur_id)` (owner och editor) och det som bara ägaren får göra skyddas med `public.ar_agare(tur_id)`.
- Åtkomstkontrollen testas i `supabase/rls.test.ts` (Postgres i minnet via PGlite). Ny policy eller tabell = nytt test där.
- Alla schemaändringar görs som migreringsfiler i `supabase/migrations` och körs med Supabase CLI mot det riktiga projektet: `npx supabase db push --remote` (utan `--remote` försöker den nå en lokal databas). Inga ändringar för hand i SQL Editor.
- Migreringar får datum och tid först i filnamnet, t.ex. `20261108000000_grund.sql`. Ändra aldrig en migrering som redan körts, skriv en ny.
- Visa SQL för en migrering och vänta på ok innan den körs mot databasen.
- Bara en av grundarna kör migreringar åt gången.
- Tabell- och kolumnnamn: följ det som redan finns i `supabase/migrations`. Byt inte namn på befintliga tabeller utan att fråga.

## Säkerhet
Frontend-kontroller räcker aldrig. Behörighet ska garanteras av RLS. Testa särskilt att:
- användare A inte kan läsa eller ändra användare B:s vandring
- inbjudna deltagare bara får sin roll (ägare, redigerare, läsare)
- en borttagen deltagare förlorar åtkomst
- privata anteckningar förblir privata
- inbjudningslänkar kan återkallas

## MVP-prioritet
**P0:** registrering, inloggning, profil, skapa/redigera/se mina vandringar, bjuda in deltagare, deltagarroller, mobilanpassat gränssnitt.

**P1:** dagsetapper, packlista, viktberäkning (basvikt, förbrukning, total startvikt, vikt per deltagare), gemensam utrustning, enkel matplanering, inköpslista, anteckningar, "Kom ihåg till nästa vandring".

**P2:** GPX-import, karta, platser längs rutten, hundinformation.

**Inte MVP:** AI-planering, native-app, offlinekartor, e-handel, affiliate, community, social feed, betalvägg.

Vid prioritering: 1) planera en vandring 2) planera tillsammans 3) packning och vikt 4) mat 5) lärdomar 6) karta 7) upptäcka vandringar 8) community 9) AI 10) handel.

## Arkitektur och kod
- Håll det enkelt. Ingen onödig abstraktion eller förtida optimering.
- Affärslogik (t.ex. vikt- och matberäkningar) som rena funktioner i `src/lib`, med tester bredvid (`*.test.ts`). Komponenterna ska bara visa och spara. Gemensamma typer i `src/lib/typer.ts`.
- Små, fokuserade komponenter och funktioner. Undvik `any` och duplicerad logik.
- Validera data vid systemgränser och hantera fel.
- Kommentarer bara när de tillför något.
- Gör inga stora refaktoreringar samtidigt som en ny funktion.

## Design och UX
- Mobile first: tryckytor minst 44 px höga, tydlig navigation, enkla formulär, få steg. Inga breda tabeller som kräver sidscroll.
- Sökvägar skrivs utan å/ä/ö (t.ex. `ga-med`, `logga-in`).
- Skandinavisk, lugn, naturnära och professionell. Undvik plottriga dashboards, för många färger, onödiga animationer och generisk AI/SaaS-stil.
- Färger: skogsgrönt primär, sand/beige komplement, ljus off-white bakgrund, mörkgrå text, diskret accent.
- Tillgänglighet: labels på formulär, god kontrast, semantisk HTML, synligt fokus.
- Använd inte tankstreck som paus i synliga texter.
- Lova inte funktioner i appens texter som inte finns ännu.
- Varje funktion ska svara ja på: gör detta det enklare att planera en riktig vandring?

## Arbetssätt
1. Hämta senaste ändringarna från GitHub innan arbete börjar.
2. Jobba i en egen branch och skapa en pull request. Pusha inte direkt till main utan att fråga.
3. Läs relevant kod först och förstå nuvarande lösning.
4. Vid större ändringar: beskriv kort planen och vänta på ok.
5. Bygg minsta rimliga lösning.
6. Kör `npm run build`, `npm test` och `npm run lint` innan du säger att något är klart.
7. Avsluta med en kort sammanfattning och hur ändringen testas.

Om ett viktigt produktbeslut är oklart: beskriv alternativen kort och rekommendera det enklaste. Fråga inte om små tekniska detaljer som har en etablerad lösning.

## Tester
Prioritera tester för behörigheter, deltagarroller, inbjudningar, vikt- och matberäkningar och datavalidering. Visuella detaljer behöver inte testas.
