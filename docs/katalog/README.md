# Produktkatalogen: källor och täckning

**Så fyller vi på katalogen: se [manual.md](manual.md).** Promptmallen till Astra ligger i [astra-mall.md](astra-mall.md).

Katalogfilerna ligger i `supabase/katalog/`. Den här mappen beskriver varifrån produkterna kommer.
Filerna här ligger medvetet utanför `supabase/katalog/`, så att `npm run katalog` inte försöker importera dem.

## Så går en genomgång till

1. Produkterna i en kategori hämtas från en butiks sortiment, men alla uppgifter tas från tillverkarens egen sida. Butikens sida används bara för att veta vilka produkter som finns.
2. Raderna kontrolleras och läggs till i rätt fil i `supabase/katalog/`. Produkter som redan finns (samma märke, modell och version) räknas som "redan fanns" och läggs inte till igen.
3. Genomgången loggas som en ny rad i `genomgangar.csv`.
4. Raderna granskas mot tillverkarens sida (nivån Granskad), och en av grundarna godkänner genomgången efter ett stickprov (nivån Stickprovskontrollerad).

## Täckning per kategori och butik

✓ = genomgången · – = inte gjord än

| Kategori | Naturkompaniet | Outnorth | XXL | Outdoorexperten | Addnature |
|---|---|---|---|---|---|
| Tält och vindskydd | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 |
| Sovsäckar och quilts | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 |
| Liggunderlag | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 |
| Ryggsäckar | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 |

## Kolumnerna i genomgangar.csv

- `datum`: när genomgången gjordes
- `kategori` och `katalogfil`: vilken kategori och vilken fil i `supabase/katalog/`
- `kalla`: butiken, eller annan källa (tillverkarnas sidor, användare)
- `rader_i_kallan`: hur många produkter och storlekar källan gav
- `nya`: hur många som lades till i katalogen
- `redan_fanns`: hur många som redan fanns från en tidigare genomgång
- `utelamnade`: hur många som inte togs med, med skäl i `kommentar`
- `kommentar`: vilka som utelämnades och varför
- `genomgang`: genomgångens id, `ÅÅÅÅ-MM-DD-butik-kategori` med små bokstäver utan å, ä, ö, till exempel `2026-11-22-xxl-talt`. Kategorierna är `talt`, `sov`, `ligg` och `ryggsack`. Samma id står i kolumnen `genomgang` på varje rad i CSV:n som kom med genomgången. Det lagras bara i CSV:erna, inte i databasen.
- `godkand`: datum då en av grundarna godkände genomgången efter stickprov. Tomt tills dess. Sätts av `--godkann`.

## Granskningsnivåer

En rad i katalogen har högst en nivå, och appen visar den högsta:

1. **Stickprovskontrollerad** (`kontrollerad` i databasen, `kontrollerad_datum` i CSV:n): en av grundarna har kontrollerat ett stickprov ur hela genomgången och godkänt den. Gäller alla granskade rader i genomgången.
2. **Granskad mot tillverkaren** (`granskad`, `granskad_datum`): katalog-granskaren har läst tillverkarens sida och bekräftat minst vikten. Sätts bara av Claude, utifrån granskarens lista över rader.
3. **Ingen nivå.** Raden kommer från tillverkaren men är inte jämförd än. Butiksrader (`kalla_typ` butik, där vikten kommer från butikens sida eftersom tillverkaren saknar vikt) får aldrig någon nivå.

Databasen kontrollerar det: `kontrollerad` får bara vara satt om `granskad` är satt, och en butiksrad kan varken vara granskad eller kontrollerad. Importen kontrollerar samma sak och stoppar raden annars.

## Kolumnerna i CSV-filerna

Tre kolumner står direkt efter `kontrollerad_datum`:

- `granskad_datum`: dagen vikten jämfördes med tillverkarens sida. Tomt tills dess. Aldrig på butiksrader.
- `kalla_typ`: `tillverkare` eller `butik`. Tomt betyder tillverkare. `butik` kräver att kommentaren börjar med "Vikt och uppgifter från".
- `genomgang`: genomgångens id (se ovan). Tomt eller på formen `2026-11-22-xxl-talt`.

`npm run katalog` visar nivån för varje rad och summerar antalet per nivå.

## Kommandon

- `npm run katalog -- --granskad <genomgang> --nycklar <fil> [--datum ÅÅÅÅ-MM-DD]`: sätter `granskad_datum` (dagens datum om inget anges) på raderna vars nyckel (`marke;modell;version`, en per rad) står i filen. Listan kommer från granskarens avsnitt "Granskad mot tillverkaren". Vägrar butiksrader och nycklar som inte finns i genomgången.
- `npm run katalog -- --stickprov <genomgang> [--frö N]`: drar ett slumpmässigt stickprov och skriver checklistan `docs/katalog/stickprov/<genomgang>.md`. Fröet skrivs ut och sparas i checklistan, och samma urval kan återskapas med `--frö N`.
- `npm run katalog -- --godkann <genomgang> [--datum ÅÅÅÅ-MM-DD]`: sätter `kontrollerad_datum` på genomgångens rader som har `granskad_datum` och källa från tillverkaren, och `godkand` i `genomgangar.csv`. Vägrar om ingen rad har `granskad_datum`.

Efter varje kommando som ändrar CSV:erna skapas en ny seed med `npm run katalog -- --skriv katalog_<namn>`.

## Stickprovsrutinen

- Stickprovet är 5 procent av genomgångens rader, men minst 5 (eller alla om genomgången har färre än 5) och minst en rad per märke, upp till tio märken. Är märkena fler än tio väljs tio slumpmässigt.
- Bara rader som är granskade mot tillverkaren och har källa från tillverkaren ingår. Butiksrader ingår inte.
- Man jämför vikt (och minvikt), mått och temperaturer med tillverkarens sida. Genomgången kan godkännas om alla vikter stämmer.
- Hittas ett fel: rätta raden, dra ett nytt stickprov av samma storlek ur resten av genomgången, och kontrollera det. Hittas fel igen görs genomgången om i sin helhet, eller så godkänns den inte.
- Ett stickprov visar inte att allt är rätt. Det fångar systematiska fel.
