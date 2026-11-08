import { Card } from '@/components/ui/card'
import { kg } from '@/lib/utils'
import { packvikter, radvikt, type Deltagare, type Packrad } from '@/lib/vikt'

const personer: (Deltagare & { namn: string })[] = [
  { id: 'anna', namn: 'Anna', typ: 'person', matandel: null },
  { id: 'erik', namn: 'Erik', typ: 'person', matandel: null },
]

const rader: (Packrad & { namn: string })[] = [
  { namn: 'Tält för två', antal: 1, viktG: 1450, typ: 'ryggsack', med: true, barsAv: 'anna', alla: false },
  { namn: 'Stormkök med kastrull', antal: 1, viktG: 1100, typ: 'ryggsack', med: true, barsAv: 'erik', alla: false },
  { namn: 'Sovsäck', antal: 1, viktG: 950, typ: 'ryggsack', med: true, barsAv: null, alla: true },
  { namn: 'Liggunderlag', antal: 1, viktG: 480, typ: 'ryggsack', med: true, barsAv: null, alla: true },
]

function barare(rad: Packrad) {
  if (rad.alla) return 'En var'
  return `Bärs av ${personer.find((p) => p.id === rad.barsAv)?.namn ?? 'ingen'}`
}

/** Ett litet exempel på packlistan. Vikterna räknas fram med samma funktioner som appen använder. */
export function PacklistaSmakprov() {
  const vikter = packvikter(rader, personer)

  return (
    <Card className="space-y-4 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg">Packlista</h3>
        <span className="text-sm text-muted-foreground">Exempel</span>
      </div>

      <ul className="divide-y divide-border">
        {rader.map((rad) => (
          <li key={rad.namn} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-medium">{rad.namn}</p>
              <p className="text-sm text-muted-foreground">
                {barare(rad)}
              </p>
            </div>
            <span className="shrink-0 tabular-nums">{radvikt(rad).toLocaleString('sv-SE')} g</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-3">
        {personer.map((p) => (
          <div key={p.id} className="rounded-md bg-primary-soft p-3">
            <p className="text-sm text-foreground/80">{p.namn} bär</p>
            <p className="font-heading text-xl font-semibold tabular-nums text-primary">
              {kg(vikter.get(p.id)?.bas ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
