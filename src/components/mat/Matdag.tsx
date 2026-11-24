import { ChevronDown, Plus, X } from 'lucide-react'
import { useId } from 'react'
import { Initial } from '@/components/mat/Initial'
import type { Person } from '@/components/mat/RadPanel'
import { Bricka } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { uppraknade, varningar, type Behov } from '@/lib/kost'
import { formateraKcal, grupperaMaltid, HUVUDMALTIDER, kcalPer100g, MALTIDER, maltidsord, maltidsrutaId, orimligPortion, type Dagssumma, type Naring } from '@/lib/mat'
import type { Maltid, Maltidsrad, Matatare, Matprodukt, Ratt } from '@/lib/typer'
import { cn } from '@/lib/utils'

export interface Ratter {
  /** Turens rätter med id som nyckel. */
  ratter: ReadonlyMap<string, Ratt>
  /** En portion av varje rätt. */
  perPortion: ReadonlyMap<string, Naring>
  pasar: ReadonlyMap<string, Matprodukt>
  /** Namnen på varorna i varje egen rätt, i den ordning de skrevs in. */
  ingredienser: ReadonlyMap<string, readonly string[]>
}

/** Turens personer med färger och vem som äter vad, för att visa vem som bär och äter varje rätt. */
export interface Folk {
  personer: readonly Person[]
  farger: ReadonlyMap<string, string>
  atare: readonly Matatare[]
}

const INGET_FOLK: Folk = { personer: [], farger: new Map(), atare: [] }

/** De som äter en rad, sorterade, som nyckel. Tom: alla. */
const atarnyckel = (folk: Folk, rad: Maltidsrad) =>
  folk.atare
    .filter((a) => a.maltid_id === rad.id)
    .map((a) => a.deltagare_id)
    .sort()
    .join(',')

/**
 * En dag i matplanen: rubriken med datum och energin per person, och en ruta per måltid. På dator ligger dagens fyra
 * rutor i en rad, i mobil två och två och på smala skärmar under varandra.
 */
