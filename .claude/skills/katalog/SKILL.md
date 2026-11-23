---
name: katalog
description: Fyll på eller rätta produktkatalogen i MinVandring. Använd den när produkter ska läggas till från en butiks sortiment, när en CSV i supabase/katalog/ har ändrats, när en seed-migrering ska skapas eller när en genomgång ska loggas.
---

# Produktkatalogen

CSV-filerna i `supabase/katalog/` är huvudlistan. Tabellen `produkter` fylls bara genom seed-migreringar som skapas från dem. Bakgrunden står i `docs/att-ta-senare.md` under "Katalogen" och i `docs/katalog/README.md`.

## Regler som alltid gäller

- Ändra aldrig `produkter` för hand i databasen. Ändra CSV:n och skapa en ny seed-migrering.
- **Granskningsnivåer.** `kontrollerad_datum` sätts bara av en av grundarna, med `--godkann`, efter ett stickprov av hela genomgången. Sätt det aldrig själv. `granskad_datum` sätts bara av dig, med `--granskad`, för de rader katalog-granskaren har läst mot tillverkarens sida och bekräftat vikten på. Sätt det aldrig för butiksrader (`kalla_typ` butik), och aldrig för rader granskaren inte har läst.
- När användaren säger att katalogfilen är uppdaterad: läs om filen från disk, kontrollera radantalet mot det användaren säger och committa den först av allt.
- Kör aldrig `checkout`, `restore` eller `stash` på `supabase/katalog/` utan att fråga. Ett branchbyte byter också ut filerna, så använd `git worktree` om en annan branch behövs.
- Merga aldrig en pull request utan att användaren har sagt ja. Seeden körs efter merge: `npx supabase db push --remote --yes`.

## Källor

- **Tillverkarens produktsida går alltid först.** Alla uppgifter (vikt, mått, temperaturer, material, EAN) tas därifrån. Kolumnen `kalla` pekar på tillverkarens sida för just den produkten, utan spårningsparametrar (till exempel `referralCode`, `nosto`, `refSrc`, `_pos`, `___store`, `setLanguage`). Använd samma regionssida för alla rader av ett märke när värdena är desamma, helst `se-en` eller `en-se`.
- **Butikens sida som reserv.** Saknar tillverkaren en produktsida med vikt får butikens sida användas för vikt, temperaturer och mått. `kalla` pekar då på butikens sida, och kommentaren börjar med "Vikt och uppgifter från <butik>. Tillverkaren saknar produktsida." Finns tillverkarens sida men anger ingen vikt blir andra meningen "Tillverkaren saknar vikt på produktsidan." Butikens sida används aldrig när tillverkaren anger vikten, och aldrig för andra uppgifter än de som saknas. Exempel: Norrøna Falketind Econyl70 28L Pack, hämtad från Outnorth 2026-11-22.
- **Utelämnas som förut:** barnprodukter, och produkter där giltiga källor anger olika vikter. "Olika vikter" betyder att två giltiga källor anger olika tal: tillverkarens sida (två ställen på samma sida, eller två regionsidor) eller, när reservregeln gäller, butikens sida. Butikens vikt är bara en giltig källa när tillverkaren saknar vikt, så den ställs aldrig mot tillverkarens vikt: anger tillverkaren en vikt är det den som gäller. En vikt som inte går att knyta till en sida (till exempel från en annan AI eller en sammanställning) är ingen källa, och en skillnad mot den är ingen konflikt. Exempel: Norrøna 20L Pack hos Outnorth anger 504 g, tillverkaren anger ingen vikt, och Astras 498 g saknade källa, så raden ligger kvar med 504 g.
- Arkiverade sidor (till exempel web.archive.org), prisjämförelser, tester och forum är aldrig källa.
- Saknar källorna en annan uppgift än vikten lämnas fältet tomt. Gissa inte. Skriv i `kommentar` hur ett värde har härletts eller räknats om.

## Vikt och utelämnade produkter

