# Promptmall till Astra

Kopiera allt under linjen, fyll i platserna i {klammer} och skicka. En kategori och en butik per körning. Utgå från den här mallen, inte från en gammal prompt: reglerna här är de som gäller nu.

Så tar du fram listan över det som redan finns: se `manual.md`, steg 1.

Formatet (kolumnerna) skiljer sig per kategori. Klistra in rätt block under "Format per kategori" längst ned på platsen {FORMAT}.

## Platser som skiljer sig per kategori

| Plats | Tält och vindskydd | Sovsäckar och quilts | Liggunderlag | Ryggsäckar | Kök |
|---|---|---|---|---|---|
| {KATEGORI_BESKRIVNING} | tält, tarpar och vindsäckar som passar för vandring | sovsäckar och quilts | liggunderlag | vandringsryggsäckar och dagsryggsäckar för vandring | kök och brännare för vandring: toppmonterade gaskök, slangkök, systemkök, stormkök, spritkök, multibränslekök, vedkök och kök för fast bränsle |
| {UTELAMNA} | biltält, taktält, campingtält, familjetält, glamping- och bomullstält, festtält, strandtält, popup-tält, isfiske- och bastutält, separata innertält och tillbehör. Riktmärke: tält tyngre än cirka 5 kg för två personer är oftast campingtält | campingsovsäckar, rektangulära täcken, sovsäckslakan, liners, resekuddar och tillbehör | luftmadrasser och bäddar för bil eller camping, tillbehör (reparationssatser, pumpar, lakan, kuddar) | vardags-, pendlar-, dator-, skol-, rese-, cykel-, löpar-, skid- och klätterryggsäckar, duffelväskor, midjeväskor, packpåsar, regnskydd och andra tillbehör | kök för gasolflaska (med slang och regulator), campingkök med två eller fler lågor, grillar, bordsspisar, gaspatroner och bränsle, lösa kastruller och kåsor, och tillbehör (vindskydd, patronstativ, tändare, reservdelar, brännare som säljs som reservdel). Stormkök med gasbrännare för skruvpatron (EN 417) ska med |
| {MINVIKTSREGEL} | tält och tarpar gäller: anger tillverkaren bara en minimivikt (utan pinnar, linor, lock) och ingen totalvikt, lämna ute produkten, även om butiken anger en vikt. | sovsäckar gäller: bara en minimivikt och ingen totalvikt betyder utelämnad. Bara en vikt utan packpåse går in i `packvikt_g` med kommentar. | liggunderlag gäller: bara en minimivikt och ingen totalvikt betyder utelämnad. Bara en vikt utan packpåse eller pumpsäck går in i `packvikt_g` med kommentar. | ryggsäckar gäller: anger tillverkaren bara en minimivikt (utan höftbälte, lock eller ram) och ingen totalvikt, lämna ute produkten. | kök gäller: `packvikt_g` är hela förpackningen utan bränsle. Anger tillverkaren bara brännarens vikt för ett kök som säljs med kokkärl, och ingen totalvikt, lämna ute produkten. Skriv i kommentaren vad vikten omfattar. |

---

Hej Astra! Vi fyller på produktkatalogen för MinVandring.se med produkter från **{BUTIK}** ({BUTIKENS_ADRESS}). Den här gången gäller det kategorin **{KATEGORI}**.

## Uppgift

