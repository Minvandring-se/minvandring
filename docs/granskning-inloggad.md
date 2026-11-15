# Granskning av den inloggade delen

Gäller grunden från PR #33 (nu i `main`, `5d0541e`): ramen med sidomeny och bottennavigation, Mina turer, turens översikt med deltagare och inbjudan, Ditt förråd och Profil. Startsidan ingår inte. Ingen kod är ändrad och inga migreringar är körda.

## Så har jag granskat

**Kontrollerat själv**
- Läst koden för alla inloggade sidor och RLS-policyerna i `supabase/migrations`.
- Provat i webbläsaren på localhost, inloggad som ägare, i 1440 px och i ramar på 390 och 320 px: sidbyte, rullningsläge, sidtitlar, saknad tur och ogiltigt id.
- Simulerat nätfel genom att låta anropen till Supabase misslyckas.
- Kört ett fall mot databasen i minnet (PGlite) med våra migreringar: skaparen som lämnar sin tur.
- Räknat kontraster för färgparen som används.

**Inte kontrollerat**
- Redigerares och läsares vy i webbläsaren. Det kräver ett andra konto. Behörigheterna är granskade genom att jämföra koden med policyerna.
- Logga ut, gå med via länk och hela resan för en ny vän. Det kräver att jag loggar ut eller skapar konton.
- Riktig telefon, skärmläsare och långsam uppkoppling. Det som står om dem är bedömningar.

Vid varje punkt står **Kontrollerat** (jag har sett det hända), **Läst i koden** (följer av koden men är inte provat) eller **Bedömning**.

Känt sedan tidigare: inbjudningslänken visas inte förrän migreringen från PR #31 är körd. Det enda andra som beror på den står i punkt 1.

---

## Måste fixas innan riktiga användare bjuds in

### 1. Det går inte att bjuda in någon förrän migreringarna är körda
- **Vad:** Utan migreringen `20261115120000_inbjudningar.sql` visar turen "Det gick inte att hämta länken". Ingen ägare kan alltså bjuda in någon från appen. Knappen "Skapa ny länk" visas ändå för ägaren och ger då bara ett fel.
- **Var:** `src/components/tur/Inbjudan.tsx:24` (hämtningen) och `:65` (knappen visas även när länken inte gick att hämta). Åtgärden står i `docs/andreas.md`, punkt 2 och 5.
- **Varför:** Att bjuda in gänget är det appen finns till för. `docs/andreas.md` punkt 1 säger dessutom att det inte går att skapa konto i produktion på grund av fel `VITE_SUPABASE_URL` i Vercel. Jag vet inte om det är rättat. Stämmer det fortfarande kan ingen ny användare komma in alls.
- **Jobb:** Litet (köra `db push`, rätta variabeln). Att dölja "Skapa ny länk" när länken saknas är också litet.
- **Kontrollerat** för länken. Vercel-variabeln har jag inte kunnat se.

### 2. Prova hela inbjudningsresan med ett andra konto
- **Vad:** En vän får länken, har inget konto, skapar ett, bekräftar mejlet och ska hamna i turen. Koden skickar med turen hela vägen (`src/pages/GaMed.tsx:22`, `src/pages/SkapaKonto.tsx:44` med `emailRedirectTo`), men länken i bekräftelsemejlet fungerar bara om Supabase tillåter adressen `https://www.minvandring.se/ga-med/...` under Redirect URLs.
- **Varför:** Det här är den första upplevelsen för alla utom den som skapar turen. Om mejllänken leder till startsidan i stället för turen ser det ut som att inbjudan inte fungerade.
- **Jobb:** Litet att prova. Okänt att rätta, beror på vad som händer.
- **Läst i koden.** Inte provat.

