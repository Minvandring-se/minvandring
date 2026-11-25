import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt, kategoriFor } from '@/lib/forrad'
import type { Kategorivikt, Startvikt } from '@/lib/vikt'
import { cn } from '@/lib/utils'

export interface Personvikt {
  id: string
  namn: string
  vikt: Startvikt
  /** Basvikten per kategori, tyngst först. */
  kategorier: readonly Kategorivikt[]
  packat: { packat: number; totalt: number }
}

/** Så många visas innan resten av gruppen fälls ihop. */
const FORST = 3

/**
 * Startvikten per person överst i packlistan: basvikt, förbrukning och mat, och hur mycket som är packat. Den egna
 * raden kommer först. Med många i gruppen fälls resten ihop, så att listan inte hamnar långt ner.
 */
export function Packsummering({ personer, mat }: { personer: readonly Personvikt[]; mat: 'laddar' | 'fel' | 'klar' }) {
  const [alla, setAlla] = useState(false)
  const synliga = alla || personer.length <= FORST ? personer : personer.slice(0, FORST - 1)
  const matText = (g: number) => (mat === 'klar' ? `mat ${formateraVikt(g)}` : mat === 'laddar' ? 'mat hämtas' : 'mat saknas')
  return (
    <Sektion rubrik="Startvikt">
      <ul className="divide-y divide-border">
        {synliga.map((p) => (
          <li key={p.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium break-words">{p.namn}</span>
              <span className="shrink-0 font-heading text-xl font-semibold tabular-nums">{formateraVikt(p.vikt.start)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bas {formateraVikt(p.vikt.bas)}, förbrukning {formateraVikt(p.vikt.forbrukas)}, {matText(p.vikt.mat)}
              {p.vikt.kropp > 0 && `. På kroppen ${formateraVikt(p.vikt.kropp)}`}
            </p>
            {p.kategorier.length > 0 && <Kategorier namn={p.namn} kategorier={p.kategorier} />}
            {p.packat.totalt > 0 && (
              <p className="text-sm text-muted-foreground">
                {p.packat.packat} av {p.packat.totalt} packat
              </p>
            )}
          </li>
        ))}
      </ul>
      {personer.length > FORST && (
        <button
          type="button"
          aria-expanded={alla}
          onClick={() => setAlla((a) => !a)}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {alla ? 'Visa färre' : `Visa hela gruppen (${personer.length})`}
          <ChevronDown className={cn('size-4 transition-transform', alla && 'rotate-180')} aria-hidden />
        </button>
      )}
      <p className="text-sm text-muted-foreground">
        {mat === 'fel'
          ? 'Matplanen gick inte att hämta, så maten ingår inte i startvikten.'
          : 'Startvikten är det som bärs i ryggsäcken vid start. Maten kommer från matplanen.'}
      </p>
    </Sektion>
  )
}

/** Vad basvikten består av, per kategori med en stapel. Fälls ut per person, så att listan överst hålls kort. */
function Kategorier({ namn, kategorier }: { namn: string; kategorier: readonly Kategorivikt[] }) {
  const [oppen, setOppen] = useState(false)
  const tyngst = kategorier[0]?.vikt ?? 0
  return (
    <div>
      <button
        type="button"
        aria-expanded={oppen}
        onClick={() => setOppen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Basvikten per kategori
        <span className="sr-only"> för {namn}</span>
        <ChevronDown className={cn('size-4 transition-transform', oppen && 'rotate-180')} aria-hidden />
      </button>
      {oppen && (
        <ul className="space-y-2 pb-1">
          {kategorier.map((k) => (
            <li key={k.kategori} className="space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 break-words">{kategoriFor(k.kategori).etikett}</span>
                <span className="shrink-0 tabular-nums">{formateraVikt(k.vikt)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${tyngst > 0 ? Math.max(2, (k.vikt / tyngst) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
