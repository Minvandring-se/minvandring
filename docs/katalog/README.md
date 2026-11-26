# Produktkatalogen: källor och täckning

**Så fyller vi på katalogen: se [manual.md](manual.md).** Promptmallen till Astra ligger i [astra-mall.md](astra-mall.md).

Matkatalogen (påsarna i matplanen) har ett eget format och ett eget skript: se [matkatalog.md](matkatalog.md).

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
| Kök | ✓ 2026-11-23 | ✓ 2026-11-23 | – | – | – |
| Vattenrening | ✓ 2026-11-23 | ✓ 2026-11-23 | ✓ 2026-11-23 | ✓ 2026-11-23 | ✓ 2026-11-23 |
| Vandringsstavar | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 |
| Pannlampor | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 | ✓ 2026-11-24 |
| Kläder (fleece från Patagonia och Rab 2026-11-26, underställ från Devold och Icebreaker 2026-11-26) | ✓ 2026-11-25 (dunjackor, regnkläder), 2026-11-26 (fleece: Fjällräven, Tierra, Houdini; underställ: Fjällräven, Tierra, Houdini, Woolpower) | – | – | – | – |

Kök har också gåtts igenom direkt hos tillverkarna: gaspatroner från Primus, MSR och Jetboil (2026-11-24) och Trangias kokkärl, stekpannor, kokset och kittlar från trangia.se (2026-11-25). Outnorths kastruller, kokset och stekpannor från andra märken gicks igenom samma dag.

## Kolumnerna i genomgangar.csv

- `datum`: när genomgången gjordes
- `kategori` och `katalogfil`: vilken kategori och vilken fil i `supabase/katalog/`
- `kalla`: butiken, eller annan källa (tillverkarnas sidor, användare)
- `rader_i_kallan`: hur många produkter och storlekar källan gav
- `nya`: hur många som lades till i katalogen
- `redan_fanns`: hur många som redan fanns från en tidigare genomgång
- `utelamnade`: hur många som inte togs med, med skäl i `kommentar`
- `kommentar`: vilka som utelämnades och varför
- `genomgang`: genomgångens id, `ÅÅÅÅ-MM-DD-butik-kategori` med små bokstäver utan å, ä, ö, till exempel `2026-11-22-xxl-talt`. Kategorierna är `talt`, `sov`, `ligg`, `ryggsack`, `kok`, `vatten`, `stavar`, `pannlampa` och `klader`. Samma id står i kolumnen `genomgang` på varje rad i CSV:n som kom med genomgången. Det lagras bara i CSV:erna, inte i databasen.
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

## Stavars vikt per märke

`packvikt_g` för vandringsstavar är vikten för ett par. Många tillverkare skriver bara "Weight: 494 g" utan att säga om det gäller en stav eller ett par. En rad får nivån Granskad bara när tillverkarens egna sidor tydligt säger vad vikten gäller (kontrollerat i Chrome 2026-11-24). Utan en sådan uppgift står vikten som den dubbla vikten om det är rimligt att den gäller en stav, med en kommentar om att det är antaget, och raden har ingen nivå.

| Märke | Vad tillverkaren säger | Rader |
|---|---|---|
| Black Diamond | Distance Carbon Z och Alpine Carbon Cork: "Weight Per Pair" i specifikationen (eu.blackdiamondequipment.com). Trail, Trail Cork, Trail Vista Shock, Explorer 2 och 3 och Pursuit Carbon Z: bara "Weight", och inga förklaringar i Features, Specs, guider eller FAQ. Product Instructions (PDF) gick inte att läsa. | Granskade: Distance Carbon Z, Alpine Carbon Cork. Ingen nivå: övriga. |
| Silva | "Weight: 350 g/pair with gloves" (Running poles carbon z adjustable 100–120 cm), "g/pair with wrist straps" (Trekking poles carbon z adjustable, alu z adjustable, alu tele, all season alpine alu tele) och "560g/pair" (Z-Fold). Trekking Poles Aluminum Cork (silva-canada.com): bara "Weight: 464 g". Ex Pole Grey: ingen vikt hos Silva. | Granskade: de som anger "pair". Ingen nivå: Aluminum Cork. Ex Pole Grey är en butiksrad. |
| Hilleberg | "240 g / 8.5 oz per pole" (hilleberg.com/eng/products/accessories/special-poles). | Granskad, parvikt 480 g. |
| Terra Nova | Trail Carbon: "192g each" i beskrivningen. Trail Lite: bara "Max Weight (g) 274 g", utan förklaring. | Trail Carbon granskad (384 g). Trail Lite utan nivå. |
| Phoxx (XXL äger märket) | XXL Norge: "Vikt: 300 g per stav" för samma artikel (1172978), XXL Sverige: "Vikt: 600 g" utan enhet. De säger inte emot varandra, så 600 g är parvikten. | Granskad. |
| Komperdell | Produktsidorna på komperdell.com: "weight: 218g" (Carbon Pro Zero), "weight: 201g" (Carbon Pro Zero Comp), utan stav eller par, och inget i FAQ eller sidfot. Katalogen Workbook 2024-25 (PDF, nedladdad och läst som text): samma siffror utan förklaring, till exempel Carbon C3 Pro 221 g (art. 175 23 60-10) och Explorer Contour Powerlock 239 g (art. 174 23 14-10), men ingen teckenförklaring. Carbon C3 Pro och Explorer Contour Powerlock saknas på komperdell.com. | Ingen nivå. Siffrorna stämmer med katalogen, men inte vad de gäller. |
| LEKI | Tabellerna "All features" på leki.com (int/en och de/de) anger "Weight: 270 g" (Eagle, Voyager) utan etikett. "Pair" i tabellerna gäller priset. Khumbu FX TA finns inte på leki.com. | Ingen nivå. Khumbu FX TA är en butiksrad. |
| Urberg | Outnorth (Urbergs eget märke) anger "Vikt per stav: 280 gram". Ingen sida på urberg.com gick att läsa. | Butiksrad. |
| Komperdell Wild Rambler | Finns inte på komperdell.com (sökning ger bara "Gray Rambler", en annan produkt). | Butiksrad. |

Katadyn Gravity BeFree 3,0 l (vattenrening, inte stavar): tillverkarens produktblad för artikel 8020471 ger 404 och produkten finns inte på katadyn.com eller katadyngroup.com, så vikten 192 g är fortfarande inte bekräftad och raden har ingen nivå.
