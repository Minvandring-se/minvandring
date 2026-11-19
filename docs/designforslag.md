Arbeta i det befintliga repot för MinVandring.se. Genomför förbättringarna nedan i den riktiga React-appen och verifiera resultatet. Målet är att en vandrare lätt kan öppna rätt tur på mobilen, och att den som planerar hemma kan hantera turer, deltagare och utrustning effektivt på dator.

## Utgångspunkt

Läs projektets instruktioner och hitta befintliga routes, komponenter, designvariabler och tester. Följ flödena för Mina turer, en öppnad tur, Mitt förråd inklusive produktkatalogen samt Profil. Underlaget visar tre datorvyer. Mobilvyer, turdetalj, katalog och återkoppling efter åtgärder måste kontrolleras i implementationen. Använd eventuella illustrationer som kompositionsreferens. Koden och faktiska data avgör vad som får visas. Hårdkoda aldrig exempeldata, namn, antal eller datum. Behåll funktioner, behörigheter, länkar, befintliga användaruppgifter och fungerande navigationsvägar. Om ett villkor nedan är oklart, genomför övriga ändringar och ange exakt vad som behöver ett produktbeslut.

Behåll React, Tailwind CSS, lucide-ikoner, befintlig typografi och visuella identitet. Skogsgrönt #1F3D2E, sand/beige, off-white, mörkgrå text och befintlig diskret accent. Skriv MinVandring i ett ord. Sloganen är ”Planera. Packa. Upplev.” där den redan används. Skriv all gränssnittstext på svenska, utan tankstreck som paus. Behåll svensk datum- och viktformatering. Håll arbetet till befintliga funktioner. Lägg inte till exempelvis nya moduler för packning, mat eller lärdomar som del av denna ändring.

## 1. Mina turer

- Visa en synlig ”Ny tur” per layout. Behåll knappen i sidomenyn när den menyn syns. På mobil ska åtgärden finnas synlig på sidan om den annars hamnar i en stängd meny.
- Korta hälsningen till ”Hej Oscar!” med verkligt tilltalsnamn. Utelämna hälsningen om namn saknas. Märket ”Nästa vandring” förklarar redan toppkortet.
- Behåll bild och fakta sida vid sida på dator. På mobil, prova en cirka 144–160 px hög beskuren bild. Visa sedan fullständig titel, datum, plats och ”Öppna turen” nära varandra. Deltagarantalet får en egen rad om det annars tränger undan knappen.
- Behåll en gemensam vänsterkant för titlar och datum i listan. Använd tillgänglig bredd upp till cirka 960 px för innehållet. Gör varje turrad till en enda riktig länk, med tydlig hovring och fokus runt hela raden. Låt långa titlar radbrytas före pilen. På smal skärm kan listan begränsas till två titelrader med ellips där det behövs. Visa alltid hela det sparade namnet i turvyn.
- Kontrollera listans urval. Använd ”Övriga turer” om den framlyfta turen är utesluten. Varje antal i ”Kommande” och ”Tidigare” ska motsvara det som visas vid valet. Beräkna antal från samma urval som listan. Behåll befintliga regler för odaterade turer.
- Visa ”Datum ej bestämt · 3 dagar” när datum saknas men längden är känd. Anpassa längd och singular/plural efter data. Utelämna längden om även den saknas.

## 2. En öppnad tur, deltagare och inbjudan

- Visa hela turnamnet som h1 och befintligt datum och plats direkt under. Lägg till en textlänk ”Mina turer” ovanför rubriken om vägen tillbaka är otydlig.
- Om översikt och deltagare redan hör till samma vy, låt dem dela rad när det finns plats för minst cirka 420 px översikt, ett mellanrum och en deltagarkolumn på 280–320 px. Utgå från tillgänglig innehållsbredd efter sidomenyn. På smalare skärmar används en kolumn i ordningen turnamn, datum och plats, översikt, deltagare.
- Om deltagarna redan har en egen fungerande vy, behåll den och dess ingång. Placera befintlig inbjudningsåtgärd intill ”Deltagare”, med texten ”Bjud in”. Flytta ned knappen på egen rad när det behövs. Respektera vem som får bjuda in. Behåll det faktiska inbjudningsflödet.

## 3. Mitt förråd och befintlig produktkatalog

