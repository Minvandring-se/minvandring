# Baslivsmedlen: källa, format och import

Baslivsmedlen ger förslag med näringsvärden när man skriver ingredienser i egna rätter och recept, till exempel "Pasta okokt" med 357 kcal och 12 g protein per 100 g. De kommer från Livsmedelsverkets livsmedelsdatabas.

## Källan

- **API:** Livsmedelsverkets öppna API, version 1. Dokumentation: https://dataportal.livsmedelsverket.se/livsmedel/swagger/index.html
- **Licens:** CC BY 4.0, enligt `info.license` i API:ets swagger ("Tillhandahålls enligt CC BY"). Vi ska ange Livsmedelsverket som källa, länka till licensen och säga vad vi har ändrat. Det står vid förslagen i appen ("Näringsvärden från Livsmedelsverket") och under Källor på integritetssidan.
- **Omfång:** alla livsmedel i databasen, både analyserade och beräknade. Vid den första hämtningen 2026-11-24 fanns 2 606, och 2 605 kom med (se nedan).
- **Ändringar vi gör:** värdena avrundas (se tabellen nedan), och tillståndet (torr, rå eller tillagad) läses ut ur namnet.

Appen anropar aldrig API:t. Värdena hämtas av skriptet, sparas i CSV:n och läggs in i tabellen `livsmedel` med en seed-migrering, precis som matkatalogen.

## Så hämtas och läggs livsmedlen in

1. Kör `npm run livsmedel`. Skriptet:
   - hämtar listan med alla livsmedel, och sedan näringsvärden och klassificeringar för varje livsmedel
   - skriver `supabase/katalog/livsmedel/livsmedel.csv`
   - visar en rapport: antal, rader med fel, tillstånd och hur många som saknar varje värde
2. Läs rapporten och diffen i CSV:n.
3. Kör `npm run livsmedel -- --skriv livsmedel_<namn>`. Det läser CSV:n, kontrollerar den och skapar en seed-migrering i `supabase/migrations/` med en tidsstämpel efter den senaste. Ingenting hämtas i det här steget.
4. Visa migreringen och vänta på ok innan den körs, som alla migreringar.

Skriptet är snällt mot API:t: fyra anrop åt gången, en kort paus efter varje anrop och nya försök med längre väntan vid fel. Svaren sparas i `supabase/katalog/livsmedel/.api-svar/`, som inte committas, så att en ny körning inte behöver hämta allt igen. `npm run livsmedel -- --ny` hämtar om allt, till exempel när Livsmedelsverket har släppt en ny version.

En rad med fel kommer inte med i seeden, som i matkatalogen, och syns i rapporten. Fel i själva filen (rubrikraden, samma nummer två gånger) stoppar seeden. Vid den första hämtningen 2026-11-24 utelämnades en rad: Matolja (nummer 3418), som har 902 kcal och 102 g fett per 100 g hos Livsmedelsverket. Det är mer än 100 g fett per 100 g och över gränsen 900 kcal som recepten har, så ett förslag med de värdena skulle inte gå att spara. Övriga oljor har 884 kcal och 100 g fett och finns med.

Ett livsmedel som redan finns (samma nummer) uppdateras när seeden körs igen. Ett livsmedel som tas bort ur CSV:n försvinner inte ur tabellen av sig själv. Det kräver en egen migrering.

Ändra aldrig tabellen `livsmedel` eller CSV:n för hand. Hämta om och skapa en ny migrering.

## Formatet

Semikolon mellan fälten, decimalkomma och UTF-8. Ett fält som innehåller semikolon sätts inom citattecken. Rubrikraden:

```
nummer;namn;grupp;tillstand;kcal;protein_g;fett_g;kolhydrater_g;fiber_g;sockerarter_g;salt_g;vatten_g;version
```

| Kolumn i CSV:n | Kolumn i tabellen | Från API:t | Innehåll |
|---|---|---|---|
| `nummer` | `nummer` | `nummer` i listan | Livsmedelsverkets livsmedelsnummer, unikt. |
| `namn` | `namn` | `namn` i listan | Livsmedelsverkets namn, till exempel "Pasta kokt u. salt". |
| `grupp` | `grupp` | klassificeringen med `typ` LanguaL och fasett "A Gruppindelning EuroFIR", fältet `namn` | Till exempel "Pasta". Tom när den saknas. |
| `tillstand` | `tillstand` | räknas ut av oss | `torr`, `ra`, `tillagad` eller tom. Se nedan. |
| `kcal` | `kcal_per_100g` | näringsvärdet "Energi (kcal)", enhet kcal | Heltal. |
| `protein_g` | `protein_per_100g` | "Protein", enhet g | En decimal. |
| `fett_g` | `fett_per_100g` | "Fett, totalt", enhet g | En decimal. |
| `kolhydrater_g` | `kolhydrater_per_100g` | "Kolhydrater, tillgängliga", enhet g | En decimal. |
| `fiber_g` | `fiber_per_100g` | "Fiber", enhet g | En decimal. |
| `sockerarter_g` | `sockerarter_per_100g` | "Sockerarter, totalt", enhet g | En decimal. |
| `salt_g` | `salt_per_100g` | "Salt, NaCl", enhet g | Två decimaler. |
| `vatten_g` | `vatten_per_100g` | "Vatten", enhet g | En decimal. |
| `version` | `version` | `version` i listan, de tio första tecknen | Datumet för livsmedlets version hos Livsmedelsverket. |

