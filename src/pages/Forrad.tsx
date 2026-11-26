import { ChevronDown, ExternalLink, LayoutGrid, List, NotebookPen, Pencil, Plus, RotateCcw } from 'lucide-react'
import { Kategoriikon } from '@/components/forrad/Kategoriikon'
import { useEffect, useId, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { HelaForradet, Onskelista, StorstaVinsten, ViktPerKategori } from '@/components/forrad/Forradsoversikt'
import { Detaljlista } from '@/components/forrad/Detaljlista'
import { DittKok } from '@/components/forrad/DittKok'
import { Granskad } from '@/components/forrad/Granskad'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { ProduktSok } from '@/components/forrad/ProduktSok'
import { SakFormular } from '@/components/forrad/SakFormular'
import { Button } from '@/components/ui/button'
import { Bricka } from '@/components/ui/bricka'
import { Flikrad } from '@/components/ui/flikrad'
import { KommerSnart, KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { AktivaFilter, Filterpanel, Sokrad, Sokruta, type AktivtFilter } from '@/components/ui/sokruta'
import { Select } from '@/components/ui/select'
import { Panel } from '@/components/ui/panel'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { FORRAD_EXEMPEL } from '@/lib/exempeldata'
import {
  antalGranskade,
  flerKategorier,
  formateraVikt,
  kategoriFor,
  listdelar,
  sakdetaljer,
  saknadeGrundsaker,
  storstaVinsten,
  summeraForrad,
  underkategoriFor,
  viktjamforelse,
  type Forval,
  type KategoriNyckel,
  type Listdel,
  type SaknadGrundsak,
  type UnderkategoriNyckel,
} from '@/lib/forrad'
import {
  SORTERINGAR,
  adressFranVal,
  doljsAvFiltret,
  filtrera,
  harFilter,
  kategorivalIForradet,
  sortera,
  underkategorivalIForradet,
  utanFilter,
  valFranAdress,
  valjKategori,
  type Listval,
  type Vy,
} from '@/lib/forradslista'
import { arKok, arKokdel, kokdelar, kokForDel } from '@/lib/forradskok'
import { granskning } from '@/lib/granskning'
import { felrapportLank } from '@/lib/kontakt'
import { arKlader } from '@/lib/produktegenskaper'
import { forradsStorlekText, konEtikett, viktstorlek } from '@/lib/kladstorlek'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Vad som är öppet: sökningen i katalogen (dialogen Lägg till utrustning), formuläret för en egen sak,
 * eller formuläret för en sak som ändras.
 */
type Oppet = { sok: true; kategori?: KategoriNyckel; underkategori?: UnderkategoriNyckel } | { ny: Forval } | { sakId: string } | null

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function antalText(antal: number) {
  return antal === 1 ? '1 sak' : `${antal} saker`
}

/**
 * Mitt förråd: översikten med hela förrådet, vikt per kategori och största vinsten, och listan med sök, kategori,
 * sortering och val mellan lista och rutnät. Saknas någon av de fyra tunga (ryggsäck, tält eller tarp, sovsäck,
 * liggunderlag) visas en tom ruta under dess kategori, och under listan knappar för kategorier man inte har fyllt på.
 * Bara man själv ser sitt förråd. På dator ligger listan till vänster och översikten till höger, där den ligger kvar
 * när man scrollar. I mobil kommer sökrutan direkt under rubriken och översikten, med hela förrådets vikt, under listan.
 */
export function Forrad() {
  useSidtitel('Mitt förråd')
  const [saker, setSaker] = useState<Forradssak[] | null>(null)
  const [laddfel, setLaddfel] = useState(false)
  const [oppet, setOppet] = useState<Oppet>(null)
  // Det senaste som lades till, från katalogen eller som egen sak, så att man kan gå vidare och ändra antal eller anteckning.
  const [tillagd, setTillagd] = useState<{ sakId: string } | null>(null)
  // Det som har lagts till sedan rutan Lägg till utrustning öppnades. Rutan står kvar tills man trycker Klar.
  const [iRutan, setIRutan] = useState<string[]>([])
  // Fler än en sak lades till i rutan. Då visas antalet i stället för namnet.
  const [flera, setFlera] = useState<number | null>(null)

  // Räknas upp när något har sparats eller tagits bort, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    supabase
      ?.from('forradssaker')
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering, skapad, kok_id, storlek, produkter(id, marke, modell, packvikt_g, kontrollerad, granskad, kalla_typ, version, underkategori, minvikt_g, kalla, egenskaper)')
      .then(({ data, error }) => {
        setLaddfel(!!error)
        if (!error) setSaker((data as unknown as Forradssak[] | null) ?? [])
      })
  }, [omgang])

  function hamtaOm() {
    setOmgang((n) => n + 1)
  }

  function klar() {
    setOppet(null)
    setTillagd(null)
    setFlera(null)
    hamtaOm()
  }

  // Översikten räknas alltid på hela förrådet, oavsett sök och filter.
  const alla = saker ?? []
  const summa = summeraForrad(alla)

  // Sök, kategori, sortering och vy sparas i adressen, så att de finns kvar vid omladdning.
  const [parametrar, setParametrar] = useSearchParams()
  const val = valFranAdress(parametrar)
  const setVal = (nytt: Listval) => setParametrar(adressFranVal(nytt), { replace: true })
  const visade = filtrera(alla, val)
  const oppenSak = oppet !== null && 'sakId' in oppet ? oppet.sakId : null
  const radhjalp: Radhjalp = { vy: val.vy, alla, oppenSak, onOppna: (sakId) => setOppet({ sakId }), onKlar: klar, onAndrad: hamtaOm, onAvbryt: () => setOppet(null) }
  const ny = oppet !== null && 'ny' in oppet ? oppet.ny : null
  // En sak som just sparats men som sök eller filter döljer. Då går formuläret för att ändra den inte att öppna i listan.
  const dold = tillagd !== null && doljsAvFiltret(tillagd.sakId, alla, visade)
  // Rutan visas först när förrådet har hämtats om och saken finns i det, så att Ändra alltid öppnar något.
  const tillagdNamn = tillagd ? alla.find((s) => s.id === tillagd.sakId)?.namn : undefined
  const oppnaSok = (kategori?: KategoriNyckel, underkategori?: UnderkategoriNyckel) => {
    setTillagd(null)
    setFlera(null)
    setIRutan([])
    setOppet({ sok: true, kategori, underkategori })
  }
  /** Stänger Lägg till utrustning och visar det som lades till: namnet på en sak, eller antalet. */
  const stangSok = () => {
    setOppet(null)
    if (iRutan.length === 1) setTillagd({ sakId: iRutan[0] })
    else if (iRutan.length > 1) setFlera(iRutan.length)
    setIRutan([])
  }
  const sok = oppet !== null && 'sok' in oppet ? oppet : null
  const laggTillKnapp = (
    <Button onClick={() => oppnaSok()}>
      <Plus className="size-4 text-hjortron-ikon" aria-hidden />
      Lägg till utrustning
    </Button>
  )
  const finnsRedan = new Set(alla.flatMap((s) => (s.produkt_id ? [s.produkt_id] : [])))
  // De tomma rutorna och Fyll på fler kategorier visas bara när hela förrådet visas.
  const heltForrad = !harFilter(val)
  const delar = listdelar(summeraForrad(visade).grupper, heltForrad ? saknadeGrundsaker(alla) : [])
  const fler = heltForrad ? flerKategorier(alla) : []

  return (
    <div className="space-y-6">
      <SidRubrik rubrik="Mitt förråd" text="Allt du äger för vandring, samlat på ett ställe." knappar={laggTillKnapp} />

      {saker && saker.length > 0 && <Sokdel val={val} onVal={setVal} saker={saker} />}

      {sok && (
        <Panel
          etikett="Lägg till utrustning"
          rubrik={<h2 className="text-2xl">Lägg till utrustning</h2>}
          onStang={stangSok}
          fot={
            <Button className="w-full" variant={iRutan.length > 0 ? 'default' : 'outline'} onClick={stangSok}>
              {iRutan.length === 0 ? 'Stäng' : iRutan.length === 1 ? 'Klar, 1 sak tillagd' : `Klar, ${iRutan.length} saker tillagda`}
            </Button>
          }
        >
          <ProduktSok
            // En tom ruta eller en knapp under Fyll på fler kategorier öppnar dialogen med rätt kategori vald.
            key={`${sok.kategori ?? 'alla'}|${sok.underkategori ?? ''}`}
            startKategori={sok.kategori}
            startUnderkategori={sok.underkategori}
            finnsRedan={finnsRedan}
            forrad={alla}
            onTillagd={(sakId) => {
              setIRutan((r) => [...r, sakId])
              hamtaOm()
            }}
            onEgen={(soktext, kategori, underkategori) => {
              setTillagd(null)
              setFlera(iRutan.length > 0 ? iRutan.length : null)
              setIRutan([])
              setOppet({ ny: { namn: soktext, kategori, underkategori } })
            }}
          />
        </Panel>
      )}

      {ny && (
        <SakFormular
          forval={ny}
          onKlar={(sakId) => {
            klar()
            if (sakId) setTillagd({ sakId })
          }}
          onAvbryt={() => oppnaSok()}
        />
      )}

      {flera !== null && (
        <div role="status" className="rounded-md bg-hjortron-soft px-4 py-2 text-sm text-hjortron-strong">
          <p className="flex min-h-11 items-center font-medium">{antalText(flera)} ligger nu i ditt förråd.</p>
        </div>
      )}

      {tillagd && dold && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-hjortron-soft px-4 py-2 text-sm text-hjortron-strong">
          <p className="font-medium">Sparad. Saken döljs av filtret.</p>
          <button type="button" className={cn('min-h-11 font-medium underline underline-offset-4', fokus)} onClick={() => setVal(utanFilter(val))}>
            Visa alla
          </button>
        </div>
      )}

      {tillagd && !dold && tillagdNamn && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-hjortron-soft px-4 py-2 text-sm text-hjortron-strong">
          <p className="font-medium">{tillagdNamn} ligger nu i ditt förråd.</p>
          <button
            type="button"
            className={cn('min-h-11 font-medium underline underline-offset-4', fokus)}
            onClick={() => {
              setOppet({ sakId: tillagd.sakId })
              setTillagd(null)
            }}
          >
            Ändra antal eller anteckning
          </button>
        </div>
      )}

      {laddfel ? (
        <Laddfel vad="ditt förråd" onForsokIgen={hamtaOm} />
      ) : saker === null ? (
        <Laddar text="Hämtar ditt förråd">
          <Skelett className="h-28 rounded-lg" />
          <Skelett className="h-20 rounded-lg" />
          <Skelett className="h-20 rounded-lg" />
        </Laddar>
      ) : saker.length === 0 ? (
        // Ett tomt förråd börjar med de fyra tunga som tomma rutor, och knapparna för fler kategorier.
        !ny && (
          <div className="space-y-6">
            <p className="max-w-prose">Börja med de fyra tunga sakerna. Det är de som avgör mest vad ryggsäcken väger.</p>
            <Lista delar={delar} sortering={val.sortering} onSaknad={(s) => oppnaSok(s.kategori, s.underkategori)} {...radhjalp} />
            <FyllPaFler kategorier={fler} onValj={(k) => oppnaSok(k)} />
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            <Verktyg val={val} onVal={setVal} saker={saker} visas={visade.length} />

            {visade.length === 0 ? (
              <TomtLage
                kompakt
                text={val.underkategori && !val.sok.trim() ? 'Inga saker i den här underkategorin.' : 'Inga saker i förrådet matchar.'}
                knapp={
                  <Button variant="outline" onClick={() => setVal({ ...val, sok: '', kategori: '', underkategori: '' })}>
                    Visa hela förrådet
                  </Button>
                }
              />
            ) : (
              <Lista delar={delar} sortering={val.sortering} onSaknad={(s) => oppnaSok(s.kategori, s.underkategori)} {...radhjalp} />
            )}

            <FyllPaFler kategorier={fler} onValj={(k) => oppnaSok(k)} />
          </div>

          {/* På dator en egen kolumn till höger som stannar kvar när man scrollar. I mobil efter listan. */}
          <aside aria-label="Översikt" className="space-y-5 lg:sticky lg:top-6">
            {/* Ett vitt kort, eftersom sökrutan är sidans enda mörkgröna yta. Överst i översikten på dator, under listan i mobil. */}
            <HelaForradet summa={summa} granskade={antalGranskade(alla)} />
            <ViktPerKategori summa={summa} />
            <StorstaVinsten vinst={storstaVinsten(alla)} />
            <Onskelista />
          </aside>
        </div>
      )}
    </div>
  )
}

