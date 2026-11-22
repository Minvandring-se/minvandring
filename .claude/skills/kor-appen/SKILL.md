---
name: kor-appen
description: Starta MinVandring lokalt och titta på sidan i Chrome i mobilbredd (390 px). Använd den när en ändring i gränssnittet ska ses i den riktiga appen, när du ska ta skärmbilder av en sida eller läsa konsolfel, och innan du säger att en visuell ändring är klar.
---

# Kör appen och titta på den

Tester och lint visar inte hur en sida ser ut. Med den här skillen startar du appen, öppnar den i Chrome i mobilbredd, tar skärmbilder och läser konsolen.

## Läs först

- Appen pratar med det **riktiga Supabase-projektet**, inte med en testdatabas. Titta bara. Spara, ändra eller ta bort ingenting i ett konto utan att användaren har sagt ja till just det.
- Lösenord får aldrig stå i en fil, i en commit, i en adress eller i chatten, och skrivs aldrig ut i svaret.
- Undvik handlingar som öppnar webbläsarens egna dialogrutor (alert, confirm). De stoppar Chrome-kopplingen. Varna användaren först om en knapp gör det.

## 1. Kontrollera förutsättningarna

- `.env.local` ska finnas och ha `VITE_SUPABASE_URL` och `VITE_SUPABASE_ANON_KEY`, som i `.env.example`. Saknas filen: säg det och stanna. Läs aldrig ut nycklarnas värden.
- Kolla om en server redan körs: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173`. Svarar den med 200, använd den och starta ingen ny.

## 2. Starta servern

Kör `npm run dev` i bakgrunden (`run_in_background`). Vite skriver adressen, vanligen `http://localhost:5173`. Är porten upptagen väljer Vite en annan, så läs adressen i utskriften och vänta tills den visas. Stoppa servern när du är klar, om det var du som startade den.

## 3. Öppna Chrome i mobilbredd

1. Ladda Chrome-verktygen med skillen `claude-in-chrome` och kör `tabs_context_mcp`.
2. Öppna en ny flik (`tabs_create_mcp`), använd inte användarens befintliga flikar.
3. Sätt fönstret till 390 px brett (`resize_window`, till exempel 390 × 844) och gå till adressen med `navigate`.
4. Kontrollera bredden: `window.innerWidth` ska vara 390. Går fönstret inte att göra så smalt (Chrome har en minsta fönsterbredd): öppna `http://localhost:5173/` i ett fönster och lägg sidan i en `iframe` som är 390 px bred på en tom sida från samma adress, och granska den. Säg i rapporten att du gjorde så.
5. Titta också vid 1280 px om ändringen gäller layouten på dator, och byt däremellan för att se övergången mellan en och två kolumner.

## 4. Logga in när sidan kräver det

Sidorna under `/turer`, `/tur/…`, `/forrad` och `/profil` kräver inloggning.

- **Alternativ A, användaren loggar in själv.** Be användaren logga in i Chrome-fönstret och vänta tills hen säger till. Det går alltid att välja.
- **Alternativ B, testkonto.** Om `.env.local` har `TESTKONTO_EPOST` och `TESTKONTO_LOSENORD` (inga `VITE_` före, så de hamnar aldrig i webbläsarens kod) kan du logga in med dem, bara på `localhost` och bara med ett konto som är ett testkonto. Läs dem utan att skriva ut dem, till exempel med `node -e` som bara skickar värdena vidare. Använd aldrig användarens riktiga konto eller ett lösenord till en annan tjänst. Finns variablerna inte: välj A.

## 5. Titta

Ta en skärmbild av toppen av sidan, och sedan av resten när du har scrollat. Öppna det som går att öppna (utfällda rader, menyer, filter, formulär). Kontrollera särskilt:

- **Sidscroll.** `document.documentElement.scrollWidth > window.innerWidth` ska vara falskt.
- **Tryckytor.** Lista det som går att trycka på och är lägre än 44 px:

  ```js
  [...document.querySelectorAll('a, button, input, select, textarea, [role=button], summary')]
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && r.height > 0 && r.height < 44)
    .map(({ e, r }) => `${e.tagName} ${Math.round(r.width)}x${Math.round(r.height)} ${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)}`)
  ```

  Länkar mitt i löpande text räknas inte.
- **Tangentbordsfokus.** Tabba genom sidan och se att fokus syns överallt.
- **Långa texter.** Ett långt namn ska radbrytas utan att knappar, vikt eller pilar skjuts ut ur vyn.

## 6. Läs konsolen och nätverket

- `read_console_messages` med mönstret `error|warn|Uncaught|Failed`. Konsolen kan vara mångordig, så filtrera.
- `read_network_requests` och leta efter svar med status 400 eller högre, särskilt mot Supabase.
- Skilj på fel som ändringen har orsakat och sådant som fanns förut.

## 7. Städa och rapportera

Stäng fliken du öppnade (`tabs_close_mcp`) och stoppa servern om du startade den. Rapportera kort på svenska:

- vilka sidor och bredder du tittade på
- vad som såg fel ut, med skärmbild
- konsolfel och misslyckade förfrågningar
- sidscroll och tryckytor under 44 px
- det du inte kunde titta på och varför (till exempel att sidan kräver inloggning)

Spara skärmbilder på disk bara om användaren vill ha dem.