### 3. Turens sida säger "Turen finns inte" när nätet är nere
- **Vad:** Om anropet misslyckas visas "Turen finns inte, eller så är du inte med i den." efter ungefär 7 sekunder. Om bara deltagarna inte går att hämta ser man turen utan roll och utan en enda knapp, som en läsare, utan förklaring.
- **Var:** `src/pages/Tur.tsx:54` och `:60`. Felet från Supabase kastas bort och `data` blir `null`.
- **Varför:** På ett tåg eller på fjället tror man att turen är borttagen eller att man blivit utkastad. Mina turer gör rätt i samma läge ("Det gick inte att hämta dina turer").
- **Jobb:** Litet. Skilj på fel och saknad tur, visa "Det gick inte att hämta turen" och en knapp för att försöka igen.
- **Kontrollerat** för turen. Fallet med bara deltagarna är läst i koden.

### 4. Sidan rullas inte upp när man byter sida
- **Vad:** Öppnar man en tur långt ner i listan hamnar man mitt på turens sida. I mitt prov i 390 px låg rubriken 306 px ovanför skärmen.
- **Var:** `src/App.tsx` och `src/components/app/AppSkal.tsx`. Det finns ingen hantering av rullningsläget vid navigering.
- **Varför:** Det ser trasigt ut i mobilen, där listor blir långa. Det blir värre när packlistan kommer.
- **Jobb:** Litet. Rulla till toppen när sökvägen ändras, men behåll läget när man går bakåt.
- **Kontrollerat.**

### 5. Den som skapade turen ser den även efter att ha lämnat eller tagits bort
- **Vad:** Policyn för att läsa `turer` släpper igenom skaparen även när hen inte längre är deltagare. Turen ligger kvar i Mina turer med 0 deltagare, och namn, destination, datum och senare ändringar går att läsa. Packning, mat, deltagare och inbjudningskod syns inte.
- **Var:** `supabase/migrations/20261108000000_grund.sql:191` (`ar_medlem(id) or skapad_av = auth.uid()`). Villkoret finns för att den som skapar en tur ska få tillbaka raden direkt.
- **Varför:** CLAUDE.md kräver att en borttagen deltagare förlorar åtkomst. Fallet är ovanligt (ägaren lämnar över och går ur, eller tas bort av en annan ägare), men det är ett löfte om behörighet som inte hålls. I gränssnittet ser det ut som att "Lämna turen" inte fungerade.
- **Jobb:** Litet till mellan. Kräver en ny migrering (visa SQL först) och ett test i `supabase/rls.test.ts`. Det enklaste är att skapa turen genom en funktion som returnerar id, så att undantaget för skaparen kan tas bort.
- **Kontrollerat** i databasen i minnet: skaparen ser 1 tur och 0 deltagare efter att ha lämnat.

---

## Bör fixas snart

### 6. Vit sida om något går fel i en komponent
- **Vad:** Det finns ingen felgräns (error boundary). Ett fel vid rendering, eller en JS-fil som inte går att hämta efter en ny publicering, ger en helt tom sida.
- **Var:** `src/App.tsx`, runt `Routes`, och `src/components/app/AppSkal.tsx:120` runt `Outlet`.
- **Varför:** Sidorna laddas som egna filer (`lazy`) och appen är en PWA. En gammal flik efter en ny version är ett verkligt fall.
- **Jobb:** Litet. En felgräns med "Något gick fel. Ladda om sidan." och kontaktadressen.
- **Läst i koden.**

### 7. Fel som sväljs tyst
- **Radera turen:** vid fel händer ingenting. `src/pages/Tur.tsx:84`.
- **Kopiera länk:** `navigator.clipboard.writeText` kan kasta, till exempel utan behörighet. Då visas varken "Kopierad" eller ett fel. `src/components/tur/Inbjudan.tsx:30`.
- **Profil:** går namnet inte att hämta visas "Inget namn än" och ett tomt fält, som om man saknade namn. `src/pages/Profil.tsx:20-31`. Samma i ramen, `src/components/app/AppSkal.tsx:31-39`.
- **Tomt antal dagar:** raderar man siffran i Vandringsdagar skickas 0, databasen nekar och man får "Det gick inte att spara. Försök igen." utan att förstå varför. `src/components/tur/TurUppgifter.tsx:129`.
- **Varför:** Användaren vet inte om det är nätet, behörigheten eller ett eget fel.
- **Jobb:** Litet för var och en.
- **Kontrollerat** för Profil. Övriga lästa i koden.

