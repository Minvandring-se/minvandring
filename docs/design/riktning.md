# Designriktning

Så här ser MinVandring ut från och med den nya riktningen (november 2026). Skissen finns i `Claude outputs/design-turoversikt/`. Huvudreferensen är `Dator-v3.html` (turens översikt på dator) och `Mobil-v2.html` (samma vy i mobil). Reglerna i CLAUDE.md under Design och UX gäller fortfarande och går före det här.

Riktningen blev ljusare och skarpare i slutet av november 2026, utifrån skisserna A "Skogsljus" och B "Mörkgrönt turhuvud" i `Claude outputs/riktning-mat/skisser/`. Matplaneringen är först att följa den.

## Känslan

Skandinavisk, lugn och naturnära, som en välgjord fjällkarta. Allt ska gå att läsa snabbt, i tältet med en hand eller vid datorn hemma.

## Sektioner i stället för likadana kort

- En sida är uppbyggd av sektioner (`Sektion` i `src/components/ui/`) med en rubrik, eventuellt en länk eller knapp till höger och innehållet under.
- En sektion är en vit yta med tunn kant på den nästan vita bakgrunden. Hierarkin kommer från storlek, placering och rubrik, inte från skuggor.
- Sektionerna får olika bredd på dator (en, två eller tre kolumner i rutnätet) beroende på hur mycket de innehåller. I mobil ligger allt i en kolumn.
- Inga tunga skuggor. Kanten är tunn (`border-border`).

## En huvudknapp per vy

- Varje vy har en enda fylld knapp (`bg-primary`) för det viktigaste man gör där, till exempel Öppna turen eller Lägg till utrustning.
- Står den på den mörkgröna ytan är den ljus (`knappStil({ variant: 'ljus' })`). Knappar med kant på den ytan är `kant-stark`.
- Övriga åtgärder är knappar med kant (`outline`) eller textlänkar.

## Siffror i rader med tunna avgränsare

- Nyckeltal (datum, antal dagar, vikt) visas i en rad med etikett över värdet och en tunn linje emellan (`Nyckeltal`).
- Inga stora siffror med liten etikett och färgtoning som dekoration. Siffran ska svara på en fråga man har.
- Inga mittpunkter mellan uppgifter (`4 dagar · 3 deltagare`). Varje uppgift får en egen plats, med en tunn linje emellan (`border-l border-border`, eller `border-yta-stark-linje` på den mörkgröna ytan).
- Listor med turer eller saker är tunna rader i en ruta med kant, med en linje mellan raderna, inte ett kort per rad.

## Former

- Allt är rundat, och radierna ligger som variabler i `src/index.css`. Använd dem, aldrig egna värden.
- `rounded-knapp` (12 px): knappar och fält.
- `rounded-ruta` (16 px): mindre rutor i en yta, till exempel en måltid, och rutor med en lista av rader.
- `rounded-yta` (20 px): sektioner, paneler, kort och den mörkgröna ytan.
- `rounded-full`: brickor, avatarer och förloppslister.
- `rounded-md` och `rounded-lg` är samma som `knapp` och `yta`, så att äldre klasser följer med. Använd de nya namnen i ny kod.

## Två accentfärger: rost och hjortron

- Grönt (`primary`) bär appen. Resten är neutralt.
- Rost (`accent`), som ledkrysset på en fjälled, är för det man ska lägga märke till: det som saknas, nedräkningen, aktiv flik.
- Hjortron (`hjortron`) är för möjligheter och det positiva: tips, vinster och att lägga till något. Den får också användas för sidans viktigaste siffra och för små markeringar: ikonen i huvudknappen (`hjortron-ikon`), det aktiva antalet i en flik och den korta linjen under en rubrik. Den används sparsamt, aldrig som text eller signal på ljusa ytor.
- I praktiken är hjortron oftast bara två saker på en sida: siffran på den mörkgröna ytan (till exempel "12 måltider saknas" eller en förloppslist) och plustecknet i huvudknappen.
- Hjortron är aldrig text på ljusa ytor. Den används som fyllning (en prick, `bg-hjortron-soft`) eller som text på den mörkgröna ytan (`yta-stark`). Text på `hjortron-soft` är `hjortron-strong` eller `foreground`, och `hjortron-strong` går också som text på ytorna.
- Använd aldrig fler signalfärger. Fel visas med `destructive`.

