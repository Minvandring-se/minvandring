# Manual: så fyller vi på katalogen

För oss grundare. Följ stegen i ordning. Bakgrund och regler för Claude Code står i `.claude/skills/katalog/SKILL.md`, loggen i `genomgangar.csv` och täckningen i `README.md`.

## 1. Översikt

```
Butikens sortiment
      ↓  Astra (steg 1)        listar produkter, hämtar uppgifter från tillverkaren
Astras svar
      ↓  Vi läser (steg 2)     checklista, summan ska stämma
Claude Code (steg 3)           lägger in raderna, loggar, skapar seed, mergar och kör den
      ↓
Granskning (steg 4)            katalog-granskaren läser tillverkarens sidor → "Granskad mot tillverkaren"
      ↓
Stickprov (steg 4)             en av oss kontrollerar ett urval → hela genomgången "Stickprovskontrollerad"
```

Två nivåer syns i appen: **Granskad mot tillverkaren** (granskaren har läst tillverkarens sida och bekräftat vikten) och **Stickprovskontrollerad** (en av oss har kontrollerat ett stickprov och godkänt genomgången). Rader med butikens vikt (butiksrader) får ingen nivå.

En genomgång är en butik och en kategori, till exempel Outdoorexperten och liggunderlag. Den får ett id: `ÅÅÅÅ-MM-DD-butik-kategori`, till exempel `2026-11-22-outdoorexperten-ligg`. Kategorierna heter `talt`, `sov`, `ligg`, `ryggsack` och `kok` i id:t.

## 2. Steg 1: Astra

1. Öppna `astra-mall.md`. Kopiera mallen och fyll i butik, butikens adress, kategori, kategorisidan och de platser som skiljer sig per kategori (tabellen överst). Klistra in rätt kolumnblock på platsen `{FORMAT}`.
2. Ta fram listan över det som redan finns i katalogen och klistra in den på platsen `{REDAN_LISTA}`. I Git Bash (eller macOS och Linux), från projektets rot:

   ```
   cut -d';' -f1-3 supabase/katalog/ryggsackar.csv | tail -n +2 | sed 's/;/ | /g' | sort
   ```

   Byt filnamn efter kategori: `talt-och-vindskydd.csv`, `sovsackar.csv`, `liggunderlag.csv`, `ryggsackar.csv` eller `kok.csv`. `kok.csv` skapas vid den första kökgenomgången, så första gången är listan tom: skriv "Inga ännu." Listan ska vara hämtad från senaste main (`git pull` först), annars missar Astra det som nyss lagts in.
3. Skicka prompten. En butik och en kategori per körning.
4. Spara svaret i mappen `Claude outputs/` (den ligger utanför Git): CSV:n som `<butik>-<kategori>.csv` och sammanfattningen som `<butik>-<kategori>-genomgang.md`.

## 3. Steg 2: läs Astras svar

Gå igenom checklistan innan något läggs in. Hittar du fel: be Astra rätta, eller skriv upp dem och ta med dem i steg 3.

- [ ] **Summan stämmer.** Nya + redan fanns + utelämnade = produkter hos butiken. Räkna efter själv.
- [ ] **Inget är utelämnat för att butikens vikt skiljer sig från tillverkarens.** Tillverkarens vikt gäller alltid. Bara när tillverkarens egna sidor ger två olika vikter utelämnas produkten.
- [ ] **Tält och ryggsäckar:** bara en minimivikt och ingen totalvikt betyder utelämnad.
- [ ] **Sovsäckar och liggunderlag:** en vikt utan packpåse (eller pumpsäck) är ok. Den ska ligga i `packvikt_g` med kommentaren "Vikt utan packpåse enligt tillverkaren." Bara minimivikt betyder utelämnad.
- [ ] **Samma vikt för flera storlekar** utan att den knyts till storleken betyder att de storlekarna är utelämnade.
- [ ] **Utelämnat är rätt:** barn-, camping-, rese-, vardags-, cykel-, löpar-, skid- och klätterprodukter, tillbehör och specialprodukter ligger bland de utelämnade, inte bland de nya.
- [ ] **Tillverkarens modellnamn och märkesnamn,** i samma stil som befintliga rader av märket (`Deuter`, `NEMO`, `Sea to Summit`, Marmot med °F, Mammut med -15C). Inga butiksord ("Backpack", "Sleeping Bag", "Daypack") och ingen produkttyp i namnet.
- [ ] **Inga arkiverade sidor** (web.archive.org) som källa, och inga andra butiker eller tester.
- [ ] **Inga spårningsparametrar** i `kalla`, ingen `?color=`. Samma region för alla rader av ett märke.
- [ ] **Ordinarie pris** i `pris_sek_ca`, inte reapris. Tomt om tillverkaren inte anger ett svenskt pris.
- [ ] **"Redan fanns" stämmer mot katalogen.** Stickprova några rader mot CSV-filerna. Kontrollera särskilt att inget som Astra kallar "redan fanns" i själva verket saknas (till exempel något vi tidigare utelämnat).
- [ ] **Butiksrader är rätt gjorda:** kommentaren börjar "Vikt och uppgifter från <butik>. Tillverkaren saknar produktsida." (eller "... saknar vikt på produktsidan."), och bara när tillverkaren saknar vikt.
- [ ] **Inget är påhittat:** tomma fält är tomma, omräkningar (oz, lb, tum, °F) är förklarade i kommentaren.

