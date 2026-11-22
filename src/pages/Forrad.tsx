import { ChevronDown, ExternalLink, Pencil, Plus, RotateCcw, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Granskad } from '@/components/forrad/Granskad'
import { ProduktSok } from '@/components/forrad/ProduktSok'
import { SakFormular } from '@/components/forrad/SakFormular'
import { ForradIllustration } from '@/components/illustrationer/ForradIllustration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt, forradsrad, fyraTunga, sakdetaljer, summeraForrad, underkategoriFor, viktjamforelse, type Detaljrad, type Forval, type KategoriNyckel, type Kategorigrupp } from '@/lib/forrad'
import {
  MIN_FOR_VERKTYG,
  SORTERINGAR,
  adressFranVal,
  filtrera,
  harVal,
  kategorierIForradet,
  sortera,
  valFranAdress,
  FORVALDA_VAL,
  type Listval,
} from '@/lib/forradslista'
import { felrapportLank } from '@/lib/kontakt'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Vad som är öppet: sökningen i katalogen (första steget i Lägg till), formuläret för en egen sak,
 * eller formuläret för en sak som ändras.
 */
type Oppet = { sok: true; kategori?: KategoriNyckel } | { ny: Forval } | { sakId: string } | null

function antalText(antal: number) {
  return antal === 1 ? '1 sak' : `${antal} saker`
}

