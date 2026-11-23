import { Check } from 'lucide-react'
import { KommerSnart } from '@/components/ui/kommerSnart'
import { Sektion } from '@/components/ui/sektion'
import { FORRAD_EXEMPEL } from '@/lib/exempeldata'
import { formateraVikt, type Forradssumma } from '@/lib/forrad'
import { cn } from '@/lib/utils'

/** Rubrikerna i korten bredvid listan. */
const kortrubrik = 'text-[22px] sm:text-[22px]'

/** Hela förrådet i den mörkgröna rutan: vikten stort, antal saker, hur många som är granskade och hur många som är utan vikt. */
export function HelaForradet({ summa, granskade, className }: { summa: Forradssumma; granskade: number; className?: string }) {
  return (
    <section aria-labelledby="hela-forradet" className={cn('rounded-lg bg-yta-stark p-5 text-yta-stark-foreground sm:p-6', className)}>
      <h2 id="hela-forradet" className="font-sans text-sm font-semibold text-hjortron">
        Hela förrådet
      </h2>
      <p className="mt-1 font-heading text-[52px] leading-none font-semibold tracking-[-0.02em] tabular-nums">{formateraVikt(summa.viktG)}</p>
      <ul className="mt-3 space-y-0.5 text-sm text-yta-stark-muted">
        <li>{summa.antal === 1 ? '1 sak' : `${summa.antal} saker`}</li>
        {granskade > 0 && (
          <li className="flex items-center gap-1.5">
            <Check className="size-4 shrink-0 text-hjortron" aria-hidden />
            {granskade} med vikt granskad mot tillverkaren
          </li>
        )}
        {summa.utanVikt > 0 && <li>{summa.utanVikt} utan vikt</li>}
      </ul>
    </section>
  )
}

/** Vikten per kategori som staplar, den tyngsta kategorin först. Stapeln är relativ till den tyngsta. */
export function ViktPerKategori({ summa }: { summa: Forradssumma }) {
  const grupper = [...summa.grupper].filter((g) => g.viktG > 0).sort((a, b) => b.viktG - a.viktG)
  if (grupper.length === 0) return null
  const max = grupper[0].viktG
  return (
    <Sektion rubrik="Vikt per kategori" rubrikKlass={kortrubrik}>
      <ul className="space-y-3">
        {grupper.map((g) => (
          <li key={g.kategori.nyckel} className="space-y-1">
            <div className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 break-words">{g.kategori.etikett}</span>
              <span className="shrink-0 font-medium tabular-nums">{formateraVikt(g.viktG)}</span>
            </div>
            <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(3, (g.viktG / max) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </Sektion>
  )
}

/** Största vinsten: den tyngsta saken, där det finns mest att vinna. Jämförelsen med lättare produkter kommer senare. */
export function StorstaVinsten({ vinst }: { vinst: { namn: string; viktG: number; kategori: string } | null }) {
  if (!vinst) return null
  return (
    <Sektion rubrik="Största vinsten" variant="hjortron" rubrikKlass={kortrubrik}>
      <p className="text-sm">
        <span className="font-semibold">{vinst.namn}</span> är din tyngsta sak, {formateraVikt(vinst.viktG)}. Vill du gå lättare är det här det finns mest att vinna.
      </p>
    </Sektion>
  )
}

/** Önskelistan, som exempel med Kommer snart. Den kräver en ändring i databasen. */
export function Onskelista() {
  return (
    <Sektion rubrik="Önskelista" kommerSnart>
      <KommerSnart text="Saker du vill skaffa, och vad de skulle ändra i vikten.">
        <ul className="divide-y divide-border text-sm">
          {FORRAD_EXEMPEL.onskelista.map((r) => (
            <li key={r.namn} className="flex justify-between gap-3 py-2">
              <span>{r.namn}</span>
              <span className="shrink-0 text-muted-foreground">{r.not}</span>
            </li>
          ))}
        </ul>
      </KommerSnart>
    </Sektion>
  )
}
