import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt } from '@/lib/forrad'
import { varningar, type Behov } from '@/lib/kost'
import { formateraKcal, HUVUDMALTIDER, kcalPer100g, MALTIDER, type Dagssumma, type Naring } from '@/lib/mat'
import type { Maltid, Maltidsrad, Matprodukt, Ratt } from '@/lib/typer'
import { cn } from '@/lib/utils'

export interface Ratter {
  /** Turens rätter med id som nyckel. */
  ratter: ReadonlyMap<string, Ratt>
  /** En portion av varje rätt. */
  perPortion: ReadonlyMap<string, Naring>
  pasar: ReadonlyMap<string, Matprodukt>
}

/** En dag i matplanen: de fyra måltiderna med sina rätter, och energin och vikten per person för dagen. */
export function Matdag({
  summa,
  maltider,
  ratter,
  behov,
  kanAndra,
  onLaggTill,
  onTaBort,
}: {
  summa: Dagssumma
  /** Måltidsraderna för dagen. */
  maltider: readonly Maltidsrad[]
  ratter: Ratter
  behov: readonly Behov[]
  kanAndra: boolean
  onLaggTill: (maltid: Maltid) => void
  onTaBort: (rad: Maltidsrad) => void
}) {
  const { dag, naring } = summa
  return (
    <Sektion
      rubrik={dag.namn}
      rubrikniva={3}
      atgard={
        naring.gram > 0 && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {formateraKcal(naring.kcal)} och {formateraVikt(naring.gram)} per person
          </span>
        )
      }
    >
      <ul className="divide-y divide-border">
        {MALTIDER.map(({ nyckel, etikett }) => {
          const rader = maltider.filter((m) => m.maltid === nyckel)
          const saknas = rader.length === 0 && HUVUDMALTIDER.includes(nyckel)
          return (
            <li key={nyckel} className="space-y-2 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-sans text-sm font-semibold">
                  {etikett}
                  {saknas && <span className="ml-2 font-medium text-accent-strong">Saknas</span>}
                </h4>
                {kanAndra && (
                  <Button variant="ghost" className="-mr-3 text-primary" onClick={() => onLaggTill(nyckel)} aria-label={`Lägg till i ${etikett.toLowerCase()}, ${dag.namn.toLowerCase()}`}>
                    <Plus className="size-4" aria-hidden />
                    Lägg till
                  </Button>
                )}
              </div>
              {rader.length > 0 && (
                <ul className="space-y-2">
                  {rader.map((rad) => (
                    <Rattrad key={rad.id} rad={rad} ratter={ratter} behov={behov} kanAndra={kanAndra} onTaBort={() => onTaBort(rad)} maltid={etikett} dag={dag.namn} />
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </Sektion>
  )
}

function Rattrad({
  rad,
  ratter,
  behov,
  kanAndra,
  onTaBort,
  maltid,
  dag,
}: {
  rad: Maltidsrad
  ratter: Ratter
  behov: readonly Behov[]
  kanAndra: boolean
  onTaBort: () => void
  maltid: string
  dag: string
}) {
  const ratt = ratter.ratter.get(rad.ratt_id)
  const portion = ratter.perPortion.get(rad.ratt_id)
  if (!ratt || !portion) return null
  const pase = ratt.matprodukt_id ? ratter.pasar.get(ratt.matprodukt_id) : undefined
  // Varningar bara för påsar ur katalogen. Egna rätter har ingen kostinformation i första versionen.
  const lista = pase ? varningar(pase, behov) : []
  const per100 = kcalPer100g(portion.kcal, portion.gram)
  return (
    <li className="flex items-start gap-3 rounded-md bg-muted/50 py-2 pr-1 pl-3">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium break-words">{ratt.namn}</p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formateraKcal(portion.kcal)} per portion
          {per100 !== null && <span className="max-sm:block sm:ml-2">{per100} kcal per 100 g</span>}
        </p>
        {lista.length > 0 && (
          <ul className="space-y-0.5 text-sm">
            {lista.map((v) => (
              <li key={v.text} className={cn(v.okand ? 'text-muted-foreground' : 'font-medium text-accent-strong')}>
                {v.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {kanAndra && (
        <Button variant="ghost" size="ikon" onClick={onTaBort} aria-label={`Ta bort ${ratt.namn} från ${maltid.toLowerCase()}, ${dag.toLowerCase()}`}>
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </li>
  )
}
