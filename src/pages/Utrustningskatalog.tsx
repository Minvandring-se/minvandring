import { Check, ChevronDown, ExternalLink, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Granskad } from '@/components/forrad/Granskad'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { SakFormular } from '@/components/forrad/SakFormular'
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
import { KOKKARL, KOKVARMARE, passarMed, passarMedRubrik } from '@/lib/kokkarl'
import {
  antalText,
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
  type Modell,
} from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Katalogprodukt } from '@/lib/typer'
import { cn } from '@/lib/utils'

const MAX = 200
const FORDROJNING_MS = 250
// Allt som visas i detaljpanelen hämtas i samma fråga, så att det inte blir en fråga per kort.
const KOLUMNER = 'id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ, minvikt_g, pris_sek_ca, kalla, egenskaper'

type Lage = { nyckel: string; modeller: Modell<Katalogprodukt>[]; avkortad: boolean } | { nyckel: string; fel: true } | null

/** Produkt-id mot produktens version (storlek), för de produkter man har i förrådet. */
type IForradetKarta = ReadonlyMap<string, string | null>

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Hämtar vilka av produkterna man har i förrådet, med storlek. RLS gör att bara ens egna saker kommer tillbaka. */
async function hamtaIForradet(ids: string[]): Promise<IForradetKarta> {
  if (!supabase || ids.length === 0) return new Map()
  const { data } = await supabase.from('forradssaker').select('produkt_id, produkter(version)').in('produkt_id', ids)
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
  // Produkterna i träfflistan som finns i ens förråd, med produktens version (storlek). Hämtas med en fråga per träfflista.
  const [iForradet, setIForradet] = useState<IForradetKarta>(new Map())
  // Produkten som läggs i förrådet just nu, i formuläret.
  const [laggTill, setLaggTill] = useState<Katalogprodukt | null>(null)
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
      let fraga = klient.from('produkter').select(KOLUMNER).limit(MAX)
      if (kategori) fraga = fraga.eq('kategori', kategori)
      if (underkategori) fraga = fraga.eq('underkategori', underkategori)
      if (harText) for (const ord of sokord(text)) fraga = fraga.or(sokfilter(ord))
      const { data, error } = await fraga.order('marke').order('modell')
      if (avbruten) return
      const produkter = (data as Katalogprodukt[] | null) ?? []
      const egna = await hamtaIForradet(produkter.map((p) => p.id))
      if (avbruten) return
      setIForradet(egna)
      setLage(
        error
          ? { nyckel, fel: true }
          : { nyckel, modeller: grupperaModeller(sorteraTraffar(produkter, harText ? text : '')), avkortad: produkter.length === MAX },
      )
    }, FORDROJNING_MS)
    return () => {
      avbruten = true
      window.clearTimeout(timer)
    }
  }, [text, kategori, underkategori, harText, sokbar, nyckel])

  const aktuellt = sokbar && lage?.nyckel === nyckel ? lage : null
  // Förra träfflistan ligger kvar, dämpad, tills nästa kommer. Då hoppar inte sidan medan man skriver.
  const modeller = sokbar && lage && 'modeller' in lage ? lage.modeller : null
  const gammal = !aktuellt

  // Den öppna produkten: ur träfflistan, annars den som hämtades för sig.
  const iListan = produktId && modeller ? modellMedProdukt(modeller, produktId) : null
  const fraanLank = produktId && !iListan && direkt?.for === produktId ? modellMedProdukt(direkt.modeller, produktId) : null
  const oppen = iListan ?? fraanLank
  const oppenIForradet = iListan ? iForradet : (direkt?.iForradet ?? iForradet)

  // En länk till en produkt som inte finns i träfflistan: hämta produkten och sedan modellens alla storlekar.
  const behoverHamtas = !!produktId && !iListan && direkt?.for !== produktId
  useEffect(() => {
    if (!supabase || !produktId || !behoverHamtas) return
    const klient = supabase
    let avbruten = false
    ;(async () => {
      const { data: en } = await klient.from('produkter').select(KOLUMNER).eq('id', produktId).maybeSingle()
      const p = en as Katalogprodukt | null
      const { data: alla } = p ? await klient.from('produkter').select(KOLUMNER).eq('marke', p.marke).eq('modell', p.modell) : { data: null }
      const produkter = (alla as Katalogprodukt[] | null) ?? []
      const egna = await hamtaIForradet(produkter.map((x) => x.id))
      if (!avbruten) setDirekt({ for: produktId, modeller: grupperaModeller(produkter), iForradet: egna })
    })()
    return () => {
      avbruten = true
    }
  }, [produktId, behoverHamtas])

  /** Öppnar panelen. Ett nytt steg i historiken, så att bakåtknappen stänger den. */
  function oppna(produkt: string) {
    const p = new URLSearchParams(parametrar)
    p.set('produkt', produkt)
    setParametrar(p, { state: { panel: true } })
  }

  /** Byter storlek i panelen utan ett nytt steg i historiken. */
  function valjStorlek(produkt: string) {
    const p = new URLSearchParams(parametrar)
    p.set('produkt', produkt)
    setParametrar(p, { replace: true, state: location.state })
  }

  /** Stänger panelen: ett steg bakåt om panelen öppnades här, annars tas produkten bort ur adressen. */
  function stang() {
    if ((location.state as { panel?: boolean } | null)?.panel) {
      navigate(-1)
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
            Sök på märke eller modell
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
      {sokbar && !aktuellt && !modeller && <p className="text-sm text-muted-foreground">Söker …</p>}
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {aktuellt && 'fel' in aktuellt && <p className="text-destructive">Det gick inte att söka. Kontrollera uppkopplingen och försök igen.</p>}
        {!gammal && modeller?.length === 0 && <p>{ingaTraffarText({ harText, kategori, underkategori })}</p>}
        {!gammal && modeller && modeller.length > 0 && (
          <p className="font-medium text-foreground">
            {antalText(modeller.length)}
            {aktuellt && 'avkortad' in aktuellt && aktuellt.avkortad && <span className="font-normal text-muted-foreground">. Skriv mer för att se fler.</span>}
          </p>
        )}
      </div>

      {modeller && modeller.length > 0 && (
        <ul aria-busy={gammal} className={cn('grid gap-3 transition-opacity md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4', gammal && 'opacity-60')}>
          {modeller.map((m) => (
            <Produktkort key={m.nyckel} modell={m} iForradet={iForradet} onOppna={() => oppna(m.varianter[0].id)} />
          ))}
        </ul>
      )}

      {oppen && (
        <Produktpanel
          key={oppen.modell.nyckel}
          modell={oppen.modell}
          vald={oppen.produkt}
          iForradet={oppenIForradet}
          onValj={valjStorlek}
          onLaggTill={setLaggTill}
          onOppna={oppna}
          onStang={stang}
        />
      )}

      {laggTill && (
        <Dialog etikett="Lägg i förrådet" onStang={() => setLaggTill(null)}>
          <SakFormular
            forval={forvalFranProdukt(laggTill)}
            onKlar={() => {
              const nytt = (s: IForradetKarta) => new Map([...s, [laggTill.id, laggTill.version]])
              setIForradet(nytt)
              setDirekt((d) => (d ? { ...d, iForradet: nytt(d.iForradet) } : d))
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
      <div className="space-y-1 px-4 pb-4">
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
  onStang,
}: {
  modell: Modell<Katalogprodukt>
  vald: Katalogprodukt
  iForradet: IForradetKarta
  onValj: (id: string) => void
  onLaggTill: (p: Katalogprodukt) => void
  onOppna: (id: string) => void
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
          <h2 className="text-2xl break-words text-primary">{produktnamn(modell)}</h2>
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

        <PassarMed produkt={vald} onOppna={onOppna} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-hjortron-soft px-2.5 py-0.5 font-medium text-hjortron-strong">
        <Check className="size-4 shrink-0" aria-hidden />
        {finns.text}
      </span>
      <Link
        to={forradsadress(finns.produkt.kategori, finns.produkt.underkategori)}
        className={cn('inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4', fokus)}
      >
        Visa i Mitt förråd
      </Link>
    </p>
  )
}

/**
 * Det som passar ihop med produkten i köket: kokkärl och stekpannor till en brännare eller ett komplett kök, och
 * brännare och kompletta kök till ett kokkärl. Hämtar köken ur katalogen när panelen öppnas och visar inget för
 * produkter utanför köket.
 */
function PassarMed({ produkt, onOppna }: { produkt: Katalogprodukt; onOppna: (id: string) => void }) {
  const rubrik = passarMedRubrik(produkt.underkategori)
  const [kandidater, setKandidater] = useState<{ for: string; produkter: Katalogprodukt[] } | null>(null)

  useEffect(() => {
    if (!supabase || !rubrik) return
    let avbruten = false
    supabase
      .from('produkter')
      .select(KOLUMNER)
      .eq('kategori', 'kok')
      .in('underkategori', [...KOKVARMARE, KOKKARL])
      .limit(MAX)
      .then(({ data }) => {
        if (!avbruten) setKandidater({ for: produkt.id, produkter: (data as Katalogprodukt[] | null) ?? [] })
      })
    return () => {
      avbruten = true
    }
  }, [produkt.id, rubrik])

  if (!rubrik) return null
  const lista = kandidater?.for === produkt.id ? passarMed(produkt, kandidater.produkter) : null
  return (
    <section aria-labelledby={`passar-${produkt.id}`} className="space-y-2">
      <h3 id={`passar-${produkt.id}`} className="font-heading text-lg font-semibold">
        {rubrik}
      </h3>
      {!lista && <p className="text-sm text-muted-foreground">Hämtar …</p>}
      {lista?.length === 0 && <p className="text-sm text-muted-foreground">Inget i katalogen än.</p>}
      {lista && lista.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {lista.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onOppna(p.id)}
                className={cn('flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted', fokus)}
              >
                <span className="min-w-0 break-words">
                  {[p.marke, p.modell, p.version].filter(Boolean).join(' ')}
                  <span className="block text-muted-foreground">{underkategoriFor(p.kategori, p.underkategori)?.etikett}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formateraVikt(p.packvikt_g)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
