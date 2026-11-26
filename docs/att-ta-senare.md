# Att ta senare

## Min utrustning

Idé från Hikt (deras "Gear Closet"). Varje person har en egen lista över sin utrustning med namn, kategori, vikt och typ. Man lägger in sina prylar en gång och väljer sedan vad som ska med på varje tur.

Varför: man slipper skriva in tält, sovsäck och kök med vikt för varje ny tur. Kalkylarket klarar inte det bra, så det är en tydlig anledning att byta till appen.

Tankar om hur:
- Egen tabell per person. Bara man själv ser och ändrar sin utrustning (RLS på `user_id`).
- När en pryl läggs i en turs packlista kopieras den in i `packrader`, den länkas inte. Gamla turer ändras då inte om man byter tält, och gruppen ser inte hela ens förråd.
- I packlistan ska man fortfarande kunna skriva in saker direkt, och spara dem till Min utrustning med ett klick.
- Importen från kalkylarket (punkt 7 i version 1) kan läggas i Min utrustning i stället för i en enskild tur.

Bygg packlistan (punkt 4) så att det här går att lägga till senare utan ombyggnad.

### Läget

Mitt förråd finns (`/forrad`, tabellen `forradssaker`). Lägg till börjar med en sökning i produktkatalogen (`produkter`). Ett tryck på en träff lägger saken i förrådet med namn, kategori, vikt och typ ifyllda. Hittar man inte sin produkt skriver man in den själv, och den hamnar då bara i ens eget förråd. Kategorierna i två nivåer står i `src/lib/forrad.ts` och i tabellerna `kategorier` och `underkategorier`.

### Katalogen

CSV-filerna i `supabase/katalog/` är huvudlistan. Semikolon som avgränsare, kolumnerna läses efter namn, och tal får ha punkt eller komma som decimaltecken. Kolumnen `kommentar` är till för oss och sparas inte.

- `npm run katalog` visar varje rad med fel och varningar utan att skriva något. Fel stoppar raden, varningar (fält som saknas för jämförelser) gör det inte.
- `npm run katalog -- --skriv katalog_<namn>` skapar dessutom en ny seed-migrering. Den uppdaterar produkter som redan finns, så hela listan kan köras igen när en CSV har ändrats.
- Ett test (`supabase/katalog.test.ts`) faller om en CSV ändras utan att en ny migrering skapas.
- En produkt som tas bort ur CSV:n försvinner inte ur databasen av sig själv. Det kräver en egen migrering.

Granskning görs alltid i CSV:n och förs in med en ny seed-migrering, aldrig direkt i databasen. Seeden skriver över `kontrollerad` för varje produkt, så ett datum som bara satts i databasen försvinner vid nästa körning.

`kontrollerad_datum` sätts när någon av oss har kontrollerat raden mot tillverkarens sida. Tomt betyder inte granskad. Sådana produkter importeras och syns i sökningen, märkta "Inte granskad än". Granskade får etiketten "Granskad".

Jämförelser senare ("likvärdigt tält som väger mindre") ska bara använda granskade produkter (`kontrollerad is not null`). Vikter och mått som ingen har kontrollerat får inte ligga till grund för ett råd.

Egenskaper per underkategori står i `src/lib/produktegenskaper.ts`. Tält har flest, och elva av dem behövs för jämförelser. Tarp och vindsäck har fem enkla, alla frivilliga. Sovsäck och quilt har tolv, varav fem behövs för jämförelser (komfort- och limittemperatur, fyllning, form och max längd). Där finns också regler mellan fälten: limit får inte vara högre än komfort, extrem inte högre än limit, och fillpower anges bara för dun och blandning. Liggunderlag har elva, varav fem behövs för jämförelser (typ, R-värde, längd, bredd och tjocklek), och ett underlag av skum får inte ha en ventil. Ryggsäck och dagsryggsäck har elva, varav fem behövs för jämförelser (volym, passform, minsta och största rygglängd och ram), och den minsta rygglängden får inte vara större än den största. Övriga underkategorier har inga än.