/** Kategorierna i listan, med sakerna och de tomma rutorna för det som saknas. */
function Lista({ delar, sortering, onSaknad, ...radhjalp }: { delar: Listdel[]; sortering: Listval['sortering']; onSaknad: (s: SaknadGrundsak) => void } & Radhjalp) {
  return (
    <div className="grid gap-8">
      {delar.map((del) => (
        <Kategoridel key={del.kategori.nyckel} del={del} sortering={sortering} onSaknad={onSaknad} {...radhjalp} />
      ))}
    </div>
  )
}

/** Länkar för kategorier man inte har fyllt på än, som textlänkar med plus. Visas inte när alla har saker. */
function FyllPaFler({ kategorier, onValj }: { kategorier: { nyckel: KategoriNyckel; etikett: string }[]; onValj: (k: KategoriNyckel) => void }) {
  if (kategorier.length === 0) return null
  return (
    <Sektion rubrik="Fyll på fler kategorier">
      <ul className="-mx-3 flex flex-wrap">
        {kategorier.map((k) => (
          <li key={k.nyckel}>
            <Button variant="ghost" className="px-3 text-primary" onClick={() => onValj(k.nyckel)}>
              <Plus className="size-4" aria-hidden />
              <span className="sr-only">Lägg till i </span>
              {k.etikett}
            </Button>
          </li>
        ))}
      </ul>
    </Sektion>
  )
}