## 4. Steg 3: Claude Code

Öppna Claude Code i projektmappen och skicka mallen nedan. Fyll i butik, kategori och filnamn. Lovet att merga och köra seeden ligger i mallen. Ta bort det stycket om du vill godkänna varje steg själv.

```
Nästa genomgång med katalog-skillen: {BUTIK}, {KATEGORI}.

Raderna ligger i "Claude outputs/{FIL}.csv" och sammanfattningen i "Claude outputs/{FIL}-genomgang.md" ({N} i källan).
Förutsättning: det som ska vara inlagt först är inlagt (till exempel {FÖREGÅENDE}).

Rättelser och flaggor: {sådant jag såg i steg 2, annars "inga"}.

Gör så här:
1. Kontrollera alla nya rader och alla "redan fanns" mot katalogen som den ser ut nu.
2. Låt katalog-granskaren läsa de rader som faktiskt blir nya, visa rapporten och vänta på mitt ok.
3. Lägg sedan in raderna, logga genomgången (docs/katalog/genomgangar.csv), uppdatera täckningstabellen och skapa seeden.
4. Kör build, test och lint.

Du får merga och köra seeden (npx supabase db push --remote --yes) när build, test och lint är gröna och migreringen bara innehåller katalogen (insert on conflict på produkter, inga alter, create, grant eller drop). Annars: stanna och fråga. Om något kräver ett beslut som inte står här: välj det som följer reglerna i katalog-skillen, skriv ner det och fortsätt. Rapportera siffrorna (i källan, nya, redan fanns, utelämnade) och vad du avgjorde själv.
```

Claude Code gör resten: en egen branch, en PR, merge och seed. Claude Code skriver `ÅÅÅÅ-MM-DD-butik-kategori` i kolumnen `genomgang` för varje ny rad.

## 5. Steg 4: granskning och stickprov

### Granskning (Claude Code)

Skicka: *"Låt katalog-granskaren granska genomgången {id}, en kategori i taget. Rätta det som är klart fel, sätt granskad_datum med `--granskad` för raderna där vikten är bekräftad mot tillverkarens sida, skapa seed, merga och kör den. Rader vars tillverkarsida inte finns längre ska vara kvar som utgångna: kalla blir butikens sida, kommentaren "Utgången. Tillverkarens produktsida finns inte längre.", ingen nivå."*

Granskaren läser tillverkarnas sidor i Chrome och rapporterar avvikelser. Rader med avvikande vikt, två olika vikter, utgångna eller oläsliga får ingen nivå.

### Stickprov (en av oss, aldrig Claude)

1. Dra stickprovet, från projektets rot:

   ```
   npm run katalog -- --stickprov {id}
   ```

   Det ger 5 procent av genomgångens granskade rader, minst 5 och minst en per märke (upp till tio märken), och skriver en checklista i `docs/katalog/stickprov/{id}.md`. Frö skrivs ut, så att samma urval kan dras igen med `--frö N`.
2. Öppna tillverkarens sida för varje rad i checklistan (länken står där) och jämför **vikt**, minvikt, mått och temperaturer. Kryssa "stämmer" eller "fel" och skriv en rad om felet.
3. **Alla vikter stämmer:** godkänn hela genomgången.

   ```
   npm run katalog -- --godkann {id}
   ```

   Det sätter `kontrollerad_datum` på genomgångens granskade rader och skriver `godkand` i loggen. Be sedan Claude Code skapa seeden, köra tester och merga, eller gör det med `npm run katalog -- --skriv katalog_godkand_<butik>_<kategori>` (namnet får bara ha a till z, siffror och understreck) och en PR. Därefter visas "Stickprovskontrollerad" i appen.