- Saknas vikten helt, också hos butiken, utelämnas produkten och räknas som utelämnad i loggen.
- **Bara minvikt.** Anger tillverkaren bara en minimivikt och ingen totalvikt utelämnas produkten. Importen kräver `packvikt_g`, och minvikten är lägre än det man bär eftersom pinnar, linor och packpåse inte ingår. Så blev det för åtta Marmot-tält. Frågan om appen ska tillåta det ligger i `docs/att-ta-senare.md`.
- **Sovsäckar, quilts och liggunderlag.** Anger tillverkaren bara en minimivikt och ingen totalvikt: utelämna produkten. Anger tillverkaren bara en vikt utan packpåse (eller utan pumpsäck, eller utan kompressionsöverdrag) läggs vikten i `packvikt_g` och kommentaren blir "Vikt utan packpåse enligt tillverkaren." (för en butiks reservvikt: skriv vad den utelämnar). Så blev det för Mammut, vars sovsäckar och liggunderlag bara har den vikten. Mammut skriver gradtalet som -15C, med versalt C och utan gradtecken, och alla Mammut-rader skrivs så.
- **Samma vikt för flera storlekar** utan att det framgår vilken storlek den gäller: utelämna de storlekar som inte kan knytas till vikten.
- Anger tillverkaren en vikt men inte vad den omfattar: skriv den i `packvikt_g` och skriv i `kommentar` att det inte framgår vad vikten omfattar. Lägg aldrig vikten bara i kommentaren.
- **Utgångna produkter.** Att tillverkaren markerar en produkt som utgången är inget skäl att utelämna den, så länge tillverkarens uppgifter finns. Skriv i `kommentar`: "Tillverkarens sida anger att produkten har utgått."
- **Utgångna produkter utan tillverkarsida.** Finns tillverkarens produktsida inte längre (404, omdirigering eller bortflyttad) behålls raden, men källan är aldrig en arkiverad sida (web.archive.org). `kalla` blir butikens egen produktsida om den finns kvar (utan `?color=`-delen), och kommentaren blir "Utgången. Tillverkarens produktsida finns inte längre." Raden får ingen `granskad_datum`. `kalla` får inte vara tom, eftersom importen och databasen kräver en adress. Finns varken tillverkarens eller butikens sida går raden inte att lägga in.
- **Ur kategorin utelämnas** också: campingprodukter, tillbehör (reparationssatser, pumpar, lakan, liners) och specialprodukter. För ryggsäckar gäller dessutom cykel-, löpar-, vardags-, dator- och barnryggsäckar och specialryggsäckar för klättring. För liggunderlag luftmadrasser och bäddar för bil eller camping. För kök: kök för gasolflaska, campingkök med två eller fler lågor, grillar, bränsle, lösa kokkärl och tillbehör. Stormkök med gasbrännare för skruvpatron ska med.
- **Kök: vikten är hela förpackningen utan bränsle** (brännare, kokkärl, vindskydd). Anger tillverkaren bara brännarens vikt för ett kök som säljs med kokkärl, och ingen totalvikt: utelämna produkten. `kok.csv` skapas vid den första kökgenomgången, med kolumnerna i kökblocket i `docs/katalog/astra-mall.md`. Koktid som bara anges för 0,5 liter och förbrukning som inte anges i g/h skrivs i kommentaren, aldrig omräknad. **`kokkarl_l` fylls i när kokkärl ingår och lämnas tomt för en ren brännare.** Appen visar köket som "Med kokkärl" eller "Bara brännare" utifrån det fältet (`src/lib/kokkarl.ts`), och importen stoppar ett stormkök eller systemkök utan kokkärl. Koktid utan angiven mängd vatten skrivs också bara i kommentaren.

## Namn

- **Modellnamn följer tillverkarens namn**, inte butikens. Lägg inte till ord som bara butiken använder (till exempel "Ultralight", "DWN", "SYN", "RC" eller "Sleeping Bag" när det inte ingår i tillverkarens namn), och skriv namnet utan produkttyp ("Brenta 30", inte "Brenta 30 Liters Hiking Backpack"). Skriv i samma stil som befintliga rader av samma märke. Marmots sovsäckar har gradtalet med °F i namnet, till exempel "Hibernest 15°F".
- **Märkesnamn som i resten av katalogen:** `Deuter`, `Exped`, `NEMO`, `NOMAD`, `Pajak`, `Sea to Summit`, `VAUDE`. För nya märken: skriv som tillverkaren själv skriver det i löptext. Stavas ett märke olika i olika filer: visa det för användaren och vänta på beslut innan något ändras.
- En seed känner igen en produkt på märke, modell och version utan hänsyn till stora och små bokstäver, och skriver över alla kolumner vid träff. En rättad stavning slår alltså igenom på en befintlig rad.

## Temperaturer

- `temperaturstandard`: anger tillverkaren EN 13537 (föregångaren till ISO 23537) skrivs `iso`, med en kommentar om att tillverkaren anger EN 13537.

## Så går en genomgång till

