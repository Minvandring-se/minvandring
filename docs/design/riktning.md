# Designriktning

Så här ser MinVandring ut från och med den nya riktningen (november 2026). Skissen finns i `Claude outputs/design-turoversikt/`. Huvudreferensen är `Dator-v3.html` (turens översikt på dator) och `Mobil-v2.html` (samma vy i mobil). Reglerna i CLAUDE.md under Design och UX gäller fortfarande och går före det här.

## Känslan

Skandinavisk, lugn och naturnära, som en välgjord fjällkarta. Allt ska gå att läsa snabbt, i tältet med en hand eller vid datorn hemma.

## Sektioner i stället för likadana kort

- En sida är uppbyggd av sektioner (`Sektion` i `src/components/ui/`) med en rubrik, eventuellt en länk eller knapp till höger och innehållet under.
- En sektion är en vit yta på den färgade bakgrunden. Hierarkin kommer från storlek, placering och rubrik, inte från skuggor.
- Sektionerna får olika bredd på dator (en, två eller tre kolumner i rutnätet) beroende på hur mycket de innehåller. I mobil ligger allt i en kolumn.
- Inga tunga skuggor. Kanten är tunn (`border-border`).

## En huvudknapp per vy

- Varje vy har en enda fylld knapp (`bg-primary`) för det viktigaste man gör där, till exempel Öppna turen eller Lägg till utrustning.
- Övriga åtgärder är knappar med kant (`outline`) eller textlänkar.

## Siffror i rader med tunna avgränsare

- Nyckeltal (datum, antal dagar, vikt) visas i en rad med etikett över värdet och en tunn linje emellan (`Nyckeltal`).
- Inga stora siffror med liten etikett och färgtoning som dekoration. Siffran ska svara på en fråga man har.
- Inga mittpunkter mellan uppgifter (`4 dagar · 3 deltagare`). Varje uppgift får en egen plats.

## En enda accentfärg

- Accenten är rost (`accent`), som ledkrysset på en fjälled. Den används för det man ska lägga märke till: nedräkningen, aktiv flik, det som saknas.
- Grönt (`primary`) bär appen. Resten är neutralt.
- Använd aldrig fler signalfärger. Fel visas med `destructive`.

## Vita ytor på färgad bakgrund

- Bakgrunden är svagt grön (`background`). Ytorna är vita (`card`). Då syns sektionerna utan skuggor.
- I mörkt läge är bakgrunden nästan svart och ytorna mörkgröna.

## Mörkgrön yta för en eller två saker per sida

- Den mörka primärfärgen används som yta för högst en eller två saker per sida, till exempel färdplanen. Den drar blicken, så den ska användas sparsamt.

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
