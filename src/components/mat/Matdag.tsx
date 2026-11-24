import { Plus, X } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { varningar, type Behov } from '@/lib/kost'
import { formateraKcal, HUVUDMALTIDER, kcalPer100g, MALTIDER, maltidsord, maltidsrutaId, type Dagssumma, type Naring } from '@/lib/mat'
import type { Maltid, Maltidsrad, Matprodukt, Ratt } from '@/lib/typer'
import { cn } from '@/lib/utils'

export interface Ratter {
  /** Turens rätter med id som nyckel. */
  ratter: ReadonlyMap<string, Ratt>
  /** En portion av varje rätt. */
  perPortion: ReadonlyMap<string, Naring>
  pasar: ReadonlyMap<string, Matprodukt>
}

/**
 * En dag i matplanen: rubriken med datum och energin per person, och en ruta per måltid. På dator ligger dagens fyra
 * rutor i en rad, i mobil två och två och på smala skärmar under varandra.
 */
export function Matdag({
  summa,
  datum,
  maltider,
  ratter,
  behov,
  kanAndra,
  onLaggTill,
  onTaBort,
}: {
  summa: Dagssumma
  /** "fredag 4 december", eller null när turen saknar datum eller dagen är en reservdag. */
  datum: string | null
  /** Måltidsraderna för dagen. */
  maltider: readonly Maltidsrad[]
  ratter: Ratter
  behov: readonly Behov[]
  kanAndra: boolean
  onLaggTill: (maltid: Maltid) => void
  onTaBort: (rad: Maltidsrad) => void
}) {
  const { dag, naring } = summa
  const id = useId()
  const undertext = datum ?? (dag.reserv ? 'Om turen drar ut' : null)
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 id={id} className="text-xl lg:text-2xl">
            {dag.namn}
          </h2>
          {undertext && <p className="text-sm text-muted-foreground first-letter:uppercase lg:text-[0.9375rem]">{undertext}</p>}
        </div>
        {naring.gram > 0 && (
          <p className="text-sm text-muted-foreground tabular-nums">
            {formateraKcal(naring.kcal)} och {formateraVikt(naring.gram)} per person
          </p>
        )}
      </div>
      <ul className="grid grid-cols-1 gap-3 min-[23.75rem]:grid-cols-2 lg:grid-cols-4">
        {MALTIDER.map(({ nyckel, etikett }) => (
          <li key={nyckel} className="min-w-0">
            <Maltidsruta
              dag={dag.dag}
              dagnamn={dag.namn}
              maltid={nyckel}
              etikett={etikett}
              rader={maltider.filter((m) => m.maltid === nyckel)}
              ratter={ratter}
              behov={behov}
              kanAndra={kanAndra}
              onLaggTill={() => onLaggTill(nyckel)}
              onTaBort={onTaBort}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * En måltid. Tom: streckad kant och Lägg till, och "Saknas" i rost för frukost, lunch och middag. Fylld: rätterna med
 * namn och Ta bort, och Lägg till för fler rätter i samma måltid. Läsare ser rätterna men inga knappar.
 */
function Maltidsruta({
  dag,
  dagnamn,
  maltid,
  etikett,
  rader,
  ratter,
  behov,
  kanAndra,
  onLaggTill,
  onTaBort,
}: {
  dag: number
  dagnamn: string
  maltid: Maltid
  etikett: string
  rader: readonly Maltidsrad[]
  ratter: Ratter
  behov: readonly Behov[]
  kanAndra: boolean
  onLaggTill: () => void
  onTaBort: (rad: Maltidsrad) => void
}) {
  const synliga = rader.filter((r) => ratter.ratter.has(r.ratt_id))
  const tom = synliga.length === 0
  const vad = `${maltidsord(maltid)} ${dagnamn.toLowerCase()}`
  return (
    <div
      id={maltidsrutaId(dag, maltid)}
      tabIndex={-1}
      className={cn(
        'flex h-full min-h-28 scroll-mt-6 flex-col gap-2 rounded-ruta p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4',
        tom ? 'border-2 border-dashed border-border' : 'border border-border bg-card',
      )}
    >
      <h3 className="flex flex-wrap items-baseline gap-x-2 font-sans text-sm font-semibold">
        {etikett}
        {tom && HUVUDMALTIDER.includes(maltid) && <span className="font-medium text-accent-strong">Saknas</span>}
        {tom && !HUVUDMALTIDER.includes(maltid) && <span className="font-normal text-muted-foreground">Frivilligt</span>}
      </h3>
      {!tom && (
        <ul className="space-y-1.5">
          {synliga.map((rad) => (
            <Rattrad key={rad.id} rad={rad} ratter={ratter} behov={behov} kanAndra={kanAndra} onTaBort={() => onTaBort(rad)} vad={vad} />
          ))}
        </ul>
      )}
      {kanAndra ? (
        <Button
          variant="ghost"
          className="mt-auto -ml-2 self-start px-2 text-primary"
          onClick={onLaggTill}
          aria-label={tom ? `Lägg till ${vad}` : `Lägg till en rätt till i ${vad}`}
        >
          <Plus className="size-4" aria-hidden />
          Lägg till
        </Button>
      ) : (
        tom && <p className="mt-auto text-sm text-muted-foreground">Inget planerat</p>
      )}
    </div>
  )
}

function Rattrad({ rad, ratter, behov, kanAndra, onTaBort, vad }: { rad: Maltidsrad; ratter: Ratter; behov: readonly Behov[]; kanAndra: boolean; onTaBort: () => void; vad: string }) {
  const ratt = ratter.ratter.get(rad.ratt_id)
  const portion = ratter.perPortion.get(rad.ratt_id)
  if (!ratt || !portion) return null
  const pase = ratt.matprodukt_id ? ratter.pasar.get(ratt.matprodukt_id) : undefined
  // Varningar bara för påsar ur katalogen. Egna rätter har ingen kostinformation i första versionen.
  const lista = pase ? varningar(pase, behov) : []
  const per100 = kcalPer100g(portion.kcal, portion.gram)
  return (
    <li className="flex items-start gap-1 rounded-knapp bg-muted/60 py-1 pl-3">
      <div className="min-w-0 flex-1 space-y-0.5 py-1.5">
        <p className="text-[0.9375rem] leading-snug font-medium wrap-anywhere">{ratt.namn}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formateraKcal(portion.kcal)} per portion
          {per100 !== null && <span className="block">{per100} kcal per 100 g</span>}
        </p>
        {lista.length > 0 && (
          <ul className="space-y-0.5 text-xs">
            {lista.map((v) => (
              <li key={v.text} className={cn(v.okand ? 'text-muted-foreground' : 'font-medium text-accent-strong')}>
                {v.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {kanAndra && (
        <Button variant="ghost" size="ikon" onClick={onTaBort} aria-label={`Ta bort ${ratt.namn} från ${vad}`}>
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </li>
  )
}