1. Gå igenom {BUTIK}s sortiment av {KATEGORI_BESKRIVNING} (kategorin {KATEGORISIDA}). Butikens sida används för att se vilka produkter och storlekar som finns, och bara för det, förutom enligt reservregeln nedan.
2. Hämta ALLA uppgifter från tillverkarens egen, nuvarande produktsida, aldrig från andra butiker, prisjämförelser, tester, forum eller arkiverade kopior (till exempel web.archive.org). Länken till tillverkarens sida för just produkten skrivs i kolumnen `kalla`, utan spårningsparametrar (till exempel `referralCode`, `nosto`, `refSrc`, `_pos`, `?color=`, `?variant=` som bara väljer färg, `setLanguage`). Använd samma regionssida för alla rader av ett märke, helst `se-en` eller `en-se`.
3. Jämför med listan "Redan i katalogen" längst ned. Samma märke, modell och version (storlek) som redan finns ska INTE med i CSV:n. Den räknas som "redan fanns". Samma produkt kan heta lite olika i butiken och hos tillverkaren: matcha på modell, storlek och gärna EAN.
4. Lämna ute (och redovisa som utelämnade): barnprodukter, och för den här kategorin: {UTELAMNA}.
5. Vikt måste finnas, från tillverkaren eller enligt reservregeln. Anger tillverkaren en vikt men inte vad den omfattar: skriv den i `packvikt_g` och skriv i `kommentar` att det inte framgår vad vikten omfattar. Lägg aldrig vikten bara i kommentaren.
6. Anger tillverkaren samma vikt för flera storlekar utan att säga vilken storlek den gäller: lämna ute de storlekar som inte kan knytas till vikten.
7. Hitta aldrig på värden. Anger tillverkaren inget lämnar du fältet tomt. Räknar du om eller härleder ett värde (från oz, lb, tum eller Fahrenheit) förklarar du det i `kommentar`.
8. Använd tillverkarens modellnamn, inte butikens. Lägg inte till ord som bara butiken använder (till exempel "Ultralight", "Sleeping Bag", "Tent" eller "Backpack" om de inte ingår i tillverkarens namn) och skriv namnet utan produkttyp. Skriv i samma stil som befintliga rader av samma märke i listan.
9. Skriv märkesnamnet exakt som det står i listan längst ned. För nya märken: skriv som tillverkaren själv skriver det i löptext. Stavas ett märke olika i olika källor: skriv det under en egen rubrik "Frågor" i svaret, så avgör vi.

## Vikt och utelämnade, så här gäller reglerna

- **Tillverkarens vikt gäller alltid.** Butikens vikt ställs aldrig mot tillverkarens. Lämna aldrig ute en produkt för att butikens vikt skiljer sig från tillverkarens. Skillnaden får gärna nämnas i kommentaren.
- **Butikens sida som reserv.** Saknar tillverkaren produktsida, eller saknar sidan vikt, får {BUTIK}s produktsida användas för vikt, temperaturer och mått. `kalla` pekar då på butikens sida, och `kommentar` börjar med "Vikt och uppgifter från {BUTIK}. Tillverkaren saknar produktsida." eller "Vikt och uppgifter från {BUTIK}. Tillverkaren saknar vikt på produktsidan." Gäller inte barnprodukter, camping-, rese-, vardags-, cykel-, löpar-, skid- och klätterprodukter, och inte när tillverkarens egna sidor anger olika vikter.
- **Olika vikter.** Anger två giltiga källor olika vikter för samma produkt och storlek (två ställen på tillverkarens sida, eller två av tillverkarens regionsidor): lämna ute produkten och ange båda vikterna i skälet. En arkiverad sida, en butik som tillverkaren motsäger, en annan AI eller en sammanställning är ingen källa.
- **Bara minvikt.** För {MINVIKTSREGEL}
- **Utgångna produkter.** Att tillverkaren anger att en produkt har utgått är inget skäl att lämna ute den, så länge tillverkarens sida finns kvar med uppgifterna. Skriv i `kommentar`: "Tillverkarens sida anger att produkten har utgått." Finns tillverkarens sida inte längre: lägg inte till produkten, redovisa den som utelämnad.
- **Barnprodukter** lämnas alltid ute, även med reservregeln.

## Format

{FORMAT}

## Leverera fyra saker

1. **CSV:n** med de nya produkterna i ett kodblock, med exakt kolumnerna ovan.
2. **Redan fanns:** en lista över produkter hos {BUTIK} som redan finns i katalogen (märke, modell, storlek).
3. **Utelämnade:** en lista över produkter du lämnade ute, med skäl och länk för var och en.
4. **Frågor:** allt du var osäker på.

Avsluta med en sammanfattning på en rad: antal produkter och storlekar hos {BUTIK} totalt, antal nya, antal som redan fanns och antal utelämnade. Summan av de tre sista ska bli totalen. Räkna efter.

## Redan i katalogen (märke | modell | version)

{REDAN_LISTA}

---

## Format per kategori

Kolumnerna i CSV:n du levererar. Lämna `kontrollerad_datum` tomt. Det är Claude Code som fyller i de kolumner som tillkommer i katalogen.

### Tält och vindskydd

