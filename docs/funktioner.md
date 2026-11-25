# Funktioner i MinVandring

Alla funktioner från designskissen (`Claude outputs/design-turoversikt/Funktioner.html`), grupperade så att varje grupp kan byggas som en egen modul.

Status:

- **Finns**: byggt och används i dag.
- **Nästa (P1)**: byggs härnäst, enligt P1 i CLAUDE.md.
- **Senare**: en egen modul längre fram.
- **Idé**: inte bestämt.

Det som inte finns visas i turens översikt och på sidorna i menyn (Packlistor och mallar, Dagbok, Kom ihåg till nästa, Statistik och Vandringskompisar) som det kommer att se ut, med etiketten ”Kommer snart”. Exempelinnehållet ligger i `src/lib/exempeldata.ts` och tas bort när modulen byggs på riktigt.

## Turen

| Funktion | Status |
|---|---|
| Skapa, ändra och se turer | Finns |
| Bjud in med länk och roller | Finns |
| Dagsetapper med övernattning | Nästa (P1) |
| Bokad eller ej bokad stuga | Senare |
| Resan dit och hem, biljetter | Senare |
| Väder från SMHI före avfärd | Senare |
| Svårighetsgrad och typ av boende | Senare |
| Kopiera en tur | Senare |
| Tecknad bildruta per tur | Finns |

## Packning och vikt

| Funktion | Status |
|---|---|
| Mitt förråd med produktkatalog | Finns |
| Förrådet: Grunden, översikt, sök, kategori, sortering, lista och rutnät | Finns |
| Ditt kök i förrådet: kokkärl och bränsle kopplade till brännaren, vikten för hela köket, och hela köket i packlistan i ett steg | Finns |
| Önskelista, utlånat och pensionerat i förrådet | Senare |
| Köpt, skick, turer och pris per natt för en sak | Senare |
| Utrustningskatalog: sök och kategorifilter (`/utrustning`) | Finns |
| Jämför produkter sida vid sida | Senare |
| Packlista per person | Finns (`/tur/:id/packning`): ur förrådet eller som egen sak, bockar per person, Alla har var sin med egen modell |
| Basvikt, förbrukning och startvikt | Finns, startvikt per person med mat från matplanen |
| Vikt per kategori och person | Finns: under Startvikt fälls basvikten per kategori ut för varje person, med en stapel per kategori |
| Gemensam utrustning och vem som bär | Finns: gemensamma rader, Jag tar med den (även läsare), förslag på det gruppen behöver och frågor om dubbletter |
| Viktmål för turen | Senare |
| Buren vikt | Senare |
| Packläge att bocka av | Senare |
| Utskrivbar packlista | Senare |
| Mallar och import från LighterPack | Senare |
| Dela packlistan med länk | Senare |

## Mat

| Funktion | Status |
|---|---|
| Matplan per dag, med flera rätter per måltid | Finns |
| Egna rätter med ingredienser | Finns |
| Matkatalog med frystorkade och lufttorkade påsar | Finns, fylls på med data från Astra |
| Egen sida för matkatalogen med sökning, filter, sortering och panel | Finns (`/matplanering/katalog`) |
| Mina matplaner: nästa tur överst och hur många måltider som saknas i varje tur | Finns (`/matplanering`) |
| Inköpslista med ansvarig | Finns |
| Kcal, protein och matvikt per person och dag | Finns |
| Kostbehov och allergier per deltagare, med samtycke | Finns |
| Varning när en påse inte passar någon i gruppen | Finns |
| Fliken Mat: kompakt turhuvud, en ruta per måltid, Nästa att planera och Vem tar med vad | Finns |
| Förslag med näringsvärden från Livsmedelsverket när man skriver ingredienser i egna rätter och recept | Finns |
| Kostinformation för egna rätter | Senare |
| Skafferi: påsar hemma med antal och bäst före, och favoriter | Finns (`/matplanering/skafferi`), personligt |
| Favoriter och det man har hemma först i Välj rätt, och "Köp 2 (du har 1 hemma)" i inköpslistan | Finns |
| Egna recept på kontot, att lägga in i vilken tur som helst (kopieras till turen) | Finns (`/matplanering/recept`), personligt |
| Spara en egen rätt i en tur som recept | Finns |
| Tips om mat med källor: energi, vatten och bränsle, packning, kcal per 100 g | Finns (`/matplanering/tips`) |
| Gas till köket: patroner som räcker på sommaren och med snösmältning, enligt Primus veckosiffror | Finns, i turens matplan och som förslaget Gas i packlistan |
| Dela recept med andra användare | Senare |
| Proviantering i STF-stugor | Senare |

## Gruppen

| Funktion | Status |
|---|---|
| Deltagare med roller, hund utan konto | Finns |
| Att göra med ansvarig och datum | Senare |
| Omröstning om datum och led | Senare |
| Senaste i gruppen | Senare |
| Delade kostnader | Senare |

## Säkerhet

| Funktion | Status |
|---|---|
| Färdplan till någon hemma | Senare |
| Kontaktperson och hemkomst | Senare |
| Nödinformation, 112 och täckning | Senare |
| Lavinprognos för vinterturer | Idé |

## Karta och leder

| Funktion | Status |
|---|---|
| GPX-import | Senare |
| Karta och höjdprofil | Senare |
| Platser längs rutten: stugor, vatten | Senare |
| Hundinformation | Senare |
| Leddatabas med svenska leder | Idé |

## Efter turen

| Funktion | Status |
|---|---|
| Anteckningar | Nästa (P1) |
| Kom ihåg till nästa vandring | Nästa (P1) |
| Vad användes och vad inte | Senare |
| Dagbok och bilder | Idé |
| Statistik över åren | Idé |

## Appen

| Funktion | Status |
|---|---|
| Mobil först och datorvy | Finns |
| Sidomeny med grupper på dator, bottenmeny med bladen Minnen och Mer i mobil | Finns |
| Fungerar som app på telefonen (PWA) | Finns |
| Ljust och mörkt läge, val under Inställningar | Finns |
| Fiske och jakt i förrådet | Idé |
