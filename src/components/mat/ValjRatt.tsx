import { BookmarkPlus, Pencil, Search, Star } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { EgenRattFormular } from '@/components/mat/EgenRattFormular'
import { Kostfilterval } from '@/components/mat/Kostfilterval'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { useMatkatalog } from '@/hooks/useMatplan'
import type { Receptlage } from '@/hooks/useRecept'
import { formateraVikt } from '@/lib/forrad'
import { filterForGruppen, passarFilter, varningar, type Behov, type Kostfilter } from '@/lib/kost'
import { formateraKcal, kcalPer100g, naringForRader, PASAR_TILL, pasdetaljer, pasnamn, type Naring, type TolkadIngrediens } from '@/lib/mat'
import { rattTillRader, receptMedNamn, receptTillRader } from '@/lib/recept'
import { skafferietForst } from '@/lib/skafferi'
import type { Ingrediens, Maltid, Matprodukt, Ratt, Recept, Vara } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Ens egna favoriter och påsarna man har hemma, som visas först. Andras skafferier hämtas aldrig. */
export interface EgetSkafferi {
  favoriter: ReadonlySet<string>
  /** Antal hemma per påse, utan påsar vars bäst-före har passerat. */
  hemma: ReadonlyMap<string, number>
}

const TOMT_SKAFFERI: EgetSkafferi = { favoriter: new Set(), hemma: new Map() }

type Vy = { typ: 'lista' } | { typ: 'ny' } | { typ: 'andra'; ratt: Ratt }

type Flik = 'pasar' | 'egna' | 'recept'

const FLIKAR: readonly (readonly [Flik, string])[] = [
  ['pasar', 'Påsar'],
  ['egna', 'Egna rätter'],
  ['recept', 'Recept'],
]

/**
 * Panelen där man väljer en rätt till en måltid: en påse ur matkatalogen, en av turens egna rätter eller ett av
 * ens recept, som kopieras till turen. Påsarna är förfiltrerade efter gruppens kostbehov, och filtret går att ändra.
 */
