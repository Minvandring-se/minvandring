---
name: katalog
description: Fyll på eller rätta produktkatalogen i MinVandring. Använd den när produkter ska läggas till från en butiks sortiment, när en CSV i supabase/katalog/ har ändrats, när en seed-migrering ska skapas eller när en genomgång ska loggas.
---

# Produktkatalogen

CSV-filerna i `supabase/katalog/` är huvudlistan. Tabellen `produkter` fylls bara genom seed-migreringar som skapas från dem. Bakgrunden står i `docs/att-ta-senare.md` under "Katalogen" och i `docs/katalog/README.md`.

## Regler som alltid gäller

- Ändra aldrig `produkter` för hand i databasen. Ändra CSV:n och skapa en ny seed-migrering.
- Sätt aldrig `kontrollerad_datum`. Det gör bara en av grundarna, efter egen kontroll mot tillverkarens sida.
- När användaren säger att katalogfilen är uppdaterad: läs om filen från disk, kontrollera radantalet mot det användaren säger och committa den först av allt.
- Kör aldrig `checkout`, `restore` eller `stash` på `supabase/katalog/` utan att fråga. Ett branchbyte byter också ut filerna, så använd `git worktree` om en annan branch behövs.
- Merga aldrig en pull request utan att användaren har sagt ja. Seeden körs efter merge: `npx supabase db push --remote --yes`.

## Källor

- **Tillverkarens produktsida går alltid först.** Alla uppgifter (vikt, mått, temperaturer, material, EAN) tas därifrån. Kolumnen `kalla` pekar på tillverkarens sida för just den produkten, utan spårningsparametrar (till exempel `referralCode`, `nosto`, `refSrc`, `_pos`, `___store`, `setLanguage`). Använd samma regionssida för alla rader av ett märke när värdena är desamma, helst `se-en` eller `en-se`.
- **Butikens sida som reserv.** Saknar tillverkaren en produktsida med vikt får butikens sida användas för vikt, temperaturer och mått. `kalla` pekar då på butikens sida, och kommentaren börjar med "Vikt och uppgifter från <butik>. Tillverkaren saknar produktsida." Finns tillverkarens sida men anger ingen vikt blir andra meningen "Tillverkaren saknar vikt på produktsidan." Butikens sida används aldrig när tillverkaren anger vikten, och aldrig för andra uppgifter än de som saknas. Exempel: Norrøna Falketind Econyl70 28L Pack, hämtad från Outnorth 2026-11-22.
- **Utelämnas som förut:** barnprodukter, och produkter där källorna anger olika vikter (tillverkaren och butiken, eller två siffror på samma sida utan att det framgår vilken som gäller).
- Arkiverade sidor (till exempel web.archive.org), prisjämförelser, tester och forum är aldrig källa.
- Saknar källorna en annan uppgift än vikten lämnas fältet tomt. Gissa inte. Skriv i `kommentar` hur ett värde har härletts eller räknats om.

## Vikt och utelämnade produkter

- Saknas vikten helt, också hos butiken, utelämnas produkten och räknas som utelämnad i loggen.
- **Bara minvikt.** Anger tillverkaren bara en minimivikt och ingen totalvikt utelämnas produkten. Importen kräver `packvikt_g`, och minvikten är lägre än det man bär eftersom pinnar, linor och packpåse inte ingår. Så blev det för åtta Marmot-tält. Frågan om appen ska tillåta det ligger i `docs/att-ta-senare.md`.
- **Sovsäckar, quilts och liggunderlag.** Anger tillverkaren bara en vikt utan packpåse (eller utan pumpsäck), eller bara en minimivikt, och ingen totalvikt: utelämna produkten.
- **Samma vikt för flera storlekar** utan att det framgår vilken storlek den gäller: utelämna de storlekar som inte kan knytas till vikten.
- Anger tillverkaren en vikt men inte vad den omfattar: skriv den i `packvikt_g` och skriv i `kommentar` att det inte framgår vad vikten omfattar. Lägg aldrig vikten bara i kommentaren.
- **Utgångna produkter.** Att tillverkaren markerar en produkt som utgången är inget skäl att utelämna den, så länge tillverkarens uppgifter finns. Skriv i `kommentar`: "Tillverkarens sida anger att produkten har utgått."
- **Ur kategorin utelämnas** också: campingprodukter, tillbehör (reparationssatser, pumpar, lakan, liners) och specialprodukter. För ryggsäckar gäller dessutom cykel-, löpar-, vardags-, dator- och barnryggsäckar och specialryggsäckar för klättring. För liggunderlag luftmadrasser och bäddar för bil eller camping.

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
5. **Lägg raderna i rätt fil** i `supabase/katalog/`. Semikolon som avgränsare, kolumnerna läses efter namn, decimaltecken får vara punkt eller komma.
6. **Kör `npm run katalog`.** Fel stoppar raden och ska rättas. Varningar betyder att fält för jämförelser saknas, och får stå kvar om tillverkaren inte anger dem.
7. **Skapa seeden:** `npm run katalog -- --skriv katalog_<namn>`. Den uppdaterar också produkter som redan finns.
8. **Logga genomgången** (se nedan).
9. **Kör `npm test`.** `supabase/katalog.test.ts` faller om en CSV har ändrats utan ny migrering.
10. **Visa migreringen och vänta på ok** innan `npx supabase db push --remote`.

### Spärrade tillverkarsidor

Flera tillverkare svarar HTTP 403 eller 429 på automatiska hämtningar (bland andra Big Agnes, Helsport, Jack Wolfskin, Osprey, The North Face, Pajak, Sea to Summit och marmot.com). Granskaren stannar efter två spärrade sidor och listar raderna. Den som startade granskaren läser dem då i Chrome, en sida i taget. Specifikationen ligger ibland i en flik eller dialog som måste öppnas först (till exempel Lundhags "Tekniska specifikationer"). Skriv aldrig att en rad stämmer när sidan inte har lästs.

### När raderna kommer färdiga från en annan AI

Kommer raderna färdiga från en annan AI (vi använder Astra) börjar genomgången vid steg 4. Katalog-granskaren läser alltså raderna mot tillverkarens sida även då.

Kontrollera ändå att Astras sammanfattning (nya, redan fanns, utelämnade) stämmer mot raderna innan loggen skrivs: räkna raderna du faktiskt har fått, och jämför "redan fanns" med det som står i katalogfilen. Stämmer siffrorna inte, säg det till användaren och skriv ingen loggrad förrän det är utrett.

En produkt som tas bort ur CSV:n försvinner inte ur databasen. Det kräver en egen migrering, se skillen `ny-migrering`.

## Logga genomgången

Varje genomgång loggas, också en som inte gav några nya produkter.

**En ny rad sist i `docs/katalog/genomgangar.csv`:**

```
datum;kategori;katalogfil;kalla;rader_i_kallan;nya;redan_fanns;utelamnade;kommentar
```

- `rader_i_kallan` ska vara summan av `nya`, `redan_fanns` och `utelamnade`. Räkna efter.
- `kommentar` anger vilka som utelämnades och varför.
- En rad per kategori och butik. Kontrollera att raden inte redan finns.

**Täckningstabellen i `docs/katalog/README.md`:** byt `–` mot `✓` och datumet i rätt cell. Ny butik blir en ny kolumn, ny kategori en ny rad.

Loggen och tabellen committas tillsammans med CSV:n och seed-migreringen.