export function Matdag({
  summa,
  datum,
  maltider,
  ratter,
  folk = INGET_FOLK,
  behov,
  kanAndra,
  onLaggTill,
  onTaBort,
  onVem,
}: {
  summa: Dagssumma
  /** "fredag 4 december", eller null när turen saknar datum eller dagen är en reservdag. */
  datum: string | null
  /** Måltidsraderna för dagen. */
  maltider: readonly Maltidsrad[]
  ratter: Ratter
  folk?: Folk
  behov: readonly Behov[]
  kanAndra: boolean
  onLaggTill: (maltid: Maltid) => void
  onTaBort: (rad: Maltidsrad) => void
  /** Öppnar valet av vem som bär och äter raderna. */
  onVem?: (rader: readonly Maltidsrad[]) => void
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
              folk={folk}
              behov={behov}
              kanAndra={kanAndra}
              onLaggTill={() => onLaggTill(nyckel)}
              onTaBort={onTaBort}
              onVem={onVem}
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
  folk,
  behov,
  kanAndra,
  onLaggTill,
  onTaBort,
  onVem,
}: {
  dag: number
  dagnamn: string
  maltid: Maltid
  etikett: string
  rader: readonly Maltidsrad[]
  ratter: Ratter
  folk: Folk
  behov: readonly Behov[]
  kanAndra: boolean
  onLaggTill: () => void
  onTaBort: (rad: Maltidsrad) => void
  onVem?: (rader: readonly Maltidsrad[]) => void
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
          {grupperaMaltid(synliga, (r) => atarnyckel(folk, r)).map((grupp) => (
            <Rattrad key={grupp.rader[0].id} grupp={grupp} ratter={ratter} folk={folk} behov={behov} kanAndra={kanAndra} onTaBort={onTaBort} onVem={onVem} vad={vad} />
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

/** Så många ingredienser visas innan resten fälls ihop. */
const KORT_LISTA = 3

/**
 * En rätt i måltiden. Ligger samma rätt flera gånger visas den en gång med antal, och Ta bort tar bort en av dem.
 * En egen rätt visar ingredienserna under namnet, och en orimlig portion får en varning.
 */
function Rattrad({
  grupp,
  ratter,
  folk,
  behov,
  kanAndra,
  onTaBort,
  onVem,
  vad,
}: {
  grupp: { rattId: string; rader: readonly Maltidsrad[] }
  ratter: Ratter
  folk: Folk
  behov: readonly Behov[]
  kanAndra: boolean
  onTaBort: (rad: Maltidsrad) => void
  onVem?: (rader: readonly Maltidsrad[]) => void
  vad: string
}) {
  const ratt = ratter.ratter.get(grupp.rattId)
  const portion = ratter.perPortion.get(grupp.rattId)
  if (!ratt || !portion) return null
  const antal = grupp.rader.length
  const pase = ratt.matprodukt_id ? ratter.pasar.get(ratt.matprodukt_id) : undefined
  // Varningar bara för påsar ur katalogen. Egna rätter har ingen kostinformation i första versionen.
  const lista = pase ? varningar(pase, behov) : []
  const per100 = kcalPer100g(portion.kcal, portion.gram)
  const ingredienser = ratt.matprodukt_id ? [] : (ratter.ingredienser.get(ratt.id) ?? [])
  const barsAv = grupp.rader[0].bars_av ?? null
  const barare = barsAv ? folk.personer.find((p) => p.id === barsAv) : undefined
  const atare = atarnyckel(folk, grupp.rader[0])
  const atarnamn = atare ? folk.personer.filter((p) => atare.split(',').includes(p.id)).map((p) => p.namn) : []
  const vemText = barare ? `Bärs av ${barare.namn}` : 'Ingen bär den än'
  return (
    // Namnet får hela rutans bredd. Energin och Ta bort står på raden under, så att långa namn går att läsa i smala rutor.
    <li className="space-y-0.5 rounded-knapp bg-muted/60 pt-2 pl-3">
      <p className="flex flex-wrap items-baseline gap-x-2 pr-3 text-[0.9375rem] leading-snug font-medium">
        <span className="min-w-0 break-words hyphens-auto">{ratt.namn}</span>
        {antal > 1 && <Bricka className="tabular-nums">{antal} st</Bricka>}
      </p>
      {ingredienser.length > 0 && <Ingredienser namn={ingredienser} />}
      {lista.length > 0 && (
        <ul className="space-y-0.5 pr-3 text-xs">
          {lista.map((v) => (
            <li key={v.text} className={cn(v.okand ? 'text-muted-foreground' : 'font-medium text-accent-strong')}>
              {v.text}
            </li>
          ))}
        </ul>
      )}
      {orimligPortion(portion) && <p className="pr-3 text-xs font-medium text-accent-strong">Ovanligt stor portion. Kontrollera mängderna.</p>}
      {atarnamn.length > 0 && <p className="pr-3 text-xs text-muted-foreground">Äts av {uppraknade(atarnamn)}</p>}
      <div className="flex items-center justify-between gap-1">
        <p className="py-2 text-xs text-muted-foreground tabular-nums">
          {portion.kcal > 0 ? (
            <>
              {formateraKcal(portion.kcal)} per portion
              {per100 !== null && <span className="block">{per100} kcal per 100 g</span>}
            </>
          ) : (
            'Energi saknas'
          )}
        </p>
        <span className="flex shrink-0 items-center">
          {kanAndra && onVem ? (
            <button
              type="button"
              onClick={() => onVem(grupp.rader)}
              aria-label={`${vemText}. Ändra vem som bär och äter ${ratt.namn}`}
              className="flex size-11 items-center justify-center rounded-knapp hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Barare namn={barare?.namn} farg={barsAv ? folk.farger.get(barsAv) : undefined} />
            </button>
          ) : (
            barare && (
              <span role="img" aria-label={vemText} className="flex size-11 items-center justify-center">
                <Barare namn={barare.namn} farg={folk.farger.get(barare.id)} />
              </span>
            )
          )}
          {kanAndra && (
            <Button variant="ghost" size="ikon" onClick={() => onTaBort(grupp.rader.at(-1)!)} aria-label={antal > 1 ? `Ta bort en portion ${ratt.namn} från ${vad}` : `Ta bort ${ratt.namn} från ${vad}`}>
              <X className="size-4" aria-hidden />
            </Button>
          )}
        </span>
      </div>
    </li>
  )
}

/** Den som bär en rätt som en liten bricka i sin färg, eller en streckad ring när ingen bär den. */
function Barare({ namn, farg }: { namn: string | undefined; farg: string | undefined }) {
  if (!namn) return <span aria-hidden className="size-7 rounded-full border-2 border-dashed border-muted-foreground/50" />
  return <Initial namn={namn} farg={farg} className="size-7 text-xs" />
}

/** Ingredienserna i en egen rätt: högst tre, och resten fälls ut. */
function Ingredienser({ namn }: { namn: readonly string[] }) {
  if (namn.length <= KORT_LISTA) return <p className="pr-3 text-xs break-words text-muted-foreground">{namn.join(', ')}</p>
  return (
    <details className="group pr-3 text-xs text-muted-foreground">
      <summary className="flex min-h-11 cursor-pointer items-center gap-1 break-words rounded-knapp focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-3.5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
        <span className="group-open:hidden">
          Ingredienser: {namn.slice(0, KORT_LISTA).join(', ')} och {namn.length - KORT_LISTA} till
        </span>
        <span className="hidden group-open:inline">Ingredienser</span>
      </summary>
      <p className="break-words">{namn.join(', ')}</p>
    </details>
  )
}
