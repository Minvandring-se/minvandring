import { ExternalLink, Star } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Kostfilterval } from '@/components/mat/Kostfilterval'
import { Matflikar } from '@/components/mat/Matflikar'
import { Bricka } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Delval } from '@/components/ui/delval'
import { AktivaFilter, Filterpanel, Sokrad, Sokruta, type AktivtFilter } from '@/components/ui/sokruta'
import { LaggISkafferi } from '@/components/mat/LaggISkafferi'
import { PasNamn } from '@/components/mat/PasNamn'
import { Panel } from '@/components/ui/panel'
import { Select } from '@/components/ui/select'
import { Specrutor } from '@/components/ui/specrutor'
import { useMatkatalog } from '@/hooks/useMatplan'
import { useGruppantal, useKatalogantal, useNaringskatalog } from '@/hooks/useNaringskatalog'
import { laggISkafferi, sattFavorit, useSkafferi, type Skafferi } from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt } from '@/lib/forrad'
import { allergenetikett, kostvalsetikett, passarFilter, uppraknade, type Kostfilter } from '@/lib/kost'
import { HUVUDGRUPPER } from '@/lib/livsmedelsgrupper'
import { forstaAndraNamn, formateraKcal, kcalPer100g, pasnamn, TILLAGNING } from '@/lib/mat'
import {
  allergentext,
  antalPerMaltid,
  bytDel,
  delFranAdress,
  filterFranAdress,
  filterTillAdress,
  katalogbild,
  KATALOGDELAR,
  KATALOGMALTIDER,
  kostbrickor,
  kostetiketter,
  marken,
  mestEnergi,
  naringPer100,
  naringstabell,
  pristext,
  SIDSTORLEK,
  sokPasar,
  SORTERINGAR,
  spartext,
  type Katalogdel,
  type Katalogfilter,
  type Naringskort,
} from '@/lib/matkatalog'
import { manadOchAr, SKAFFERISTATUS_TEXT, skafferistatus } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import { laddfelText } from '@/lib/texter'
import type { Matprodukt } from '@/lib/typer'
import { KATEGORIETIKETT } from '@/lib/varukatalog'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const tal = (n: number) => n.toLocaleString('sv-SE')

/** De aktiva filtren som etiketter: kostvalen, allergenerna och märket (bara för påsar). */
function aktivaKostfilter(f: Katalogfilter, del: Katalogdel, andra: (a: Partial<Katalogfilter>) => void): AktivtFilter[] {
  return [
    ...f.val.map((v) => ({ nyckel: `val-${v}`, text: kostvalsetikett(v), onTaBort: () => andra({ val: f.val.filter((x) => x !== v) }) })),
    ...f.utan.map((a) => ({ nyckel: `utan-${a}`, text: `Utan ${allergenetikett(a).toLowerCase()}`, onTaBort: () => andra({ utan: f.utan.filter((x) => x !== a) }) })),
    ...(del === 'pasar' && f.marke ? [{ nyckel: 'marke', text: f.marke, onTaBort: () => andra({ marke: '' }) }] : []),
  ]
}
const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)

/**
 * Matkatalogen i tre delar: påsar, märkesvaror och livsmedel. Överst en mörkgrön ruta med sökfältet,
 * sedan delarna, filtret och måltiderna eller grupperna som rutor. Listan är tom tills man har sökt eller valt en ruta.
 * Delen, måltiden, gruppen, filtret och sorteringen står i adressen.
 *
 * Ett tryck på en påse öppnar en panel med näring, tillagning, allergener och pris. Den öppna påsen står i adressen
 * (?pase=<id>), så att bakåtknappen stänger panelen och en länk kan öppna den direkt.
 */