/** En tom ruta för en av de fyra tunga som saknas. Hela rutan är en knapp som öppnar Lägg till utrustning. */
function SaknadRuta({ saknad, onValj }: { saknad: SaknadGrundsak; onValj: () => void }) {
  return (
    <button
      type="button"
      onClick={onValj}
      className={cn(
        'flex w-full items-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/40 bg-transparent p-4 text-left transition-colors hover:border-primary',
        fokus,
      )}
    >
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-hjortron-strong/40 bg-hjortron-soft text-hjortron-strong">
        <Plus className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold break-words">{saknad.rubrik}</span>
        <span className="block text-sm break-words text-muted-foreground">{saknad.hjalp}</span>
      </span>
    </button>
  )
}

/**
 * Förrådets delar, som flikar. Bara Mitt förråd finns. Önskelista, Utlånat och Pensionerat kräver en ändring i
 * databasen och visas med "Snart", utan länk. Mitt förråd behåller sök och filter i adressen.
 */
function Forradsdelar({ antal }: { antal: number }) {
  const { search } = useLocation()
  return (
    <Flikrad
      etikett="Förrådets delar"
      aktiv="forrad"
      flikar={[{ nyckel: 'forrad', namn: 'Mitt förråd', till: `/forrad${search}`, antal }, ...FORRAD_EXEMPEL.flikar.map((f) => ({ nyckel: f.namn, namn: f.namn }))]}
    />
  )
}

