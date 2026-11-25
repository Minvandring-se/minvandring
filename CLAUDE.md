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
- Supabase: Auth (konto med mejl och lösenord, glömt lösenord via länk i mejlet), Postgres, Row Level Security, Realtime, projekt i eu-north-1 (Stockholm)
- Hosting: Vercel, kopplat till GitHub-repot Minvandring-se/minvandring. Merge till main publiceras automatiskt.
- Domän: www.minvandring.se är huvudadress, minvandring.se omdirigerar dit.
- Detta är INTE ett Next.js-projekt. Föreslå inte byte av ramverk.

## Miljövariabler
- `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY` (Supabase publishable key) i `.env.local` och i Vercel.
- Nya miljövariabler läggs till i både `.env.example` och `src/vite-env.d.ts`.
- `.env.local` får aldrig committas.
- Secret- eller service_role-nycklar får aldrig användas i klientkoden.

## Supabase och databas
- Tabeller just nu (efter `grund`, `roller` och `inbjudningar`): `profiler`, `turer`, `deltagare` (med `roll`), `packrader`, `packstatus`, `varor`, `ratter`, `ingredienser`, `maltider`, `maltid_atare`, `inkop_klart`, `matprodukter`, `kostbehov`, `etapper`, `inbjudningar` (koden, bara ägare och redigerare ser den) och `inbjudningsforsok` (felaktiga koder i `ga_med`, ingen roll når den).
- Mitt förråd (efter `produkter_och_forrad`): `forradssaker` (varje användares egna saker, bara ägaren når dem), `produkter` (katalogen, inloggade läser, fylls bara via migreringar) och `kategorier` och `underkategorier` (stängda för API:t, finns för främmande nycklar). Ditt kök (efter `forradskok`): `forradssaker.kok_id` kopplar ett kokkärl eller bränsle till brännaren eller det kompletta köket det används med, och båda måste ha samma ägare (främmande nyckel på `(kok_id, user_id)`, blir tom när köket tas bort). `skydda_forradskok` stoppar andra underkategorier, kök i kök och att ett kök med delar byter till något annat än brännare eller komplett kök. Logiken står i `src/lib/forradskok.ts`. Kategorinycklarna står också i `src/lib/forrad.ts`. En ny kategori läggs till på båda ställena, och ett test i `supabase/rls.test.ts` kontrollerar att de stämmer överens.
- Produktkatalogen fylls från CSV-filerna i `supabase/katalog/`, som är huvudlistan. Ändra inte `produkter` för hand: ändra CSV:n, kör `npm run katalog` för att se fel och varningar och `npm run katalog -- --skriv katalog_<namn>` för att skapa seed-migreringen. Granskningsnivåer: `produkter.kontrollerad` sätts bara av grundarna efter stickprov av en hel genomgång. `produkter.granskad` sätts bara av Claude för rader som katalog-granskaren har läst mot tillverkarens sida och bekräftat vikten på, aldrig för butiksrader. `produkter.kalla_typ` är `tillverkare` eller `butik` (butikens vikt när tillverkaren saknar vikt, ingen nivå). CSV-filerna har kolumnerna `granskad_datum`, `kalla_typ` och `genomgang` efter `kontrollerad_datum`, se `docs/katalog/README.md`. Så fyller vi på katalogen steg för steg står i `docs/katalog/manual.md`.
- Matplanen (efter `matplan`): `maltider` har ett eget `id` och flera rätter per dag och måltid, och `ratt_id` måste vara en rätt i samma tur. `ratter.matprodukt_id` gör en rätt till en påse ur matkatalogen, och `ratter.ansvarig` och `ratter.klart` gäller påsen i inköpslistan. För egna rätter står ansvarig och klart på `varor`, som också har `protein_per_100g`. `ingredienser` har `tur_id`, och rätt, vara och ansvarig måste höra till samma tur (främmande nycklar på `(id, tur_id)`). `matprodukter` är matkatalogen (inloggade läser, fylls bara via migreringar). `kostbehov` är känsliga uppgifter som bygger på samtycke per tur: deltagarna i samma tur läser, och bara personen själv (deltagaren vars `user_id` är den inloggade) skapar, ändrar och tar bort sin rad. Databasen sätter `samtycke_tid` och stoppar att en rad flyttas till en annan deltagare (`skydda_kostbehov`, efter `matplan_skydd`). En egen rätt sparas med `public.spara_egen_ratt(...)` (rätt, varor, ingredienser och för en ny rätt måltiden, i en transaktion) och raderas med `public.ta_bort_egen_ratt(r)`, som också tar bort varor som ingen annan rätt använder. Allergennycklarna står i domänen `allergenlista` och i `src/lib/kost.ts`, och ett test kontrollerar att de stämmer överens.
- Vem bär och vem äter (efter `vem_ater_och_bar`): `maltider.bars_av` är deltagaren som bär raden (samma tur, blir tom när deltagaren tas bort). `maltid_atare` är de som äter en rad, bara personer i samma tur. Inga rader betyder att alla äter, och mängderna i inköpslistan räknas efter ätarna. Vem tar med vad och bokningen ur skafferiet bygger på `bars_av`. `ratter.ansvarig` och `varor.ansvarig` gäller bara inköpslistan tills den bygger på `bars_av` (se `docs/att-ta-senare.md`). Färgen per deltagare räknas ut i deltagarnas ordning (`src/lib/personfarg.ts`, `--color-person-a` till `-h`).
- Inköpslistan (efter `handlingslista`): `ingredienser` och `receptrader` har `mangd` och `enhet` (nycklarna i `ENHETER` i `src/lib/handla.ts`), och `gram_per_portion` är frivilligt utom för g och kg, där det måste stämma med mängden. En egen rätt och ett recept får sakna ingredienser. `varor.avdelning` är butiksavdelningen (`AVDELNINGAR` i `src/lib/handla.ts`, tom betyder att appen gissar). Var och en köper det hen bär, och `inkop_klart` är bockarna per person och vara eller påse: medlemmar läser, `kan_andra` bockar åt alla och var och en, även en läsare, åt sig själv. Bara personer bockar av. Inköpslistan räknas i `src/lib/handlingslista.ts`. `varor.klart`, `ratter.klart`, `varor.ansvarig` och `ratter.ansvarig` används inte längre av appen (se `docs/att-ta-senare.md`).
- Skafferiet (efter `skafferi`): `skafferi` (påsar ur matkatalogen som man har hemma, med `antal` 1–999 och frivilligt `bast_fore`, en rad per påse) och `matfavoriter` (stjärnorna). Båda är personliga: bara ägaren når sina rader med `user_id = auth.uid()`, även när man delar en tur, och raderna försvinner med kontot och med påsen. En påse vars bäst-före har passerat räknas inte som hemma i inköpslistan.
- Egna recept (efter `recept`): `recept` (namn, unikt per person oavsett stora och små bokstäver) och `receptrader` (ingredienserna, samma gränser som formuläret för egna rätter). Båda är personliga med `user_id = auth.uid()`, och en rad måste höra till ett recept med samma ägare (främmande nyckel på `(recept_id, user_id)`). Ett recept sparas med alla rader i en transaktion med `public.spara_recept(...)`. Ett recept kopieras till turens `ratter`, `varor` och `ingredienser` när det läggs i en tur, så att en ändring i receptet inte ändrar turen. Har turen redan en egen rätt med namnet och samma ingredienser och mängder används den, annars får kopian ett nytt namn ("Gryta (2)"), se `src/lib/recept.ts`.
- Baslivsmedel (efter `livsmedel`): `livsmedel` är Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) med näringsvärden per 100 g, för förslag när man skriver ingredienser. Inloggade läser, och den fylls bara via migreringar. Appen anropar aldrig Livsmedelsverkets API. `npm run livsmedel` hämtar och skriver `supabase/katalog/livsmedel/livsmedel.csv`, och `npm run livsmedel -- --skriv livsmedel_<namn>` skapar seed-migreringen. Ett förslag kopierar bara kcal och protein till raden. Se `docs/katalog/livsmedel.md`.
- Tipsen under Matplanering ligger i `src/lib/tips.ts`, inte i databasen. Varje siffra ska ha en källa i guiden, och råden ska vara allmänna.
- Matkatalogen fylls bara via migreringar från CSV-filerna i `supabase/katalog/mat/`, som är huvudlistan. Ändra inte `matprodukter` för hand: ändra CSV:n, kör `npm run matkatalog` för att se fel och varningar och `npm run matkatalog -- --skriv matkatalog_<namn>` för att skapa seed-migreringen. Formatet (Astras kolumner) står i `docs/katalog/matkatalog.md`.
- Profilbilder (efter `profilbilder`): en privat bucket `profilbilder` i Supabase Storage med filen `<user_id>/bild` (WebP eller JPEG, 256 × 256 px). Policyerna på `storage.objects` låter ägaren ladda upp, byta och ta bort, och låter ägaren och den som delar en tur med ägaren läsa (`public.delar_tur(user_id)`). `profiler.bild_uppdaterad` säger om man själv har en bild. Andras profiler går inte att läsa, så deras bilder hämtas med signerade adresser direkt från lagringen.
- Packlistan (efter `packlista`): `packrader` har förrådets `kategori` och `underkategori` (främmande nycklar), frivilligt `produkt_id`, `gemensam` (en person bär raden åt gruppen, aldrig samtidigt som `alla`) och `bars_av`, som måste vara en deltagare i samma tur. `packstatus` har `tur_id`, och packraden och deltagaren måste höra till samma tur (främmande nycklar på `(id, tur_id)`). Den har bocken `packad` och, på rader som alla ska ha, personens egen modell i `namn`, `vikt_g` och `produkt_id`. Alla i turen ser allt, ägare och redigerare ändrar raderna och allas bockar, och var och en, även en läsare, ändrar sin egen rad i `packstatus`. Saker från förrådet kopieras in med namn och vikt, eftersom förrådet är privat. `packrader.dubblett_ok` är svaret att alla rader av samma sort behövs (se `dubbletter` i `src/lib/packlista.ts`). En gemensam rad som ingen bär tas på och släpps med `public.ta_med_gemensam(rad, ta)`, som var och en i turen, även en läsare, får anropa och som aldrig tar en rad från någon annan.
- Dagsetapperna (efter `etapper`): `etapper` har en rad per dag och tur (`unique (tur_id, dag)`, dag 1–30) med `fran`, `till`, `km` (en decimal), `natt`, `boende` (`stuga`, `talt` eller `annat`), `bokad` (bara stugor och annat boende) och `notering`. Medlemmar läser och `kan_andra` ändrar. En rad för en dag efter turens sista vandringsdag finns kvar och visas för sig. Logiken står i `src/lib/etapper.ts`.
- `deltagare.roll` är `owner` (ägare), `editor` (redigerare) eller `viewer` (läsare). Skaparen blir owner, den som går med via länk blir editor. Viewer får bara bocka av sin egen packning och ta eller släppa en rad i matplanen åt sig själv (`public.ta_ratt(rad)` tar en rad som ingen bär, `public.slapp_ratt(rad)` släpper en rad man bär). Rader i `deltagare` ändras och tas bort av ägaren (alla rader i turen) och av redigeraren bara när raden saknar konto och inte har rollen owner. Ingen annan ändrar sin egen rad direkt: namnet följer profilen (`synka_namn`).
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
- Namnet skrivs MinVandring, i ett ord, överallt där det syns.
- Färger: ljust läge Fjällskog och mörkt läge Polarnatt. Skogsgrönt primär (`#1F3D2E`, samma som logotypen, `primary-hover` för hover och fokus), vita ytor på svagt grön bakgrund och mörkgrå text. Grönt bär appen. Rost (`accent`) är för det man ska lägga märke till (det som saknas, nedräkning, aktiv flik), och hjortron (`hjortron`) för möjligheter och det positiva (tips, vinster, lägg till), sparsamt och högst ett par ställen per sida. Hjortron är aldrig text på ljusa ytor. Text på foton använder `pa-bild` och den mörkgröna ytan `yta-stark`. Varianten `mork:` används bara där en färgvariabel inte räcker, till exempel för att byta bild.
- Typsnitt: Fraunces för rubriker (`font-heading`), Inter för text (`font-sans`) och Montserrat bara i logotypen (`font-logo`). Alla laddas lokalt i `src/main.tsx`.
- Logotypen är komponenten `Logotyp` med symbolerna i `public/brand/`. Källan ligger i `design/logo/`.
- Tillgänglighet: labels på formulär, god kontrast, semantisk HTML, synligt fokus.
- Använd inte tankstreck som paus i synliga texter.
- Lova inte funktioner i appens texter som inte finns ännu. Undantag: korten på startsidan får visa planerade funktioner, till exempel Kom ihåg till nästa vandring och Mitt förråd.
- Planerade delar får visas som de kommer att se ut, med etiketten ”Kommer snart”. Exempelinnehållet i dem ligger i `src/lib/exempeldata.ts`, aldrig i databasen.
- Allt ska fungera i ljust och mörkt läge. Använd bara färgvariablerna i `src/index.css`.
- Designriktningen beskrivs i `docs/design/riktning.md` och alla funktioner med status i `docs/funktioner.md`.
- Varje funktion ska svara ja på: gör detta det enklare att planera en riktig vandring?
- Reglerna i det här avsnittet går alltid före råden i skillen `frontend-design` om djärva, ovanliga eller tydligt egna val av palett, typsnitt, layout och rörelse. Skillen används för kvalitet och eftertanke, inte för att byta stil.

## Arbetssätt
1. Hämta senaste ändringarna från GitHub innan arbete börjar.
2. Jobba i en egen branch och skapa en pull request. Pusha inte direkt till main utan att fråga.
3. Läs relevant kod först och förstå nuvarande lösning.
4. Vid större ändringar: beskriv kort planen och vänta på ok.
5. Bygg minsta rimliga lösning.
6. Kör `npm run build`, `npm test` och `npm run lint` innan du säger att något är klart.
7. Avsluta med en kort sammanfattning och hur ändringen testas.
8. Svara aldrig på webbläsarens bekräftelserutor (confirm, alert) med skript. Behöver något raderas i appen: be mig göra det.

Om ett viktigt produktbeslut är oklart: beskriv alternativen kort och rekommendera det enklaste. Fråga inte om små tekniska detaljer som har en etablerad lösning.

## Tester
Prioritera tester för behörigheter, deltagarroller, inbjudningar, vikt- och matberäkningar och datavalidering. Visuella detaljer behöver inte testas.