### 8. Samma sidtitel överallt och inget som berättar om sidbyte
- **Vad:** Alla sidor heter "MinVandring · Planera. Packa. Upplev." i fliken och i historiken. Fokus ligger kvar på `body` efter ett sidbyte.
- **Varför:** Skärmläsare får inget besked om att sidan bytts. Alla får en historik där varje rad ser likadan ut.
- **Jobb:** Litet. Sätt titeln per sida ("Mina turer · MinVandring", turens namn) och flytta fokus till rubriken.
- **Kontrollerat.**

### 9. Tillgänglighet i deltagarlistan
- **Namnfältet saknar etikett.** Det har bara en platshållare. `src/components/tur/Deltagarlista.tsx:143`.
- **Vad rollerna betyder står bara i `title`.** Det syns inte på en telefon och nås inte med tangentbord. `:97` och `:109`. En vandrare som ska välja mellan Ägare, Redigerare och Läsare får ingen hjälp i mobilen.
- **Felmeddelandet annonseras inte** (`role="alert"` saknas). `:130`.
- **Jobb:** Litet.
- **Kontrollerat** för etiketten och `title`.

### 10. "Fler turer" visas även när det inte finns fler
- **Vad:** Med en enda tur, det vanligaste läget för en ny användare, visas rubriken "Fler turer", flikarna "Kommande (0)" och "Tidigare (0)" och texten "Inga fler kommande turer." Om alla turer är avslutade saknas det stora kortet, fliken Kommande är förvald och tom, och turerna ligger bakom fliken Tidigare.
- **Var:** `src/pages/MinaTurer.tsx:21` och `:90-133`.
- **Jobb:** Litet. Dölj avsnittet när båda listorna är tomma, välj fliken som har innehåll och visa en uppmaning att planera nästa tur när allt är avslutat.
- **Läst i koden.**

### 11. "3 dagar" visas för en tur som ingen har fyllt i
- **Vad:** En ny tur får 3 dagar och 1 reservdag som standard i databasen. Turens sida visar "Inga datum än · 3 dagar". Listan visar bara "Inga datum än".
- **Var:** `src/pages/Tur.tsx:104`, jämför `src/components/app/TurKort.tsx:21`.
- **Varför:** Det ser ut som något gruppen har bestämt. Vi ska inte visa uppgifter som ingen har angett.
- **Jobb:** Litet.
- **Kontrollerat** i webbläsaren.

### 12. En person utan konto blir en dubblett när hen går med
- **Vad:** Lägger man till "Pichi" som person utan konto och Pichi sedan går med via länken skapas en ny deltagare. Platshållaren ligger kvar och måste tas bort för hand, och det som senare knyts till platshållaren (bärs av, matandel) följer inte med.
- **Var:** `ga_med` lägger alltid till en ny rad, och `skydda_deltagare` förbjuder att `user_id` ändras (`supabase/migrations/20261109000000_roller.sql:53`).
- **Varför:** Att lägga in gänget först och bjuda in sedan är ett naturligt sätt att börja. Det blir ett verkligt problem när packlistan pekar på deltagare.
- **Jobb:** Mellan. Kräver en migrering, till exempel att den som går med får välja "Det här är jag" bland platshållarna. Bör bestämmas innan packlistan byggs.
- **Läst i koden.**

### 13. Förrådet tar en tredjedel av menyn men finns inte
- **Vad:** Ditt förråd ligger i sidomenyn och bottennavigationen och leder till en sida som säger "Inte byggt än".
- **Var:** `src/components/app/AppSkal.tsx:13-17`, `src/pages/Forrad.tsx`.
- **Varför:** CLAUDE.md säger att appen inte ska lova funktioner som inte finns, med undantag för korten på startsidan. För de första användarna är en av tre menyval en återvändsgränd.
- **Jobb:** Litet. Ett beslut: ta bort den ur menyn tills förrådet finns, eller utöka undantaget i CLAUDE.md.
- **Bedömning.**

