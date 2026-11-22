---
name: klar-for-pr
description: Kontrollera en ändring i MinVandring och skapa en pull request. Använd den när en ändring är färdig och ska committas, pushas eller bli en PR, och innan du säger att något är klart.
---

# Klar för PR

## 1. Kontrollera

Kör alla tre och läs utfallet. Rätta det som faller, hoppa inte över något.

```
npm run build
npm test
npm run lint
```

## 2. Granska det som ändrats

- Migrering eller policy i ändringen: agenten `rls-granskare`.
- Synlig text i ändringen: agenten `textgranskare`.
- Ändring i sidor, komponenter eller formulär (`src/pages`, `src/components`): agenten `mobilgranskare`. Den läser koden. Rör ändringen hur en sida ser ut, titta också på den med skillen `kor-appen`.
- Nya miljövariabler finns i både `.env.example` och `src/vite-env.d.ts`.

## 3. Committa

- Aldrig direkt på `main`. Arbeta i en egen branch.
- Kör `git status` och läs listan. Flera personer lägger filer i mappen samtidigt.
- Lägg till filer med exakta sökvägar. Inte `git add .`, `git add -A` eller hela mappar.
- `.env.local` committas aldrig.
- Har användaren sagt att katalogfilen är uppdaterad committas den först, se skillen `katalog`.
- Commitmeddelande på svenska som säger vad som ändrats.

## 4. Före PR

- `git fetch origin` och sedan `git diff --stat origin/main...HEAD`. Bara filer som hör till ändringen ska synas. Syns andras filer: stanna och red ut det.
- Ingen force-push och ingen `reset` på delade brancher. Rätta med nya commits.

## 5. Skapa PR

`gh pr create` mot `main`, på svenska, med:

- vad som ändrats och varför, kort
- hur ändringen testas, steg för steg
- migreringar som måste köras, och om de redan är körda

Merge till `main` publiceras automatiskt på www.minvandring.se. Merga inte utan att användaren har sagt ja.

## 6. Avsluta

En kort sammanfattning till användaren: vad som gjordes, utfallet av build, test och lint, länken till PR:en och hur ändringen testas.