Alla näringsvärden gäller 100 g ätlig del, som hos Livsmedelsverket (`matrisenhet` "100 g ätlig del"). Namnet och enheten måste stämma exakt, så att till exempel kJ aldrig hamnar som kcal.

**Tomt eller 0:** ett värde som saknas hos Livsmedelsverket blir tomt i CSV:n och null i tabellen, aldrig 0. En 0 betyder att Livsmedelsverket anger 0, till exempel en logisk nolla (vatten i talg) eller "Inget fynd".

**Används i appen i dag:** `kcal` och `protein_g`, som fylls i när man väljer ett förslag. Resten sparas för senare (se `docs/att-ta-senare.md`).

## Tillståndet

Vandrare packar torr vikt, så förslagen visar om livsmedlet är torrt, rått eller tillagat. Funktionen `tillstandFranNamn` i `src/lib/livsmedel.ts` läser namnet i den här ordningen:

1. **Torr, om namnet säger okokt.** Går först, så att "okokt" inte räknas som kokt.
2. **Tillagad:** ord som slutar på kokt eller stekt, och grillad, tillagad, friterad, ugnsbakad, gräddad, ångad med flera. Går före övriga torra ord, så att "Röda linser torkade kokta m. salt" och "Tomatsoppa tillagad pulver m. vatten" blir tillagade.
3. **Torr:** ord som torkad, torkade, torr, frystorkad, och ord som slutar på pulver eller mjöl (mjölkpulver, vetemjöl). Bara delen före "m." (med) läses, eftersom det som kommer efter är i eller till maträtten: "Kalvdans m. mjölkpulver ägg" och "Baguette m. salami soltorkad tomat" blir inte torra.
4. **Rå:** ordet rå, råa eller rått, men inte rå mitt i ett ord (råris, råg).
5. **Reserv:** säger namnet inget används tillagningen i klassificeringen (LanguaL G), om den säger att livsmedlet är kokt, stekt och så vidare.
6. Annars tomt, eftersom en gissning kan ge fel vikt.

Reglerna rättades samma dag som den första seeden kördes. Rättelsen ligger i en egen seed-migrering (`livsmedel_2026_11_tillstand`), som uppdaterar tillståndet på 38 livsmedel.

## Förslagen i appen

När man skriver en ingrediens söker databasen på det längsta ordet, och `rangordnaLivsmedel` i `src/lib/livsmedel.ts` väljer högst fem förslag:

- Alla ord man har skrivit måste finnas i namnet.
- Först namn som börjar med det man har skrivit, sedan namn där ett ord börjar med det första sökordet, sedan övriga.
- Vid lika träff kommer torrt före rått före okänt före tillagat, och kortare namn först.

Varor som redan finns i turen eller i ens recept föreslås före livsmedlen. Väljer man ett livsmedel kopieras namnet, kcal och protein in i raden. Värdena går att ändra, och raden pekar inte på livsmedlet efteråt.

## Allergener

Varje livsmedel har kolumnen `allergener` med EU:s 14 allergener, som påsarna i matkatalogen. Saknas värdet (null) är livsmedlet okänt, och okänt räknas aldrig som att livsmedlet passar. En tom lista betyder att det inte innehåller någon av de 14. Livsmedelsverkets databas har inga allergener, så de räknas ut med regler i `allergenerForLivsmedel` i `src/lib/livsmedelsgrupper.ts` när seed-migreringen skapas. Ändra reglerna där och här samtidigt, och skapa en ny seed-migrering.

Reglerna gäller bara enkla råvaror. Allt annat är okänt.