### 14. Rolländringar utan bekräftelse
- **Vad:** Ägaren kan göra någon annan till ägare, eller göra sig själv till läsare, med ett enda val i listan. En ny ägare kan radera turen och ta bort den första ägaren.
- **Var:** `src/components/tur/Deltagarlista.tsx:100`.
- **Jobb:** Litet. Fråga innan någon blir ägare och innan man sänker sin egen roll.
- **Läst i koden.**

### 15. Bakåtknappen öppnar "Ny tur" igen
- **Vad:** Formuläret styrs av `?ny=1`. Efter att turen skapats leder bakåt till Mina turer med formuläret öppet. Trycker man på "Ny tur" i sidomenyn när formuläret redan är öppet händer ingenting, och fokus flyttas inte dit.
- **Var:** `src/pages/MinaTurer.tsx:35` och `:149`.
- **Jobb:** Litet.
- **Läst i koden.**

### 16. Smått om tillgänglighet
- **Flikarna** har `role="tab"` men inte tangentbordsmönstret som hör till (piltangenter). Enklast är vanliga knappar med `aria-pressed`. `src/pages/MinaTurer.tsx:94-118`.
- **Röd feltext på sandfärgad yta** har kontrast 4,44:1, strax under 4,5:1 för liten text. Det gäller "Det gick inte att hämta länken" i inbjudningsrutan. På kort och bakgrund klarar den sig (5,35 och 4,91).
- **Kantlinjerna** runt fält och kort har kontrast 1,3–1,4:1 mot ytan. Fälten känns igen på form och etikett, men för fält rekommenderas 3:1.
- **Ingen länk "Hoppa till innehållet"** före sidomenyn.
- Övrigt jag räknade klarar AA: dämpad text 4,86–5,84:1, grön text på ljusgrön yta 9,65:1. Tryckytorna jag gick igenom är minst 44 px.
- **Jobb:** Litet.
- **Kontrollerat** (uträkningarna), resten läst i koden.

### 17. Ingenting uppdateras av sig självt
- **Vad:** Tas man bort ur en tur medan sidan är öppen ser man den gamla sidan tills man laddar om, och knapparna ger "Det gick inte att …". Går en vän med syns hen först efter omladdning.
- **Jobb:** Mellan. Realtime behövs ändå för punkt 5 i version 1 (bocka av packning), så det kan tas då.
- **Bedömning**, utifrån koden.

---

## Behörigheter

Jag har jämfört gränssnittet med policyerna i `20261109000000_roller.sql` och `20261115120000_inbjudningar.sql`. Läst i koden, inte provat med flera konton.

| | Ägare | Redigerare | Läsare | Stämmer med databasen |
|---|---|---|---|---|
| Ändra turens uppgifter | Ja | Ja | Nej, knappen visas inte | Ja |
| Lägga till hund eller person utan konto | Ja | Ja | Nej | Ja |
| Ta bort hund eller person utan konto | Ja | Ja | Nej | Ja |
| Ta bort en deltagare med konto | Ja | Nej | Nej | Ja |
| Lämna turen | Ja, om det finns en annan ägare | Ja | Ja | Ja |
| Ändra roller | Ja | Nej, ser rollen som text | Nej | Ja |
| Se och kopiera inbjudningslänken | Ja | Ja | Nej | Ja |
| Skapa ny länk | Ja | Nej | Nej | Ja |
| Radera turen | Ja | Nej | Nej | Ja |

Jag hittade ingen knapp som visas och sedan nekas av databasen, förutom "Skapa ny länk" när länken inte gick att hämta (punkt 1).

Tre saker att känna till:
- **Databasen tillåter mer än gränssnittet.** En redigerare får ändra andra deltagares rader (namn, bärvikt, matandel). Det behövs för punkt 3 i version 1, men ingen knapp använder det än.
- **Ensam ägare kan inte lämna.** Krysset visas inte, och det står inte varför. En rad som "Gör någon annan till ägare för att kunna lämna" skulle räcka.
- **Skaparen som lämnat** ser fortfarande turen. Se punkt 5.

