# Version 1

Målet: gänget kan planera nästa tur i appen i stället för i kalkylarket. Klart när Andreas, Oscar och Pichi har packat inför en riktig tur med appen.

Inte med i version 1: kartor, leddata, GPX, community, AI, butiker, betalning.

## Uppgifter

Varje rubrik blir en issue på GitHub.

### 1. Koppla Supabase och Vercel
- Kör migreringarna med Supabase CLI (`npx supabase db push --remote`).
- Slå på inloggning med mejl (Authentication → Sign In / Providers → Email) och lägg till `https://minvandring.se` och Vercels adress under URL Configuration.
- Koppla repot i Vercel och lägg in `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`.
- Klart när: man kan logga in på den publicerade sidan och skapa en tur.

### 2. Profil och namn
- Ange sitt namn första gången man loggar in.
- Klart när: deltagarlistan visar riktiga namn.

### 3. Turens inställningar
- Ändra namn, destination, startpunkt, datum, dagar och reservdagar.
- Lägga till en hund eller en deltagare som inte har gått med än. Max bärvikt och matandel per deltagare.
- Klart när: allt som finns under Start i kalkylarket går att ange.

### 4. Packlista
- Lägga till, ändra och ta bort saker i kategorier: namn, antal, vikt, bärs av (en person eller Alla), typ, med eller inte.
- Mobilvänlig lista. En rad per sak, bock för att packa.
- Klart när: hela packlistan från kalkylarket går att föra in och redigera i telefonen.

### 5. Bocka av packning
- Var och en bockar av sina egna saker. Ändringar syns direkt hos de andra (Supabase Realtime).
- Klart när: två telefoner ser varandras bockar utan att ladda om.

### 6. Vikt per ryggsäck
- Basvikt, förbrukning, mat, bränsle och vatten per person, med `src/lib/vikt.ts`.
- Varning när någon bär mer än sin max.
- Klart när: siffrorna stämmer med kalkylarket för samma packlista.

### 7. Importera packlista från kalkylarket
- Klistra in eller ladda upp en CSV från fliken Packa i kalkylarket.
- Klart när: Andreas packlista finns i appen utan att skrivas in för hand.

### 8. Matplan och inköpslista
- Varor med kcal, rätter med ingredienser, ett schema dag för dag.
- Matvikt, kcal per person och dag, och en inköpslista som går att bocka av.
- Klart när: matfliken i kalkylarket går att göra i appen.

### 9. Rutt och säkerhet
- Dagsetapper med km och höjdmeter, beräknad tid.
- Kontaktperson hemma, larmtid och en färdplan som går att dela.
- Klart när: säkerhetsplanen kan skickas som länk till någon hemma.

### 10. Fungerar offline på fjället
- Senaste versionen av turen sparas i telefonen. Bockar som görs utan nät skickas när nätet kommer tillbaka.
- Klart när: packlistan går att öppna och bocka i flygplansläge.
