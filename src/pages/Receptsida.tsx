import { ChevronLeft, ExternalLink, Minus, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Matflikar } from '@/components/mat/Matflikar'
import { Receptbrickor } from '@/components/mat/MinvandringsRecept'
import { ReceptISkafferiet } from '@/components/mat/ReceptISkafferiet'
import { Receptbild } from '@/components/mat/Receptbild'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { Select } from '@/components/ui/select'
import { sparaEgenRatt } from '@/hooks/useMatplan'
import { hamtaTurlage, useReceptkatalog, useRedigerbaraTurer, type Turlage } from '@/hooks/useReceptkatalog'
import { sparaRecept, useRecept } from '@/hooks/useRecept'
import { useSidtitel } from '@/hooks/useSidtitel'
import { allergenetikett, uppraknade, varningarForRatt } from '@/lib/kost'
import { ledigtNamn, valForRecept } from '@/lib/recept'
import {
  allergenrad,
  kcalPerPortion,
  kostdelar,
  mangdtext,
  MAX_PERSONER,
  MIN_PERSONER,
  RECEPTMALTID_ETIKETT,
  receptPerPortion,
  skalaRecept,
  stegPerPlats,
  tidtext,
  type Katalogrecept,
} from '@/lib/receptkatalog'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const RECEPT = '/matplanering/recept'
const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline underline-offset-4', fokus)

/**
 * Ett av MinVandrings recept: beskrivning, portioner, ingredienser, steg hemma och på turen och källan. Receptet kan
 * läggas i en tur, där det blir en egen rätt, eller sparas som eget recept. Texterna kommer från receptkatalogen.
 */
export function Receptsida() {
  const { id } = useParams()
  const katalog = useReceptkatalog()
  const recept = Array.isArray(katalog) ? katalog.find((r) => r.id === id) : undefined
  useSidtitel(recept?.namn ?? 'Recept')

  return (
    <div className="space-y-6">
      <Matflikar />
      {katalog === null && (
        <Laddar text="Hämtar receptet" className="space-y-3">
          <Skelett className="h-48 rounded-lg" />
          <Skelett className="h-24 rounded-lg" />
        </Laddar>
      )}
      {katalog === 'fel' && <Laddfel vad="receptet" />}
      {Array.isArray(katalog) && !recept && (
        <TomtLage
          kompakt
          rubrik="Receptet finns inte"
          text="Adressen kan vara fel, eller så har receptet tagits bort."
          knapp={
            <Link to={RECEPT} className={knappStil({ variant: 'outline' })}>
              Alla recept
            </Link>
          }
        />
      )}
      {recept && <Receptet recept={recept} />}
    </div>
  )
}

const begransa = (n: number) => Math.min(MAX_PERSONER, Math.max(MIN_PERSONER, n))