export function ValjRatt({
  rubrik,
  maltid,
  ratter,
  perPortion,
  ingredienser,
  varor,
  behov,
  skafferi = TOMT_SKAFFERI,
  recept = [],
  onValjPase,
  onValjRecept,
  onSparaSomRecept,
  onValjRatt,
  onSparaRatt,
  onTaBortRatt,
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
  skafferi?: EgetSkafferi
  /** Ens egna recept. */
  recept?: Receptlage
  onValjPase: (p: Matprodukt) => Promise<boolean>
  /** Kopierar receptet till turen, eller använder en rätt med samma ingredienser, och lägger det i måltiden. */
  onValjRecept?: (r: Recept) => Promise<boolean>
  /** Sparar en egen rätt i turen som recept, eller uppdaterar receptet med samma namn. */
  onSparaSomRecept?: (namn: string, rader: TolkadIngrediens[]) => Promise<boolean>
  onValjRatt: (rattId: string) => Promise<boolean>
  /** Sparar en ny eller ändrad egen rätt. En ny läggs också i måltiden. */
  onSparaRatt: (rattId: string | null, namn: string, rader: TolkadIngrediens[]) => Promise<boolean>
  /** Tar bort en egen rätt ur turen. */
  onTaBortRatt: (rattId: string) => Promise<boolean>
  onStang: () => void
}) {
  const id = useId()
  const [flik, setFlik] = useState<Flik>('pasar')
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
    const forsta = ratt ? { namn: ratt.namn, rader: rattTillRader(ratt.id, ingredienser, varor) } : undefined
    return (
        <EgenRattFormular
          ram={(falt, knappar) => (
            <Panel
              etikett={ratt ? `Ändra ${ratt.namn}` : 'Ny egen rätt'}
              onStang={onStang}
              rubrik={<h2 className="text-2xl">{ratt ? 'Ändra rätten' : 'Ny egen rätt'}</h2>}
              fot={knappar}
            >
              {ratt && forsta && forsta.rader.length > 0 && onSparaSomRecept && (
                <SparaSomRecept
                  key={ratt.id}
                  namn={forsta.namn}
                  finns={Array.isArray(recept) && !!receptMedNamn(recept, forsta.namn)}
                  onSpara={() => onSparaSomRecept(forsta.namn, forsta.rader)}
                />
              )}
              {falt}
            </Panel>
          )}
          ny={!ratt}
          forsta={forsta}
          varor={varor}
          onAvbryt={() => setVy({ typ: 'lista' })}
          onTaBort={
            ratt
              ? async () => {
                  const ok = await onTaBortRatt(ratt.id)
                  if (ok) setVy({ typ: 'lista' })
                  return ok
                }
              : undefined
          }
          onSpara={async (namn, rader) => {
            const ok = await onSparaRatt(ratt?.id ?? null, namn, rader)
            if (ok && ratt) setVy({ typ: 'lista' })
            return ok
          }}
        />
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
          {FLIKAR.map(([varde, text], i) => (
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
                const annan = FLIKAR[(i + (e.key === 'ArrowRight' ? 1 : FLIKAR.length - 1)) % FLIKAR.length][0]
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
            <Pasar maltid={maltid} behov={behov} skafferi={skafferi} valjer={valjer} onValj={(p) => valj(() => onValjPase(p))} />
          ) : flik === 'recept' ? (
            <Receptlista recept={recept} valjer={valjer} onValj={(x) => onValjRecept && valj(() => onValjRecept(x))} />
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

/** Påsarna i katalogen, med sökning och filter. Favoriter och det man har hemma står först. */
function Pasar({
  maltid,
  behov,
  skafferi,
  valjer,
  onValj,
}: {
  maltid: Maltid
  behov: readonly Behov[]
  skafferi: EgetSkafferi
  valjer: boolean
  onValj: (p: Matprodukt) => void
}) {
  const id = useId()
  const { katalog, forsokIgen } = useMatkatalog()
  const [sok, setSok] = useState('')
  const [filter, setFilter] = useState<Kostfilter>(() => filterForGruppen(behov))
  const [allaMaltider, setAllaMaltider] = useState(false)

  const traffar = useMemo(() => {
    if (!Array.isArray(katalog)) return []
    const s = sok.trim().toLowerCase()
    const passar = katalog.filter(
      (p) =>
        (allaMaltider || PASAR_TILL[maltid].includes(p.maltid)) && passarFilter(p, filter) && (!s || pasnamn(p).toLowerCase().includes(s)),
    )
    return skafferietForst(passar, skafferi.favoriter, skafferi.hemma)
  }, [katalog, sok, filter, allaMaltider, maltid, skafferi])

  if (katalog === null) return <Listladdar text="Hämtar katalogen" />
  if (katalog === 'fel') return <Laddfel vad="katalogen" onForsokIgen={forsokIgen} />
  if (katalog.length === 0) return <TomtLage kompakt text="Det finns inga påsar i katalogen än. Lägg till en egen rätt i stället." />

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

      <Kostfilterval filter={filter} onAndra={setFilter} />

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
          <Pasrad key={p.id} pase={p} behov={behov} favorit={skafferi.favoriter.has(p.id)} hemma={skafferi.hemma.get(p.id) ?? 0} valjer={valjer} onValj={() => onValj(p)} />
        ))}
      </ul>
    </div>
  )
}

function Pasrad({
  pase,
  behov,
  favorit,
  hemma,
  valjer,
  onValj,
}: {
  pase: Matprodukt
  behov: readonly Behov[]
  favorit: boolean
  hemma: number
  valjer: boolean
  onValj: () => void
}) {
  const lista = varningar(pase, behov)
  const per100 = kcalPer100g(pase.kcal, pase.vikt_torr_g)
  return (
    <li className="py-1">
      <button type="button" disabled={valjer} onClick={onValj} className={cn('w-full space-y-1 rounded-md px-2 py-2.5 text-left hover:bg-muted disabled:opacity-60', fokus)}>
        <span className="flex items-start gap-2">
          <span className="min-w-0 flex-1 font-medium break-words">{pasnamn(pase)}</span>
          {favorit && <Star className="mt-0.5 size-4 shrink-0 fill-primary text-primary" aria-label="Favorit" role="img" />}
        </span>
        {hemma > 0 && <span className="block text-sm font-medium text-primary">Du har {hemma} hemma</span>}
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

/** Knappen som sparar en egen rätt i turen som recept på kontot. Det som är sparat i turen blir receptet. */
function SparaSomRecept({ namn, finns, onSpara }: { namn: string; finns: boolean; onSpara: () => Promise<boolean> }) {
  const [lage, setLage] = useState<'vilar' | 'sparar' | 'sparat' | 'fel'>('vilar')
  async function spara() {
    setLage('sparar')
    setLage((await onSpara()) ? 'sparat' : 'fel')
  }
  return (
    <div className="mb-5 space-y-2 rounded-md bg-muted p-3">
      <p className="text-sm">
        {finns ? `Du har redan ett recept som heter ${namn}. Det uppdateras med den här rättens ingredienser.` : 'Spara rätten som recept, så kan du lägga in den i andra turer.'}
      </p>
      <Button variant="outline" disabled={lage === 'sparar'} onClick={spara}>
        <BookmarkPlus className="size-4" aria-hidden />
        {finns ? 'Uppdatera receptet' : 'Spara som recept'}
      </Button>
      <p aria-live="polite" className="text-sm">
        {lage === 'sparat' && <span className="font-medium text-primary">Sparat i dina recept.</span>}
        {lage === 'fel' && <span className="text-destructive">Det gick inte att spara receptet. Kontrollera uppkopplingen och försök igen.</span>}
      </p>
    </div>
  )
}

/** Ens recept, med sökning. Ett tryck kopierar receptet till turen och lägger det i måltiden. */
function Receptlista({ recept, valjer, onValj }: { recept: Receptlage; valjer: boolean; onValj: (r: Recept) => void }) {
  const id = useId()
  const [sok, setSok] = useState('')
  if (recept === null) return <Listladdar text="Hämtar dina recept" />
  // Recepten hämtas av turens mat. Panelen kan stängas och öppnas igen, så här finns ingen Försök igen.
  if (recept === 'fel') return <Laddfel vad="dina recept" />
  if (recept.length === 0)
    return <TomtLage kompakt text="Du har inga recept än. Skapa dem under Matplanering, Recept, eller spara en egen rätt som recept när du ändrar den." />
  const s = sok.trim().toLowerCase()
  const traffar = recept.filter((r) => !s || r.namn.toLowerCase().includes(s))
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${id}-sok`} className="mb-1.5 block text-sm font-medium">
          Sök bland dina recept
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3 left-3 size-5 text-muted-foreground" aria-hidden />
          <Input id={`${id}-sok`} type="search" className="pl-10" value={sok} onChange={(e) => setSok(e.target.value)} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Receptet kopieras till turen. Ändrar du receptet senare ändras inte turen.</p>
      <ul className="divide-y divide-border">
        {traffar.map((r) => {
          const portion = naringForRader(receptTillRader(r))
          return (
            <li key={r.id} className="py-1">
              <button
                type="button"
                disabled={valjer}
                onClick={() => onValj(r)}
                className={cn('min-h-11 w-full rounded-md px-2 py-2 text-left hover:bg-muted disabled:opacity-60', fokus)}
              >
                <span className="block font-medium break-words">{r.namn}</span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {formateraKcal(portion.kcal)} per portion, {formateraVikt(portion.gram)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {traffar.length === 0 && <p className="text-muted-foreground">Inget recept passar sökningen.</p>}
    </div>
  )
}

/** Laddläget för en lista i panelen: några rader i listans form. */
function Listladdar({ text }: { text: string }) {
  return (
    <Laddar text={text} className="space-y-3">
      <Skelett className="h-14 rounded-lg" />
      <Skelett className="h-14 rounded-lg" />
      <Skelett className="h-14 rounded-lg" />
    </Laddar>
  )
}
