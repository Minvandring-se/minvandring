import { Check, ChevronDown, ChevronLeft, ExternalLink, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Granskad } from '@/components/forrad/Granskad'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { KOLUMNER, PassarMed, type Kokval } from '@/components/forrad/PassarMed'
import { SakFormular } from '@/components/forrad/SakFormular'
import { Bricka } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { Panel } from '@/components/ui/panel'
import { Sektion } from '@/components/ui/sektion'
import { Specrutor } from '@/components/ui/specrutor'
import { useSidtitel } from '@/hooks/useSidtitel'
import { arKategori, formateraVikt, KATEGORIER, kategoriFor, produktdetaljer, underkategoriFor, underkategorierFor, type KategoriNyckel } from '@/lib/forrad'
import { forradsadress } from '@/lib/forradslista'
import {
  forvalFranProdukt,
  gArAttSoka,
  grupperaModeller,
  iForradetText,
  ingaTraffarText,
  modellMedProdukt,
  produktnamn,
  sokfilter,
  sokord,
  sorteraTraffar,
  visasText,
  type Modell,
} from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Katalogprodukt } from '@/lib/typer'
import { cn } from '@/lib/utils'

// Kort som visas åt gången. "Visa fler" visar lika många till.
const SIDA = 100
// Supabase lämnar högst 1 000 rader per fråga, så träffarna hämtas i omgångar. Katalogen är liten (runt 1 300
// produkter), så alla träffar hämtas: de rangordnas och grupperas till modeller här, och det går inte att göra
// sida för sida i databasen. Se docs/att-ta-senare.md.
const OMGANG = 1000
const MAX_OMGANGAR = 10
const FORDROJNING_MS = 250
// Allt som visas i detaljpanelen hämtas i samma fråga, så att det inte blir en fråga per kort.
type Lage = { nyckel: string; modeller: Modell<Katalogprodukt>[] } | { nyckel: string; fel: true } | null

/** Produkt-id mot produktens version (storlek), för de produkter man har i förrådet. */
type IForradetKarta = ReadonlyMap<string, string | null>

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Hämtar vilka produkter ur katalogen man har i förrådet, med storlek. RLS gör att bara ens egna saker kommer
 * tillbaka. Hela förrådet hämtas, eftersom det är litet, i stället för att skicka alla träffarnas id i adressen.
 */
async function hamtaIForradet(): Promise<IForradetKarta> {
  if (!supabase) return new Map()
  const { data } = await supabase.from('forradssaker').select('produkt_id, produkter(version)').not('produkt_id', 'is', null)
  const rader = (data as unknown as { produkt_id: string; produkter: { version: string | null } | null }[] | null) ?? []
  return new Map(rader.map((s) => [s.produkt_id, s.produkter?.version ?? null]))
}

/**
 * Utrustningskatalogen: sök och filtrera bland produkterna i katalogen och se vikten. Ett tryck på ett kort öppnar
 * en detaljpanel med specifikationerna, och produkten går att lägga i förrådet därifrån. Den öppna produkten står i
 * adressen (?produkt=<id>), så att bakåtknappen stänger panelen och en länk kan öppna den direkt.
 * Jämförelse sida vid sida kommer senare.
 */