---

## Kodkvalitet

### 18. Lägg turens data på ett ställe innan Packa byggs
- **Vad:** `Tur.tsx` hämtar turen och deltagarna själv och räknar ut rollen. Samma deltagarfråga står två gånger (`src/pages/Tur.tsx:41-45` och `:55-60`). Packa, Mat och Rutt kommer att behöva samma tre saker: turen, deltagarna och min roll.
- **Förslag:** Gör `/tur/:id` till en ram med delrutter (`/tur/:id`, `/tur/:id/packa`, `/tur/:id/mat`, `/tur/:id/rutt`) som hämtar en gång och delar via `Outlet`, på samma sätt som `AppSkal` gör i dag. Samla hämtning, fel och omladdning i en hook.
- **Varför:** Annars kopieras hämtning och rollkontroll till varje ny sida, och felen i punkt 3 kopieras med.
- **Jobb:** Mellan. Lättast att göra nu, före packlistan.

### 19. Sessionen och profilen hämtas på flera ställen
- `useSession` anropas i `src/App.tsx:31`, `src/components/Layout.tsx:11` och `src/components/app/AppSkal.tsx:24`, och varje anrop hämtar sessionen och lyssnar själv. Profilnamnet hämtas i både `AppSkal.tsx:34` och `src/pages/Profil.tsx:23`.
- **Jobb:** Litet. En gemensam källa.

### 20. Typerna skrivs för hand
- Svaren från Supabase görs om med `as Tur` och `as DeltagareRad[]`. När `turer.inbjudningskod` togs bort hittades användningarna genom sökning, inte av kompilatorn.
- **Förslag:** Generera typerna från databasen med Supabase CLI.
- **Jobb:** Mellan. Lönar sig innan tabellerna för packning och mat börjar användas.

### 21. Två ramar som måste hållas i takt
- `arAppsida` i `src/lib/navigering.ts` räknar upp samma sökvägar som rutterna i `src/App.tsx`. En ny inloggad sida måste läggas till på båda ställena, annars får den fel ram.
- Det gamla sidhuvudet i `src/components/Layout.tsx:23-34` har en egen meny (Mina turer, Profil, Logga ut) utan förrådet, och dess Logga ut skickar inte till startsidan som de andra gör.
- **Jobb:** Litet. Låt `Layout` också bli en ram i rutterna.

### 22. Gammalt svar kan skriva över nytt
- Byter man tur med bakåt och framåt nollställs inte `tur`, så den förra turen syns tills den nya har laddats. Ett långsamt svar för den förra kan komma sist och vinna. `src/pages/Tur.tsx:47-61`.
- **Jobb:** Litet. Löses av punkt 18.

### 23. Tester
- Det som finns är bra: `turlista.ts`, `navigering.ts`, `roller.ts`, `vikt.ts` och RLS-testerna.
- **Saknas:** ett RLS-test för punkt 5, och ett för att en deltagare som tagits bort inte längre ser turen.
- **Värt att överväga senare:** ett röktest i webbläsare för inbjudningsresan. Det kräver ett nytt paket, så det är ett eget beslut.

---

## Förbättringar och designförslag

**Helheten:** Den inloggade delen följer stilen väl. Färgerna kommer från variablerna i `src/index.css`, rubrikerna är Montserrat, ytorna är lugna och orange används bara i märket "Nästa vandring". Det som drar ner intrycket är att sidorna beskriver vad som saknas ("Inte ifyllt" fyra gånger, tre "Kommer snart", "Inte byggt än") i stället för att visa nästa steg. Allt nedan är bedömningar.

### Mina turer
- **Visa hur långt det är kvar.** "Om 19 dagar" på det stora kortet säger mer än datumet. När turen pågår: "Dag 2 av 5".
- **Visa vad som återstår** när det finns något att visa, till exempel "Datum saknas" eller senare "12 av 40 saker packade". Det gör kortet till en överblick och inte bara en genväg.
- **Dölj "Fler turer"** när det bara finns en tur. Se punkt 10.
- **"Ny tur" två gånger på dator** (sidomenyn och sidhuvudet). Behåll sidomenyns och låt sidhuvudets knapp bara finnas i mobilen.