interface Radhjalp {
  vy: Vy
  /** Hela förrådet, för köket: delarna och det som kan läggas till. */
  alla: Forradssak[]
  oppenSak: string | null
  onOppna: (sakId: string) => void
  onKlar: () => void
  /** Något har sparats direkt från raden, så listan ska hämtas igen. */
  onAndrad: () => void
  onAvbryt: () => void
}

/**
 * Sökrutan för förrådet: "Hitta i förrådet", förrådets flikar under rutan och Filter till höger. Kategori och
 * underkategori ligger i filterpanelen, och de som är valda visas som etiketter med kryss.
 */
function Sokdel({ val, onVal, saker }: { val: Listval; onVal: (val: Listval) => void; saker: Forradssak[] }) {
  const [filterOppet, setFilterOppet] = useState(false)
  const rensa = () => onVal(valjKategori(val, '', ''))
  const underetikett = underkategorivalIForradet(saker, val.kategori, val.underkategori).find((u) => u.nyckel === val.underkategori)?.etikett
  const aktiva: AktivtFilter[] = val.kategori
    ? [
        { nyckel: 'kategori', text: kategoriFor(val.kategori).etikett, onTaBort: rensa },
        ...(val.underkategori ? [{ nyckel: 'underkategori', text: underetikett ?? val.underkategori, onTaBort: () => onVal(valjKategori(val, val.kategori, '')) }] : []),
      ]
    : []
  return (
    <div className="space-y-3">
      <Sokruta
        rubrik="Hitta i förrådet"
        rubrikniva={2}
        rad={`${antalText(saker.length)} i förrådet.`}
        sok={val.sok}
        onSok={(sok) => onVal({ ...val, sok })}
        etikett="Sök i förrådet"
        placeholder="Till exempel sovsäck"
      />
      <Sokrad flikar={<Forradsdelar antal={saker.length} />} antalFilter={aktiva.length} onFilter={() => setFilterOppet(true)} />
      <AktivaFilter filter={aktiva} onRensaAllt={rensa} />
      {filterOppet && (
        <Filterpanel visa="Visa sakerna" onStang={() => setFilterOppet(false)} harFilter={aktiva.length > 0} onRensaAllt={rensa}>
          <Kategorifilter
            kategorier={kategorivalIForradet(saker, val.kategori)}
            underkategorier={underkategorivalIForradet(saker, val.kategori, val.underkategori)}
            kategori={val.kategori}
            underkategori={val.underkategori}
            onAndra={(kategori, underkategori) => onVal(valjKategori(val, kategori, underkategori))}
          />
        </Filterpanel>
      )}
    </div>
  )
}

