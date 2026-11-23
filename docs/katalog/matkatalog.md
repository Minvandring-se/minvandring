# Matkatalogen: format och import

Matkatalogen är påsarna man kan välja i turens matplan: frystorkade och lufttorkade måltider. Den byggs som produktkatalogen. CSV-filerna i `supabase/katalog/mat/` är huvudlistan, och tabellen `matprodukter` fylls bara via migreringar som skapas från dem. Ändra aldrig tabellen för hand.

Datan samlas av Astra. Den här filen beskriver formatet hon levererar i.

## Beslut som ännu inte är byggda

Beslutade 2026-11-24, när Astras första filer kom. De byggs i en egen branch, tillsammans med att filerna läggs in.

1. **Avgränsaren känns igen på rubrikraden.** Astras filer har kommatecken mellan fälten. Importen ska ta emot både komma och semikolon och välja det som rubrikraden använder. Tills det är byggt läser `npm run matkatalog` bara semikolon.
2. **Astras `kontrollerad` ignoreras.** Datumet hon skriver är när hon hämtade uppgifterna, och det behöver inte sparas. `matprodukter.kontrollerad` lämnas tom i databasen och sätts bara av oss grundare efter ett stickprov. Kolumnen får finnas kvar i Astras filer.

## Så kommer en fil in i katalogen

1. Lägg CSV:n i `supabase/katalog/mat/`, till exempel `frystorkat.csv`.
2. Kör `npm run matkatalog`. Skriptet visar varje rad med fel och varningar och skriver ingenting.
3. Rätta felen i CSV:n. Rader med fel kommer inte med. Läs varningarna och rätta det som är fel.
4. Kör `npm run matkatalog -- --skriv matkatalog_<namn>`. Det skapar en seed-migrering i `supabase/migrations/` med en tidsstämpel efter den senaste migreringen.
5. Visa migreringen och vänta på ok innan den körs, som alla migreringar.

Seed-migreringen måste ligga efter migreringen `matplan`, som skapar tabellen. Byter `matplan` datum innan den körs, skapa seeden efter bytet.

En påse som redan finns (samma märke och namn, utan hänsyn till stora och små bokstäver) uppdateras när seeden körs igen. Samma CSV kan alltså köras om i en ny migrering när den har ändrats.

## Formatet

Semikolon mellan fälten och UTF-8 (komma ska också gå, se beslut 1 ovan). Ett fält som innehåller avgränsaren sätts inom citattecken. Rubrikraden ska ha exakt de här kolumnerna i den här ordningen:

```
marke;namn;maltid;torkning;vikt_torr_g;portioner;kcal;protein_g;fett_g;kolhydrater_g;vatten_ml;tillagning_vatten;tillagning_min;vegetarisk;vegansk;glutenfri;laktosfri;allergener;spar;pris_sek_ca;pris_kalla;kalla;kontrollerad
```

| Kolumn | Måste finnas | Innehåll |
|---|---|---|
| `marke` | ja | Märket som tillverkaren skriver det. |
| `namn` | ja | Tillverkarens namn på måltiden, utan märket. Märke och namn tillsammans ska vara unika. |
| `maltid` | ja | `frukost`, `lunch_middag`, `dessert` eller `mellanmal`. |
| `torkning` | nej | `frystorkad` eller `lufttorkad`. Tomt när det inte framgår. |
| `vikt_torr_g` | ja | Hela påsens vikt i gram, torr, som heltal. |
| `portioner` | nej | Antal portioner i påsen, 1 till 10. Tomt räknas som 1, med en varning. |
| `kcal` | ja | Energin i hela påsen, som heltal. Inte per 100 g och inte per portion. Kcal per 100 g räknas ut i appen. |
| `protein_g`, `fett_g`, `kolhydrater_g` | nej | Gram i hela påsen. Högst en decimal, med komma eller punkt. |
| `vatten_ml` | nej | Vatten som behövs för att tillaga hela påsen, i milliliter. |
| `tillagning_vatten` | nej | `varmt`, `kallt`, `varmt_eller_kallt` eller `inget`. |
| `tillagning_min` | nej | Minuter som påsen ska dra. |
| `vegetarisk`, `vegansk`, `glutenfri`, `laktosfri` | nej | `ja`, `nej` eller tom cell. Tom betyder okänt. `vegansk` ja kräver att `vegetarisk` också är ja. |
| `allergener` | nej | Kommaseparerade nycklar ur listan nedan. Tom cell betyder okänt. `inga` betyder att påsen inte innehåller någon av de 14. |
| `spar` | nej | Kan innehålla spår av. Samma nycklar och samma regler som `allergener`. |
| `pris_sek_ca` | nej | Ungefärligt pris i kronor, heltal. |
| `pris_kalla` | nej | Butikens produktsida när priset kommer från en butik i stället för tillverkaren. Tom när priset kommer från tillverkaren. Ska börja med `http` och får bara vara ifylld när `pris_sek_ca` är ifyllt. |
| `kalla` | ja | Tillverkarens produktsida, där uppgifterna är hämtade. Ska börja med `http`. |
| `kontrollerad` | nej | Datum (`ÅÅÅÅ-MM-DD`). Det Astra skriver ignoreras (se beslut 2 ovan). I databasen sätts den bara av en av grundarna efter stickprov. |

## Allergenernas nycklar

EU:s 14 allergener. Samma nycklar finns i `src/lib/kost.ts` och i databasen (domänen `allergenlista`).

| Nyckel | Allergen |
|---|---|
| `gluten` | Gluten (vete, råg, korn, havre, spelt, kamut) |
| `kraftdjur` | Kräftdjur |
| `agg` | Ägg |
| `fisk` | Fisk |
| `jordnotter` | Jordnötter |
| `soja` | Soja |
| `mjolk` | Mjölk |
| `notter` | Nötter (mandel, hasselnöt, valnöt, cashew med flera) |
| `selleri` | Selleri |
| `senap` | Senap |
| `sesam` | Sesamfrön |
| `svaveldioxid` | Svaveldioxid och sulfit |
| `lupin` | Lupin |
| `blotdjur` | Blötdjur |

## Så används uppgifterna i appen

- Okänt räknas aldrig som att en påse passar. En påse med tom `glutenfri` visas inte när man filtrerar på Glutenfri, och en påse med tom `allergener` visas inte när man filtrerar bort en allergen.
- Spår räknas inte som att påsen innehåller allergenen när man filtrerar, men visas i detaljerna om påsen.
- Matplanen varnar när en påse inte passar någon i gruppen, till exempel "Innehåller gluten, passar inte Lisa".

## Varningar från skriptet

Varningar stoppar inte raden men bör läsas:

- Kcal per 100 g under 100 eller över 700. Då gäller kcal eller vikten troligen en portion i stället för hela påsen.
- Allergenerna är okända.
- En allergen står både under `allergener` och `spar`.
- `vegansk` eller `vegetarisk` är ja men allergenerna innehåller något animaliskt.
- `glutenfri` är ja men allergenerna innehåller gluten.