- Ändra huvudknappen ”Lägg till” till ”Lägg till utrustning”. Högerställ den i sidhuvudet på dator. Ge den en egen rad under rubrik och antal på smal mobil.
- Ersätt ingressen och det fristående summeringskortet med en rad under h1, exempelvis ”1 sak i förrådet” eller ”4 saker i förrådet”. Lämna cirka 24 px före första kategorin. Vid tomt förråd, visa ”Ditt förråd är tomt” och en synlig ”Lägg till utrustning”. Undvik att upprepa samma knapp eller budskap i tomläget.
- Placera kategorins summering nära rubriken, exempelvis ”Tält och vindskydd” följt av ”1 sak · 2,63 kg”, med cirka 12 px lucka. Låt summeringen flytta ned under rubriken på mobil. Behåll produktens egen vikt i produktraden. Återanvänd befintlig logik för vikt och antal.
- Ge varje rad en flexibel yta för namn och eventuell anteckning samt en kompakt yta för vikt och utfällningspil. Sikta på 12 px mellan vikt och pil. Låt långa namn radbrytas. Använd hela radhuvudet som knapp med aria-expanded om raden fälls ut. Låt eventuella redigeringsknappar ligga utanför den knappen.
- Spåra betydelsen av ”Inte granskad än” till datamodell och användning. Gäller det produktuppgifter i katalogen, visa ”Produktuppgifterna har inte granskats” i den utfällda detaljen. Krävs en användaråtgärd, behåll en synlig och konkret uppmaning som beskriver den faktiska åtgärden. Kan betydelsen inte fastställas, behåll nuvarande status och redovisa frågan.
- Behåll befintlig sökning, kategori- och märkesfiltrering där katalogen öppnas. Om filter och träfflista finns i samma vy och har tillräckligt utrymme på dator, pröva en cirka 220 px bred filterkolumn bredvid träffarna. I en smal dialog eller mobilvy behåll en kolumn med sök och åtkomliga filter före träffarna. Bevara söktext och valda filter vid layoutbyte. Vid noll träffar, visa ”Inga produkter matchar din sökning” endast om en sökning gjorts. Skilj noll träffar från tomt förråd.

## 4. Profil

- Behåll cirka 520 px maxbredd och samma vänsterkant som sidrubriken på dator. Lägg kontokortet under formuläret. På mobil, använd tillgänglig bredd med cirka 16 px sidmarginal.
- Behåll synlig etikett ”Ditt namn”. Skriv ”Namnet visas för andra deltagare i dina turer.” som kopplad hjälptext. Byt knappen till ”Spara namn”.
- Visa ”Namnet har sparats.” nära knappen först när sparningen lyckats. Använd en statusyta som skärmläsare kan uppfatta. Visa begripligt fel intill formuläret om sparningen misslyckas, behåll det inskrivna värdet och låt användaren försöka igen med samma knapp. Gamla lyckade besked ska försvinna vid fortsatt redigering eller nytt fel.
- Behåll ”Logga ut” i kontokortet och förklaringen om den här enheten. Ta bort dubbletten längst ned i datorversionens sidomeny bara om användarnamnet där länkar till Profil och utloggning fortfarande är lätt att nå. Kontrollera mobilens väg separat.

## 5. Gemensamma komponenter och tillgänglighet

- Använd mobil layout som grund. Säkerställ minst 44 px höga tryckytor på mobil för knappar, filterval, navigation, utfällningsrader och formulärkontroller. Själva ikonen får vara mindre. Undvik horisontell sidskroll och breda tabeller.
- Sikta på cirka 14 px för datum, vikt, status och hjälptext. Kontrollera textkontrasten mot både kort och sidbakgrund. Förmedla valda och öppna tillstånd med mer än färg. Använd textetiketter eller tillgängliga namn för ikoner som är kontroller.
- Använd riktiga länkar för sidbyte, knappar för åtgärder och synliga labels som är kopplade till formulärfälten. Markera aktuell sida i navigationen. Ge tangentbordsfokus tydlig kontur, som utgångspunkt 2 px med 2 px avstånd. Visa diskret hovring på klickbara rader och kort. Behåll logisk fokusordning när kolumner staplas.
- Utgå från 8 px mellan rubrik och hjälptext, 16 px mellan relaterade kontroller och 24–32 px före ett nytt avsnitt. Återanvänd befintliga komponenter och klasser där det passar. I tomma lägen räcker en begriplig mening och den relevanta befintliga åtgärden.

## 6. Prioritering och klart när

Börja med de fem snabba förbättringarna i ordning: red ut granskningsstatus, ändra till ”Lägg till utrustning”, förenkla förrådets summering, låt långa turnamn radbrytas, ta bort dubblerad ”Ny tur”. Slutför sedan resten av uppdraget.

Kör projektets relevanta kontroller och testa i webbläsare om miljön medger det. Använd exempelvis 390 px och 1280 px för huvudkontrollen, och kontrollera övergången mellan en och två kolumner. Verifiera särskilt:

1. På mobil går det lätt att hitta ”Öppna turen” och ”Ny tur”. Ett långt turnamn går att läsa utan att pilen, datumet eller knappen skjuts utanför vyn.
2. Listans antal stämmer när man växlar mellan kommande och tidigare turer. En odaterad tur visar bara kända uppgifter.
3. Öppna en tur med mus och tangentbord, hitta deltagarna och kontrollera att befintlig inbjudan går att nå för rätt roll. Använd testdata och skicka ingen verklig inbjudan.
4. Kontrollera ett tomt och ett fyllt förråd. Lägg till utrustning via befintligt flöde i en testmiljö, sök och filtrera i katalogen och öppna en utrustningsrad. Kontrollera läsordning, summering, vikt och långa namn.
5. Prova lyckad och misslyckad namnsparning med testdata eller befintlig mockning. Kontrollera återkoppling, bevarat inmatat namn vid fel och att vägen till utloggning finns kvar.
6. Tabba genom navigation, länkar, formulär och utfällningsrader. Kontrollera synligt fokus, tryckytor och att ingen sida får horisontell sidskroll.

Avsluta med en kort sammanfattning på svenska av vad du ändrade, vilka filer som berördes, vad du verifierade och vad som eventuellt återstår. Ange vilka kontroller som faktiskt kördes.
