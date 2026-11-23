import { ChevronDown, Pencil, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { EgenRattFormular } from '@/components/mat/EgenRattFormular'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { useMatkatalog } from '@/hooks/useMatplan'
import { formateraVikt } from '@/lib/forrad'
import { ALLERGENER, filterForGruppen, KOSTVAL, passarFilter, varningar, type Allergen, type Behov, type Kostfilter, type Kostval } from '@/lib/kost'
import { formateraKcal, kcalPer100g, PASAR_TILL, pasdetaljer, pasnamn, type Naring, type TolkadIngrediens } from '@/lib/mat'
import type { Ingrediens, Maltid, Matprodukt, Ratt, Vara } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const knapp = (vald: boolean) =>
  cn(
    'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
    fokus,
    vald ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-border bg-card hover:bg-muted',
  )

type Vy = { typ: 'lista' } | { typ: 'ny' } | { typ: 'andra'; ratt: Ratt }

/**
 * Panelen där man väljer en rätt till en måltid: en påse ur matkatalogen eller en av turens egna rätter.
 * Påsarna är förfiltrerade efter gruppens kostbehov, och filtret går att ändra.
 */
export function ValjRatt({
  rubrik,
  maltid,
  ratter,
  perPortion,
  ingredienser,
  varor,
  behov,
  onValjPase,
  onValjRatt,
  onSparaRatt,
  onStang,
}: {
  /** Till exempel "Frukost, dag 2". */
  rubrik: string
  maltid: Maltid
  ratter: readonly Ratt[]
  perPortion: ReadonlyMap<string, Naring>
  ingredienser: readonly Ingrediens[]
  varor: readonly Vara[]
  behov: readonly Behov[]
  onValjPase: (p: Matprodukt) => Promise<boolean>
  onValjRatt: (rattId: string) => Promise<boolean>
  /** Sparar en ny eller ändrad egen rätt. En ny läggs också i måltiden. */
  onSparaRatt: (rattId: string | null, namn: string, rader: TolkadIngrediens[]) => Promise<boolean>
  onStang: () => void
}) {
  const id = useId()
  const [flik, setFlik] = useState<'pasar' | 'egna'>('pasar')
  const [vy, setVy] = useState<Vy>({ typ: 'lista' })
  const [fel, setFel] = useState(false)
  const [valjer, setValjer] = useState(false)

  async function valj(gor: () => Promise<boolean>) {
    setFel(false)
    setValjer(true)
    const ok = await gor()
    setValjer(false)
    if (!ok) setFel(true)
  }

  const egna = ratter.filter((r) => !r.matprodukt_id)

  if (vy.typ !== 'lista') {
    const ratt = vy.typ === 'andra' ? vy.ratt : null
    const forsta = ratt
      ? {
          namn: ratt.namn,
          rader: ingredienser
            .filter((i) => i.ratt_id === ratt.id)
            .flatMap((i) => {
              const vara = varor.find((v) => v.id === i.vara_id)
              return vara ? [{ vara, gram: i.gram_per_portion }] : []
            }),
        }
      : undefined
    return (
      <Panel etikett={ratt ? `Ändra ${ratt.namn}` : 'Ny egen rätt'} onStang={onStang} rubrik={<h2 className="text-2xl">{ratt ? 'Ändra rätten' : 'Ny egen rätt'}</h2>}>
        <EgenRattFormular
          ny={!ratt}
          forsta={forsta}
          varor={varor}
          onAvbryt={() => setVy({ typ: 'lista' })}
          onSpara={async (namn, rader) => {
            const ok = await onSparaRatt(ratt?.id ?? null, namn, rader)
            if (ok && ratt) setVy({ typ: 'lista' })
            return ok
          }}
        />
      </Panel>
    )
  }

  return (
    <Panel
      etikett={`Välj rätt till ${rubrik.toLowerCase()}`}
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          <h2 className="text-2xl">Välj rätt</h2>
          <p className="text-sm text-muted-foreground">{rubrik}</p>
        </div>
      }
    >
      <div className="space-y-4">
        <div role="tablist" aria-label="Typ av rätt" className="flex gap-2">
          {(
            [
              ['pasar', 'Påsar'],
              ['egna', 'Egna rätter'],
            ] as const
          ).map(([varde, text]) => (
            <button
              key={varde}
              type="button"
              role="tab"
              id={`${id}-flik-${varde}`}
              aria-selected={flik === varde}
              aria-controls={`${id}-innehall`}
              tabIndex={flik === varde ? 0 : -1}
              onClick={() => setFlik(varde)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.preventDefault()
                const annan = varde === 'pasar' ? 'egna' : 'pasar'
                setFlik(annan)
                document.getElementById(`${id}-flik-${annan}`)?.focus()
              }}
              className={cn(
                'h-11 rounded-full border px-5 text-sm font-medium transition-colors',
                fokus,
                flik === varde ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
              )}
            >
              {text}
            </button>
          ))}
        </div>

        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att lägga till rätten. Kontrollera uppkopplingen och försök igen.
          </p>
        )}

        <div id={`${id}-innehall`} role="tabpanel" aria-labelledby={`${id}-flik-${flik}`}>
          {flik === 'pasar' ? (
            <Pasar maltid={maltid} behov={behov} valjer={valjer} onValj={(p) => valj(() => onValjPase(p))} />
          ) : (
            <div className="space-y-4">
              <Button variant="outline" onClick={() => setVy({ typ: 'ny' })}>
                Ny egen rätt
              </Button>
              {egna.length === 0 ? (
                <p className="text-muted-foreground">Turen har inga egna rätter än.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {egna.map((r) => {
                    const portion = perPortion.get(r.id)
                    return (
                      <li key={r.id} className="flex items-center gap-2 py-1">
                        <button type="button" disabled={valjer} onClick={() => valj(() => onValjRatt(r.id))} className={cn('min-h-11 min-w-0 flex-1 rounded-md px-2 py-2 text-left hover:bg-muted', fokus)}>
                          <span className="block font-medium break-words">{r.namn}</span>
                          {portion && <span className="block text-sm text-muted-foreground tabular-nums">{formateraKcal(portion.kcal)} per portion, {formateraVikt(portion.gram)}</span>}
                        </button>
                        <Button variant="ghost" size="ikon" aria-label={`Ändra ${r.namn}`} onClick={() => setVy({ typ: 'andra', ratt: r })}>
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

/** Påsarna i katalogen, med sökning och filter. */
function Pasar({ maltid, behov, valjer, onValj }: { maltid: Maltid; behov: readonly Behov[]; valjer: boolean; onValj: (p: Matprodukt) => void }) {
  const id = useId()
  const katalog = useMatkatalog()
  const [sok, setSok] = useState('')
  const [filter, setFilter] = useState<Kostfilter>(() => filterForGruppen(behov))
  const [allaMaltider, setAllaMaltider] = useState(false)
  const [visaAllergener, setVisaAllergener] = useState(filter.utan.length > 0)

  const traffar = useMemo(() => {
    if (!Array.isArray(katalog)) return []
    const s = sok.trim().toLowerCase()
    return katalog.filter(
      (p) =>
        (allaMaltider || PASAR_TILL[maltid].includes(p.maltid)) && passarFilter(p, filter) && (!s || pasnamn(p).toLowerCase().includes(s)),
    )
  }, [katalog, sok, filter, allaMaltider, maltid])

  if (katalog === null) return <p role="status" className="text-muted-foreground">Hämtar katalogen …</p>
  if (katalog === 'fel')
    return (
      <p role="alert" className="text-destructive">
        Det gick inte att hämta katalogen. Kontrollera uppkopplingen och försök igen.
      </p>
    )
  if (katalog.length === 0) return <p className="text-muted-foreground">Det finns inga påsar i katalogen än. Lägg till en egen rätt i stället.</p>

  const vaxlaVal = (val: Kostval) =>
    setFilter((f) => ({ ...f, val: f.val.includes(val) ? f.val.filter((v) => v !== val) : [...f.val, val] }))
  const vaxlaAllergen = (a: Allergen) =>
    setFilter((f) => ({ ...f, utan: f.utan.includes(a) ? f.utan.filter((x) => x !== a) : [...f.utan, a] }))

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-sok`} className="mb-1.5 block text-sm font-medium">
          Sök bland påsarna
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 size-5 text-muted-foreground" aria-hidden />
          <Input id={`${id}-sok`} type="search" className="pl-10" placeholder="Märke eller namn" value={sok} onChange={(e) => setSok(e.target.value)} />
        </div>
      </div>

      <div role="group" aria-label="Kost" className="flex flex-wrap gap-2">
        {KOSTVAL.map((k) => (
          <button key={k.nyckel} type="button" aria-pressed={filter.val.includes(k.nyckel)} onClick={() => vaxlaVal(k.nyckel)} className={knapp(filter.val.includes(k.nyckel))}>
            {k.etikett}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          aria-expanded={visaAllergener}
          aria-controls={`${id}-allergener`}
          onClick={() => setVisaAllergener((v) => !v)}
          className={cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary', fokus)}
        >
          Utan allergener{filter.utan.length > 0 && ` (${filter.utan.length})`}
          <ChevronDown className={cn('size-4 transition-transform', visaAllergener && 'rotate-180')} aria-hidden />
        </button>
        <div id={`${id}-allergener`} role="group" aria-label="Utan allergener" hidden={!visaAllergener} className="flex flex-wrap gap-2">
          {ALLERGENER.map((a) => (
            <button key={a.nyckel} type="button" aria-pressed={filter.utan.includes(a.nyckel)} onClick={() => vaxlaAllergen(a.nyckel)} className={knapp(filter.utan.includes(a.nyckel))}>
              Utan {a.etikett.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {behov.length > 0 && (filter.val.length > 0 || filter.utan.length > 0) && (
        <p className="text-sm text-muted-foreground">Filtret följer gruppens kostbehov. Okänt räknas inte som att påsen passar.</p>
      )}

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input type="checkbox" checked={allaMaltider} onChange={(e) => setAllaMaltider(e.target.checked)} className="size-5 accent-primary" />
        Visa påsar för alla måltider
      </label>

      <p aria-live="polite" className="text-sm text-muted-foreground">
        {traffar.length === 1 ? 'En påse' : `${traffar.length} påsar`}
      </p>

      <ul className="divide-y divide-border">
        {traffar.map((p) => (
          <Pasrad key={p.id} pase={p} behov={behov} valjer={valjer} onValj={() => onValj(p)} />
        ))}
      </ul>
    </div>
  )
}

function Pasrad({ pase, behov, valjer, onValj }: { pase: Matprodukt; behov: readonly Behov[]; valjer: boolean; onValj: () => void }) {
  const lista = varningar(pase, behov)
  const per100 = kcalPer100g(pase.kcal, pase.vikt_torr_g)
  return (
    <li className="py-1">
      <button type="button" disabled={valjer} onClick={onValj} className={cn('w-full space-y-1 rounded-md px-2 py-2.5 text-left hover:bg-muted disabled:opacity-60', fokus)}>
        <span className="block font-medium break-words">{pasnamn(pase)}</span>
        <span className="block text-sm tabular-nums">
          {formateraVikt(pase.vikt_torr_g)}, {formateraKcal(pase.kcal)}
          {per100 !== null && `, ${per100} kcal per 100 g`}
          {pase.portioner > 1 && `, ${pase.portioner} portioner`}
        </span>
        <span className="block text-sm text-muted-foreground">{pasdetaljer(pase).join('. ')}</span>
        {lista.map((v) => (
          <span key={v.text} className={cn('block text-sm', v.okand ? 'text-muted-foreground' : 'font-medium text-accent-strong')}>
            {v.text}
          </span>
        ))}
      </button>
    </li>
  )
}
