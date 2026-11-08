# Min Vandring

Planera. Packa. Upplev. Planera vandringen tillsammans: packning, mat och rutt på ett ställe.

## Kom igång

```bash
npm install
cp .env.example .env.local   # fyll i nycklarna från Supabase → Project Settings → API
npm run dev
```

## Databasen

Kör `supabase/migrations/20261108000000_grund.sql` i Supabase (SQL Editor → New query → klistra in → Run).

## Kommandon

| Kommando | Gör |
|---|---|
| `npm run dev` | Startar appen lokalt |
| `npm run build` | Bygger för produktion |
| `npm test` | Kör testerna |
| `npm run lint` | Kollar koden |

Vad som ska byggas först står i [docs/version-1.md](docs/version-1.md). Regler för koden (och för Claude Code) står i [CLAUDE.md](CLAUDE.md).