```
marke;modell;version;underkategori;personer;sasong;konstruktion;fristaende;kraver_stavar;packvikt_g;minvikt_g;golvyta_m2;absidyta_m2;ingangar;absider;innerhojd_cm;langd_cm;yttertalt_forst;material_typ;material_beskrivning;vattenpelare_duk_mm;vattenpelare_golv_mm;packmatt_cm;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar
```

- `underkategori`: `talt`, `tarp` eller `vindsack` (vindsack betyder nödskydd, utan egna bågar)
- `personer`: heltal. `sasong`: `3` eller `4`, tomt om det inte anges
- `konstruktion`: `tunnel`, `kupol`, `geodetiskt`, `pyramid`, `stavtalt` eller `annat`
- `fristaende`: `ja`, `nej` eller `halvt` (innertältet står självt men absiden måste pinnas). `kraver_stavar`: `ja` (reses med vandringsstavar) eller `nej`
- `packvikt_g`: total vikt i gram. `minvikt_g`: bara om tillverkaren anger en separat lägre vikt (trimvikt), och då tillsammans med packvikten
- `absidyta_m2`: summan av alla absider (skriv i kommentaren att det är en summa)
- `material_typ`: `Kerlon`, `silnylon`, `silpoly`, `nylon`, `polyester`, `DCF`, `bomull` eller `annat`
- Mått i centimeter och kvadratmeter, decimaltal med komma. `packmatt_cm`: till exempel `43 x 17`, största måttet först
- `pris_sek_ca`: tillverkarens ordinarie svenska pris i kronor, heltal, inte reapris. Tomt om det inte finns
- `ean`: bara om tillverkaren anger den

### Sovsäckar och quilts

```
marke;modell;version;underkategori;packvikt_g;minvikt_g;komfort_temp_c;limit_temp_c;extrem_temp_c;temperaturstandard;fyllning;fillpower_cuin;fyllnadsvikt_g;form;max_langd_cm;dragkedja;material_beskrivning;packmatt_cm;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar
```

- `version`: storleken eller varianten (`Regular`, `Long`, `W`, `190 cm`). En rad per storlek.
- `underkategori`: `sovsack` eller `quilt`
- `packvikt_g`: total vikt i gram. `minvikt_g`: bara om tillverkaren anger en separat lägre vikt
- Anger tillverkaren bara en vikt utan packpåse (eller utan kompressionsöverdrag): skriv den i `packvikt_g` med kommentaren "Vikt utan packpåse enligt tillverkaren." Anger tillverkaren bara en minimivikt och ingen totalvikt: lämna ute produkten.
- Temperaturer i hela °C (räkna om från °F och säg det). Limit får inte vara högre än komfort, extrem inte högre än limit. `temperaturstandard`: `iso` bara om tillverkaren anger ISO 23537 eller EN 13537, annars `ej_angiven`
- `fyllning`: `dun`, `syntet` eller `blandning`. `fillpower_cuin` bara för dun eller blandning
- `form`: `mumie`, `rektangular`, `quilt` eller `annat`. `max_langd_cm`: användarens längd, 140 till 230. `dragkedja`: `vanster`, `hoger` eller `ingen`, tomt om det inte framgår
- Marmots sovsäckar har °F i modellnamnet (till exempel "Hibernest 15°F"). Mammut skriver gradtalet som -15C.

### Liggunderlag

```
marke;modell;version;underkategori;packvikt_g;minvikt_g;typ;r_varde;r_varde_standard;langd_cm;bredd_cm;tjocklek_cm;form;ventil;pumpsack_ingar;material_beskrivning;packmatt_cm;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar
```

- `version`: storleken eller varianten. En rad per storlek.
- `underkategori`: alltid `liggunderlag`
- `packvikt_g`: total vikt. `minvikt_g`: vikt utan packpåse eller pumpsäck om tillverkaren anger båda. Anger tillverkaren bara en vikt utan packpåse eller pumpsäck: skriv den i `packvikt_g` med kommentaren "Vikt utan packpåse enligt tillverkaren."
- `typ`: `luft`, `sjalvuppblasande`, `skum` eller `annat`. `r_varde`: 0,1 till 12 med komma. `r_varde_standard`: `astm` bara om tillverkaren anger ASTM F3340, annars `ej_angiven`
- `langd_cm` 100 till 230, `bredd_cm` 30 till 150 (heltal), `tjocklek_cm` med komma
- `form`: `rektangular`, `mumie` eller `annat`. `ventil`: `platt`, `traditionell`, `ingen` eller `annat`. `pumpsack_ingar`: `ja` eller `nej`, tomt om det inte framgår
- Luftmadrasser och bäddar för bil eller camping, och tillbehör (reparationssatser, pumpar, lakan), lämnas ute.