export function Utrustningskatalog() {
  useSidtitel('Utrustningskatalog')
  const id = useId()
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>('')
  const [underkategori, setUnderkategori] = useState('')
  const [antal, setAntal] = useState<number | null>(null)
  const [lage, setLage] = useState<Lage>(null)
  // Hur många kort som visas, för sökningen i nyckel. En ny sökning börjar om från en sida.
  const [visas, setVisas] = useState<{ nyckel: string; antal: number }>({ nyckel: '', antal: SIDA })
  // Räknas upp av Försök igen, så att sökningen görs igen.
  const [forsok, setForsok] = useState(0)
  // Produkterna i träfflistan som finns i ens förråd, med produktens version (storlek). Hämtas med en fråga per träfflista.
  const [iForradet, setIForradet] = useState<IForradetKarta>(new Map())
  // Produkten som läggs i förrådet just nu, i formuläret.
  const [laggTill, setLaggTill] = useState<Katalogprodukt | null>(null)
  // Kokkärlen man har lagt till i "Ditt kök" för en brännare. Ligger kvar när man öppnar ett kokkärl och går tillbaka.
  const [kok, setKok] = useState<Kokval | null>(null)
  // En produkt som öppnas från en länk och inte finns i träfflistan hämtas för sig, med sin modells alla storlekar.
  const [direkt, setDirekt] = useState<{ for: string; modeller: Modell<Katalogprodukt>[]; iForradet: IForradetKarta } | null>(null)

  const [parametrar, setParametrar] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const produktId = parametrar.get('produkt')

  const harText = gArAttSoka(text)
  const sokbar = harText || kategori !== ''
  const nyckel = `${kategori}|${underkategori}|${text}`

  useEffect(() => {
    supabase
      ?.from('produkter')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setAntal(count ?? null))
  }, [])

  useEffect(() => {
    if (!supabase || !sokbar) return
    const klient = supabase
    let avbruten = false
    const timer = window.setTimeout(async () => {
      // Alla träffar, i omgångar. Ordningen på id gör att ingen rad hamnar i två omgångar eller faller bort.
      const alla: Katalogprodukt[] = []
      let fel = false
      for (let i = 0; i < MAX_OMGANGAR; i++) {
        let fraga = klient.from('produkter').select(KOLUMNER)
        if (kategori) fraga = fraga.eq('kategori', kategori)
        if (underkategori) fraga = fraga.eq('underkategori', underkategori)
        if (harText) for (const ord of sokord(text)) fraga = fraga.or(sokfilter(ord))
        const { data, error } = await fraga.order('id').range(i * OMGANG, (i + 1) * OMGANG - 1)
        if (avbruten) return
        if (error) {
          fel = true
          break
        }
        alla.push(...((data as Katalogprodukt[] | null) ?? []))
        if ((data?.length ?? 0) < OMGANG) break
      }
      const produkter = alla
      const egna = fel ? new Map<string, string | null>() : await hamtaIForradet()
      if (avbruten) return
      setIForradet(egna)
      setLage(fel ? { nyckel, fel: true } : { nyckel, modeller: grupperaModeller(sorteraTraffar(produkter, harText ? text : '')) })
    }, FORDROJNING_MS)
    return () => {
      avbruten = true
      window.clearTimeout(timer)
    }
  }, [text, kategori, underkategori, harText, sokbar, nyckel, forsok])

  const aktuellt = sokbar && lage?.nyckel === nyckel ? lage : null
  // Förra träfflistan ligger kvar, dämpad, tills nästa kommer. Då hoppar inte sidan medan man skriver.
  const modeller = sokbar && lage && 'modeller' in lage ? lage.modeller : null
  const gammal = !aktuellt
  const antalVisas = visas.nyckel === nyckel ? visas.antal : SIDA
  const synliga = modeller?.slice(0, antalVisas) ?? null

  // Den öppna produkten: ur träfflistan, annars den som hämtades för sig.
  const iListan = produktId && modeller ? modellMedProdukt(modeller, produktId) : null
  const fraanLank = produktId && !iListan && direkt?.for === produktId ? modellMedProdukt(direkt.modeller, produktId) : null
  // Medan en produkt som inte finns i träfflistan hämtas visas den förra, så att panelen inte försvinner och kommer tillbaka.
  const behoverHamtasNu = !!produktId && !iListan && direkt?.for !== produktId
  const hittad = iListan ?? fraanLank
  const [senast, setSenast] = useState<typeof hittad>(null)
  if (hittad && hittad.produkt.id !== senast?.produkt.id) setSenast(hittad)
  const oppen = hittad ?? (behoverHamtasNu ? senast : null)
  const oppenIForradet = iListan ? iForradet : (direkt?.iForradet ?? iForradet)

  // En länk till en produkt som inte finns i träfflistan: hämta produkten och sedan modellens alla storlekar.
  const behoverHamtas = behoverHamtasNu
  useEffect(() => {
    if (!supabase || !produktId || !behoverHamtas) return
    const klient = supabase
    let avbruten = false
    ;(async () => {
      const { data: en } = await klient.from('produkter').select(KOLUMNER).eq('id', produktId).maybeSingle()
      const p = en as Katalogprodukt | null
      const { data: alla } = p ? await klient.from('produkter').select(KOLUMNER).eq('marke', p.marke).eq('modell', p.modell) : { data: null }
      const produkter = (alla as Katalogprodukt[] | null) ?? []
      const egna = await hamtaIForradet()
      if (!avbruten) setDirekt({ for: produktId, modeller: grupperaModeller(produkter), iForradet: egna })
    })()
    return () => {
      avbruten = true
    }
  }, [produktId, behoverHamtas])

  /** Markerar produkter som finns i förrådet efter att de har lagts dit, utan att hämta om träfflistan. */
  function markeraIForradet(produkter: Katalogprodukt[]) {
    const nytt = (s: IForradetKarta) => new Map([...s, ...produkter.map((p) => [p.id, p.version] as const)])
    setIForradet(nytt)
    setDirekt((d) => (d ? { ...d, iForradet: nytt(d.iForradet) } : d))
  }

  /** Öppnar panelen. Ett nytt steg i historiken, så att bakåtknappen stänger den. */
  function oppna(produkt: string, fran?: string) {
    const p = new URLSearchParams(parametrar)
    p.set('produkt', produkt)
    // Hur många steg panelen har öppnats i följd, så att Stäng går tillbaka förbi alla.
    const djup = ((location.state as { djup?: number } | null)?.djup ?? 0) + 1
    setParametrar(p, { state: { panel: true, fran, djup } })
  }

  /** Byter storlek i panelen utan ett nytt steg i historiken. */
  function valjStorlek(produkt: string) {
    const p = new URLSearchParams(parametrar)
    p.set('produkt', produkt)
    setParametrar(p, { replace: true, state: location.state })
  }

  /** Stänger panelen: ett steg bakåt om panelen öppnades här, annars tas produkten bort ur adressen. */
  function stang() {
    const state = location.state as { panel?: boolean; djup?: number } | null
    if (state?.panel) {
      navigate(-(state.djup ?? 1))
      return
    }
    const p = new URLSearchParams(parametrar)
    p.delete('produkt')
    setParametrar(p, { replace: true })
  }

  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Utrustningskatalog"
        text={
          antal
            ? `Sök bland ${antal.toLocaleString('sv-SE')} produkter i katalogen och se vad de väger. Lägg till det du har i Mitt förråd.`
            : 'Sök bland produkterna i katalogen och se vad de väger. Lägg till det du har i Mitt förråd.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
        <div className="space-y-1">
          <label htmlFor={`${id}-sok`} className="block text-sm font-medium">
            Sök på märke, modell eller version
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
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        </div>
        <Kategorifilter
          kategorier={KATEGORIER}
          underkategorier={underkategorierFor(kategori)}
          kategori={kategori}
          underkategori={underkategori}
          onAndra={(k, u) => {
            const ny = arKategori(k) ? k : ''
            setKategori(ny)
            setUnderkategori(ny && underkategoriFor(ny, u) ? u : '')
          }}
        />
      </div>


      {!sokbar && <p className="text-sm text-muted-foreground">Skriv minst två tecken eller välj en kategori.</p>}
      {sokbar && !aktuellt && !modeller && (
        <Laddar text="Hämtar produkter" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Skelett className="h-28 rounded-lg" />
          <Skelett className="h-28 rounded-lg" />
        </Laddar>
      )}
      {aktuellt && 'fel' in aktuellt && <Laddfel vad="produkterna" onForsokIgen={() => setForsok((n) => n + 1)} />}
      {!gammal && modeller?.length === 0 && <TomtLage kompakt text={ingaTraffarText({ harText, kategori, underkategori })} />}
      <div aria-live="polite" className="text-sm">
        {!gammal && modeller && modeller.length > 0 && <p className="font-medium">{visasText(Math.min(antalVisas, modeller.length), modeller.length)}</p>}
      </div>

      {synliga && synliga.length > 0 && (
        <ul aria-busy={gammal} className={cn('grid gap-3 transition-opacity md:grid-cols-2 xl:grid-cols-3', gammal && 'opacity-60')}>
          {synliga.map((m) => (
            <Produktkort key={m.nyckel} modell={m} iForradet={iForradet} onOppna={() => oppna(m.varianter[0].id)} />
          ))}
        </ul>
      )}

      {!gammal && modeller && modeller.length > antalVisas && (
        <Button variant="outline" onClick={() => setVisas({ nyckel, antal: antalVisas + SIDA })}>
          Visa fler
        </Button>
      )}

      {oppen && (
        <Produktpanel
          key={oppen.modell.nyckel}
          modell={oppen.modell}
          vald={oppen.produkt}
          iForradet={oppenIForradet}
          onValj={valjStorlek}
          onLaggTill={setLaggTill}
          onOppna={(id) => oppna(id, produktnamn(oppen.modell))}
          onSparat={markeraIForradet}
          kok={kok}
          onKok={setKok}
          tillbaka={(location.state as { fran?: string } | null)?.fran}
          onTillbaka={() => navigate(-1)}
          onStang={stang}
        />
      )}

      {laggTill && (
        <Dialog etikett="Lägg i förrådet" onStang={() => setLaggTill(null)}>
          <SakFormular
            forval={forvalFranProdukt(laggTill)}
            onKlar={() => {
              markeraIForradet([laggTill])
              setLaggTill(null)
            }}
            onAvbryt={() => setLaggTill(null)}
          />
        </Dialog>
      )}

      <Sektion rubrik="Jämför sida vid sida" kommerSnart>
        <p className="max-w-prose text-sm text-muted-foreground">Välj två eller tre produkter och se vikt, mått och pris bredvid varandra.</p>
      </Sektion>
    </div>
  )
}