Att ta ställning till: ska appen tillåta produkter som bara har minvikt? I dag kräver importen `packvikt_g`, och produkter där tillverkaren bara anger minimivikt utelämnas. Så blev det för åtta Marmot-tält i genomgången av Outnorth 2026-11-22. Minvikten är lägre än det man faktiskt bär, eftersom pinnar, linor och packpåse inte ingår, så den kan inte stå som packvikt utan att det syns.

Att göra: gå igenom Outnorths utelämnade produkter med regeln om butikens sida som reserv för vikt, temperaturer och mått (se skillen `katalog`), främst Urberg och Sydvang. De utelämnades i genomgången 2026-11-22 för att tillverkarens produktsida saknar verifierbar vikt.

### Kopplingen till packlistan

Byggt: Lägg till i packlistan hämtar saker ur förrådet och kopierar in dem i `packrader` med namn och vikt (`src/components/packning/LaggTillUtrustning.tsx`), och man väljer om man bär saken själv, åt gruppen eller om alla har var sin. En ny sak kan skrivas in där. `packrader.kategori` och `underkategori` använder förrådets nycklar, bara owner och editor lägger till, och gruppen ser bara kopian. I förrådet hämtar Hämta från en tur det man bar i en tur.

Kvar:
- `packrader.forradssak_id` (nullable, on delete set null) för att visa "redan tillagd". I dag finns bara varningen för dubbletter (`dubbletter` i `src/lib/packlista.ts`).
- Kryssrutorna "Går åt under turen" och "Jag har den på mig" går inte att ändra per tur i packlistan, till exempel regnjackan som ibland är på och ibland ligger i ryggsäcken. Valet i förrådet följer med när saken hämtas in.

## Smarta tips i packlistan

Idé från Hikt. Tre sorters tips, i den ordning de bör byggas.

### 1. Säkerhetskoll för gruppen (först, direkt efter packlista och vikt)

Enkla regler, ingen AI eller produktdatabas. En lista med saker som alltid bör finnas med (första hjälpen, karta, kompass, vindskydd, pannlampa) jämförs med turens packlista. Reglerna som rena funktioner i `src/lib` med tester.

Vår fördel mot andra appar är att vi ser hela gruppen:
- "Ingen i gruppen har packat första hjälpen."
- "Ni har två kök men ingen gas."
- "Tre personer har packat tält, ni är fyra. Behövs alla?"

### 2. Lättare alternativ (senare)

"Byt till en spork i titan och spara 65 g." Kräver en databas med produkter och vikter som hålls aktuell. Här kan länkar till riktiga produkter och butiker komma in (affiliate), men e-handel och affiliate är inte MVP.

### 3. Populärt bland andra (mycket senare)

"87 % av vandrare med liknande utrustning använder ..." Kräver många användare och Min utrustning. Statistik från ett fåtal personer säger ingenting.

### Om produkter och förtroende

Tips om säkerhet och vikt måste gå att lita på. Om de leder till butiker där vi får provision ska det vara tydligt märkt, och tipsen får aldrig styras av vad som ger mest provision.

## Vercels förhandsversioner i Supabase

Under Authentication → URL Configuration → Redirect URLs i Supabase fanns `https://*.vercel.app/**`. Den släppte igenom alla webbplatser på Vercel, inte bara våra, så den togs bort.

Att göra (den som har Vercel-kontot): öppna en förhandsversion (Preview) under Deployments, kolla adressen och lägg till en smal variant i Supabase, ungefär `https://minvandring-*-<teamnamn>.vercel.app/**`.

Tills dess fungerar inloggning med lösenord ändå i förhandsversionerna. Bara länkarna i mejlen (bekräfta konto, nytt lösenord) leder till www.minvandring.se i stället.

## Mejlmallar i Supabase som inte är översatta

Mejlen skickas via Resend (SMTP) från noreply@minvandring.se. Mallarna finns under Authentication → Emails → Templates.

Översatta till svenska: Confirm sign up, Reset password och Invite user.

