# MinVandrings recept

Receptkatalogen är recept skrivna med egna ord utifrån idéer från andra (källan visas som "Inspirerat av …"). Den fylls bara via migreringar från CSV-filerna i `supabase/katalog/recept/`, som är huvudlistan. Ändra inte tabellerna för hand.

```
npm run receptkatalog                                  visar fel och en sammanfattning
npm run receptkatalog -- --skriv receptkatalog_<namn>  skapar seed-migreringen
```

Seeden skriver om hela katalogen: recept som inte längre finns i CSV:n tas bort, och varje recepts ingredienser och steg skrivs på nytt. Logiken står i `src/lib/receptkatalogimport.ts`.

## Filerna

- **recept.csv**: ett recept per rad: `id` (små bokstäver, siffror och bindestreck), `namn`, `maltid` (frukost, lunch, middag, mellanmal eller dryck), `portioner` (hur många portioner ingredienserna räcker till), `kok_kravs` och `torkning_hemma` (ja eller nej), `beskrivning`, `mangder` (`fran_kallan` eller `egna` när källan saknade mängder), `inspirerat_av`, `inspirerat_av_url` och `status` (`otestat` tills någon av grundarna har lagat rätten, sedan `testat`).
- **ingredienser.csv**: en rad per ingrediens för hela receptet: `recept_id`, `ordning`, `ingrediens`, `mangd` (punkt som decimaltecken), `enhet` (g, kg, dl, ml, st, msk, tsk eller krm), `packas` (`hemma`, `separat` eller `pa_plats` för vatten), `kommentar`, `livsmedel_nummer`, `varukatalog` och `gram` (frivillig, vikten i gram för hela mängden med högst en decimal, bara när enheten inte är g eller kg).
- **steg.csv**: stegen i ordning: `recept_id`, `steg_nr`, `var` (`hemma` eller `turen`), `steg` och `tid_min` (minuter, till exempel 5 eller 5–10).

## Kopplingar, allergener och kost

En ingrediens kan kopplas till ett livsmedel (`livsmedel_nummer`, Livsmedelsverkets nummer) eller en märkesvara (`varukatalog`, märke och namn med `|` emellan, till exempel `Pågen | Gifflar`). Skriptet kontrollerar att livsmedlet finns bland de livsmedel som importen godkänner och att märkesvaran finns i `supabase/katalog/varor/`.

- Allergener och kost för ett recept räknas i appen från ingredienserna (`kostForRecept` i `src/lib/receptkatalog.ts`). Vatten på plats räknas inte.
- En ingrediens utan koppling är okänd. Då är receptets allergener okända, och okänt räknas aldrig som att receptet passar ett filter.
- Koppla bara när livsmedlet verkligen är samma sak. En kryddning eller en färdig produkt utan säkert livsmedel får hellre vara okänd.

Vid den första importen 2026-11-26 kopplades 144 av 193 ingredienser. Matolja kopplades till Rapsolja (2189), eftersom livsmedlet Matolja (3418) inte går igenom livsmedelsimporten.

## Kcal och antal personer

Receptvyn räknar kcal per portion från ingrediensernas vikt och kcal per 100 g i det kopplade livsmedlet eller märkesvaran (`kcalPerPortion` i `src/lib/receptkatalog.ts`). Vikten är `gram`, eller mängden när enheten är g eller kg. Vatten på plats räknas inte, och kryddor i tsk och krm utan gram räknas som 0 g.

Kcal visas, avrundat till närmaste 10, bara när ingredienser med både vikt och kcal är minst 80 % av receptets vikt. Saknas vikten för någon annan ingrediens visar appen "Kcal går inte att räkna än". Fyll alltså i `gram` för rader i dl, msk, st och liknande, och koppla dem till ett livsmedel eller en märkesvara.

I receptvyn går det att välja 1 till 12 personer. Alla mängder räknas om och avrundas läsbart (`skalaRecept`): dl och msk till en decimal, tsk, krm och st till närmaste halva och g till hela gram.

## I appen

- Under Recept visas MinVandrings recept ovanför ens egna, med kostfilter. Recept med status `otestat` får brickan "Inte provlagat av oss än".
- Ett recept öppnas på `/matplanering/recept/<id>`.
- **Lägg i turen** kopierar receptet till turens egna rätter (`spara_egen_ratt`), per portion. Vatten på plats kommer inte med, och en mängd i g som blir under 1 g per portion kopieras utan mängd. Gruppens kostbehov visas som varningar innan man lägger receptet i turen.
- **Spara som eget recept** kopierar det till ens egna recept (`spara_recept`). Finns namnet redan får kopian ett nytt namn ("Gryta (2)").