1. **Lista sortimentet.** Hämta produkterna i kategorin från butikens sida. Bara märke, modell och storlekar.
2. **Sortera bort det som redan finns.** Samma märke, modell och version räknas som "redan fanns" och läggs inte till igen.
3. **Hämta uppgifterna från tillverkaren.** En rad per storlek eller version. Egenskaperna per underkategori och reglerna mellan fälten står i `src/lib/produktegenskaper.ts`. Skriv i `kommentar` hur ett värde har härletts när det inte står rakt av på sidan.
4. **Låt katalog-granskaren läsa de nya raderna** mot tillverkarens sida innan de läggs in. Rätta avvikelserna, eller utelämna raden.
5. **Lägg raderna i rätt fil** i `supabase/katalog/`. Semikolon som avgränsare, kolumnerna läses efter namn, decimaltecken får vara punkt eller komma. Sätt `genomgang` på varje ny rad (samma id som i loggraden, se nedan). Sätt `kalla_typ` till `butik` för reservrader (kommentaren börjar då med "Vikt och uppgifter från"), annars till `tillverkare`. Lämna `granskad_datum` och `kontrollerad_datum` tomma.
6. **Kör `npm run katalog`.** Fel stoppar raden och ska rättas. Varningar betyder att fält för jämförelser saknas, och får stå kvar om tillverkaren inte anger dem.
7. **Sätt `granskad_datum`** på raderna granskaren bekräftade: spara avsnittet "Granskad mot tillverkaren" ur granskarens rapport som en fil med en nyckel (`marke;modell;version`) per rad och kör `npm run katalog -- --granskad <genomgang> --nycklar <fil>`. Kommandot vägrar butiksrader och nycklar som inte finns i genomgången.
8. **Skapa seeden:** `npm run katalog -- --skriv katalog_<namn>`. Den uppdaterar också produkter som redan finns.
9. **Logga genomgången** (se nedan).
10. **Kör `npm test`.** `supabase/katalog.test.ts` faller om en CSV har ändrats utan ny migrering.
11. **Visa migreringen och vänta på ok** innan `npx supabase db push --remote`.

### Stickprov och godkännande (en av grundarna)

Efter genomgången drar man ett stickprov: `npm run katalog -- --stickprov <genomgang>` skriver en checklista i `docs/katalog/stickprov/<genomgang>.md` (frö skrivs ut och kan återanvändas med `--frö N`). Grundaren jämför raderna med tillverkarnas sidor. Stämmer vikterna kör grundaren `npm run katalog -- --godkann <genomgang>`, som sätter `kontrollerad_datum` på genomgångens granskade rader och `godkand` i loggen. Skapa därefter en ny seed. Hittas ett fel: rätta raden, dra ett nytt stickprov av samma storlek ur resten, och hittas fel igen görs genomgången om eller så godkänns den inte.

### Spärrade tillverkarsidor

Flera tillverkare svarar HTTP 403 eller 429 på automatiska hämtningar (bland andra Big Agnes, Helsport, Jack Wolfskin, Osprey, The North Face, Pajak, Sea to Summit och marmot.com). Katalog-granskaren har Chrome-verktygen och läser själv sidor som spärrar automatisk hämtning, en sida i taget i en egen Chrome-flik som den stänger efteråt. Den som startade granskaren läser bara de sidor granskaren inte kommer åt, till exempel när en robotkontroll kräver att man klickar, och gör det då i en egen flik, en sida i taget. Specifikationen ligger ibland i en flik eller dialog som måste öppnas först (till exempel Lundhags "Tekniska specifikationer").

Chrome används bara för att läsa offentliga produktsidor: ingen inloggning, inga formulär och inga köp. Försök aldrig ta dig förbi en robotkontroll. Skriv aldrig att en rad stämmer när sidan inte har lästs.

### När raderna kommer färdiga från en annan AI

Kommer raderna färdiga från en annan AI (vi använder Astra) börjar genomgången vid steg 4. Katalog-granskaren läser alltså raderna mot tillverkarens sida även då.

Kontrollera ändå att Astras sammanfattning (nya, redan fanns, utelämnade) stämmer mot raderna innan loggen skrivs: räkna raderna du faktiskt har fått, och jämför "redan fanns" med det som står i katalogfilen. Stämmer siffrorna inte, säg det till användaren och skriv ingen loggrad förrän det är utrett.

En produkt som tas bort ur CSV:n försvinner inte ur databasen. Det kräver en egen migrering, se skillen `ny-migrering`.

## Logga genomgången

Varje genomgång loggas, också en som inte gav några nya produkter.

**En ny rad sist i `docs/katalog/genomgangar.csv`:**

```
datum;kategori;katalogfil;kalla;rader_i_kallan;nya;redan_fanns;utelamnade;kommentar;genomgang;godkand
```

- `rader_i_kallan` ska vara summan av `nya`, `redan_fanns` och `utelamnade`. Räkna efter.
- `kommentar` anger vilka som utelämnades och varför.
- `genomgang` är id:t `ÅÅÅÅ-MM-DD-butik-kategori` med små bokstäver utan å, ä, ö, till exempel `2026-11-22-xxl-talt` (kategorier: `talt`, `sov`, `ligg`, `ryggsack`, `kok`). Samma id sätts på varje ny rad i CSV:n. `godkand` lämnas tomt: det fylls av `--godkann`.
- En rad per kategori och butik. Kontrollera att raden inte redan finns.

**Täckningstabellen i `docs/katalog/README.md`:** byt `–` mot `✓` och datumet i rätt cell. Ny butik blir en ny kolumn, ny kategori en ny rad.

Loggen och tabellen committas tillsammans med CSV:n och seed-migreringen.
