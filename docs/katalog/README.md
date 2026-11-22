# Produktkatalogen: källor och täckning

Katalogfilerna ligger i `supabase/katalog/`. Den här mappen beskriver varifrån produkterna kommer.
Filerna här ligger medvetet utanför `supabase/katalog/`, så att `npm run katalog` inte försöker importera dem.

## Så går en genomgång till

1. Produkterna i en kategori hämtas från en butiks sortiment, men alla uppgifter tas från tillverkarens egen sida. Butikens sida används bara för att veta vilka produkter som finns.
2. Raderna kontrolleras och läggs till i rätt fil i `supabase/katalog/`. Produkter som redan finns (samma märke, modell och version) räknas som "redan fanns" och läggs inte till igen.
3. Genomgången loggas som en ny rad i `genomgangar.csv`.

## Täckning per kategori och butik

✓ = genomgången · – = inte gjord än

| Kategori | Naturkompaniet | Outnorth | XXL | Outdoorexperten | Addnature |
|---|---|---|---|---|---|
| Tält och vindskydd | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | – |
| Sovsäckar och quilts | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | ✓ 2026-11-22 | – |
| Liggunderlag | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | – | – |
| Ryggsäckar | ✓ 2026-11-19 | ✓ 2026-11-22 | ✓ 2026-11-22 | – | – |

## Kolumnerna i genomgangar.csv

- `datum`: när genomgången gjordes
- `kategori` och `katalogfil`: vilken kategori och vilken fil i `supabase/katalog/`
- `kalla`: butiken, eller annan källa (tillverkarnas sidor, användare)
- `rader_i_kallan`: hur många produkter och storlekar källan gav
- `nya`: hur många som lades till i katalogen
- `redan_fanns`: hur många som redan fanns från en tidigare genomgång
- `utelamnade`: hur många som inte togs med, med skäl i `kommentar`