## Typsnitt

- Rubriker i Fraunces (`font-heading`), vikt 600, med teckenavstånd −0.02em på stora rubriker och −0.01em på mellanrubriker.
- Text, knappar, formulär och etiketter i Inter (`font-sans`).
- Montserrat bara i logotypen (`font-logo`).
- Alla tre laddas lokalt från `@fontsource-variable` i `src/main.tsx`.
- Siffror som ska jämföras (vikter i listor och summor) har tabellsiffror (`tabular-nums`).

## Vita ytor på nästan vit bakgrund

- Bakgrunden är nästan vit (`background`, #f7f8f5). Ytorna är vita (`card`) med en tunn kant (`border-border`). Kanten skiljer ytan från bakgrunden, inte en skugga.
- I mörkt läge är bakgrunden nästan svart och ytorna mörkgröna, med samma kanter och former.

## Mörkgrön yta för det viktigaste

- Den mörkgröna ytan (`bg-yta-stark`, eller `Sektion` med `variant="stark"`) används för det viktigaste på sidan, högst en eller två saker per sida, till exempel nästa tur eller turens huvud på fliken Mat. Den drar blicken, så den ska användas sparsamt.
- Text på ytan är `yta-stark-foreground` och `yta-stark-muted`. Linjer och spår är `yta-stark-linje`. Siffran som betyder mest står i hjortron.

## Ljust och mörkt läge

- Ljust läge är Fjällskog och mörkt läge är Polarnatt. Färgerna ligger som variabler i `src/index.css`.
- Allt ska fungera i båda lägena. Använd bara färgvariablerna, aldrig hårdkodade färger.
- Man väljer Ljust, Mörkt eller Som enheten under Utseende på Profil. Valet sparas på enheten. Status för läget och valet står i `docs/funktioner.md`.

## Planerade delar

- Det som inte är byggt får visas som det kommer att se ut, med etiketten ”Kommer snart” (`KommerSnart`), så att vi själva ser vad som är på riktigt.
- Exempelinnehållet ligger samlat i `src/lib/exempeldata.ts`, aldrig i databasen, och tas bort när modulen byggs på riktigt.
- Funktionerna och deras status finns i `docs/funktioner.md`.

## Text

- Meningsstart med versal, inga versaler i etiketter och inga tankstreck som paus.
- Knappar säger vad som händer: ”Bjud in”, ”Spara namn”.

## Mönster: en variant var

Från designinventeringen i november 2026 (`Claude outputs/design-inventering/inventering.md`). Utseendet på komponenterna bestäms i resten av det här dokumentet. Här står vilken komponent som används var.

### Sidhuvud

- Varje sida med en lista eller en vy har `SidRubrik`, med sidans knappar i `knappar`. Det gäller också Mitt förråd.
- Turen har sitt eget huvud (`TurHuvud`), eftersom den visar en sak och inte en lista.

### Avsnitt

- En del av en sida är en `Sektion` med en h2. Rubrikens storlek ändras inte per sida.
- Det korta strecket under en rubrik finns bara på startsidan och är hjortron.

### Flikar

- **Byta del av en sida:** `Flikrad`. Det gäller turens delar, Matplaneringens delar och förrådets delar. Flikarna är text på en tunn linje, och den aktiva har en rostfärgad linje under sig, i mobil och på dator. I mobil går raden att svepa och skrollas fram till den aktiva. En del som inte finns än står med ”Snart” och går inte att öppna.
- **Filtrera en lista:** runda knappar med `role="tab"`, som Kommande och Tidigare i Mina turer och Påsar, Egna rätter och Recept i Välj rätt.
- **Välja ett värde:** en segmentväljare, som Utseende och året i Statistik.
- **Antal i en flik:** `FlikAntal`, en liten prick i hjortron. Aldrig ”(2)”.
- **Sidomenyn:** en sidas delar står som flikar på sidan och inte i sidomenyn, så att de inte syns två gånger på dator.

### Knappar

- **Fylld knapp:** en per vy, för det viktigaste man gör där. Lägger den till något har den ett plus i hjortron (`text-hjortron-ikon`).
- **Knapp med kant (`outline`):** övriga åtgärder.
- **Textknapp med plus (`ghost` i primärfärg):** för att lägga till något inne i en lista, som ”+ Lägg till” i dagkorten och kategorierna under Fyll på fler kategorier.
- **Röd text:** bara för att ta bort något som inte går att få tillbaka.

### Brickor

- `Bricka`, alltid rund: grå (`gra`) för fakta (storlek, typ, kost, roll), rost (`rost`) för det man ska lägga märke till (avfärd, det som saknas), hjortron (`hjortron`) för det positiva (det man har, mest energi).
- Den stora storleken (`stor`) finns bara i turens huvud och på turkortet.
- ”Kommer snart” (`KommerSnartEtikett`) och ”Snart” (`Snart`) är egna, med streckad kant. ”Snart” används där det är trångt: menyer och flikar.
- Granskningsmärket (`Granskad`) är eget, eftersom det går att trycka på.

### Tomt läge, laddning och fel

- **Tomt läge:**
  - `TomtLage` kompakt för en del av en sida och stor för en hel sida utan innehåll.
  - Förrådets streckade rutor med plus är för de tunga sakerna som saknas.
- **Laddning:** `Laddar` med `Skelett` i samma form som innehållet. Texten för skärmläsare börjar med ”Hämtar”. En rad text räcker bara för något som tar ett ögonblick.
- **Fel när något inte gick att hämta:** `Laddfel` med texten ”Det gick inte att hämta … Kontrollera uppkopplingen och försök igen.” och knappen ”Försök igen”. Knappen saknas bara där man kan stänga och öppna igen, som i en panel.

### Formulär och paneler

- `Panel` för allt som öppnas från en lista, för att läsa eller fylla i, till exempel en produkt, en påse, Lägg till utrustning och en egen rätt. Knapparna står fast i panelens fot.
- `Dialog` mitt på skärmen bara för korta val och frågor.
- Formulär i sidan där man ändrar något som redan syns: en sak i förrådet, turens uppgifter, sitt namn.
- Rubriken i en panel har samma färg som övriga rubriker.

### Ord

- **”Tur” i appen.** ”Vandring” bara i marknadsföringen (startsidan) och om själva vandrandet (”Allt du äger för vandring”).
- **”Inget datum”** när en tur saknar datum. ”Inte angett” bara i formuläret med turens uppgifter.
- **”Vandringsdagar”** i raderna med datum, eftersom det är samma tal som i turens huvud.
- **”Ta bort”** överallt, utom ”Radera turen”, där allt försvinner för alla.
- **”Ny …” skapar något** (Ny tur, Nytt recept, Ny egen rätt, Ny egen sak). **”Lägg till …” väljer något som finns** (Lägg till utrustning, Lägg till i måltiden).
- **”Hämtar …”** när något laddas.
- **Fel när något inte gick att göra** säger vad och samma råd: ”Det gick inte att spara. Kontrollera uppkopplingen och försök igen.”
- **”Skafferi” och ”förråd” med ”ditt”** i felmeddelanden och laddtexter, som ”dina turer” och ”dina recept”.
- **”Kom ihåg till nästa tur”** i menyn och på sidan.