export function Matkatalog() {
  useSidtitel('Matkatalog')
  const [sok, setSok] = useState('')
  const [filterOppet, setFilterOppet] = useState(false)
  const [parametrar, setParametrar] = useSearchParams()
  const del = delFranAdress(parametrar)
  const filter = useMemo(() => filterFranAdress(parametrar), [parametrar])
  const grupp = (parametrar.get('grupp') ?? '').slice(0, 40)
  const kost = useMemo(() => ({ val: filter.val, utan: filter.utan }), [filter.val, filter.utan])
  const antal = useKatalogantal()
  const aktivaFilter = filter.val.length + filter.utan.length + (del === 'pasar' && filter.marke ? 1 : 0)

  function andraFilter(andring: Partial<Katalogfilter>) {
    setParametrar(filterTillAdress({ ...filter, ...andring }, parametrar), { replace: true })
  }

  function valjGrupp(nyckel: string) {
    const p = new URLSearchParams(parametrar)
    if (grupp === nyckel) p.delete('grupp')
    else p.set('grupp', nyckel)
    setParametrar(p, { replace: true })
  }

  return (
    <div className="space-y-6">
      <Matflikar />
      <Sokruta
        rubrik="Vad vill ni äta?"
        rad={antal && `${uppraknade([`${tal(antal.pasar)} påsar`, `${tal(antal.varor)} märkesvaror`, `${tal(antal.livsmedel)} livsmedel`])}.`}
        sok={sok}
        onSok={setSok}
        placeholder="Till exempel viltgryta eller gröt"
      />

      <Sokrad
        flikar={<Delval etikett="Sök bland" delar={KATALOGDELAR} vald={del} onValj={(d) => setParametrar(bytDel(d, parametrar), { replace: true })} />}
        antalFilter={aktivaFilter}
        onFilter={() => setFilterOppet(true)}
      />
      <AktivaFilter filter={aktivaKostfilter(filter, del, andraFilter)} onRensaAllt={() => andraFilter({ val: [], utan: [], marke: '' })} />

      {del === 'pasar' && <Pasdel sok={sok} filter={filter} andraFilter={andraFilter} filterOppet={filterOppet} onStangFilter={() => setFilterOppet(false)} />}
      {del !== 'pasar' && (
        <Naringsdel del={del} sok={sok} grupp={grupp} valjGrupp={valjGrupp} kost={kost} />
      )}
      {del !== 'pasar' && filterOppet && (
        <Filterpanel visa={VISA[del]} onStang={() => setFilterOppet(false)} harFilter={aktivaFilter > 0} onRensaAllt={() => andraFilter({ val: [], utan: [], marke: '' })}>
          <Filterinnehall kost={kost} onKost={(f) => andraFilter({ val: [...f.val], utan: [...f.utan] })} />
        </Filterpanel>
      )}
    </div>
  )
}

/** Innehållet i filterpanelen: märke för påsarna och "Passar gruppen". */
function Filterinnehall({ kost, onKost, marke }: { kost: Kostfilter; onKost: (f: Kostfilter) => void; marke?: ReactNode }) {
  return (
    <>
      {marke}
      <section aria-labelledby="passar-gruppen" className="space-y-3">
        <h3 id="passar-gruppen" className="text-lg">
          Passar gruppen
        </h3>
        <Kostfilterval filter={kost} onAndra={onKost} />
        <p className="text-sm text-muted-foreground">Det som saknar uppgiften visas inte när du filtrerar.</p>
      </section>
    </>
  )
}

/** Texten på Visa-knappen i filterpanelen. */
const VISA: Record<Katalogdel, string> = { pasar: 'Visa påsarna', varor: 'Visa varorna', livsmedel: 'Visa livsmedlen' }

/**
 * En ruta för en måltid eller grupp: bild, namn och antal. Vald när den är tryckt. Bilden är 5:3 med motivet i mitten
 * och visas som 5:2 på dator, där den tomma bakgrunden över och under skärs bort.
 */
function Ruta({ bild, namn, antal, vald, onValj }: { bild: string; namn: string; antal: string | null; vald: boolean; onValj: () => void }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={vald}
        onClick={onValj}
        className={cn(
          'lyft flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          vald ? 'border-primary ring-1 ring-primary' : 'border-border',
        )}
      >
        <img
          src={`/katalog/${bild}-480.webp`}
          srcSet={`/katalog/${bild}-480.webp 480w, /katalog/${bild}-960.webp 960w`}
          sizes="(min-width: 768px) 25vw, 50vw"
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[5/3] w-full object-cover md:aspect-[5/2]"
        />
        <span className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
          <span className="font-semibold break-words">{namn}</span>
          {antal && <span className="text-sm text-muted-foreground tabular-nums">{antal}</span>}
        </span>
      </button>
    </li>
  )
}