4. **Något är fel:** rätta raden i CSV:n (och ny seed). Dra ett nytt stickprov av samma storlek med ett nytt frö. Är något fel igen: gör en full genomgång av alla rader i genomgången, eller håll genomgången utan godkännande.
5. Spara checklistan med dina kryss i Git (en liten docs-PR).

Ett stickprov visar inte att allt är rätt. Det fångar systematiska fel som felmatchade storlekar och kopierade värden, men inte enstaka slarvfel.

## 6. Specialfall

**Ny butik.** Lägg en kolumn i täckningstabellen i `README.md`. Använd butikens namn utan å, ä och ö, med små bokstäver, i genomgångs-id:t. Fråga Astra efter butikens kategorisidor och gör som vanligt. Kontrollera att butikens produkter inte bara är en annan butiks sortiment med samma artiklar.

**Ny kategori** (till exempel kök eller kläder). Det är en större ändring. Be Claude Code följa skillen `ny-migrering` och ändra på alla ställen:
- databasen: raden i tabellerna `kategorier` och `underkategorier` (en migrering, med test)
- `src/lib/forrad.ts`: kategorinyckeln (samma nyckel som i databasen, ett test i `supabase/rls.test.ts` kontrollerar att de stämmer överens)
- `src/lib/produktegenskaper.ts`: egenskaperna och reglerna per underkategori
- en ny CSV i `supabase/katalog/` med katalogens kolumner, och en Astra-mall (kolumnblock i `astra-mall.md`)
- täckningstabellen i `README.md`

**En enstaka produkt som en användare saknar.** Lägg en rad i rätt CSV med genomgången `ÅÅÅÅ-MM-DD-anvandare-<kategori>`, och logga en rad (butik "Användare"). Hämta uppgifterna från tillverkarens sida, kör katalog-granskaren på raden och skapa en seed. Be Claude Code: *"Lägg in {produkt} från {länk} enligt katalog-skillen."*

**Utgångna produkter.**
- Tillverkarens sida finns kvar och säger att produkten har utgått: lägg in med kommentaren "Tillverkarens sida anger att produkten har utgått."
- Tillverkarens sida finns inte längre: lägg inte till nya produkter. En befintlig rad behålls med butikens sida som `kalla` (aldrig web.archive.org), kommentaren "Utgången. Tillverkarens produktsida finns inte längre." och ingen nivå. `kalla` får inte vara tom.

**Butiksrader.** När tillverkaren saknar produktsida eller vikt får butikens sida användas. `kalla_typ` är `butik`, kommentaren börjar "Vikt och uppgifter från <butik>. ...", raden får aldrig `granskad_datum` eller `kontrollerad_datum`, och butikens vikt ställs aldrig mot tillverkarens.

**Rader som tas bort.** Att ta bort en rad ur CSV:n tar inte bort den ur databasen. Det kräver en egen migrering (skillen `ny-migrering`).

## 7. Vem gör vad

| Vem | Gör |
|---|---|
| Astra | Listar butikens produkter, hämtar uppgifter från tillverkaren, levererar CSV och listor |
| Du eller Andreas | Tar fram listan över befintliga produkter, läser Astras svar (steg 2), skickar mallen till Claude Code, dra stickprov och godkänner |
| Claude Code | Lägger in, loggar, skapar seed, kör tester, granskar via katalog-granskaren, mergar och kör seeden när du har gett lov |
| Katalog-granskaren | Läser tillverkarens sidor och rapporterar. Ändrar ingenting och sätter inga datum |

Regler:
- **Bara en av oss kör migreringar åt gången.** Säg till den andra innan du startar en körning (`npx supabase db push --remote`), och kör aldrig två Claude Code-sessioner med seeds samtidigt. Kontrollera med `npx supabase migration list --remote` att inget annat väntar innan du kör.
- **Bara vi grundare sätter `kontrollerad_datum`** (med `--godkann`). Claude Code sätter bara `granskad_datum`, och bara för rader som granskaren har läst mot tillverkarens sida.
- **Ändra aldrig `produkter` för hand i databasen.** Ändra CSV:n och skapa en ny seed. En migrering som redan körts ändras aldrig.
- Seeden skriver över alla kolumner för varje rad. Ett datum som bara satts i databasen försvinner vid nästa seed.
