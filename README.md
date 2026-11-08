# Min Vandring

Planera. Packa. Upplev. Planera vandringen tillsammans: packning, mat och rutt på ett ställe.

## Kom igång

```bash
npm install
cp .env.example .env.local   # fyll i nycklarna från Supabase → Project Settings → API
npm run dev
```

## Databasen

Migreringarna i `supabase/migrations/` körs med Supabase CLI. Första gången:

```bash
npx supabase login
npx supabase link --project-ref psvuzkkauiqhimnhtjep
```

Se vilka migreringar som är körda och kör de nya:

```bash
npx supabase migration list
npx supabase db push --remote
```

## Kommandon

| Kommando | Gör |
|---|---|
| `npm run dev` | Startar appen lokalt |
| `npm run build` | Bygger för produktion |
| `npm test` | Kör testerna |
| `npm run lint` | Kollar koden |

Vad som ska byggas först står i [docs/version-1.md](docs/version-1.md). Regler för koden (och för Claude Code) står i [CLAUDE.md](CLAUDE.md).