/** Raden precis ovanför listan: sortering, val mellan lista och rutnät, och hur mycket som visas när ett filter är på. */
function Verktyg({ val, onVal, saker, visas }: { val: Listval; onVal: (val: Listval) => void; saker: Forradssak[]; visas: number }) {
  const id = useId()
  return (
    <section aria-label="Sortera och visa" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={`${id}-sortera`} className="text-sm text-muted-foreground">
            Sortera
          </label>
          <Select id={`${id}-sortera`} className="w-auto" value={val.sortering} onChange={(e) => onVal({ ...val, sortering: e.target.value as Listval['sortering'] })}>
            {SORTERINGAR.map((s) => (
              <option key={s.varde} value={s.varde}>
                {s.etikett}
              </option>
            ))}
          </Select>
        </div>
        <div role="group" aria-label="Visning" className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ['lista', 'Lista', List],
              ['rutnat', 'Rutnät', LayoutGrid],
            ] as const
          ).map(([vy, namn, Ikon]) => (
            <button
              key={vy}
              type="button"
              aria-pressed={val.vy === vy}
              onClick={() => onVal({ ...val, vy })}
              className={cn('flex size-11 items-center justify-center rounded-md', fokus, val.vy === vy ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground')}
            >
              <Ikon className="size-5" aria-hidden />
              <span className="sr-only">{namn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Säger hur mycket av förrådet som visas, så att det märks att ett filter är på. Tar ingen plats utan filter. */}
      <div className={cn('flex flex-wrap items-center gap-x-4', harFilter(val) && 'min-h-11')}>
        <p role="status" className="text-sm text-muted-foreground">
          {harFilter(val) && `Visar ${visas} av ${saker.length} saker.`}
        </p>
        {harFilter(val) && (
          <button
            type="button"
            onClick={() => onVal({ ...val, sok: '', kategori: '', underkategori: '' })}
            className={cn('min-h-11 text-sm font-medium text-primary underline underline-offset-4', fokus)}
          >
            Visa hela förrådet
          </button>
        )}
      </div>
    </section>
  )
}

/**
 * En kategori i listan: rubriken med antal och vikt, sakerna, och en tom ruta för varje grundsak som saknas.
 * En kategori utan saker säger hur många som saknas i stället för antal och vikt.
 */
function Kategoridel({ del, sortering, onSaknad, ...radhjalp }: { del: Listdel; sortering: Listval['sortering']; onSaknad: (s: SaknadGrundsak) => void } & Radhjalp) {
  const { kategori, grupp, saknade } = del
  const lista = grupp ? sortera(grupp.saker, sortering) : []
  return (
    <Sektion
      rubrik={kategori.etikett}
      atgard={
        grupp ? (
          <p className="flex gap-3 text-[13px] text-muted-foreground tabular-nums">
            <span>{antalText(grupp.antal)}</span>
            <span>{formateraVikt(grupp.viktG)}</span>
          </p>
        ) : (
          <p className="text-[13px] font-semibold text-accent-strong">{saknade.length} saknas</p>
        )
      }
    >
      {lista.length > 0 && (
      <ul
        className={cn(
          radhjalp.vy === 'lista'
            ? 'divide-y divide-border overflow-hidden rounded-lg border border-border bg-card'
            : 'grid gap-3 sm:grid-cols-2 2xl:grid-cols-3',
        )}
      >
        {lista.map((sak) => {
          const oppen = radhjalp.oppenSak === sak.id
          return (
            <li
              key={sak.id}
              className={cn(
                // I rutnätet tar ett utfällt eller öppnat kort hela raden, så att detaljerna får plats.
                radhjalp.vy === 'rutnat' && 'overflow-hidden rounded-lg border border-border bg-card shadow-soft has-[>button[aria-expanded=true]]:col-span-full',
                radhjalp.vy === 'rutnat' && oppen && 'col-span-full',
                oppen && 'p-2',
              )}
            >
              {oppen ? (
                <SakFormular sak={sak} onKlar={radhjalp.onKlar} onAvbryt={radhjalp.onAvbryt} />
              ) : (
                <Sakrad sak={sak} alla={radhjalp.alla} vy={radhjalp.vy} onAndra={() => radhjalp.onOppna(sak.id)} onAndrad={radhjalp.onAndrad} />
              )}
            </li>
          )
        })}
      </ul>
      )}
      {saknade.length > 0 && (
        <ul className="space-y-3">
          {saknade.map((s) => (
            <li key={s.grupp}>
              <SaknadRuta saknad={s} onValj={() => onSaknad(s)} />
            </li>
          ))}
        </ul>
      )}
    </Sektion>
  )
}

/** En liten rostfärgad prick som säger att något saknas och går att fylla i. Bara en markering, texten bredvid bär betydelsen. */
function Prick() {
  return <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-accent align-middle" />
}

const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)

/**
 * För kläder ur katalogen: kön, ens storlek och om katalogens vikt gäller den, till exempel "Herr, storlek L · vikten gäller M".
 * Med egen vikt visas bara kön och storlek.
 */
function kladrad(sak: Forradssak): string | null {
  const p = sak.produkter
  if (!p || !arKlader(p.underkategori)) return null
  if (viktjamforelse(sak).egen) return [konEtikett(p.egenskaper), sak.storlek ? `storlek ${sak.storlek}` : null].filter(Boolean).join(', ') || null
  return forradsStorlekText(konEtikett(p.egenskaper), sak.storlek ?? null, viktstorlek(p.egenskaper))
}

/** Versionen och underkategorin under namnet, som var sin liten etikett, till exempel Regular och Sovsäck. */
function Underrad({ sak, kok }: { sak: Forradssak; kok?: string | null }) {
  const under = underkategoriFor(sak.kategori, sak.underkategori)?.etikett ?? kategoriFor(sak.kategori).etikett
  // Kön och storleken katalogens vikt gäller, för kläder ur katalogen.
  const storlek = kladrad(sak)
  return (
    // Etiketterna på en rad under namnet. Räcker inte bredden bredvid vikten går de över på nästa rad i stället för att kapas.
    <span className="flex min-w-0 flex-wrap gap-1.5">
      {[sak.produkter?.version, under, storlek, kok].filter(Boolean).map((text) => (
        <Bricka key={text} className="shrink-0 whitespace-nowrap">
          {text}
        </Bricka>
      ))}
    </span>
  )
}

/**
 * En sak i listan eller rutnätet: ikonen för kategorin, namnet, version och kategori, vikten stort till höger och
 * anteckningen på en egen rad i hela kortets bredd. Ett tryck fäller ut katalogens uppgifter, anteckningen och knappen Ändra.
 */
function Sakrad({ sak, alla, vy, onAndra, onAndrad }: { sak: Forradssak; alla: Forradssak[]; vy: Vy; onAndra: () => void; onAndrad: () => void }) {
  const id = useId()
  const [utfalld, setUtfalld] = useState(false)
  const { egen } = viktjamforelse(sak)
  const antalDelar = arKok(sak) ? kokdelar(sak, alla).length : 0
  const kokText = antalDelar > 0 ? `Kök med ${antalDelar} ${antalDelar === 1 ? 'del' : 'delar'}` : kokForDel(sak, alla) ? 'I ditt kök' : null
  // Vikten stort till höger om namnet, och lite mindre när den står under namnet bredvid etiketterna.
  const vikt = (liten = false) =>
    sak.vikt_g === null ? (
      <span className="text-sm text-muted-foreground italic">
        <Prick />
        Ingen vikt
      </span>
    ) : (
      <span className="block text-right">
        <span className={cn('block font-bold tabular-nums', liten ? 'text-lg' : 'text-xl')}>{formateraVikt(sak.antal * sak.vikt_g)}</span>
        {egen && <span className="block text-xs text-muted-foreground">Egen vikt</span>}
      </span>
    )
  // Ord bryts aldrig mitt i (ingen break-all och ingen automatisk avstavning). Långa namn bryts mellan ord, högst två rader.
  const namn = (
    <span className="line-clamp-2 text-base font-semibold [overflow-wrap:normal] hyphens-manual">
      {/* Hårda bindestreck (U+2011), så att "2-Person" inte delas på två rader. */}
      {sak.namn.replaceAll('-', '‑')}
      {sak.antal > 1 && <span className="font-normal text-muted-foreground"> × {sak.antal}</span>}
    </span>
  )
  const anteckning = sak.notering && (
    <span className="mt-1.5 flex gap-1.5 text-sm break-words text-muted-foreground italic">
      <NotebookPen className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0">{sak.notering}</span>
    </span>
  )
  const ikon = (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
      <Kategoriikon kategori={sak.kategori as KategoriNyckel} />
    </span>
  )
  const pil = <ChevronDown className={cn('mt-1 size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />

  return (
    <>
      <button
        type="button"
        aria-expanded={utfalld}
        aria-controls={id}
        onClick={() => setUtfalld((u) => !u)}
        className={cn(
          'w-full text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
          vy === 'lista' ? '@container flex min-h-16 items-start gap-3 px-4 py-3' : 'flex h-full flex-col gap-3 p-4',
        )}
      >
        {vy === 'lista' ? (
          <>
            {ikon}
            {/*
              Namnet får hela bredden. Är raden bred nog (från 28rem) står vikten och pilen till höger om namnet,
              annars under namnet bredvid etiketterna. Anteckningen ligger sist i hela bredden.
            */}
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-start gap-3">
                <span className="min-w-0 flex-1">{namn}</span>
                <span className="hidden shrink-0 items-start gap-2 @[28rem]:flex">
                  {vikt()}
                  {pil}
                </span>
              </span>
              <span className="flex items-start justify-between gap-3">
                <Underrad sak={sak} kok={kokText} />
                <span className="flex shrink-0 items-center gap-2 @[28rem]:hidden">
                  {vikt(true)}
                  {pil}
                </span>
              </span>
              {anteckning}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-start justify-between gap-3">
              {ikon}
              {vikt()}
            </span>
            <span className="min-w-0 space-y-1">
              {namn}
              <Underrad sak={sak} kok={kokText} />
              {anteckning}
            </span>
          </>
        )}
      </button>
      <div id={id} hidden={!utfalld} className="border-t border-border bg-muted/40 px-4 py-4">
        {utfalld && <Utfalld sak={sak} alla={alla} onAndra={onAndra} onAndrad={onAndrad} />}
      </div>
    </>
  )
}

/** Den utfällda delen av en sak: katalogens uppgifter med granskningsnivån, din sak och anteckning, Ändra, och det som kommer. */
function Utfalld({ sak, alla, onAndra, onAndrad }: { sak: Forradssak; alla: Forradssak[]; onAndra: () => void; onAndrad: () => void }) {
  const id = useId()
  const [visaAlla, setVisaAlla] = useState(false)
  const [aterstaller, setAterstaller] = useState(false)
  const [fel, setFel] = useState('')
  const { grund, viktiga, ovriga } = sakdetaljer(sak)
  const { egen, katalogG } = viktjamforelse(sak)
  const produkt = sak.produkter
  const rapportera = produkt ? felrapportLank(produkt) : null

  /** Sätter tillbaka katalogens vikt. Sparas direkt, eftersom det är lätt att ändra tillbaka. */
  async function aterstallVikt() {
    if (!supabase || katalogG === null) return
    setAterstaller(true)
    setFel('')
    const { error } = await supabase.from('forradssaker').update({ vikt_g: katalogG }).eq('id', sak.id)
    setAterstaller(false)
    if (error) {
      setFel('Det gick inte att återställa vikten. Kontrollera uppkopplingen och försök igen.')
      return
    }
    onAndrad()
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <section aria-labelledby={`${id}-katalog`} className="min-w-0 space-y-2">
          <h3 id={`${id}-katalog`} className="font-sans text-sm font-semibold">
            Från katalogen
          </h3>
          {produkt ? (
            <>
              <Granskad produkt={produkt} />
              {!granskning(produkt).marke && <p className="text-sm text-muted-foreground">{granskning(produkt).forklaring}</p>}
              {viktiga.length > 0 && <Detaljlista rader={viktiga} />}
              {ovriga.length > 0 && (
                <>
                  <button type="button" aria-expanded={visaAlla} aria-controls={`${id}-alla`} onClick={() => setVisaAlla((v) => !v)} className={cn(lankKlass, 'no-underline')}>
                    {visaAlla ? 'Dölj specifikationerna' : 'Visa alla specifikationer'}
                    <ChevronDown className={cn('size-4 transition-transform', visaAlla && 'rotate-180')} aria-hidden />
                  </button>
                  <div id={`${id}-alla`} hidden={!visaAlla}>
                    <Detaljlista rader={ovriga} />
                  </div>
                </>
              )}
              <a href={produkt.kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
                Tillverkarens sida
                <ExternalLink className="size-4" aria-hidden />
                <span className="sr-only">(öppnas i ny flik)</span>
              </a>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">En egen sak, inte från katalogen.</p>
          )}
        </section>

        <section aria-labelledby={`${id}-din`} className="min-w-0 space-y-2">
          <h3 id={`${id}-din`} className="font-sans text-sm font-semibold">
            Din sak
          </h3>
          <Detaljlista rader={grund} />
          <div className="pt-1">
            <p className="text-sm font-medium">Din anteckning</p>
            <p className="text-sm break-words text-muted-foreground">{sak.notering ?? 'Ingen anteckning. Lägg till en med Ändra.'}</p>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onAndra}>
          <Pencil className="size-4" aria-hidden />
          Ändra
        </Button>
        {egen && (
          <Button variant="ghost" disabled={aterstaller} onClick={aterstallVikt}>
            <RotateCcw className="size-4" aria-hidden />
            {aterstaller ? 'Återställer …' : 'Återställ till katalogens vikt'}
          </Button>
        )}
      </div>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      {(arKok(sak) || arKokdel(sak)) && <DittKok sak={sak} alla={alla} onAndrad={onAndrad} />}

      <Kommande />

      {rapportera && (
        <p className="text-sm text-muted-foreground">
          Fel uppgift?{' '}
          <a href={rapportera} className={lankKlass}>
            Meddela oss
          </a>
        </p>
      )}
    </div>
  )
}

/** Det som kommer i den utfällda raden, som exempel: köpt, skick, turer och nätter, pris per natt, lättare alternativ och knapparna. */
function Kommande() {
  return (
    <section className="space-y-3 rounded-lg border border-dashed border-muted-foreground/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-sans text-sm font-semibold">Med packlistorna</h3>
        <KommerSnartEtikett />
      </div>
      <KommerSnart text="Här kommer det stå när saken köptes, hur många turer och nätter den har följt med, priset per natt och lättare alternativ i katalogen. Du kommer att kunna lägga den i en packlista, låna ut den och pensionera den.">
        <div className="grid gap-4 md:grid-cols-2">
          <dl className="text-sm">
            {FORRAD_EXEMPEL.detaljer.map((d) => (
              <div key={d.etikett} className="flex justify-between gap-4 border-b border-border py-1.5">
                <dt className="text-muted-foreground">{d.etikett}</dt>
                <dd className="font-medium">{d.varde}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-1 rounded-md bg-accent-soft p-3 text-sm">
            <p className="font-semibold">Lättare alternativ</p>
            <p>{FORRAD_EXEMPEL.lattare.text}</p>
            <p className="font-medium text-accent-strong underline underline-offset-4">{FORRAD_EXEMPEL.lattare.spara}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FORRAD_EXEMPEL.etiketter.map((e) => (
            <Bricka key={e}>{e}</Bricka>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FORRAD_EXEMPEL.knappar.map((k) => (
            <span key={k} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium">
              {k}
            </span>
          ))}
        </div>
      </KommerSnart>
    </section>
  )
}
