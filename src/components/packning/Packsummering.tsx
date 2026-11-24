import { Sektion } from '@/components/ui/sektion'
import { formateraVikt } from '@/lib/forrad'
import type { Startvikt } from '@/lib/vikt'

export interface Personvikt {
  id: string
  namn: string
  vikt: Startvikt
  packat: { packat: number; totalt: number }
}

/** Startvikten per person överst i packlistan: basvikt, förbrukning och mat, och hur mycket som är packat. */
export function Packsummering({ personer }: { personer: readonly Personvikt[] }) {
  return (
    <Sektion rubrik="Startvikt">
      <ul className="divide-y divide-border">
        {personer.map((p) => (
          <li key={p.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-medium break-words">{p.namn}</span>
              <span className="shrink-0 font-heading text-xl font-semibold tabular-nums">{formateraVikt(p.vikt.start)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bas {formateraVikt(p.vikt.bas)}, förbrukning {formateraVikt(p.vikt.forbrukas)}, mat {formateraVikt(p.vikt.mat)}
              {p.vikt.kropp > 0 && `. På kroppen ${formateraVikt(p.vikt.kropp)}`}
            </p>
            {p.packat.totalt > 0 && (
              <p className="text-sm text-muted-foreground">
                {p.packat.packat} av {p.packat.totalt} packade
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Startvikten är det som bärs i ryggsäcken vid start. Maten kommer från matplanen.</p>
    </Sektion>
  )
}
