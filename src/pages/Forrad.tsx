import { ChevronDown, ExternalLink, LayoutGrid, List, NotebookPen, Pencil, Plus, RotateCcw, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { HelaForradet, Onskelista, StorstaVinsten, ViktPerKategori } from '@/components/forrad/Forradsoversikt'
import { Detaljlista } from '@/components/forrad/Detaljlista'
import { Granskad } from '@/components/forrad/Granskad'
import { Grunden } from '@/components/forrad/Grunden'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { ProduktSok } from '@/components/forrad/ProduktSok'
import { SakFormular } from '@/components/forrad/SakFormular'
import { ForradIllustration } from '@/components/illustrationer/ForradIllustration'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { KommerSnart, KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { Select } from '@/components/ui/select'
import { Snart } from '@/components/ui/snart'
import { useSidtitel } from '@/hooks/useSidtitel'
import { FORRAD_EXEMPEL } from '@/lib/exempeldata'
import {
  antalGranskade,
  formateraVikt,
  fyraTunga,
  kategoriFor,
  sakdetaljer,
  storstaVinsten,
  summeraForrad,
  underkategoriFor,
  viktjamforelse,
  type Forval,
  type KategoriNyckel,
  type Kategorigrupp,
} from '@/lib/forrad'
import {
  SORTERINGAR,
  adressFranVal,
  filtrera,
  harFilter,
  kategorivalIForradet,
  sortera,
  underkategorivalIForradet,
  valFranAdress,
  valjKategori,
  type Listval,
  type Vy,
} from '@/lib/forradslista'
import { granskning } from '@/lib/granskning'
import { felrapportLank } from '@/lib/kontakt'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Vad som är öppet: sökningen i katalogen (dialogen Lägg till utrustning), formuläret för en egen sak,
 * eller formuläret för en sak som ändras.
 */
type Oppet = { sok: true; kategori?: KategoriNyckel } | { ny: Forval } | { sakId: string } | null

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function antalText(antal: number) {
  return antal === 1 ? '1 sak' : `${antal} saker`
}

/**
 * Mitt förråd, enligt skissen Forrad-dator och Forrad-mobil: Grunden (de fyra tunga), översikten med hela förrådet,
 * vikt per kategori och största vinsten, och listan med sök, kategori, sortering och val mellan lista och rutnät.
 * Bara man själv ser sitt förråd. På dator ligger listan till vänster och översikten till höger, där den ligger kvar
 * när man scrollar. I mobil kommer den mörka rutan och Grunden först.
 */
export function Forrad() {
  useSidtitel('Mitt förråd')
  const [saker, setSaker] = useState<Forradssak[] | null>(null)
  const [laddfel, setLaddfel] = useState(false)
  const [oppet, setOppet] = useState<Oppet>(null)
  // Det senaste som lades till från katalogen, så att man kan gå vidare och ändra antal eller anteckning.
  const [tillagd, setTillagd] = useState<{ sakId: string; namn: string } | null>(null)

  // Räknas upp när något har sparats eller tagits bort, så att listan hämtas igen.
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    supabase
      ?.from('forradssaker')
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering, skapad, produkter(id, marke, modell, packvikt_g, kontrollerad, granskad, kalla_typ, version, underkategori, minvikt_g, kalla, egenskaper)')
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
    hamtaOm()
  }

  // Översikten och Grunden räknas alltid på hela förrådet, oavsett sök och filter.
  const alla = saker ?? []
  const summa = summeraForrad(alla)
  const tunga = fyraTunga(alla)

  // Sök, kategori, sortering och vy sparas i adressen, så att de finns kvar vid omladdning.
  const [parametrar, setParametrar] = useSearchParams()
  const val = valFranAdress(parametrar)
  const setVal = (nytt: Listval) => setParametrar(adressFranVal(nytt), { replace: true })
  const visade = filtrera(alla, val)
  const oppenSak = oppet !== null && 'sakId' in oppet ? oppet.sakId : null
  const radhjalp: Radhjalp = { vy: val.vy, oppenSak, onOppna: (sakId) => setOppet({ sakId }), onKlar: klar, onAndrad: hamtaOm, onAvbryt: () => setOppet(null) }
  const sokOppen = oppet !== null && 'sok' in oppet
  const ny = oppet !== null && 'ny' in oppet ? oppet.ny : null
  const oppnaSok = (kategori?: KategoriNyckel) => {
    setTillagd(null)
    setOppet({ sok: true, kategori })
  }
  const sokKategori = oppet !== null && 'sok' in oppet ? oppet.kategori : undefined
  const laggTillKnapp = (
    <Button onClick={() => oppnaSok()}>
      <Plus className="size-4" aria-hidden />
      Lägg till utrustning
    </Button>
  )
  const finnsRedan = new Set(alla.flatMap((s) => (s.produkt_id ? [s.produkt_id] : [])))

  return (
    <div className="space-y-6">
      <SidRubrik rubrik="Mitt förråd" text="Allt du äger för vandring, samlat på ett ställe." knappar={saker?.length ? laggTillKnapp : null} />

      {saker && saker.length > 0 && <Forradsdelar antal={saker.length} />}

      {sokOppen && (
        <Dialog etikett="Lägg till utrustning" onStang={() => setOppet(null)}>
          <ProduktSok
            // En tom ruta i Grunden öppnar dialogen med rätt kategori vald.
            key={sokKategori ?? 'alla'}
            startKategori={sokKategori}
            finnsRedan={finnsRedan}
            onTillagd={(sakId, namn) => {
              setTillagd({ sakId, namn })
              setOppet(null)
              hamtaOm()
            }}
            onEgen={(soktext, kategori) => {
              setTillagd(null)
              setOppet({ ny: { namn: soktext, kategori } })
            }}
            onStang={() => setOppet(null)}
          />
        </Dialog>
      )}

      {ny && <SakFormular forval={ny} onKlar={klar} onAvbryt={() => oppnaSok()} />}

      {tillagd && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-primary-soft px-4 py-2 text-sm text-primary">
          <p className="font-medium">{tillagd.namn} ligger nu i ditt förråd.</p>
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
        <p role="alert" className="text-destructive">
          Det gick inte att hämta ditt förråd. Ladda om sidan och försök igen.
        </p>
      ) : saker === null ? (
        <Laddar text="Hämtar ditt förråd">
          <Skelett className="h-28 rounded-lg" />
          <Skelett className="h-20 rounded-lg" />
          <Skelett className="h-20 rounded-lg" />
        </Laddar>
      ) : saker.length === 0 ? (
        !ny && (
          <TomtLage
            bild={<ForradIllustration className="block aspect-[8/5] w-full sm:aspect-[21/9]" />}
            rubrik="Ditt förråd är tomt"
            knapp={
              <Button size="lg" onClick={() => oppnaSok()}>
                <Plus className="size-5" aria-hidden />
                Lägg till utrustning
              </Button>
            }
          />
        )
      ) : (
        // Andra raden (listan) tar den extra höjden när översikten är högre än listan, så att det inte blir en lucka under Grunden.
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {/*
            Översikten. I mobil är omslagen display: contents, så att den mörka rutan kommer först och resten efter listan.
            På dator ligger den i en egen kolumn till höger och stannar kvar när man scrollar.
          */}
          <aside aria-label="Översikt" className="contents lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:block lg:self-stretch">
            <div className="contents lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-5">
              <HelaForradet summa={summa} granskade={antalGranskade(alla)} className="order-1 lg:order-none" />
              <div className="order-4 space-y-5 lg:order-none">
                <ViktPerKategori summa={summa} />
                <StorstaVinsten vinst={storstaVinsten(alla)} />
                <Onskelista />
              </div>
            </div>
          </aside>

          {tunga && (
            <Grunden
              tunga={tunga}
              onUppmaning={(u) => (u.gor === 'laggTill' ? oppnaSok(u.kategori) : setOppet({ sakId: u.sakId }))}
              className="order-2 lg:order-none lg:col-start-1 lg:row-start-1"
            />
          )}

          <div className="order-3 min-w-0 space-y-6 lg:order-none lg:col-start-1 lg:row-start-2">
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
              <div className={cn('grid gap-6', val.vy === 'lista' && '3xl:grid-cols-2 3xl:items-start')}>
                {summeraForrad(visade).grupper.map((grupp) => (
                  <Kategoridel key={grupp.kategori.nyckel} grupp={grupp} sortering={val.sortering} {...radhjalp} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Förrådets delar. Bara Mitt förråd finns. Önskelista, Utlånat och Pensionerat kräver en ändring i databasen. */
function Forradsdelar({ antal }: { antal: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
        Mitt förråd <span className="rounded-full bg-primary-foreground/20 px-1.5 text-xs tabular-nums">{antal}</span>
      </span>
      {/* Exempel på kommande delar. Inte knappar, eftersom de inte går att öppna än. */}
      {FORRAD_EXEMPEL.flikar.map((f) => (
        <span key={f.namn} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm text-muted-foreground">
          {f.namn}
          <Snart />
        </span>
      ))}
    </div>
  )
}

interface Radhjalp {
  vy: Vy
  oppenSak: string | null
  onOppna: (sakId: string) => void
  onKlar: () => void
  /** Något har sparats direkt från raden, så listan ska hämtas igen. */
  onAndrad: () => void
  onAvbryt: () => void
}

/** Sök, kategori och underkategori, sortering och val mellan lista och rutnät. */
function Verktyg({ val, onVal, saker, visas }: { val: Listval; onVal: (val: Listval) => void; saker: Forradssak[]; visas: number }) {
  const id = useId()
  return (
    <section aria-label="Sök och sortera" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <div className="space-y-1">
          <label htmlFor={`${id}-sok`} className="block text-sm font-medium">
            Sök i förrådet
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id={`${id}-sok`}
              type="search"
              autoComplete="off"
              enterKeyHint="search"
              maxLength={80}
              className="pl-10"
              value={val.sok}
              onChange={(e) => onVal({ ...val, sok: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-sortera`} className="block text-sm font-medium">
            Sortera
          </label>
          <Select id={`${id}-sortera`} value={val.sortering} onChange={(e) => onVal({ ...val, sortering: e.target.value as Listval['sortering'] })}>
            {SORTERINGAR.map((s) => (
              <option key={s.varde} value={s.varde}>
                {s.etikett}
              </option>
            ))}
          </Select>
        </div>
        <div role="group" aria-label="Visning" className="flex w-fit gap-1 self-end rounded-lg bg-muted p-1">
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

      <Kategorifilter
        kategorier={kategorivalIForradet(saker, val.kategori)}
        underkategorier={underkategorivalIForradet(saker, val.kategori, val.underkategori)}
        kategori={val.kategori}
        underkategori={val.underkategori}
        onAndra={(kategori, underkategori) => onVal(valjKategori(val, kategori, underkategori))}
      />

      {/* Säger hur mycket av förrådet som visas, så att det märks att ett filter är på. */}
      <div className="flex min-h-11 flex-wrap items-center gap-x-4">
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

function Kategoridel({ grupp, sortering, ...radhjalp }: { grupp: Kategorigrupp; sortering: Listval['sortering'] } & Radhjalp) {
  const { kategori, saker, antal, viktG } = grupp
  const rubrikId = `kategori-${kategori.nyckel}`
  const lista = sortera(saker, sortering)
  return (
    <section aria-labelledby={rubrikId} className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 id={rubrikId} className="text-lg">
          {kategori.etikett}
        </h2>
        <p className="text-sm text-muted-foreground">
          {antalText(antal)}, {formateraVikt(viktG)}
        </p>
      </div>
      <ul
        className={cn(
          radhjalp.vy === 'lista'
            ? 'divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft'
            : 'grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4',
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
                <Sakrad sak={sak} vy={radhjalp.vy} onAndra={() => radhjalp.onOppna(sak.id)} onAndrad={radhjalp.onAndrad} />
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** En liten rostfärgad prick som säger att något saknas och går att fylla i. Bara en markering, texten bredvid bär betydelsen. */
function Prick() {
  return <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-accent align-middle" />
}

const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)

/** Raden under namnet: versionen och underkategorin, till exempel "Regular, Sovsäck". */
function underrad(sak: Forradssak): string {
  const under = underkategoriFor(sak.kategori, sak.underkategori)?.etikett ?? kategoriFor(sak.kategori).etikett
  return [sak.produkter?.version, under].filter(Boolean).join(', ')
}

/**
 * En sak i listan eller rutnätet: ikonen för kategorin, namnet, version och kategori, vikten stort till höger och
 * anteckningen på en egen rad. Ett tryck fäller ut katalogens uppgifter, anteckningen och knappen Ändra.
 */
function Sakrad({ sak, vy, onAndra, onAndrad }: { sak: Forradssak; vy: Vy; onAndra: () => void; onAndrad: () => void }) {
  const id = useId()
  const [utfalld, setUtfalld] = useState(false)
  const Ikon = kategoriFor(sak.kategori).ikon
  const { egen } = viktjamforelse(sak)
  const vikt =
    sak.vikt_g === null ? (
      <span className="text-sm text-muted-foreground italic">
        <Prick />
        vikt saknas
      </span>
    ) : (
      <span className="block text-right">
        <span className="block font-heading text-lg font-bold tabular-nums">{formateraVikt(sak.antal * sak.vikt_g)}</span>
        {egen && <span className="block text-xs text-muted-foreground">Egen vikt</span>}
      </span>
    )
  const namn = (
    <span className="block font-semibold break-words">
      {sak.namn}
      {sak.antal > 1 && <span className="font-normal text-muted-foreground"> × {sak.antal}</span>}
    </span>
  )
  const anteckning = sak.notering && (
    <span className="mt-1 flex gap-1.5 text-sm break-words text-foreground/80">
      <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0">{sak.notering}</span>
    </span>
  )
  const ikon = (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
      <Ikon className="size-5" aria-hidden />
    </span>
  )

  return (
    <>
      <button
        type="button"
        aria-expanded={utfalld}
        aria-controls={id}
        onClick={() => setUtfalld((u) => !u)}
        className={cn(
          'w-full text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
          vy === 'lista' ? 'flex min-h-16 items-start gap-3 px-4 py-3' : 'flex h-full flex-col gap-3 p-4',
        )}
      >
        {vy === 'lista' ? (
          <>
            {ikon}
            <span className="min-w-0 flex-1">
              {namn}
              <span className="block text-sm break-words text-muted-foreground">{underrad(sak)}</span>
              {anteckning}
            </span>
            <span className="shrink-0">{vikt}</span>
            <ChevronDown className={cn('mt-2 size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />
          </>
        ) : (
          <>
            <span className="flex items-start justify-between gap-3">
              {ikon}
              {vikt}
            </span>
            <span className="min-w-0">
              {namn}
              <span className="block text-sm break-words text-muted-foreground">{underrad(sak)}</span>
              {anteckning}
            </span>
          </>
        )}
      </button>
      <div id={id} hidden={!utfalld} className="border-t border-border bg-muted/40 px-4 py-4">
        {utfalld && <Utfalld sak={sak} onAndra={onAndra} onAndrad={onAndrad} />}
      </div>
    </>
  )
}

/** Den utfällda delen av en sak: katalogens uppgifter med granskningsnivån, din sak och anteckning, Ändra, och det som kommer. */
function Utfalld({ sak, onAndra, onAndrad }: { sak: Forradssak; onAndra: () => void; onAndrad: () => void }) {
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
      setFel('Det gick inte att återställa vikten. Försök igen.')
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
            <span key={e} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {e}
            </span>
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