/** Mitt förråd: ens egen utrustning med vikt, grupperad per huvudkategori. Bara man själv ser den. */
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
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering, skapad, produkter(id, marke, modell, packvikt_g, kontrollerad, version, underkategori, minvikt_g, kalla, egenskaper)')
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

  // Summeringen överst och De fyra tunga räknas alltid på hela förrådet, oavsett sök och filter.
  const summa = summeraForrad(saker ?? [])

  // Sök, sortering och kategori sparas i adressen, så att de finns kvar vid omladdning.
  // Verktygen visas först när förrådet är stort nog. Innan dess gäller alltid grundläget.
  const [parametrar, setParametrar] = useSearchParams()
  const harVerktyg = (saker?.length ?? 0) >= MIN_FOR_VERKTYG
  const val = harVerktyg ? valFranAdress(parametrar) : FORVALDA_VAL
  const setVal = (nytt: Listval) => setParametrar(adressFranVal(nytt), { replace: true })
  const visade = filtrera(saker ?? [], val)
  const oppenSak = oppet !== null && 'sakId' in oppet ? oppet.sakId : null
  const radhjalp = { oppenSak, onOppna: (sakId: string) => setOppet({ sakId }), onKlar: klar, onAndrad: hamtaOm, onAvbryt: () => setOppet(null) }
  const sokOppen = oppet !== null && 'sok' in oppet
  const ny = oppet !== null && 'ny' in oppet ? oppet.ny : null
  const laggerTill = sokOppen || ny !== null
  const oppnaSok = (kategori?: KategoriNyckel) => {
    setTillagd(null)
    setOppet({ sok: true, kategori })
  }
  const sokKategori = oppet !== null && 'sok' in oppet ? oppet.kategori : undefined
  const tunga = fyraTunga(saker ?? [])
  const laggTillKnapp = !laggerTill && (
    <Button onClick={() => oppnaSok()}>
      <Plus className="size-4" aria-hidden />
      Lägg till utrustning
    </Button>
  )
  // Raden under rubriken ersätter summeringskorten. Pricken framför "saknar vikt" säger att här finns något att göra.
  const rad = saker?.length ? forradsrad(summa) : null
  const ingress = rad ? (
    <>
      {rad.saker}
      {rad.saknarVikt && (
        <>
          {' · '}
          <span className="whitespace-nowrap">
            <Prick />
            {rad.saknarVikt}
          </span>
        </>
      )}
    </>
  ) : (
    'Din egen utrustning, samlad på ett ställe.'
  )
  const finnsRedan = new Set((saker ?? []).flatMap((s) => (s.produkt_id ? [s.produkt_id] : [])))

  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mitt förråd" text={ingress} knappar={saker?.length ? laggTillKnapp : null} />

      {sokOppen && (
        <ProduktSok
          // En uppmaning i De fyra tunga öppnar rutan med rätt kategori vald, även om den redan är öppen.
          key={sokKategori ?? 'alla'}
          startKategori={sokKategori}
          finnsRedan={finnsRedan}
          onTillagd={(sakId, namn) => {
            setTillagd({ sakId, namn })
            hamtaOm()
          }}
          onEgen={(soktext, kategori) => {
            setTillagd(null)
            setOppet({ ny: { namn: soktext, kategori } })
          }}
          onStang={() => setOppet(null)}
        />
      )}

      {ny && <SakFormular forval={ny} onKlar={klar} onAvbryt={() => oppnaSok()} />}

      {tillagd && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-primary-soft px-4 py-2 text-sm text-primary">
          <p className="font-medium">{tillagd.namn} ligger nu i ditt förråd.</p>
          <button
            type="button"
            className="min-h-11 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
        <p role="status" className="text-muted-foreground">
          Hämtar ditt förråd …
        </p>
      ) : saker.length === 0 ? (
        !laggerTill && (
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
        <>
          {tunga && (
            <section aria-labelledby="fyra-tunga" className="space-y-2">
              <h2 id="fyra-tunga" className="text-lg font-semibold">
                {tunga.text}
              </h2>
              {/* Det som saknas står i en gul ruta: här finns något att göra. Texten är mörk för kontrastens skull. */}
              {tunga.uppmaningar.length > 0 && (
                <ul className="flex flex-wrap gap-x-5 rounded-md bg-accent-soft px-4 py-1 text-sm text-foreground">
                  {tunga.uppmaningar.map((u) => (
                    <li key={u.grupp}>
                      <button
                        type="button"
                        className="min-h-11 font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        onClick={() => (u.gor === 'laggTill' ? oppnaSok(u.kategori) : setOppet({ sakId: u.sakId }))}
                      >
                        {u.text}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {harVerktyg && <Verktyg val={val} onVal={setVal} kategorier={kategorierIForradet(saker)} visas={visade.length} av={saker.length} />}

          {visade.length === 0 ? (
            <div className="space-y-2 rounded-lg border border-dashed border-border px-5 py-6">
              <p className="text-muted-foreground">Inga saker i förrådet matchar.</p>
              <Button variant="outline" onClick={() => setVal(FORVALDA_VAL)}>
                Visa hela förrådet
              </Button>
            </div>
          ) : val.sortering === 'kategori' ? (
            <div className="space-y-6">
              {summeraForrad(visade).grupper.map((grupp) => (
                <Kategoridel key={grupp.kategori.nyckel} grupp={grupp} {...radhjalp} />
              ))}
            </div>
          ) : (
            // Med en annan sortering än Kategori visas en enda lista utan kategorirubriker.
            <Saklista saker={sortera(visade, val.sortering)} {...radhjalp} />
          )}
        </>
      )}
    </div>
  )
}

interface Radhjalp {
  oppenSak: string | null
  onOppna: (sakId: string) => void
  onKlar: () => void
  /** Något har sparats direkt från raden, så listan ska hämtas igen. */
  onAndrad: () => void
  onAvbryt: () => void
}

/** Sök, sortering och val av kategori. Visas när förrådet är stort nog för att behöva dem. */
function Verktyg({
  val,
  onVal,
  kategorier,
  visas,
  av,
}: {
  val: Listval
  onVal: (val: Listval) => void
  kategorier: { nyckel: string; etikett: string }[]
  visas: number
  av: number
}) {
  const id = useId()
  return (
    <section aria-label="Sök och sortera" className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="space-y-1">
          <label htmlFor={`${id}-sok`} className="block text-sm font-medium">
            Sök i ditt förråd
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
        <div className="space-y-1">
          <label htmlFor={`${id}-kategori`} className="block text-sm font-medium">
            Visa
          </label>
          <Select id={`${id}-kategori`} value={val.kategori} onChange={(e) => onVal({ ...val, kategori: e.target.value as Listval['kategori'] })}>
            <option value="">Alla kategorier</option>
            {kategorier.map((k) => (
              <option key={k.nyckel} value={k.nyckel}>
                {k.etikett}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {/* Säger hur mycket av förrådet som visas, så att det märks att ett filter är på. */}
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {harVal({ ...val, sortering: 'kategori' }) && `Visar ${visas} av ${av} rader.`}
      </p>
    </section>
  )
}

/** Raderna med saker. Den sak som ändras visas som ett formulär i stället för sin rad. */
function Saklista({ saker, oppenSak, onOppna, onKlar, onAndrad, onAvbryt }: { saker: Forradssak[] } & Radhjalp) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
      {saker.map((sak) =>
        oppenSak === sak.id ? (
          <li key={sak.id} className="p-2">
            <SakFormular sak={sak} onKlar={onKlar} onAvbryt={onAvbryt} />
          </li>
        ) : (
          <li key={sak.id}>
            <Sakrad sak={sak} onAndra={() => onOppna(sak.id)} onAndrad={onAndrad} />
          </li>
        ),
      )}
    </ul>
  )
}

function Kategoridel({
  grupp,
  oppenSak,
  onOppna,
  onKlar,
  onAndrad,
  onAvbryt,
}: {
  grupp: Kategorigrupp
  oppenSak: string | null
  onOppna: (sakId: string) => void
  onKlar: () => void
  /** Något har sparats direkt från raden, så listan ska hämtas igen. */
  onAndrad: () => void
  onAvbryt: () => void
}) {
  const { kategori, saker, antal, viktG } = grupp
  const Ikon = kategori.ikon
  const rubrikId = `kategori-${kategori.nyckel}`
  return (
    <section aria-labelledby={rubrikId} className="space-y-2">
      {/* Summeringen står intill rubriken, och under den i mobil. */}
      <div className="flex items-start gap-3">
        <Ikon className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <h2 id={rubrikId} className="text-xl">
            {kategori.etikett}
          </h2>
          <p className="text-sm text-muted-foreground">
            {antalText(antal)} · {formateraVikt(viktG)}
          </p>
        </div>
      </div>
      <Saklista saker={saker} oppenSak={oppenSak} onOppna={onOppna} onKlar={onKlar} onAndrad={onAndrad} onAvbryt={onAvbryt} />
    </section>
  )
}

/** En liten gul prick som säger att något saknas och går att fylla i. Bara en markering, texten bredvid bär betydelsen. */
function Prick() {
  return <span aria-hidden className="mr-1.5 inline-block size-2 rounded-full bg-accent align-middle" />
}

const lankKlass =
  'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Rader med rubrik och värde. På bredare skärmar i två kolumner, så att värdet står nära sin rubrik. */
function Detaljlista({ rader }: { rader: Detaljrad[] }) {
  return (
    <dl className="grid gap-x-8 text-sm sm:grid-cols-2">
      {rader.map((rad) => (
        <div key={rad.etikett} className="flex justify-between gap-4 border-b border-border py-1.5">
          <dt className="text-muted-foreground">{rad.etikett}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{rad.varde}</dd>
        </div>
      ))}
    </dl>
  )
}

/** En sak i listan. Ett tryck på raden fäller ut informationen om saken, där den också går att ändra. */
function Sakrad({ sak, onAndra, onAndrad }: { sak: Forradssak; onAndra: () => void; onAndrad: () => void }) {
  const id = useId()
  const [utfalld, setUtfalld] = useState(false)
  const [visaAlla, setVisaAlla] = useState(false)
  const [aterstaller, setAterstaller] = useState(false)
  const [fel, setFel] = useState('')
  // Underkategorin och anteckningen står diskret under namnet.
  const detaljer = [underkategoriFor(sak.kategori, sak.underkategori)?.etikett, sak.notering].filter(Boolean).join(' · ')
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
    <>
      <button
        type="button"
        aria-expanded={utfalld}
        aria-controls={id}
        onClick={() => setUtfalld((u) => !u)}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-medium break-words">
            {sak.namn}
            {sak.antal > 1 && <span className="font-normal text-muted-foreground"> × {sak.antal}</span>}
          </span>
          {/* Versionen, till exempel Regular eller Red Label, står under namnet som i träfflistan. */}
          {produkt?.version && <span className="block text-sm break-words text-muted-foreground">{produkt.version}</span>}
          {detaljer && <span className="block text-sm break-words text-muted-foreground">{detaljer}</span>}
        </span>
        {sak.vikt_g === null ? (
          <span className="shrink-0 text-sm text-muted-foreground italic">
            <Prick />
            vikt saknas
          </span>
        ) : (
          <span className="shrink-0 text-right">
            <span className="block text-sm font-medium">{formateraVikt(sak.antal * sak.vikt_g)}</span>
            {egen && <span className="block text-sm text-muted-foreground">Egen vikt</span>}
          </span>
        )}
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />
      </button>

      {/*
        Etiketten Granskad gäller katalogens uppgifter. Den står vid raden så länge vikten är katalogens.
        Har man en egen vikt flyttas den ner till specifikationerna, så att den inte ser ut att gälla den egna vikten.
        Den ligger utanför knappen, eftersom etiketten själv går att trycka på.
        Att en produkt inte är granskad står bara i den utfällda detaljen.
      */}
      {produkt && !egen && <Granskad kontrollerad={produkt.kontrollerad} className="px-4 pb-2" />}

      <div id={id} hidden={!utfalld} className="space-y-4 border-t border-border bg-muted/40 px-4 py-3">
        <Detaljlista rader={grund} />

        {egen && (
          <Button variant="outline" disabled={aterstaller} onClick={aterstallVikt}>
            <RotateCcw className="size-4" aria-hidden />
            {aterstaller ? 'Återställer …' : 'Återställ till katalogens vikt'}
          </Button>
        )}
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            {fel}
          </p>
        )}

        {produkt && (
          <section aria-labelledby={`${id}-spec`} className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 id={`${id}-spec`} className="text-sm font-semibold">
                Specifikationer från katalogen
              </h3>
              {egen && <Granskad kontrollerad={produkt.kontrollerad} />}
            </div>
            {!produkt.kontrollerad && <p className="text-sm text-muted-foreground">Produktuppgifterna har inte granskats.</p>}
            {viktiga.length > 0 && <Detaljlista rader={viktiga} />}
            {ovriga.length > 0 && (
              <>
                <button
                  type="button"
                  aria-expanded={visaAlla}
                  aria-controls={`${id}-alla`}
                  onClick={() => setVisaAlla((v) => !v)}
                  className={cn(lankKlass, 'no-underline')}
                >
                  {visaAlla ? 'Dölj specifikationerna' : 'Visa alla specifikationer'}
                  <ChevronDown className={cn('size-4 transition-transform', visaAlla && 'rotate-180')} aria-hidden />
                </button>
                <div id={`${id}-alla`} hidden={!visaAlla}>
                  <Detaljlista rader={ovriga} />
                </div>
              </>
            )}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Button variant="outline" onClick={onAndra}>
            <Pencil className="size-4" aria-hidden />
            Ändra
          </Button>
          {produkt && (
            <a href={produkt.kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
              Tillverkarens sida
              <ExternalLink className="size-4" aria-hidden />
              <span className="sr-only">(öppnas i ny flik)</span>
            </a>
          )}
        </div>

        {rapportera && (
          <p className="border-t border-border pt-2 text-sm text-muted-foreground">
            Fel uppgift?{' '}
            <a href={rapportera} className={lankKlass}>
              Meddela oss
            </a>
          </p>
        )}
      </div>
    </>
  )
}
