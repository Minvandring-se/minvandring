import { Pencil, Plus } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { useTur } from '@/components/tur/turKontext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { knappStil } from '@/components/ui/knappStil'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { Select } from '@/components/ui/select'
import { sparaEtapp, taBortEtapp, useEtapper } from '@/hooks/useEtapper'
import { dagensDatum } from '@/lib/datum'
import {
  BOENDEN,
  etappdagar,
  etappfalt,
  etapprubrik,
  etappsumma,
  kanBokas,
  kmFran,
  kmText,
  MAX_NOTERING,
  MAX_TEXT,
  nattText,
  tolkaEtapp,
  type Etappdag,
  type Etappfalt,
  type Etappsumma,
} from '@/lib/etapper'
import { kanAndra as rollKanAndra } from '@/lib/roller'
import { turdelAdress } from '@/lib/turdelar'
import type { Boende, Etapp } from '@/lib/typer'
import { cn } from '@/lib/utils'

const FELTEXT = 'Det gick inte att spara. Kontrollera uppkopplingen och försök igen.'
const TOMFEL = 'Det gick inte att tömma dagen. Kontrollera uppkopplingen och försök igen.'

/** Dagsetapperna: summeringen och dag för dag var ni går, hur långt och var ni sover. Ägare och redigerare ändrar. */
export function TurEtapper() {
  const { tur, minRoll } = useTur()
  const { lage, laddaOm } = useEtapper(tur.id)
  const kanAndra = rollKanAndra(minRoll)
  const [oppen, setOppen] = useState<number | null>(null)

  if (!tur.dagar) {
    return (
      <TomtLage
        rubrik="Hur många dagar är turen?"
        text="Etapperna delas upp dag för dag. Ange antalet vandringsdagar i översikten först."
        knapp={
          <Link to={turdelAdress(tur.id, 'oversikt')} className={knappStil({ variant: 'outline' })}>
            Till översikten
          </Link>
        }
      />
    )
  }
  if (lage.lage === 'laddar') {
    return (
      <Laddar text="Hämtar etapperna" className="space-y-4">
        <Skelett className="h-24 rounded-yta" />
        <Skelett className="h-72 rounded-ruta" />
      </Laddar>
    )
  }
  if (lage.lage === 'fel') return <Laddfel vad="etapperna" onForsokIgen={laddaOm} />

  const dagar = etappdagar(tur.dagar, lage.etapper)
  const summa = etappsumma(dagar)

  return (
    <div className="space-y-5">
      {!kanAndra && <p className="text-muted-foreground">Du är läsare. Ägare och redigerare planerar etapperna.</p>}
      <Summering summa={summa} dagar={tur.dagar} />
      <Sektion rubrik="Dag för dag">
        <ol>
          {dagar.map((d, i) => (
            <Dag
              key={d.dag}
              dag={d}
              igar={i > 0 ? dagar[i - 1].etapp : null}
              sista={i === dagar.length - 1}
              datum={d.efterTuren ? null : dagensDatum(tur.avresa, d.dag)}
              kanAndra={kanAndra}
              oppen={oppen === d.dag}
              onOppna={() => setOppen(d.dag)}
              onStang={() => setOppen(null)}
              onSpara={async (varden) => {
                const ok = await sparaEtapp(tur.id, d.dag, varden)
                if (ok) {
                  await laddaOm()
                  setOppen(null)
                }
                return ok
              }}
              onTaBort={async (id) => {
                const ok = await taBortEtapp(id)
                if (ok) {
                  await laddaOm()
                  setOppen(null)
                }
                return ok
              }}
            />
          ))}
        </ol>
      </Sektion>
    </div>
  )
}

function Summering({ summa, dagar }: { summa: Etappsumma; dagar: number }) {
  return (
    <div className="space-y-2">
      <Nyckeltal
        varden={[
          { etikett: 'Sträcka', varde: summa.km > 0 ? kmText(summa.km) : 'Ingen än' },
          { etikett: 'Längsta dagen', varde: summa.langsta ? `${kmText(summa.langsta.km)}, dag ${summa.langsta.dag}` : 'Ingen än' },
          { etikett: 'Planerat', varde: `${summa.planerade} av ${dagar} dagar` },
        ]}
      />
      {summa.km > 0 && summa.utanKm > 0 && (
        <p className="text-sm text-muted-foreground">
          {summa.utanKm === 1 ? 'En dag saknar sträcka' : `${summa.utanKm} dagar saknar sträcka`} och räknas inte in.
        </p>
      )}
      {summa.obokade.length > 0 && (
        <p className="text-sm font-semibold text-accent-strong">
          Inte bokat: {summa.obokade.length === 1 ? 'dag' : 'dagarna'} {lista(summa.obokade)}
        </p>
      )}
    </div>
  )
}

/** "2", "2 och 4", "1, 2 och 4". */
function lista(tal: readonly number[]): string {
  return tal.length <= 1 ? tal.join('') : `${tal.slice(0, -1).join(', ')} och ${tal[tal.length - 1]}`
}

