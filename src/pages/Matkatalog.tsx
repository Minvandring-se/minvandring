import { ExternalLink, Search, Star } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Kostfilterval } from '@/components/mat/Kostfilterval'
import { Matflikar } from '@/components/mat/Matflikar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Panel } from '@/components/ui/panel'
import { Select } from '@/components/ui/select'
import { Specrutor } from '@/components/ui/specrutor'
import { useMatkatalog } from '@/hooks/useMatplan'
import { laggISkafferi, sattFavorit, useSkafferi, type Skafferi } from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt } from '@/lib/forrad'
import { formateraKcal, kcalPer100g, pasnamn, TILLAGNING } from '@/lib/mat'
import {
  allergentext,
  filterFranAdress,
  filterTillAdress,
  KATALOGMALTIDER,
  kostetiketter,
  marken,
  mestEnergi,
  naringstabell,
  pristext,
  sokPasar,
  SORTERINGAR,
  spartext,
  type Katalogfilter,
} from '@/lib/matkatalog'
import { bastForeStatus, BASTFORE_TEXT } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import type { Matprodukt } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)

/**
 * Matkatalogen: sök och filtrera bland påsarna och jämför energi och vikt. Filtret och sorteringen står i adressen.
 * Ett tryck på ett kort öppnar en panel med näring, tillagning, allergener och pris. Den öppna påsen står i adressen
 * (?pase=<id>), så att bakåtknappen stänger panelen och en länk kan öppna den direkt.
 */