function Rutor({ rubrik, children }: { rubrik: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-lg">
        {rubrik}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</ul>
    </section>
  )
}

const antalText = (n: number | undefined, en: string, flera: string) => (n === undefined ? null : `${n.toLocaleString('sv-SE')} ${n === 1 ? en : flera}`)

/** Påsarna ur matkatalogen. Hela katalogen hämtas en gång och söks i appen. */
function Pasdel({
  sok,
  filter,
  andraFilter,
  filterOppet,
  onStangFilter,
}: {
  sok: string
  filter: Katalogfilter
  andraFilter: (f: Partial<Katalogfilter>) => void
  filterOppet: boolean
  onStangFilter: () => void
}) {
  const id = useId()
  const { katalog, forsokIgen } = useMatkatalog()
  const { skafferi, laddaOm } = useSkafferi()
  const [parametrar, setParametrar] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const paseId = parametrar.get('pase')
  const lista = useMemo(() => (Array.isArray(katalog) ? katalog : []), [katalog])
  const traffar = useMemo(() => sokPasar(lista, sok, filter), [lista, sok, filter])
  const perMaltid = useMemo(() => antalPerMaltid(lista), [lista])
  const markeslista = useMemo(() => marken(lista), [lista])
  const basta = mestEnergi(traffar)
  const oppen = paseId ? lista.find((p) => p.id === paseId) : undefined
  const visa = sok.trim().length > 0 || filter.maltid !== ''
  const egna = skafferi && skafferi !== 'fel' ? skafferi : null

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

  const harFilter = filter.val.length > 0 || filter.utan.length > 0 || filter.marke !== ''
  const filterpanel = filterOppet && (
    <Filterpanel visa={VISA.pasar} onStang={onStangFilter} harFilter={harFilter} onRensaAllt={() => andraFilter({ val: [], utan: [], marke: '' })}>
      <Filterinnehall
        kost={{ val: filter.val, utan: filter.utan }}
        onKost={(f) => andraFilter({ val: [...f.val], utan: [...f.utan] })}
        marke={
          <div className="space-y-1">
            <label htmlFor={`${id}-marke`} className="block font-medium">
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
        }
      />
    </Filterpanel>
  )

  if (katalog === null)
    return (
      <Laddar text="Hämtar katalogen" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Skelett className="h-32 rounded-lg" />
        <Skelett className="h-32 rounded-lg" />
      </Laddar>
    )
  if (katalog === 'fel') return <Laddfel vad="katalogen" onForsokIgen={forsokIgen} />
  if (lista.length === 0) return <TomtLage kompakt text="Det finns inga påsar i katalogen än." />

  return (
    <>
      <Rutor rubrik="Eller välj en måltid">
        {KATALOGMALTIDER.map((m) => (
          <Ruta
            key={m.nyckel}
            bild={katalogbild('pasar', m.nyckel)}
            namn={m.etikett}
            antal={antalText(perMaltid[m.nyckel], 'påse', 'påsar')}
            vald={filter.maltid === m.nyckel}
            onValj={() => andraFilter({ maltid: filter.maltid === m.nyckel ? '' : m.nyckel })}
          />
        ))}
      </Rutor>

      {!visa && <TomtLage kompakt text="Sök eller välj en måltid, så visas påsarna här." />}

      {visa && (
        <section aria-labelledby={`${id}-traffar`} className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id={`${id}-traffar`} aria-live="polite" className="text-base font-medium">
              {traffar.length === 0 ? 'Inga påsar' : traffar.length === 1 ? 'En påse' : `${traffar.length} påsar`}
            </h2>
            {traffar.length > 1 && (
              <div className="w-full space-y-1 sm:w-64">
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
            )}
          </div>
          {traffar.length === 0 && <TomtLage kompakt text="Inga påsar passar sökningen och filtret." />}
          {traffar.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {traffar.map((p) => (
                <Paskort key={p.id} pase={p} mestEnergi={p.id === basta} favorit={!!egna?.favoriter.has(p.id)} onOppna={() => oppna(p.id)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {filterpanel}
      {oppen && <Paspanel key={oppen.id} pase={oppen} skafferi={skafferi} laddaOm={laddaOm} onStang={stang} />}
    </>
  )
}

const NARINGSDEL = {
  varor: { rubrik: 'Eller välj en kategori', tom: 'Sök eller välj en kategori, så visas varorna här.', en: 'vara', flera: 'varor', ingen: 'Inga varor' },
  livsmedel: { rubrik: 'Eller välj en grupp', tom: 'Sök eller välj en grupp, så visas livsmedlen här.', en: 'livsmedel', flera: 'livsmedel', ingen: 'Inga livsmedel' },
} as const

const VARURUTOR = Object.entries(KATEGORIETIKETT).map(([nyckel, etikett]) => ({ nyckel, etikett }))

/** Märkesvarorna eller livsmedlen. Databasen söker, och listan visas en sida i taget. */
function Naringsdel({ del, sok, grupp, valjGrupp, kost }: { del: 'varor' | 'livsmedel'; sok: string; grupp: string; valjGrupp: (g: string) => void; kost: Kostfilter }) {
  const id = useId()
  const text = NARINGSDEL[del]
  const rutor = del === 'varor' ? VARURUTOR : HUVUDGRUPPER
  const giltig = rutor.some((r) => r.nyckel === grupp) ? grupp : ''
  const antal = useGruppantal(del)
  const kort = useNaringskatalog(del, sok, giltig)
  const traffar = useMemo(() => (Array.isArray(kort) ? kort.filter((k) => passarFilter(k.kost, kost)) : []), [kort, kost])
  const nyckel = `${del}|${sok}|${giltig}|${kost.val.join()}|${kost.utan.join()}`
  const [sidor, setSidor] = useState({ nyckel: '', antal: 1 })
  // En ny sökning, grupp eller ett nytt filter börjar om på första sidan.
  const visade = (sidor.nyckel === nyckel ? sidor.antal : 1) * SIDSTORLEK
  const visa = sok.trim().length >= 2 || giltig !== ''

  return (
    <>
      <Rutor rubrik={text.rubrik}>
        {rutor.map((r) => (
          <Ruta key={r.nyckel} bild={katalogbild(del, r.nyckel)} namn={r.etikett} antal={antalText(antal[r.nyckel], text.en, text.flera)} vald={giltig === r.nyckel} onValj={() => valjGrupp(r.nyckel)} />
        ))}
      </Rutor>

      {!visa && <TomtLage kompakt text={text.tom} />}
      {visa && kort === null && (
        <Laddar text="Söker" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skelett className="h-28 rounded-lg" />
          <Skelett className="h-28 rounded-lg" />
        </Laddar>
      )}
      {visa && kort === 'fel' && (
        <p role="alert" className="text-destructive">
          Det gick inte att söka. Kontrollera uppkopplingen och försök igen.
        </p>
      )}

      {visa && Array.isArray(kort) && (
        <section aria-labelledby={`${id}-traffar`} className="space-y-4">
          <h2 id={`${id}-traffar`} aria-live="polite" className="text-base font-medium">
            {traffar.length === 0 ? text.ingen : antalText(traffar.length, text.en, text.flera)}
          </h2>
          {traffar.length === 0 && <TomtLage kompakt text="Inget passar sökningen och filtret." />}
          {traffar.length > 0 && (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {traffar.slice(0, visade).map((k) => (
                <Naringskortet key={k.id} kort={k} />
              ))}
            </ul>
          )}
          {traffar.length > visade && (
            <Button variant="outline" onClick={() => setSidor({ nyckel, antal: visade / SIDSTORLEK + 1 })}>
              Visa fler
            </Button>
          )}
          {del === 'livsmedel' && traffar.length > 0 && <p className="text-xs text-muted-foreground">Näringsvärden från Livsmedelsverkets livsmedelsdatabas.</p>}
        </section>
      )}
    </>
  )
}

/** En märkesvara eller ett livsmedel: märke på egen rad, namnet, kategorin eller gruppen, näringen och kostbrickorna. */
function Naringskortet({ kort }: { kort: Naringskort }) {
  const naring = naringPer100(kort)
  const brickor = kostbrickor(kort.kost)
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="space-y-0.5">
        {kort.marke && <p className="text-sm text-muted-foreground">{kort.marke}</p>}
        <p className="font-semibold break-words">{kort.namn}</p>
        {kort.grupp && <p className="text-sm text-muted-foreground">{kort.grupp}</p>}
      </div>
      {naring && <p className="text-sm tabular-nums">{naring}</p>}
      {brickor.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {brickor.map((b) => (
            <Bricka key={b}>{b}</Bricka>
          ))}
        </span>
      )}
    </li>
  )
}

/** En påse i katalogen: namn, märke, vikt och energi, och kostetiketterna. Ett tryck öppnar panelen. */
function Paskort({ pase, mestEnergi, favorit, onOppna }: { pase: Matprodukt; mestEnergi: boolean; favorit: boolean; onOppna: () => void }) {
  const per100 = kcalPer100g(pase.kcal, pase.vikt_torr_g)
  const etiketter = kostetiketter(pase)
  return (
    <li className="lyft flex flex-col rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOppna}
        className="flex w-full flex-1 flex-col gap-2 rounded-lg p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        {mestEnergi && (
          <Bricka ton="hjortron" className="text-sm font-semibold">
            Mest energi
          </Bricka>
        )}
        <span className="flex w-full items-start gap-3">
          <PasNamn marke={pase.marke} namn={pase.namn} ettAnnat={forstaAndraNamn(pase)} className="flex-1" namnKlass="font-semibold" />
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
              <Bricka key={e}>{e}</Bricka>
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
  const status = rad ? skafferistatus(rad.bast_fore, lokaltDatum()) : null
  const [laggTill, setLaggTill] = useState(false)
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
          <p className="text-sm text-muted-foreground">{pase.marke}</p>
          <h2 className="text-2xl break-words text-primary">{pase.namn}</h2>
          {forstaAndraNamn(pase) && <p className="break-words text-muted-foreground">{forstaAndraNamn(pase)}</p>}
          <p className="font-heading text-3xl font-semibold tabular-nums">{formateraKcal(pase.kcal)}</p>
          <p className="text-sm tabular-nums">
            {formateraVikt(pase.vikt_torr_g)}
            {per100 !== null && `, ${per100} kcal per 100 g`}
          </p>
          {rad && (
            <p className="flex flex-wrap items-center gap-x-3 text-sm">
              <Bricka ton="hjortron" className="text-sm">Du har {rad.antal} hemma</Bricka>
              <Link to="/matplanering/skafferi" className={lankKlass}>
                Visa i skafferiet
              </Link>
            </p>
          )}
          {rad?.bast_fore && (
            <p className={cn('text-sm', status === 'gatt_ut' ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>
              Bäst före {manadOchAr(rad.bast_fore)}
              {status && `. ${SKAFFERISTATUS_TEXT[status]}`}
            </p>
          )}
        </div>
      }
      fot={
        <div className="space-y-2">
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          {skafferi === 'fel' && <p className="text-sm text-destructive">{laddfelText('ditt skafferi')}</p>}
          {laggTill && egna && (
            <LaggISkafferi
              namn={pasnamn(pase)}
              hemma={rad?.antal ?? 0}
              onSpara={async (antal, bastFore) => {
                const ny = await laggISkafferi(pase.id, rad, antal, bastFore)
                if (ny) await laddaOm()
                return ny
              }}
              onKlar={() => {
                setLaggTill(false)
                // Knappen kommer tillbaka när formuläret stängs, och får fokus igen.
                requestAnimationFrame(() => document.getElementById(`lagg-i-skafferiet-${pase.id}`)?.focus())
              }}
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {!laggTill && (
              <Button id={`lagg-i-skafferiet-${pase.id}`} disabled={sparar || !egna} onClick={() => setLaggTill(true)}>
                Lägg i skafferiet
              </Button>
            )}
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
                <td className="py-1.5 text-right">
                  <Varde text={r.perPase} />
                </td>
                <td className="py-1.5 text-right">
                  <Varde text={r.per100g} />
                </td>
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

/** Ett värde i näringstabellen. Ett streck betyder att värdet saknas, och läses så av skärmläsare. */
function Varde({ text }: { text: string }) {
  if (text !== '–') return text
  return (
    <>
      <span aria-hidden>–</span>
      <span className="sr-only">Saknas</span>
    </>
  )
}