/** Vilka storlekar av modellen man har i förrådet, med texten och produkten som länken till Mitt förråd utgår från. */
function iForradetFor(modell: Modell<Katalogprodukt>, iForradet: IForradetKarta): { produkt: Katalogprodukt; text: string } | null {
  const egna = modell.varianter.filter((v) => iForradet.has(v.id))
  return egna.length ? { produkt: egna[0], text: iForradetText(egna.map((v) => iForradet.get(v.id) ?? null)) } : null
}

/**
 * En modell i katalogen: namn, kategori, vikten och storlekarna om det finns flera. Ett tryck öppnar detaljpanelen.
 * Kortet ändras inte när panelen öppnas, så rutnätet står still.
 */
function Produktkort({ modell, iForradet, onOppna }: { modell: Modell<Katalogprodukt>; iForradet: IForradetKarta; onOppna: () => void }) {
  const forsta = modell.varianter[0]
  const { ikon: Ikon, etikett } = kategoriFor(forsta.kategori)
  const flera = modell.varianter.length > 1
  const finns = iForradetFor(modell, iForradet)
  return (
    <li className="flex h-full flex-col rounded-lg border border-border bg-card">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOppna}
        className="flex w-full flex-1 flex-col gap-2 rounded-lg p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex w-full items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Ikon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold break-words">{produktnamn(modell)}</span>
            <span className="block text-sm text-muted-foreground">
              {flera ? `${etikett}, ${modell.varianter.length} storlekar` : [etikett, forsta.version].filter(Boolean).join(', ')}
            </span>
          </span>
          <span className="shrink-0 font-heading text-lg font-semibold tabular-nums">
            {flera && <span className="font-sans text-sm font-normal text-muted-foreground">från </span>}
            {formateraVikt(forsta.packvikt_g)}
          </span>
        </span>
        {flera && (
          <span className="block w-full space-y-0.5 border-t border-border pt-2 text-sm">
            {modell.varianter.map((v) => (
              <span key={v.id} className="flex justify-between gap-3">
                <span className="min-w-0 break-words text-muted-foreground">{v.version || 'Utan storlek'}</span>
                <span className="shrink-0 tabular-nums">{formateraVikt(v.packvikt_g)}</span>
              </span>
            ))}
          </span>
        )}
      </button>
      <div className="space-y-2 px-4 pt-2 pb-4">
        <Granskad produkt={forsta} />
        {finns && <IForradet finns={finns} />}
      </div>
    </li>
  )
}