### Ryggsäckar

```
marke;modell;version;underkategori;packvikt_g;minvikt_g;volym_l;passform;torso_min_cm;torso_max_cm;justerbar_rygg;ram;max_last_kg;hoftbalte;atkomst;regnskydd_ingar;material_beskrivning;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar
```

- `version`: storleken (`S/M`, `M/L`, `One Size`). En rad per storlek, eftersom vikt och rygglängd skiljer sig.
- `underkategori`: `ryggsack` (flerdagars, oftast från cirka 35 liter) eller `dagsryggsack`
- `packvikt_g`: total vikt. `minvikt_g`: bara om tillverkaren anger en separat lägre vikt, och då tillsammans med packvikten. Anger tillverkaren bara en minimivikt (utan pinnar, lock eller höftbälte) och ingen totalvikt: lämna ute produkten.
- `volym_l` 1 till 150. `passform`: `dam`, `herr` eller `unisex`. `torso_min_cm` och `torso_max_cm`: rygglängden storleken passar (25 till 75). `justerbar_rygg`: `ja` eller `nej`
- `ram`: `intern`, `ingen`, `extern` eller `annat`. `hoftbalte`: `fast`, `avtagbart`, `enkelt` eller `inget`. `atkomst`: `topp`, `topp_och_front`, `topp_och_sida`, `front` eller `annat`
- `regnskydd_ingar`: `ja` eller `nej`, tomt om det inte framgår
- Vardags-, pendlar-, dator-, skol-, rese-, cykel-, löpar-, skid- och klätterryggsäckar, duffelväskor, packpåsar, regnskydd och andra tillbehör lämnas ute. En ryggsäck utan riktigt höftbälte och utan tydlig koppling till vandring lämnas ute.

### Kök

```
marke;modell;version;underkategori;packvikt_g;minvikt_g;typ;bransle;personer;effekt_w;koktid_1l_min;forbrukning_g_h;regulator;kokkarl_l;tandare;patronfaste;packmatt_cm;pris_sek_ca;ean;kalla;kontrollerad_datum;kommentar
```

- `version`: varianten (`1,0 l`, `Duo`, `UL`, `HA`). En rad per variant, eftersom vikt och kokkärl skiljer sig.
- `underkategori`: alltid `brannare`
- `packvikt_g`: hela förpackningen utan bränsle, i gram: brännare, kokkärl, vindskydd och det som följer med. Skriv i `kommentar` vad som ingår. `minvikt_g`: bara om tillverkaren anger en separat lägre vikt, till exempel bara brännaren, och då tillsammans med packvikten
- `typ`: `toppmonterat` (skruvas på patronen), `slangkok` (brännaren står på marken med slang till patron eller flaska), `systemkok` (brännare och kokkärl sitter ihop, till exempel Jetboil), `stormkok` (vindskydd och kastruller i ett set, till exempel Trangia) eller `annat`
- `bransle`: `gas`, `sprit`, `multibransle`, `ved`, `fast_bransle` eller `annat`
- `personer`: heltal, det tillverkaren anger
- `effekt_w`: heltal i watt. Räkna om från BTU/h (1 W = 3,412 BTU/h) eller kcal/h och säg det i kommentaren
- `koktid_1l_min`: minuter för 1 liter vatten, med komma (3:30 skrivs 3,5). Anger tillverkaren bara tiden för 0,5 liter: lämna fältet tomt och skriv tiden i kommentaren
- `forbrukning_g_h`: gram per timme på full effekt. Anger tillverkaren förbrukningen på annat sätt (liter vatten per patron, minuter per patron): lämna fältet tomt och skriv uppgiften i kommentaren
- `regulator` och `tandare`: `ja` eller `nej`, bara för gas och multibränsle, tomt om det inte framgår
- `kokkarl_l`: volymen på det största kokkärlet som ingår, med komma. Tomt om inget kokkärl ingår. Ska alltid anges för stormkök
- `patronfaste`: fri text, till exempel `EN 417` eller `EN 417 och bränsleflaska`
- `packmatt_cm`: till exempel `12 x 16`, största måttet först
