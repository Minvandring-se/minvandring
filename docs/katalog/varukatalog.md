# Varukatalogen

Märkesvaror från butiken som passar på tur: bröd, frukost, ost och mejeri, korv och chark, snabbmat, tuber och smaksättning, mellanmål och drycker. Varje vara har näring per 100 g, kostval och EU:s 14 allergener.

Varorna föreslås när man skriver en ingrediens i en egen rätt eller ett recept. Väljer man en vara får ingrediensen märke och namn, kcal och protein, och en koppling till varan (`varor.varukatalog_id` och `receptrader.varukatalog_id`). Med kopplingen räknar appen med varans allergener och kostval i varningarna för egna rätter. Ingredienser utan koppling är okända, och okänt räknas aldrig som att något passar.

## Så fylls katalogen på

1. CSV-filerna i `supabase/katalog/varor/` är huvudlistan, en fil per kategori. Ändra inte tabellen `varukatalog` för hand.
2. Kör `npm run varukatalog` för att se fel och varningar för varje rad.
3. Kör `npm run varukatalog -- --skriv varukatalog_<namn>` för att skapa seed-migreringen. Den uppdaterar varor som redan finns (samma märke och namn, utan hänsyn till stora och små bokstäver) och lägger till nya. Den tar aldrig bort en vara: det görs i en egen migrering.
4. Visa SQL:en och vänta på ok innan den körs.

Den första leveransen är Astras filer från 24 november 2026 (`Claude outputs/varukatalog/`). Rättningarna i `granskning.md` där är gjorda när filerna flyttades hit. Hela måltider i påse hör till matkatalogen och finns inte här. Filen med glutenfria alternativ är fördelad på de vanliga kategorierna. Två rader där kcal gällde en majskaka i stället för 100 g är inte med, och inte heller två varor med samma EAN som en annan.

## Kolumner

Samma ordning som Astras filer.

| Kolumn | Krav | Format |
|---|---|---|
| `marke`, `namn` | ja | Text. Märke och namn får inte förekomma två gånger. |
| `kategori` | ja | `brod`, `frukost`, `ost_mejeri`, `korv_chark`, `snabbmat`, `tuber_smaksattning`, `mellanmal` eller `drycker`. Glutenfria varor ligger i sin vanliga kategori, med `glutenfri` ja. |
| `forpackning_g` | ja | Förpackningens vikt i gram. Decimaler avrundas till hela gram. |
| `portion_g` | nej | En portion i gram. |
| `kcal_100g` | ja | Heltal 0–900. |
| `protein_100g`, `fett_100g`, `kolhydrater_100g`, `fiber_100g`, `socker_100g`, `salt_100g` | nej | Tal 0–100 med högst två decimaler. "<0.1" (mindre än) läses som 0, med en varning. |
| `vatten_ml` | nej | Vattnet för hela förpackningen. |
| `tillagning` | nej | Fri text, högst 500 tecken. |
| `vegetarisk`, `vegansk`, `glutenfri`, `laktosfri` | nej | `ja`, `nej` eller tom cell. Tom betyder okänt. |
| `allergener`, `spar` | nej | Kommaseparerade nycklar som i matkatalogen. Tom cell betyder okänt, `inga` betyder ingen av de 14. |
| `haller_utan_kyl` | nej | `ja`, `nej` eller tom. |
| `ean` | nej | 8 till 14 siffror. Samma EAN får inte förekomma två gånger. |
| `pris_sek_ca`, `pris_kalla` | nej | Pris och butikens sida. |
| `kalla` | ja | Tillverkarens eller butikens sida med näringsvärdena. |

## Varningar

Importen varnar, utan att stoppa raden, när allergenerna är okända, när en allergen står både under `allergener` och `spar`, när en glutenfri vara har gluten bland allergenerna, när energin skiljer sig mycket från det fett, kolhydrater och protein ger, och när bröd, frukost eller mellanmål har under 100 kcal per 100 g (troligen kcal per styck).