- **Enkla grupper:** Mjölk, Fil och yoghurt, Grädde, Smör, Hårdost, Lagrad ost, Halvhård ost, Mjukost, Ost, Färskost, Övriga ostprodukter, Mejeriprodukter, Övriga mjölkprodukter, Ägg, Fisk, Fisk och skaldjur, Rött kött, Fågel, Innanmat och inälvsmat, Andra djurfetter, Grönsaker och svamp, Grönsaker, rotfrukter och svamp, Frukt och bär, Potatis och stärkelserika rötter, Baljväxter, Nöt, frö eller kärna, Ris eller annat spannmål, Cerealier eller cerealielika mjölprodukter och derivat, Pasta och liknande produkter, Vegetabiliskt fett och olja, Krydda, Socker, honung eller sirap och Vatten. Spannmål och spannmålsprodukter är inte en enkel grupp, eftersom den blandar deg, lasagne och snacks.
- **Sammansatt trots gruppen:** namn med till exempel panerad, pastej, korv, pudding, bröd, gröt, sås, soppa, margarin, choklad, gryta, sauté, stuvad, sufflé, palt, lasagne (inte lasagneplattor), sushi (inte sushiris), masala, hemlagad, mix, buljong, fond, burgare, chips, leverbiff och grönsaksbiff (men inte bara "biff", så att Ryggbiff är enkel), blandning (utom när namnet räknar upp vete, råg, korn eller havre) och namn med "m." följt av något annat än salt, ben, skinn, skal, svål, lag, vatten, olja, fett eller ägg ("Kyckling m. bacon jordnötter"), är okända.
- **Pålägg:** kött och fågel som är skivad eller i tunna skivor är okända, eftersom pålägg kan innehålla mjölkprotein.
- **Nötter blandade** är okända, eftersom en blandning kan innehålla jordnötter, utom de två nedan med kända allergener.
- **Mejerigrupperna** innehåller alltid mjölk, även laktosfria, eftersom laktosfritt fortfarande är mjölkprotein. **Ägg** innehåller ägg.
- **Fisk och skaldjur:** räkor, krabba, hummer och kräftor är kräftdjur. Musslor, ostron, bläckfisk och sniglar är blötdjur. Övrigt i grupperna Fisk och Fisk och skaldjur är fisk. Skaldjur räknas inte som fisk.
- **Gluten:** vete (inte bovete), råg, korn (spannmålet, inte "krossade korn" av bovete eller hirs), havre, dinkel, spelt, bulgur, couscous och mannagryn. Pasta innehåller gluten om den inte är gjord på ris, majs eller baljväxter, är glasnudlar eller kallas glutenfri.
- **Ur namnet:** jordnötter, nötter (mandel, hasselnöt, valnöt, cashew, pekan, para, pistage, macadamia, men inte mandelpotatis), sesam, soja, lupin, selleri (inte sellerikål), senap och ägg (som eget ord eller början på ett ord, inte "lägg").
- **Torkad frukt**, fruktchips och tillagad rödkål är okända, eftersom de kan innehålla svaveldioxid.
- **Oljor:** raffinerade oljor räknas inte som allergener, som i EU:s undantag. Sesamolja och jordnötsolja gör det. Vetegroddsolja och kallpressade oljor är inte raffinerade och behåller allergenerna i namnet, så vetegroddsolja innehåller gluten.
- **Kända trots att de är sammansatta** (`KANDA`): Nötter blandade naturella och rostade m. salt (jordnötter och nötter), Deg filodeg (gluten), Lasagne nötfärs (gluten, ägg, mjölk och selleri), Leverpalt och Njurpalt (gluten) och Grönsakssufflé (gluten, ägg och mjölk). Listan tar med allergener som troligen ingår, eftersom en varning för mycket är bättre än en för lite.

Vid den första körningen 2026-11-24 fick 255 livsmedel allergener, 579 inga och 1 771 okända. Efter felsökningen 2026-11-26 (34 livsmedel som räknades som "inga" fast de troligen innehåller allergener) fick 263 livsmedel allergener, 545 inga och 1 797 okända. Förslagen visar "Innehåller gluten" och så vidare under namnet när allergenerna är kända.

## Råvaror före maträtter

När man skriver en ingrediens kommer råvaror före färdiga rätter, eftersom man oftast skriver in det man själv köper och lagar. Grupperna som räknas som maträtter står i `MATRATTSGRUPPER` i `src/lib/livsmedelsgrupper.ts`: Kötträtt, Sås i maträtt, Cerealierätter (klimp, risotto, pannkakor med fyllning, couscous, smörgåsar), Fisk- och skaldjursrätt, Grönsaksrätter, Potatisrätter, Soppa, Matpaj eller pizza, Baljväxträtter, Pastarätter, Färdigsallad, Äggrätter, Svamprätter, Smörgåsar, Maträtter och efterrätter, Livsmedelsrätter och ingredienser, Pannkaka eller våffla och Dessert.

## Kost och huvudgrupper i matkatalogen

Matkatalogen visar livsmedlen i huvudgrupper (`HUVUDGRUPPER` i `src/lib/livsmedelsgrupper.ts`), och kostvalen räknas i appen med `kostForLivsmedel` utifrån gruppen och allergenerna:

- **Glutenfri och laktosfri:** kända allergener utan gluten och utan mjölk. Livsmedel med mjölk räknas inte som laktosfria, eftersom databasen inte säger om laktosen är borttagen.
- **Vegetarisk och vegansk:** bara enkla råvaror från växtriket och mejeri och ägg, med kända allergener. Kött, fisk och skaldjur är varken eller. Honung är inte veganskt. Allt annat är okänt, och okänt räknas aldrig som att något passar ett filter.
