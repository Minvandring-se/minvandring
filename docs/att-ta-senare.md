# Att ta senare

## JS-filen är över 500 kB

`npm run build` varnar för att `assets/index-*.js` är större än 500 kB (cirka 545 kB, 159 kB gzip). Det gäller när nycklarna i `.env.local` finns med, för då kommer Supabase-klienten med i bygget. Utan nycklar är filen cirka 326 kB.

Inget är trasigt. Startsidan blir bara lite långsammare att ladda i mobilen.

Möjliga åtgärder när vi tar det:
- Ladda sidorna bakom inloggning (Mina turer, Tur, Profil) med `React.lazy`, så att startsidan inte behöver dem.
- Se om Supabase-klienten kan laddas först när den behövs.

## Min utrustning

Idé från Hikt (deras "Gear Closet"). Varje person har en egen lista över sin utrustning med namn, kategori, vikt och typ. Man lägger in sina prylar en gång och väljer sedan vad som ska med på varje tur.

Varför: man slipper skriva in tält, sovsäck och kök med vikt för varje ny tur. Kalkylarket klarar inte det bra, så det är en tydlig anledning att byta till appen.

Tankar om hur:
- Egen tabell per person. Bara man själv ser och ändrar sin utrustning (RLS på `user_id`).
- När en pryl läggs i en turs packlista kopieras den in i `packrader`, den länkas inte. Gamla turer ändras då inte om man byter tält, och gruppen ser inte hela ens förråd.
- I packlistan ska man fortfarande kunna skriva in saker direkt, och spara dem till Min utrustning med ett klick.
- Importen från kalkylarket (punkt 7 i version 1) kan läggas i Min utrustning i stället för i en enskild tur.

Bygg packlistan (punkt 4) så att det här går att lägga till senare utan ombyggnad.

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

## Mejlmallar i Supabase

Under Authentication → Emails → Templates är bara Confirm sign up och Reset password översatta till svenska. Magic link, Change email address, Invite user och Reauthentication är kvar på engelska. Appen använder inte dem i dag, men de behöver översättas när en funktion som använder dem byggs, till exempel byte av mejladress.

Mallarna finns bara i Supabase-dashboarden, inte i repot. Ändras de ska båda grundarna veta om det.