function Receptet({ recept }: { recept: Katalogrecept }) {
  const [adress] = useSearchParams()
  const steg = stegPerPlats(recept.steg)
  const allergener = allergenrad(recept)
  const kcal = kcalPerPortion(recept)
  // Antal personer börjar på receptets portioner. Väljs en tur tar det turens antal, tills man ändrar det själv.
  const [personer, setPersoner] = useState(() => begransa(recept.portioner))
  const andrat = useRef(false)
  const ingredienser = skalaRecept([...recept.ingredienser].sort((a, b) => a.ordning - b.ordning), recept.portioner, personer)

  function andraPersoner(n: number) {
    andrat.current = true
    setPersoner(begransa(n))
  }

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      {/* Bilden är 5:2, så den visas hel även i mobil. Platshållaren är högre i mobil. */}
      <Receptbild recept={recept} typ="vy" className={cn('w-full rounded-yta', recept.bild ? 'aspect-[5/2]' : 'aspect-[16/9] sm:aspect-[5/2]')} />
      <div className="space-y-3">
        <Link to={RECEPT} className={cn('-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary', fokus)}>
          <ChevronLeft className="size-4" aria-hidden />
          Alla recept
        </Link>
        <p className="text-sm text-muted-foreground">
          {RECEPTMALTID_ETIKETT[recept.maltid]}, {recept.portioner === 1 ? '1 portion' : `${recept.portioner} portioner`}
        </p>
        <h1 className="text-[2rem] leading-tight break-words lg:text-[2.5rem]">{recept.namn}</h1>
        <p className="max-w-prose text-lg">{recept.beskrivning}</p>
        <Receptbrickor recept={recept} />
        <ReceptISkafferiet koppling={{ receptkatalog_id: recept.id }} namn={recept.namn} />
      </div>

      <Atgarder recept={recept} startTur={adress.get('tur') ?? ''} onTurPersoner={(n) => !andrat.current && n > 0 && setPersoner(begransa(n))} />

      <section aria-labelledby="ingredienser" className="space-y-3">
        <h2 id="ingredienser" className="text-xl">
          Ingredienser
        </h2>
        <Personvaljare personer={personer} onAndra={andraPersoner} />
        {recept.mangder === 'egna' && <p className="text-sm text-muted-foreground">Källan saknade mängder, så vi har satt dem.</p>}
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {ingredienser.map((i) => (
            <li key={i.ordning} className="flex gap-3 px-4 py-2.5">
              <span className="w-20 shrink-0 tabular-nums text-muted-foreground">{mangdtext(i)}</span>
              <span className="min-w-0 flex-1">
                <span className="block break-words">{i.ingrediens}</span>
                {(i.kommentar || i.packas !== 'hemma') && (
                  <span className="block text-sm text-muted-foreground">
                    {[i.packas === 'separat' && 'Packas för sig', i.packas === 'pa_plats' && 'På plats', i.kommentar].filter(Boolean).join('. ')}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium">{kcal === null ? 'Kcal går inte att räkna än.' : `Cirka ${kcal.toLocaleString('sv-SE')} kcal per portion.`}</p>
        <p className="text-sm">
          {allergener.innehaller.length > 0 ? `Innehåller ${uppraknade(allergener.innehaller.map((a) => allergenetikett(a).toLowerCase()))}.` : allergener.okanda === 0 ? 'Ingen av de 14 allergenerna.' : ''}
          {allergener.okanda > 0 && (
            <span className="text-muted-foreground">
              {' '}
              Allergenerna är okända för {allergener.okanda === 1 ? 'en ingrediens' : `${allergener.okanda} ingredienser`}, så kontrollera förpackningarna.
            </span>
          )}
        </p>
      </section>

      {steg.hemma.length > 0 && <Steglista rubrik="Hemma" steg={steg.hemma} />}
      {steg.turen.length > 0 && <Steglista rubrik="På turen" steg={steg.turen} />}

      <p className="border-t border-border pt-4 text-sm">
        Inspirerat av{' '}
        <a href={recept.inspirerat_av_url} target="_blank" rel="noopener noreferrer" className={lankKlass}>
          {recept.inspirerat_av}
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(öppnas i ny flik)</span>
        </a>
      </p>
    </article>
  )
}

/** Minus och plus för antal personer, 1 till 12. Mängderna räknas om direkt. */
function Personvaljare({ personer, onAndra }: { personer: number; onAndra: (n: number) => void }) {
  const id = useId()
  const knapp = knappStil({ variant: 'outline', size: 'ikon' })
  return (
    <div role="group" aria-labelledby={id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2">
      <span id={id} className="font-medium">
        Antal personer
      </span>
      <span className="flex items-center gap-2">
        <button type="button" className={knapp} aria-label="En person färre" disabled={personer <= MIN_PERSONER} onClick={() => onAndra(personer - 1)}>
          <Minus className="size-5" aria-hidden />
        </button>
        <output aria-live="polite" className="w-8 text-center text-lg font-semibold tabular-nums">
          {personer}
        </output>
        <button type="button" className={knapp} aria-label="En person fler" disabled={personer >= MAX_PERSONER} onClick={() => onAndra(personer + 1)}>
          <Plus className="size-5" aria-hidden />
        </button>
      </span>
    </div>
  )
}

function Steglista({ rubrik, steg }: { rubrik: string; steg: Katalogrecept['steg'] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl">
        {rubrik}
      </h2>
      <ol className="space-y-3">
        {steg.map((s, n) => (
          <li key={s.steg_nr} className="flex gap-3">
            <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary tabular-nums">
              {n + 1}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              {s.steg}
              {s.tid_min && <span className="block text-sm text-muted-foreground">{tidtext(s.tid_min)}</span>}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

type Lage = { typ: 'vila' } | { typ: 'sparar' } | { typ: 'klart'; text: string; till?: { adress: string; text: string } } | { typ: 'fel'; text: string }

/** Lägg i turen och Spara som eget recept. Båda kopierar receptet, så att katalogen aldrig ändras. */
function Atgarder({ recept, startTur, onTurPersoner }: { recept: Katalogrecept; startTur: string; onTurPersoner: (personer: number) => void }) {
  const id = useId()
  const turer = useRedigerbaraTurer()
  const { recept: egna, laddaOm } = useRecept()
  const [turId, setTurId] = useState('')
  const [turlage, setTurlage] = useState<{ turId: string; lage: Turlage | null } | null>(null)
  const [lage, setLage] = useState<Lage>({ typ: 'vila' })
  const rader = receptPerPortion(recept)
  const aktuellt = turlage?.turId === turId ? turlage.lage : undefined
  const varningar = aktuellt ? varningarForRatt(kostdelar(recept), aktuellt.behov) : []

  async function valjTur(ny: string) {
    setTurId(ny)
    setLage({ typ: 'vila' })
    if (!ny) return
    const hamtat = await hamtaTurlage(ny)
    setTurlage({ turId: ny, lage: hamtat })
    if (hamtat) onTurPersoner(hamtat.personer)
  }

  // Kommer man från en tur (?tur= i adressen) är den vald från början, om man får lägga recept i den.
  const startad = useRef(false)
  useEffect(() => {
    if (startad.current || !startTur || !Array.isArray(turer) || !turer.some((t) => t.id === startTur)) return
    startad.current = true
    void hamtaTurlage(startTur).then((hamtat) => {
      setTurId(startTur)
      setTurlage({ turId: startTur, lage: hamtat })
      if (hamtat) onTurPersoner(hamtat.personer)
    })
  }, [startTur, turer, onTurPersoner])

  async function laggITuren() {
    if (!aktuellt) return
    setLage({ typ: 'sparar' })
    const val = valForRecept(recept.namn, rader, aktuellt.ratter, aktuellt.ingredienser, aktuellt.varor)
    const till = { adress: `/tur/${turId}/mat`, text: 'Till turens mat' }
    if (val.typ === 'befintlig') return setLage({ typ: 'klart', text: `${val.namn} finns redan i turen med samma ingredienser.`, till })
    const rattId = await sparaEgenRatt(turId, null, val.namn, rader)
    if (!rattId) return setLage({ typ: 'fel', text: 'Det gick inte att lägga receptet i turen. Kontrollera uppkopplingen och försök igen.' })
    setTurlage({ turId, lage: await hamtaTurlage(turId) })
    setLage({ typ: 'klart', text: `${val.namn} ligger nu bland turens egna rätter. Välj den under Egna rätter när du planerar en måltid.`, till })
  }

  async function sparaSomEget() {
    if (!Array.isArray(egna)) return
    setLage({ typ: 'sparar' })
    const namn = ledigtNamn(recept.namn, egna.map((r) => r.namn))
    const ny = await sparaRecept(null, namn, rader)
    if (!ny) return setLage({ typ: 'fel', text: 'Det gick inte att spara receptet. Kontrollera uppkopplingen och försök igen.' })
    await laddaOm()
    setLage({ typ: 'klart', text: `Sparat bland dina recept som ${namn}. Där kan du ändra det.`, till: { adress: RECEPT, text: 'Till dina recept' } })
  }

  const sparar = lage.typ === 'sparar'

  return (
    <section aria-label="Använd receptet" className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1">
          <label htmlFor={`${id}-tur`} className="block text-sm font-medium">
            Lägg i turen
          </label>
          <Select id={`${id}-tur`} value={turId} disabled={!Array.isArray(turer) || turer.length === 0} onChange={(e) => void valjTur(e.target.value)}>
            <option value="">{turer === null ? 'Hämtar dina turer' : Array.isArray(turer) && turer.length === 0 ? 'Du har inga turer som du kan ändra' : 'Välj tur'}</option>
            {Array.isArray(turer) &&
              turer.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.namn}
                </option>
              ))}
          </Select>
        </div>
        <Button disabled={!aktuellt || sparar} onClick={() => void laggITuren()}>
          Lägg i turen
        </Button>
      </div>
      {turer === 'fel' && <p className="text-sm text-destructive">Det gick inte att hämta dina turer.</p>}
      {turId && turlage?.turId === turId && turlage.lage === null && <p className="text-sm text-destructive">Det gick inte att hämta turen. Försök igen.</p>}
      {varningar.length > 0 && (
        <ul aria-label="Gruppens kostbehov" className="space-y-1 text-sm">
          {varningar.map((v) => (
            <li key={v.text} className={v.okand ? 'text-muted-foreground' : 'font-medium text-accent-strong'}>
              {v.text}
            </li>
          ))}
        </ul>
      )}
      {aktuellt && varningar.length === 0 && aktuellt.behov.length > 0 && <p className="text-sm text-muted-foreground">Receptet passar gruppens kostbehov.</p>}

      <div className="border-t border-border pt-4">
        <Button variant="outline" disabled={!Array.isArray(egna) || sparar} onClick={() => void sparaSomEget()}>
          Spara som eget recept
        </Button>
      </div>

      <div aria-live="polite">
        {lage.typ === 'klart' && (
          <p className="text-sm">
            {lage.text}{' '}
            {lage.till && (
              <Link to={lage.till.adress} className={lankKlass}>
                {lage.till.text}
              </Link>
            )}
          </p>
        )}
        {lage.typ === 'fel' && (
          <p role="alert" className="text-sm text-destructive">
            {lage.text}
          </p>
        )}
      </div>
    </section>
  )
}