function Dag({
  dag,
  igar,
  sista,
  datum,
  kanAndra,
  oppen,
  onOppna,
  onStang,
  onSpara,
  onTaBort,
}: {
  dag: Etappdag
  igar: Etapp | null
  sista: boolean
  datum: string | null
  kanAndra: boolean
  oppen: boolean
  onOppna: () => void
  onStang: () => void
  onSpara: (varden: Parameters<typeof sparaEtapp>[2]) => Promise<boolean>
  onTaBort: (id: string) => Promise<boolean>
}) {
  const { etapp } = dag
  const rubrik = etapprubrik(etapp)
  const km = kmFran(etapp?.km)
  const natt = nattText(etapp)
  const forsta = dag.dag === 1

  return (
    <li className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 py-2.5">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
            forsta ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary',
          )}
        >
          {dag.dag}
        </span>
        {!sista && <span className="mt-1.5 min-h-7 w-0.5 flex-1 bg-border" />}
      </div>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              Dag {dag.dag}
              {datum && `, ${datum}`}
              {dag.efterTuren && ', efter turens sista vandringsdag'}
            </p>
            <h3 className="font-sans text-base font-semibold break-words">{rubrik ?? (etapp ? 'Utan plats' : 'Inte planerad')}</h3>
          </div>
          {km !== null && <span className="shrink-0 text-base font-semibold tabular-nums">{kmText(km)}</span>}
        </div>
        {(natt || etapp?.notering) && (
          <p className="text-sm break-words text-muted-foreground">
            {natt}
            {natt && kanBokas(etapp?.boende ?? null) && (etapp?.bokad ? '. Bokad' : <span className="font-semibold text-accent-strong">. Inte bokad</span>)}
            {natt && etapp?.notering && <br />}
            {etapp?.notering}
          </p>
        )}
        {oppen ? (
          <EtappFormular dag={dag} igar={igar} onSpara={onSpara} onTaBort={onTaBort} onAvbryt={onStang} />
        ) : (
          kanAndra && (
            <Button variant="outline" onClick={onOppna} aria-label={etapp ? `Ändra dag ${dag.dag}` : `Planera dag ${dag.dag}`}>
              {etapp ? <Pencil className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {etapp ? 'Ändra' : 'Planera dagen'}
            </Button>
          )
        )}
      </div>
    </li>
  )
}

function EtappFormular({
  dag,
  igar,
  onSpara,
  onTaBort,
  onAvbryt,
}: {
  dag: Etappdag
  igar: Etapp | null
  onSpara: (varden: Parameters<typeof sparaEtapp>[2]) => Promise<boolean>
  onTaBort: (id: string) => Promise<boolean>
  onAvbryt: () => void
}) {
  const id = useId()
  const [falt, setFalt] = useState<Etappfalt>(() => etappfalt(dag.etapp, igar))
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState('')
  const [tomFraga, setTomFraga] = useState(false)
  const andra = <K extends keyof Etappfalt>(k: K, v: Etappfalt[K]) => setFalt((f) => ({ ...f, [k]: v }))

  async function spara(e: FormEvent) {
    e.preventDefault()
    const tolkat = tolkaEtapp(falt)
    if (!tolkat.ok) {
      setFel(tolkat.fel)
      return
    }
    setSparar(true)
    setFel('')
    const ok = await onSpara(tolkat.varden)
    setSparar(false)
    if (!ok) setFel(FELTEXT)
  }

  async function tom() {
    if (!dag.etapp) return
    setSparar(true)
    setFel('')
    const ok = await onTaBort(dag.etapp.id)
    setSparar(false)
    if (!ok) setFel(TOMFEL)
  }

  return (
    <form onSubmit={spara} aria-label={`Dag ${dag.dag}`} className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 min-[28rem]:grid-cols-2">
        <Falt id={`${id}-fran`} etikett="Från">
          <Input id={`${id}-fran`} autoFocus maxLength={MAX_TEXT} value={falt.fran} onChange={(e) => andra('fran', e.target.value)} placeholder="T.ex. Abisko" />
        </Falt>
        <Falt id={`${id}-till`} etikett="Till">
          <Input id={`${id}-till`} maxLength={MAX_TEXT} value={falt.till} onChange={(e) => andra('till', e.target.value)} placeholder="T.ex. Abiskojaure" />
        </Falt>
      </div>
      <Falt id={`${id}-km`} etikett="Sträcka i km">
        <Input id={`${id}-km`} inputMode="decimal" className="max-w-32" value={falt.km} onChange={(e) => andra('km', e.target.value)} placeholder="15" />
      </Falt>
      <div className="grid grid-cols-1 gap-3 min-[28rem]:grid-cols-2">
        <Falt id={`${id}-natt`} etikett="Var ni sover">
          <Input id={`${id}-natt`} maxLength={MAX_TEXT} value={falt.natt} onChange={(e) => andra('natt', e.target.value)} placeholder="T.ex. Abiskojaure fjällstuga" />
        </Falt>
        <Falt id={`${id}-boende`} etikett="Boende">
          <Select id={`${id}-boende`} value={falt.boende} onChange={(e) => andra('boende', e.target.value as Boende | '')}>
            <option value="">Inget valt</option>
            {BOENDEN.map((b) => (
              <option key={b.nyckel} value={b.nyckel}>
                {b.etikett}
              </option>
            ))}
          </Select>
        </Falt>
      </div>
      {kanBokas(falt.boende || null) && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={falt.bokad} onChange={(e) => andra('bokad', e.target.checked)} className="size-5 shrink-0 accent-primary" />
          Bokad
        </label>
      )}
      <Falt id={`${id}-notering`} etikett="Anteckning">
        <Input id={`${id}-notering`} maxLength={MAX_NOTERING} value={falt.notering} onChange={(e) => andra('notering', e.target.value)} placeholder="T.ex. vadställe efter 8 km" />
      </Falt>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Sparar …' : 'Spara'}
        </Button>
        <Button type="button" variant="outline" onClick={onAvbryt}>
          Avbryt
        </Button>
        {dag.etapp &&
          (tomFraga ? (
            <Button type="button" variant="ghost" className="text-destructive" disabled={sparar} onClick={tom}>
              Ja, töm dagen
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => setTomFraga(true)}>
              Töm dagen
            </Button>
          ))}
      </div>
    </form>
  )
}

function Falt({ id, etikett, children }: { id: string; etikett: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {etikett}
      </label>
      {children}
    </div>
  )
}