### Turens översikt
- **Börja med nästa steg.** En ny tur visar "Inte ifyllt" fyra gånger. Visa i stället ett kort "Kom igång": 1. Sätt datum, 2. Bjud in gänget, 3. Fyll i startpunkt. Bocka av dem och ta bort kortet när de är klara. Det är samma ordning som en grupp faktiskt planerar i.
- **Bilden kan bli fel.** En fjälltur kan få kustbilden. Låt ägaren välja bland bilderna, eller använd en neutral sandfärgad yta med turens namn tills det finns egna bilder. Bilden tar också större delen av första skärmen i mobilen. En lägre bild där (ungefär 2:1) släpper fram datum och grupp.
- **Datum som egen rad överst.** Avresa och hemkomst som två rader i en tabell är svårare att läsa än "12–16 augusti 2027 · 5 dagar". Rubriken visar redan det, så tabellen kan nöja sig med startpunkt och reservdagar.
- **"Kommer snart" tar mycket plats** för något man inte kan använda. En diskret rad ("Packlista, mat och rutt kommer snart") räcker tills den första delen finns.
- **Radera turen** står ensam längst ner. Lägg den under "Ändra uppgifter" eller i en meny, så att den inte är det sista man ser.

### Deltagarlistan och inbjudan
- **Sätt inbjudan först.** I dag kommer formuläret för hund före länken, och "Hund" är förvalt. Det viktigaste i rutan är att få med vännerna. Förslag: överst en tydlig knapp "Bjud in gänget", därefter listan, och sist en mindre länk "Lägg till hund eller någon utan konto".
- **Använd telefonens delningsmeny.** `navigator.share` öppnar Messenger, WhatsApp och sms direkt, vilket är så en grupp faktiskt delar en länk. Behåll "Kopiera länk" som reserv på dator.
- **Förklara rollerna i klartext** under listan eller i valet. Se punkt 9.
- **Visa vem som inte gått med än** tydligare, och lös dubbletterna i punkt 12.
- **Säg vad länken ger.** "Alla med länken kan gå med och ändra i turen" är ärligare än dagens text, och motiverar "Skapa ny länk".

### Profil
- Fungerar och är lugn. Två saker saknas som användare kommer att fråga efter: **byta lösenord** när man är inloggad, och **ta bort sitt konto**. Integritetssidan hänvisar till mejl för det senare, vilket räcker i betan.
- Namnbrickan visar en bokstav för de flesta, eftersom folk anger förnamn. Det är i sin ordning.

### Ditt förråd
- Se punkt 13. Om sidan ska vara kvar: låt den göra något litet men riktigt, till exempel fråga "Vill du bli meddelad när förrådet finns?" via kontaktlänken, i stället för att bara säga att det saknas.

### Packa: förslag för mobilen

Utgår från punkt 4–6 i `docs/version-1.md`, idéerna om Min utrustning och säkerhetskollen i `docs/att-ta-senare.md`, tabellerna `packrader` och `packstatus` och funktionerna i `src/lib/vikt.ts`.

**Var den bor:** En egen sida `/tur/:id/packa`. I turen byts de tre "Kommer snart"-rutorna mot en rad med flikar under turens namn: Översikt, Packa, Mat, Rutt. Bottennavigationen är kvar som den är, så det blir aldrig två rader längst ner.

**Överst, alltid synligt:** Min ryggsäck. En rad med min vikt mot min maxvikt ("11,4 av 20 kg") som en stapel, och hur mycket jag har packat ("18 av 32"). Stapeln blir orange över max. Det är den siffran var och en bryr sig om, och den finns redan i `vikt.ts`.

**Tre lägen i en växel:** Mina saker (förvalt), Gemensamt och Alla. Hemma vid packningen vill man se sitt eget. När gruppen planerar vill man se vem som bär tältet och köket.

