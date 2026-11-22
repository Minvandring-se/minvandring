---
name: katalog
description: Fyll på eller rätta produktkatalogen i MinVandring. Använd den när produkter ska läggas till från en butiks sortiment, när en CSV i supabase/katalog/ har ändrats, när en seed-migrering ska skapas eller när en genomgång ska loggas.
---

# Produktkatalogen

CSV-filerna i `supabase/katalog/` är huvudlistan. Tabellen `produkter` fylls bara genom seed-migreringar som skapas från dem. Bakgrunden står i `docs/att-ta-senare.md` under "Katalogen" och i `docs/katalog/README.md`.

## Regler som alltid gäller

- **Butikens sida används bara för att se vilka produkter som finns.** Alla uppgifter (vikt, mått, temperaturer, material, EAN) tas från tillverkarens egen sida. Kolumnen `kalla` ska peka på tillverkarens sida för just den produkten.
- Saknar tillverkaren en uppgift lämnas fältet tomt. Gissa inte och ta den inte från butiken. Saknas vikten utelämnas produkten och räknas som utelämnad i loggen.
- Ändra aldrig `produkter` för hand i databasen. Ändra CSV:n och skapa en ny seed-migrering.
- Sätt aldrig `kontrollerad_datum`. Det gör bara en av grundarna, efter egen kontroll mot tillverkarens sida.
- När användaren säger att katalogfilen är uppdaterad: läs om filen från disk, kontrollera radantalet mot det användaren säger och committa den först av allt.
- Kör aldrig `checkout`, `restore` eller `stash` på `supabase/katalog/` utan att fråga. Ett branchbyte byter också ut filerna, så använd `git worktree` om en annan branch behövs.

## Så går en genomgång till

1. **Lista sortimentet.** Hämta produkterna i kategorin från butikens sida. Bara märke, modell och storlekar.
2. **Sortera bort det som redan finns.** Samma märke, modell och version räknas som "redan fanns" och läggs inte till igen.
3. **Hämta uppgifterna från tillverkaren.** En rad per storlek eller version. Egenskaperna per underkategori och reglerna mellan fälten står i `src/lib/produktegenskaper.ts`. Skriv i `kommentar` hur ett värde har härletts när det inte står rakt av på sidan.
4. **Låt katalog-granskaren läsa de nya raderna** mot tillverkarens sida innan de läggs in. Rätta avvikelserna, eller utelämna raden.
5. **Lägg raderna i rätt fil** i `supabase/katalog/`. Semikolon som avgränsare, kolumnerna läses efter namn, decimaltecken får vara punkt eller komma.
6. **Kör `npm run katalog`.** Fel stoppar raden och ska rättas. Varningar betyder att fält för jämförelser saknas, och får stå kvar om tillverkaren inte anger dem.
7. **Skapa seeden:** `npm run katalog -- --skriv katalog_<namn>`. Den uppdaterar också produkter som redan finns.
8. **Logga genomgången** (se nedan).
9. **Kör `npm test`.** `supabase/katalog.test.ts` faller om en CSV har ändrats utan ny migrering.
10. **Visa migreringen och vänta på ok** innan `npx supabase db push --remote`.

### När raderna kommer färdiga från en annan AI

Kommer raderna färdiga från en annan AI (vi använder Astra) börjar genomgången vid steg 4. Katalog-granskaren läser alltså raderna mot tillverkarens sida även då.

Kontrollera ändå att Astras sammanfattning (nya, redan fanns, utelämnade) stämmer mot raderna innan loggen skrivs: räkna raderna du faktiskt har fått, och jämför "redan fanns" med det som står i katalogfilen. Stämmer siffrorna inte, säg det till användaren och skriv ingen loggrad förrän det är utrett.

En produkt som tas bort ur CSV:n försvinner inte ur databasen. Det kräver en egen migrering, se skillen `ny-migrering`.

## Logga genomgången

Varje genomgång loggas, också en som inte gav några nya produkter.

**En ny rad sist i `docs/katalog/genomgangar.csv`:**

```
datum;kategori;katalogfil;kalla;rader_i_kallan;nya;redan_fanns;utelamnade;kommentar
```

- `rader_i_kallan` ska vara summan av `nya`, `redan_fanns` och `utelamnade`. Räkna efter.
- `kommentar` anger vilka som utelämnades och varför.
- En rad per kategori och butik. Kontrollera att raden inte redan finns.

**Täckningstabellen i `docs/katalog/README.md`:** byt `–` mot `✓` och datumet i rätt cell. Ny butik blir en ny kolumn, ny kategori en ny rad.

Loggen och tabellen committas tillsammans med CSV:n och seed-migreringen.