export function Matkatalog() {
  useSidtitel('Matkatalog')
  const id = useId()
  const katalog = useMatkatalog()
  const { skafferi, laddaOm } = useSkafferi()
  const [sok, setSok] = useState('')
  const [parametrar, setParametrar] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const filter = useMemo(() => filterFranAdress(parametrar), [parametrar])
  const paseId = parametrar.get('pase')
  const lista = useMemo(() => (Array.isArray(katalog) ? katalog : []), [katalog])
  const traffar = useMemo(() => sokPasar(lista, sok, filter), [lista, sok, filter])
  const markeslista = useMemo(() => marken(lista), [lista])
  const basta = mestEnergi(traffar)
  const oppen = paseId ? lista.find((p) => p.id === paseId) : undefined

  function andraFilter(andring: Partial<Katalogfilter>) {
    setParametrar(filterTillAdress({ ...filter, ...andring }, parametrar), { replace: true })
  }

  /** Öppnar panelen. Ett nytt steg i historiken, så att bakåtknappen stänger den. */
  function oppna(pase: string) {
    const p = new URLSearchParams(parametrar)
    p.set('pase', pase)
    setParametrar(p, { state: { panel: true } })
  }

  /** Stänger panelen: ett steg bakåt om panelen öppnades här, annars tas påsen bort ur adressen. */
  function stang() {
    if ((location.state as { panel?: boolean } | null)?.panel) {
      navigate(-1)
      return
    }
    const p = new URLSearchParams(parametrar)
    p.delete('pase')
    setParametrar(p, { replace: true })
  }

  const egna = skafferi && skafferi !== 'fel' ? skafferi : null

  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik
        rubrik="Matkatalog"
        text={
          lista.length
            ? `Sök bland ${lista.length.toLocaleString('sv-SE')} påsar och jämför energi och vikt. Lägg det du har hemma i skafferiet.`
            : 'Sök bland påsarna och jämför energi och vikt. Lägg det du har hemma i skafferiet.'
        }
      />

      {katalog === null && <p role="status" className="text-muted-foreground">Hämtar katalogen …</p>}
      {katalog === 'fel' && (
        <p role="alert" className="text-destructive">
          Det gick inte att hämta katalogen. Kontrollera uppkopplingen och försök igen.
        </p>
      )}
      {Array.isArray(katalog) && katalog.length === 0 && <p className="text-muted-foreground">Det finns inga påsar i katalogen än.</p>}

      {lista.length > 0 && (
        <>
          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor={`${id}-sok`} className="block text-sm font-medium">
                Sök på märke eller namn
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id={`${id}-sok`} type="search" autoComplete="off" enterKeyHint="search" maxLength={80} className="pl-10" value={sok} onChange={(e) => setSok(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor={`${id}-maltid`} className="block text-sm font-medium">
                  Måltid
                </label>
                <Select id={`${id}-maltid`} value={filter.maltid} onChange={(e) => andraFilter({ maltid: e.target.value as Katalogfilter['maltid'] })}>
                  <option value="">Alla måltider</option>
                  {KATALOGMALTIDER.map((m) => (
                    <option key={m.nyckel} value={m.nyckel}>
                      {m.etikett}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-marke`} className="block text-sm font-medium">
                  Märke
                </label>
                <Select id={`${id}-marke`} value={markeslista.find((m) => m.toLowerCase() === filter.marke.toLowerCase()) ?? ''} onChange={(e) => andraFilter({ marke: e.target.value })}>
                  <option value="">Alla märken</option>
                  {markeslista.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor={`${id}-sortering`} className="block text-sm font-medium">
                  Sortera
                </label>
                <Select id={`${id}-sortering`} value={filter.sortering} onChange={(e) => andraFilter({ sortering: e.target.value as Katalogfilter['sortering'] })}>
                  {SORTERINGAR.map((s) => (
                    <option key={s.nyckel} value={s.nyckel}>
                      {s.etikett}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Kostfilterval filter={{ val: filter.val, utan: filter.utan }} onAndra={(f) => andraFilter({ val: [...f.val], utan: [...f.utan] })} />
            {(filter.val.length > 0 || filter.utan.length > 0) && <p className="text-sm text-muted-foreground">Påsar där uppgiften saknas visas inte när du filtrerar.</p>}
          </div>

          <p aria-live="polite" className="text-sm font-medium">
            {traffar.length === 0 ? 'Inga påsar passar sökningen och filtret.' : traffar.length === 1 ? 'En påse' : `${traffar.length} påsar`}
          </p>

          {traffar.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
              {traffar.map((p) => (
                <Paskort key={p.id} pase={p} mestEnergi={p.id === basta} favorit={!!egna?.favoriter.has(p.id)} onOppna={() => oppna(p.id)} />
              ))}
            </ul>
          )}
        </>
      )}

      {oppen && <Paspanel key={oppen.id} pase={oppen} skafferi={skafferi} laddaOm={laddaOm} onStang={stang} />}
    </div>
  )
}

/** En påse i katalogen: namn, märke, vikt och energi, och kostetiketterna. Ett tryck öppnar panelen. */
function Paskort({ pase, mestEnergi, favorit, onOppna }: { pase: Matprodukt; mestEnergi: boolean; favorit: boolean; onOppna: () => void }) {
  const per100 = kcalPer100g(pase.kcal, pase.vikt_torr_g)
  const etiketter = kostetiketter(pase)
  return (
    <li className="flex flex-col rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOppna}
        className="flex w-full flex-1 flex-col gap-2 rounded-lg p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {mestEnergi && <span className="rounded-full bg-hjortron-soft px-2.5 py-0.5 text-sm font-semibold text-hjortron-strong">Mest energi</span>}
        <span className="flex w-full items-start gap-3">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold break-words">{pase.namn}</span>
            <span className="block text-sm text-muted-foreground">{pase.marke}</span>
          </span>
          {favorit && <Star className="mt-0.5 size-5 shrink-0 fill-primary text-primary" role="img" aria-label="Favorit" />}
        </span>
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm tabular-nums">
          <span>{formateraVikt(pase.vikt_torr_g)}</span>
          <span>{formateraKcal(pase.kcal)}</span>
          {per100 !== null && <span className="font-semibold">{per100} kcal per 100 g</span>}
        </span>
        {etiketter.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {etiketter.map((e) => (
              <span key={e} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                {e}
              </span>
            ))}
          </span>
        )}
      </button>
    </li>
  )
}

/** Panelen för en påse: energi och vikt stort, näringen, tillagningen, allergenerna, priset och skafferiet. */
function Paspanel({ pase, skafferi, laddaOm, onStang }: { pase: Matprodukt; skafferi: Skafferi | null | 'fel'; laddaOm: () => Promise<void>; onStang: () => void }) {
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)
  const egna = skafferi && skafferi !== 'fel' ? skafferi : null
  const rad = egna?.rader.find((r) => r.matprodukt_id === pase.id)
  const favorit = !!egna?.favoriter.has(pase.id)
  const status = rad ? bastForeStatus(rad.bast_fore, lokaltDatum()) : null
  const per100 = kcalPer100g(pase.kcal, pase.vikt_torr_g)
  const pris = pristext(pase)
  const spar = spartext(pase)

  async function gor(handling: () => Promise<boolean>) {
    setSparar(true)
    setFel(false)
    const ok = await handling()
    if (ok) await laddaOm()
    setSparar(false)
    setFel(!ok)
  }

  const rutor = [
    { etikett: 'Måltid', varde: KATALOGMALTIDER.find((m) => m.nyckel === pase.maltid)!.etikett },
    { etikett: 'Portioner', varde: String(pase.portioner) },
    ...(pase.torkning ? [{ etikett: 'Torkning', varde: pase.torkning === 'frystorkad' ? 'Frystorkad' : 'Lufttorkad' }] : []),
    ...(pase.tillagning_vatten
      ? [{ etikett: 'Tillagning', varde: [TILLAGNING[pase.tillagning_vatten], pase.tillagning_min ? `${pase.tillagning_min} min` : ''].filter(Boolean).join(', ') }]
      : []),
    ...(pase.vatten_ml && pase.tillagning_vatten !== 'inget' ? [{ etikett: 'Vatten', varde: `${pase.vatten_ml} ml` }] : []),
  ]

  return (
    <Panel
      etikett={pasnamn(pase)}
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          <h2 className="text-2xl break-words text-primary">{pase.namn}</h2>
          <p className="text-sm text-muted-foreground">{pase.marke}</p>
          <p className="font-heading text-3xl font-semibold tabular-nums">{formateraKcal(pase.kcal)}</p>
          <p className="text-sm tabular-nums">
            {formateraVikt(pase.vikt_torr_g)}
            {per100 !== null && `, ${per100} kcal per 100 g`}
          </p>
          {rad && (
            <p className="flex flex-wrap items-center gap-x-3 text-sm">
              <span className="rounded-full bg-hjortron-soft px-2.5 py-0.5 font-medium text-hjortron-strong">Du har {rad.antal} hemma</span>
              <Link to="/matplanering/skafferi" className={lankKlass}>
                Visa i skafferiet
              </Link>
            </p>
          )}
          {(status === 'passerat' || status === 'snart') && <p className="text-sm font-medium text-accent-strong">{BASTFORE_TEXT[status]}</p>}
        </div>
      }
      fot={
        <div className="space-y-2">
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          {skafferi === 'fel' && <p className="text-sm text-muted-foreground">Det gick inte att hämta ditt skafferi.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button disabled={sparar || !egna} onClick={() => gor(() => laggISkafferi(pase.id, rad))}>
              {rad ? 'Lägg en till i skafferiet' : 'Lägg i skafferiet'}
            </Button>
            <Button variant="outline" aria-pressed={favorit} disabled={sparar || !egna} onClick={() => gor(() => sattFavorit(pase.id, !favorit))}>
              <Star className={cn('size-4', favorit && 'fill-primary text-primary')} aria-hidden />
              Favorit
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <Specrutor rader={rutor} />

        <table className="w-full text-sm tabular-nums">
          <caption className="mb-2 text-left font-heading text-lg font-semibold">Näring</caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-1.5 text-left font-normal">
                <span className="sr-only">Näringsämne</span>
              </th>
              <th scope="col" className="py-1.5 text-right font-normal">
                Per påse
              </th>
              <th scope="col" className="py-1.5 text-right font-normal">
                Per 100 g
              </th>
            </tr>
          </thead>
          <tbody>
            {naringstabell(pase).map((r) => (
              <tr key={r.etikett} className="border-b border-border last:border-0">
                <th scope="row" className="py-1.5 text-left font-medium">
                  {r.etikett}
                </th>
                <td className="py-1.5 text-right">{r.perPase}</td>
                <td className="py-1.5 text-right">{r.per100g}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-2 text-sm">
          <div>
            <dt className="font-medium">Allergener</dt>
            <dd className="text-muted-foreground">{allergentext(pase)}</dd>
          </div>
          {spar && (
            <div>
              <dt className="font-medium">Kan innehålla spår av</dt>
              <dd className="text-muted-foreground">{spar}</dd>
            </div>
          )}
          {pris && (
            <div>
              <dt className="font-medium">Pris</dt>
              <dd className="text-muted-foreground">
                {pris}.{' '}
                {pase.pris_kalla ? (
                  <a href={pase.pris_kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
                    Pris enligt butiken
                    <ExternalLink className="size-4" aria-hidden />
                    <span className="sr-only">(öppnas i ny flik)</span>
                  </a>
                ) : (
                  'Pris enligt tillverkaren.'
                )}
              </dd>
            </div>
          )}
        </dl>

        <a href={pase.kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
          Tillverkarens sida
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(öppnas i ny flik)</span>
        </a>
      </div>
    </Panel>
  )
}