Fortfarande på engelska, eftersom appen inte använder dem än:
- Magic link or OTP (inloggning med länk eller kod, togs bort i PR #19)
- Change email address (används när man kan byta mejladress i appen)
- Reauthentication (används om "Secure password change" slås på)
- Aviseringarna under Security (Password changed, Email address changed med flera), som är avstängda

Den som bygger en funktion som skickar något av de här mejlen översätter mallen samtidigt.

## Cloudflare Turnstile mot robotkonton

Lägg till Cloudflare Turnstile som CAPTCHA i Supabase Auth (Authentication → Attack Protection), så att robotar inte kan skapa konton i mängd. Det kräver en widget på Skapa konto, Logga in och Glömt lösenord, och att CSP:n i `vercel.json` släpper fram `https://challenges.cloudflare.com` i `script-src` och `frame-src`. Ingen Cloudflare-proxy behövs framför sajten.

## Öppna API:er för lederna man ska gå

Idé: visa information om leden och området för turen, hämtad från gratis öppna källor. Det ska stödja planeringen, inte göra MinVandring till en ledguide (se docs/vision.md).

Källor:
- **SMHI, väderprognos:** öppna data, gratis, ingen nyckel. Får användas även kommersiellt, men SMHI ska anges som källa. Prognos för cirka tio dygn framåt vid turens startpunkt. Bra första steg, visas på turens översikt när turen närmar sig. Dokumentation: https://opendata.smhi.se/apidocs/metfcst
- **Naturvårdsverket, leder och friluftsanordningar:** öppna data med REST-API. Statliga leder i fjällen och anordningar i skyddade områden (stugor, rastskydd, eldplatser). Kvaliteten varierar mellan områden.
- **OpenStreetMap via Overpass:** märkta leder (route=hiking), till exempel Kungsleden, med GPX via Waymarked Trails. Den publika servern har gränser per IP, så datan ska hämtas en gång och sparas i vår databas, inte anropas för varje användare. OpenStreetMap ska anges som källa (ODbL).
- **Naturvårdsverket, lavinprognoser:** dagliga prognoser för sex fjällområden under vintern, som kartlager (WMS). För vinterturer längre fram.

Naturkartan har inget öppet API som vi hittat.

Att lösa innan:
- Turens startpunkt är bara text i dag. Vi behöver koordinater, till exempel genom att man väljer platsen på en karta eller söker upp den.
- Säkerhetsrubrikerna i vercel.json (CSP, connect-src) måste tillåta de nya adresserna.
- Ange källan där datan visas.

## Radera kontot, och profilbilden med det

Appen har inget sätt att radera sitt konto i dag. Den som vill sluta får mejla oss. Databasen är förberedd: när en rad i `auth.users` tas bort försvinner personens deltagarrader med kostbehov, ätare och bockar, en ensam ägare ersätts av nästa deltagare med konto, och en tur utan andra konton raderas (`public.konto_raderas` i `20261125210001_konto_och_matregler.sql`).

När kontoradering byggs i appen ska profilbilden tas bort samtidigt. Den ligger i Supabase Storage (bucketen `profilbilder`, filen `<user_id>/bild`) och försvinner inte av sig själv. Tills dess: ta bort filen för hand i Storage när ett konto raderas.

Profilbilden visas med signerade adresser som gäller i en timme. En turkamrat som tas bort ur en tur kan alltså ha en adress som fungerar upp till en timme till.

## Färgring runt profilbilden

Oscars idé: en tunn färgring runt profilbilden i namnbrickan, så att bilden lyfter och känns som en del av MinVandring. Förslag att pröva: skogsgrön ring som standard, eller en ring i deltagarens egen färg i Gruppen och deltagarlistan så att det syns vem som är vem. Gult bara om ringen betyder något, till exempel att någon inte svarat på inbjudan än. Ringen ska fungera både med bild och med bokstaven, och ha god kontrast mot ljus bakgrund.

## Mitt förråd: förslag efter genomgång av designförslaget

Status 2026-11-25: punkt 1, 2, 3 och 5 löstes när förrådet gjordes om, och punkt 4 är rättad (träfflistan följer rutans scroll i mobilen). Avsnittet kan tas bort när vi har sett sidan i mobilen.

Genomgången gjordes 2026-11-22 mot `docs/designforslag.md`, `docs/skisser/design-forrad.png` och sidan i 390 och 1272 px. Det mesta i designförslaget är redan byggt. Tryckytorna är minst 44 px, det finns ingen sidscroll och appen ger inga konsolfel. Fem saker återstår, i den ordning vi föreslår:

1. **Ta bort underkategorin ur radens undertext.** Raden visar "Tält · Lilla tältet. Köpt juli 2025." under rubriken "Tält och vindskydd". Skissen har bara anteckningen, och ordet Tält upprepar kategorin. Där anteckningen saknas kan underkategorin vara kvar.
2. **Tydligare radnamn och vikt.** I skissen är namnet halvfet och vikten lika stor som namnet. I dag är namnet `font-medium` och vikten `text-sm`. Det blir lättare att läsa utomhus.
3. **Lugnare "De fyra tunga".** Den gula rutan med uppmaningar ligger över alla kategorier och drar mer blick än förrådet självt. Den finns inte i skissen. Behåll men gör den mindre, eller flytta den under listan. Produktbeslut, eftersom den lades till medvetet.
4. **Mobil, sök i katalogen.** Träfflistan scrollar i en egen ruta som visar ungefär fyra rader med bottenmenyn nära. Låt listan ta sidans scroll på mobil.
5. **Rubrikstorlek.** Skissens "Mitt förråd" är större än dagens. Liten ändring, gör den om vi vill följa skissen exakt.

Inte kontrollerat än: tomt förråd, tangentbordsfokus och den utfällda detaljen med "Produktuppgifterna har inte granskats". Titta på dem med skillen `kor-appen` när vi bygger.

## Fiske och jakt

Idé: ge dem som fiskar eller jagar på vandringen plats för det i appen. Tre delar, i den ordning de bör byggas:

1. **Kategorierna Fiske och Jakt i Mitt förråd**, så att man kan lägga in egna saker. Fiske finns som underkategori (`fiske` i `src/lib/forrad.ts`), men inte Jakt. Kategorinycklarna läggs till både i databasen och i `src/lib/forrad.ts`, och testet i `supabase/rls.test.ts` ska fortsätta stämma.
2. **Påminnelser i Kom ihåg till nästa vandring** om fiskekort, jaktkort och jakttider, så att man minns att ordna dem före turen.
3. **Eventuellt en liten katalog för resespön och fjällspön.** Inga vapen i katalogen.

## Katalogen: Mammut Tyin MTI 5-Season

Mammut Tyin MTI 5-Season (180 och 200 cm) och Protect Fiber Bag -18C S utelämnades vid XXL- och Outnorth-genomgången 2026-11-22. Tyins produktsida hos Mammut hängde sig i Chrome, och Protect Fiber S visar att produkten inte längre finns. Försök läsa Tyin igen, och lägg in raderna om sidan visar vikt per storlek. Outnorths vikter för raderna finns i `Claude outputs/outnorth-sovsackar.csv`.

## Mina turer: väder, bild och information

Idé: göra turkortet och turvyn mer levande med väder, en egen bild och fakta om platsen, utan att bygga en ledguide (se docs/vision.md).

- **Väder från SMHI:s öppna prognos-API** för startpunkten när turen börjar inom cirka tio dagar. Kräver att turen har koordinater (i dag är startpunkten bara text). Kontrollera användarvillkoren innan det byggs, och ange SMHI som källa där prognosen visas.
- **En egen tecknad bildruta per tur** i appens stil: fjäll, skog eller kust efter landskap, med färger efter årstid. Kräver en kolumn för landskap på turen. Inget API och inga bildrättigheter.
- **Med P2:** karta från Lantmäteriets öppna data eller OpenStreetMap, GPX-import och höjdprofil, och lavinprognoser från Naturvårdsverket för vinterturer.
- **Bortvalt tills vidare:** bilder från Wikimedia Commons eller Unsplash. Kvaliteten varierar, upphovsangivelser krävs och nyckeln kräver en server.

## Leddatabas

Mål: en stor lista över svenska vandringsleder med mycket information, som kan förifylla en tur.

Per led:
- sträcka, och etapper med avstånd
- höjdmeter
- stugor och övernattning
- säsong och svårighetsgrad
- start och mål med kommunikationer
- vatten och mobiltäckning
- risker, till exempel vadställen och lavinterräng
- officiella källor och kontrolldatum

Etapper: de 20 till 50 mest kända lederna först, sedan de leder användarna planerar. Samma arbetssätt som produktkatalogen: en lista i filer i repot som är huvudlistan, med källa och kontrolldatum per rad.

Villkor och källor:
- Bygg inte på OpenStreetMaps ruttdata. Licensen (ODbL) kräver att den databas man bygger delas vidare.
- Kontrollera villkoren för Lantmäteriets och länsstyrelsernas data innan något hämtas.
- Skriv egna formuleringar och ange källa per led.

## Katalogen: Nordisk och OMM

Nordisks produktsidor säger inte vad "Official weight" är och anger ingen temperaturstandard för sovsäckarna, så raderna har totalvikten i `packvikt_g` och `ej_angiven`. Fråga Nordisk (eller läs deras FAQ) vad den officiella vikten och temperaturerna bygger på. Nordisk-tälten som redan ligger i katalogen har trimvikten som minvikt. OMM Mountain Raid utelämnades eftersom OMM bara anger Leanweight, "all extras removed", utan att säga vilka delar som avses för sovsäckarna.

## Utrustningskatalogen: rangordning och gruppering i databasen

Utrustningskatalogen hämtar i dag alla träffar för en sökning, i omgångar om 1 000 rader, och visar 100 kort åt gången med "Visa fler" (`src/pages/Utrustningskatalog.tsx`). Det fungerar eftersom katalogen är liten (runt 1 300 produkter). Rangordningen (`sorteraTraffar`), grupperingen till modeller (`grupperaModeller`) och filtret för kokkärl (`filtreraKokgrupp`) görs i webbläsaren, och därför går det inte att hämta en sida i taget från databasen.

Flytta rangordningen och grupperingen till databasen, till exempel en funktion som ger modellerna sida för sida med det riktiga antalet, när något av det här händer:
- Katalogen växer så att en sökning eller en stor kategori ger flera tusen rader.
- Vi bygger skyddet mot att någon hämtar hela katalogen (till exempel en gräns för antal rader per fråga eller per konto). Då går det inte längre att hämta alla träffar.

## Matplanen: varor som blir kvar när ingredienserna byts

När en egen rätt får nya ingredienser (`spara_egen_ratt` i `20261124120001_spara_ratt_och_recept.sql`) tas de gamla ingrediensraderna bort, men varor som ingen rätt använder längre ligger kvar i `varor`. De syns inte i inköpslistan, eftersom den bara tar med varor med mängd. De följer dock med om samma namn används igen, med sina gamla värden för kcal och protein. `ta_bort_egen_ratt` städar redan bort sådana varor (de som saknar egen mängd, `extra_g <= 0`). Gör samma sak i `spara_egen_ratt`: spara rättens gamla `vara_id` före borttagningen och ta bort de som inte används längre efter loopen. Lägg till ett test där Ris byts mot Bulgur och Ris försvinner.

## Matplanen: "Ris" och "ris" i samma tur

`spara_egen_ratt` matchar varor i turen utan hänsyn till stora och små bokstäver, men den unika nyckeln på `varor (tur_id, namn)` skiljer på dem. Läggs "Ris" och "ris" in direkt, eller av två samtidiga anrop, finns båda, och funktionen väljer då den med lägst id. Inget läcker mellan turer. Rätta med en ny migrering: slå först ihop dubbletterna i varje tur (flytta ingredienserna till en av varorna och lägg ihop `extra_g`), och lägg sedan till ett unikt index på `public.varor (tur_id, lower(namn))`.

## Matplanen: fett, kolhydrater och mer från livsmedlen

Tabellen `livsmedel` (Livsmedelsverkets livsmedelsdatabas, se `docs/katalog/livsmedel.md`) har fett, kolhydrater (tillgängliga), fiber, sockerarter, salt och vatten per 100 g. Formuläret för egna rätter och recept fyller i dag bara i kcal och protein, eftersom det är de fälten som finns på `varor` och `receptrader`.

Fett och kolhydrater kan läggas till i formuläret senare. Det kräver:
- kolumnerna `fett_per_100g` och `kolhydrater_per_100g` på `varor` och `receptrader`, i en ny migrering
- nya versioner av `spara_egen_ratt` och `spara_recept` som tar emot fälten
- två fält till per ingrediensrad, och fett och kolhydrater i summan per portion

Värdena finns redan i tabellen, så inget behöver hämtas om. Vattnet kan användas för att räkna om mellan torr och tillagad vikt.

## Matplanen: ta bort ansvarig och klart på ratter och varor

Sedan `20261124230000_handlingslista.sql` bygger inköpslistan på `maltider.bars_av` (var och en köper det hen bär) och bockarna ligger per person i `inkop_klart`. `ratter.ansvarig`, `varor.ansvarig`, `ratter.klart` och `varor.klart` används inte längre av appen, utom `varor.ansvarig` för extra mängd på en vara (till exempel kaffe) i `handlingslista` i `src/lib/handlingslista.ts`. Bestäm först vem som köper extra mängd (till exempel en egen kolumn eller en rad i matplanen), och ta sedan bort de fyra kolumnerna i en ny migrering, tillsammans med de främmande nycklarna `ratter_ansvarig_samma_tur` och `varor_ansvarig_samma_tur`. Ta också bort `ansvarig` och `klart` ur `Ratt` och `Vara` i `src/lib/typer.ts` och `inkopslista` i `src/lib/mat.ts`, som bara används för matvikten. Sök efter `ansvarig` och `klart` i `src/` först.

## Matplanen: välja sin egen färg

Färgen per deltagare räknas i dag ut i deltagarnas ordning (`personfarger` i `src/lib/personfarg.ts`, åtta färger i `src/index.css`). Att välja färg själv kräver en kolumn, till exempel `deltagare.farg` med de åtta bokstäverna som tillåtna värden, och att personen själv får ändra den på sin rad. I dag ändrar ingen sin egen rad direkt (se `synka_namn`). Bygg det när någon ber om det.

## Skafferiet: boka och räkna ner egna rätter hemma

En egen rätt hemma (`skafferiratter`) läggs i turen som en egen rätt utan ingredienser, men portionerna hemma räknas inte ner och bokas inte till turen, som påsarna gör (`bokningarFranRader` i `src/lib/skafferi.ts`). Det kräver en koppling från turens rätt till den privata raden, till exempel en kolumn på `ratter` som bara ägaren av raden kan läsa betydelsen av, eller att man räknar ner portionerna själv när turen är planerad. Bygg det när någon ber om det.

## Vandringsvana: mer hjälp för den som är ny

Bakgrund: en vän till grundarna vill börja vandra men vet inget om det, och önskade att appen hjälper henne på vägen. Det gäller troligen många som hittar MinVandring.

Idén är en inställning i profilen, "Hur van är du att vandra?", med tre svar: nybörjare, van och erfaren. Nivån styr hjälpen, inte funktionerna. Alla har samma funktioner och kan byta nivå när som helst.

- Nybörjare: packlistan kan starta från en färdig mall, ord som basvikt och förbrukning förklaras där de syns, fler tips visas (till exempel vad man behöver på en första tur, hur långt man orkar gå per dag och hur mycket mat som behövs) och Kom igång på Hem är tydligare.
- Van: tipsen visas men kortare, och packlistan börjar tom eller från förra turen.
- Erfaren: inga förklaringar, kompaktare vyer och mer detaljer framme, till exempel vikt per person och fördelning av gemensam utrustning.

Nivån gäller personen, inte turen, eftersom en tur kan ha deltagare med olika vana. Varje person ser hjälpen för sin egen nivå.

Ett första steg kan vara att bara fråga om nivån när man skapar konto och spara svaret (en kolumn på `profiler`), så att den finns när innehållet är klart. Innehållet (mallar och tips per nivå) tas helst fram utifrån vad riktiga nybörjare frågar om. Tips följer reglerna i `src/lib/tips.ts`: varje siffra har en källa, och råden är allmänna. Bygg efter betan.

## Databasen: prestanda efter betan (Supabase Performance Advisor)

Performance Advisor (läst 2026-11-26 med `npx supabase db advisors --remote --type performance`) har inga fel, men några varningar som är värda en migrering efter betan. De påverkar inte behörigheterna och märks inte med dagens datamängd.

- **`auth.uid()` räknas om för varje rad (`auth_rls_initplan`, 16 policyer):** skriv om policyerna så att de använder `(select auth.uid())` i stället för `auth.uid()`, som de nyare migreringarna redan gör. Det gäller `profiler` (egen profil), `turer` (skapa tur), `notiser` (alla fyra), `packstatus`, `inkop_klart` (lägger till och tar bort), `anteckningar` (alla fyra) och `lardomar` (alla fyra).
- **Flera tillåtande policyer för SELECT (`multiple_permissive_policies`):** `ingredienser`, `kostbehov`, `maltider`, `packrader`, `packstatus`, `ratter` och `varor` har både en policy för att läsa och en `for all`-policy för att ändra, så båda prövas vid varje läsning. Dela upp `for all` i `insert`, `update` och `delete`, i samma migrering som punkten ovan.
- **Främmande nycklar utan index (31 st):** lägg index på de nycklar som används när en tur eller ett konto tas bort, främst `packrader.tur_id`, `ingredienser.tur_id`, `deltagare.user_id`, `anteckningar.user_id`, `lardomar.tur_id`, `turer.skapad_av`, `notiser.fran_user_id`, och nycklarna på `(…, tur_id)` för `maltider` (`ratt_id`, `bars_av`), `maltid_atare`, `inkop_klart` och `packstatus`. De andra kan vänta.

Kör advisorn igen efter migreringen. Ändringarna i policyerna ska ha tester i `supabase/rls.test.ts`, även om reglerna inte ändras: kör hela sviten och kontrollera att inga tester behöver ändras. Varningarna om `SECURITY DEFINER`-funktioner och tabeller med RLS men utan policyer i Security Advisor är avsiktliga, se avsnittet om databasen i `CLAUDE.md`.

## Receptsidan: Försök igen när recepten inte går att hämta

Matkatalogen och skafferiet visar Försök igen när hämtningen misslyckas (`Laddfel`), men receptsidan och listan med MinVandrings recept visar bara en text om att ladda om sidan. `useReceptkatalog` i `src/hooks/useReceptkatalog.ts` saknar omhämtning. Ge hooken ett `forsokIgen` som i `useMatkatalog` och visa `Laddfel` i `MinvandringsRecept` och på `Receptsida`.

## Notisklockan: gränsen på 30 räknas före dolda vänförfrågningar

Klockan hämtar de 30 senaste notiserna (`ANTAL_I_KLOCKAN` i `src/lib/notiser.ts`) och döljer sedan notiser om vänförfrågningar som inte gäller längre (`synligaNotiser`). Listan kan därför visa färre än 30 fast det finns äldre notiser. Bestäm om filtreringen ska ske i databasen (till exempel en vy eller ett villkor på `vanforfragan_id` i frågan), så att gränsen gäller de synliga notiserna.

## Webbläsarens bekräftelseruta i stället för appens egen dialog

Ta bort vän, Ta bort grupp och Ny länk på Vänner använder webbläsarens `confirm`, liksom resten av appen (till exempel anteckningar, lärdomar, packlistor, att göra, deltagare och inbjudan). Rutan ser olika ut i olika webbläsare och går inte att styla. Den kan bytas mot en egen bekräftelsedialog i appens stil, en komponent som alla ställena använder.