**Listan:**
- Kategorier som går att fälla ihop, med antal och vikt i rubriken ("Sova · 3 saker · 2,1 kg").
- En rad per sak: stor bock till vänster (minst 44 px), namnet, och till höger vikten och vem som bär. Ett tryck på raden öppnar ett formulär nerifrån med namn, antal, vikt, bärs av (en person eller Alla), typ och med eller inte.
- Saker som inte ska med visas dämpade längst ner i kategorin i stället för att försvinna. I kalkylarket är "med eller inte" en viktig del av planeringen.
- Inga breda tabeller. Vikten per person visas i en egen vy, inte som kolumner.

**Lägga till:** En knapp "Lägg till sak" som följer med längst ner i listan, ovanför bottennavigationen. Snabbläget är bara namn och kategori, resten fylls i senare. När Min utrustning finns: "Välj ur ditt förråd" i samma formulär, och "Spara i mitt förråd" på en rad man skrivit in. Saken kopieras in i turen, som `docs/att-ta-senare.md` beskriver.

**Gruppens vikt:** Ett kort "Gruppen" med en stapel per person och en varning på den som bär över sin max. Därifrån går det att flytta en sak till någon annan med två tryck. Det är det kalkylarket används till i dag.

**Säkerhetskollen:** Ett lugnt kort överst i läget Alla, inte en röd varning: "Ingen har packat första hjälpen" eller "Två kök men ingen gas". Reglerna som rena funktioner i `src/lib` med tester. Bygg den först när packlistan och vikten finns, och visa aldrig en koll som inte bygger på riktiga rader.

**Behörigheter, som databasen redan säger:** Läsare ser allt och bockar bara sina egna saker. Ägare och redigerare ändrar listan. Visa inte knappar som databasen nekar.

**Att tänka på från början:**
- Bockar ska synas direkt hos de andra (Realtime, punkt 5 i version 1) och tåla dålig täckning (punkt 10). Bygg bockningen så att den uppdaterar skärmen direkt och skickar efteråt.
- `packrader.bars_av` pekar på en deltagare. Dubbletterna i punkt 12 bör därför lösas först.
- En tom packlista ska ha ett tydligt första steg: "Börja med det ni delar: tält, kök och första hjälpen", och senare import från kalkylarket (punkt 7).

---

## Idéer till senare

- **Listan "Dina turer" i sidomenyn**, som i skissen. Blir värdefull när man ofta växlar mellan två turer.
- **Egna bilder per tur.** Kräver lagring och är inte MVP.
- **Nedräkning och påminnelser**, till exempel "En vecka kvar, 6 saker opackade".
- **Kopiera en tidigare tur** som mall för nästa, med packlistan. Hänger ihop med "Kom ihåg till nästa vandring".
- **Byta lösenord och mejladress** under Profil.
- **Meddela gruppen** när datum eller startpunkt ändras.
- **Röktest i webbläsare** för skapa tur, bjuda in och gå med.
- **Max bärvikt och matandel per deltagare** (punkt 3 i version 1). Kolumnerna finns, men inget gränssnitt.

---

## De fem saker jag skulle göra först

1. **Kör migreringarna och kontrollera Vercel-variabeln** (punkt 1), och prova sedan hela inbjudningsresan med ett andra konto, från länk till tur (punkt 2). Utan det går det inte att bjuda in någon.
2. **Rätta felhanteringen på turens sida** (punkt 3) och lägg till en felgräns (punkt 6). Det är de två ställen där appen ser trasig ut när nätet är dåligt.
3. **Rulla till toppen vid sidbyte och sätt sidtitlar** (punkt 4 och 8). Litet jobb som märks på varje sida.
4. **Stäng luckan för skaparen som lämnat** (punkt 5) med en migrering och ett RLS-test.
5. **Gör om turens sida till en ram med delrutter och gemensam hämtning** (punkt 18), och bestäm hur personer utan konto kopplas ihop med den som går med (punkt 12). Båda bör vara klara innan packlistan byggs.