/**
 * Detaljpanelen för en modell: namn och vikt stort, vad man har i förrådet, storlekarna, specifikationerna som rutor,
 * källan, och knapparna fast i botten. Allt gäller den valda storleken.
 */
function Produktpanel({
  modell,
  vald,
  iForradet,
  onValj,
  onLaggTill,
  onOppna,
  onSparat,
  kok,
  onKok,
  tillbaka,
  onTillbaka,
  onStang,
}: {
  modell: Modell<Katalogprodukt>
  vald: Katalogprodukt
  iForradet: IForradetKarta
  onValj: (id: string) => void
  onLaggTill: (p: Katalogprodukt) => void
  onOppna: (id: string) => void
  onSparat: (produkter: Katalogprodukt[]) => void
  kok: Kokval | null
  onKok: (k: Kokval) => void
  /** Namnet på produkten man kom från via "Passar med", för knappen tillbaka dit. */
  tillbaka?: string
  onTillbaka: () => void
  onStang: () => void
}) {
  const id = useId()
  const [visaAlla, setVisaAlla] = useState(false)
  const { grund, viktiga, ovriga } = produktdetaljer(vald)
  const finns = iForradetFor(modell, iForradet)
  const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)
  // Vikten står stort under namnet. Den första raden i grund är alltid vikten, så rutorna börjar med raden efter.
  const rutor = [...grund.slice(1), ...viktiga]
  return (
    <Panel
      etikett={produktnamn(modell)}
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          {tillbaka && (
            <button type="button" onClick={onTillbaka} className={cn('-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary', fokus)}>
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Tillbaka till {tillbaka}
            </button>
          )}
          <h2 className="text-2xl break-words">{produktnamn(modell)}</h2>
          <p className="font-heading text-3xl font-semibold tabular-nums">{formateraVikt(vald.packvikt_g)}</p>
          {vald.version && <p className="text-sm text-muted-foreground">{vald.version}</p>}
          {finns && <IForradet finns={finns} />}
        </div>
      }
      fot={
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => onLaggTill(vald)}>Lägg i förrådet</Button>
          <Button variant="outline" disabled>
            Lägg på önskelistan
            <KommerSnartEtikett />
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {modell.varianter.length > 1 && (
          <div role="group" aria-label="Storlek" className="flex flex-wrap gap-2">
            {modell.varianter.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === vald.id}
                onClick={() => onValj(v.id)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
                  fokus,
                  v.id === vald.id ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-border bg-card hover:bg-muted',
                )}
              >
                {/* En prick i hjortron på den valda storleken, utöver den gröna markeringen. */}
                {v.id === vald.id && <span aria-hidden className="size-2 shrink-0 rounded-full bg-hjortron" />}
                {v.version || 'Utan storlek'}
                <span className="tabular-nums opacity-80">{formateraVikt(v.packvikt_g)}</span>
              </button>
            ))}
          </div>
        )}

        {rutor.length > 0 && <Specrutor rader={rutor} />}
        {viktiga.length === 0 && ovriga.length === 0 && <p className="text-sm text-muted-foreground">Inga fler uppgifter om den här produkten än.</p>}
        {ovriga.length > 0 && (
          <div className="space-y-3">
            <button type="button" aria-expanded={visaAlla} aria-controls={`${id}-alla`} onClick={() => setVisaAlla((v) => !v)} className={cn(lankKlass, 'no-underline')}>
              {visaAlla ? 'Dölj specifikationerna' : 'Visa alla specifikationer'}
              <ChevronDown className={cn('size-4 transition-transform', visaAlla && 'rotate-180')} aria-hidden />
            </button>
            <div id={`${id}-alla`} hidden={!visaAlla}>
              <Specrutor rader={ovriga} />
            </div>
          </div>
        )}

        <PassarMed produkt={vald} brannarenFinns={iForradet.has(vald.id)} kok={kok} onKok={onKok} onOppna={onOppna} onSparat={onSparat} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Granskad produkt={vald} />
          <a href={vald.kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
            Tillverkarens sida
            <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only">(öppnas i ny flik)</span>
          </a>
        </div>
      </div>
    </Panel>
  )
}

/** Vilka storlekar av modellen man har i förrådet, med en länk dit, filtrerat på produktens kategori och underkategori. */
function IForradet({ finns }: { finns: { produkt: Katalogprodukt; text: string } }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-sm">
      <Bricka ton="hjortron" className="text-sm">
        <Check className="size-4 shrink-0" aria-hidden />
        {finns.text}
      </Bricka>
      <Link
        to={forradsadress(finns.produkt.kategori, finns.produkt.underkategori)}
        className={cn('inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4', fokus)}
      >
        Visa i Mitt förråd
      </Link>
    </p>
  )
}
