import { Check, ChevronDown, ExternalLink, Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Detaljlista } from '@/components/forrad/Detaljlista'
import { Granskad } from '@/components/forrad/Granskad'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { SakFormular } from '@/components/forrad/SakFormular'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { arKategori, formateraVikt, KATEGORIER, kategoriFor, produktdetaljer, underkategoriFor, underkategorierFor, type KategoriNyckel } from '@/lib/forrad'
import { forradsadress } from '@/lib/forradslista'
import { antalText, forvalFranProdukt, gArAttSoka, grupperaModeller, ingaTraffarText, produktnamn, sokfilter, sokord, sorteraTraffar, type Modell } from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Katalogprodukt } from '@/lib/typer'
import { cn } from '@/lib/utils'

const MAX = 200
const FORDROJNING_MS = 250
// Allt som visas när ett kort fälls ut hämtas i samma fråga, så att det inte blir en fråga per kort.
const KOLUMNER = 'id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ, minvikt_g, pris_sek_ca, kalla, egenskaper'

type Lage = { nyckel: string; modeller: Modell<Katalogprodukt>[]; avkortad: boolean } | { nyckel: string; fel: true } | null

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Utrustningskatalogen: sök och filtrera bland produkterna i katalogen och se vikten. Ett kort fälls ut med
 * specifikationerna, och produkten går att lägga i förrådet därifrån. Jämförelse sida vid sida kommer senare.
 */
export function Utrustningskatalog() {
  useSidtitel('Utrustningskatalog')
  const id = useId()
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>('')
  const [underkategori, setUnderkategori] = useState('')
  const [antal, setAntal] = useState<number | null>(null)
  const [lage, setLage] = useState<Lage>(null)
  // Produkterna i träfflistan som finns i ens förråd. Hämtas med en fråga per träfflista.
  const [iForradet, setIForradet] = useState<ReadonlySet<string>>(new Set())
  // Produkten som läggs i förrådet just nu, i formuläret.
  const [laggTill, setLaggTill] = useState<Katalogprodukt | null>(null)

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
      // RLS gör att bara ens egna saker kommer tillbaka.
      const ids = produkter.map((p) => p.id)
      const egna = ids.length ? await klient.from('forradssaker').select('produkt_id').in('produkt_id', ids) : null
      if (avbruten) return
      setIForradet(new Set(((egna?.data as { produkt_id: string }[] | null) ?? []).map((s) => s.produkt_id)))
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
            <Produktkort key={m.nyckel} modell={m} iForradet={iForradet} onLaggTill={setLaggTill} />
          ))}
        </ul>
      )}

      {laggTill && (
        <Dialog etikett="Lägg i förrådet" onStang={() => setLaggTill(null)}>
          <SakFormular
            forval={forvalFranProdukt(laggTill)}
            onKlar={() => {
              setIForradet((s) => new Set([...s, laggTill.id]))
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

/**
 * En modell i katalogen: namn, kategori, vikten och storlekarna om det finns flera. Ett tryck fäller ut kortet med
 * specifikationerna för vald storlek, och knappen för att lägga den i förrådet.
 */
function Produktkort({ modell, iForradet, onLaggTill }: { modell: Modell<Katalogprodukt>; iForradet: ReadonlySet<string>; onLaggTill: (p: Katalogprodukt) => void }) {
  const id = useId()
  const [utfalld, setUtfalld] = useState(false)
  const [valdId, setValdId] = useState(modell.varianter[0].id)
  const forsta = modell.varianter[0]
  const vald = modell.varianter.find((v) => v.id === valdId) ?? forsta
  const { ikon: Ikon, etikett } = kategoriFor(forsta.kategori)
  const flera = modell.varianter.length > 1
  const finns = modell.varianter.find((v) => iForradet.has(v.id)) ?? null
  return (
    <li className={cn('flex flex-col rounded-lg border border-border bg-card', utfalld && 'md:col-span-full')}>
      <button
        type="button"
        aria-expanded={utfalld}
        aria-controls={id}
        onClick={() => setUtfalld((u) => !u)}
        className="flex w-full items-start gap-3 rounded-lg p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Ikon className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold break-words">{produktnamn(modell)}</span>
          <span className="block text-sm text-muted-foreground">{flera ? `${etikett}, ${modell.varianter.length} storlekar` : [etikett, forsta.version].filter(Boolean).join(', ')}</span>
        </span>
        <span className="shrink-0 font-heading text-lg font-semibold tabular-nums">
          {flera && <span className="font-sans text-sm font-normal text-muted-foreground">från </span>}
          {formateraVikt(forsta.packvikt_g)}
        </span>
        <ChevronDown className={cn('mt-1 size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />
      </button>

      {!utfalld && (
        <div className="space-y-2 px-4 pb-4">
          {flera && (
            <ul className="space-y-0.5 border-t border-border pt-2 text-sm">
              {modell.varianter.map((v) => (
                <li key={v.id} className="flex justify-between gap-3">
                  <span className="min-w-0 break-words text-muted-foreground">{v.version || 'Utan storlek'}</span>
                  <span className="shrink-0 tabular-nums">{formateraVikt(v.packvikt_g)}</span>
                </li>
              ))}
            </ul>
          )}
          <Granskad produkt={forsta} />
          {finns && <IForradet produkt={finns} />}
        </div>
      )}

      <div id={id} hidden={!utfalld} className="border-t border-border px-4 py-4">
        {utfalld && (
          <Utfallt
            modell={modell}
            vald={vald}
            onValj={setValdId}
            finns={finns}
            onLaggTill={() => onLaggTill(vald)}
          />
        )}
      </div>
    </li>
  )
}

/** Det utfällda kortet: storlekarna, vikt och pris, specifikationerna, källan och knapparna. */
function Utfallt({
  modell,
  vald,
  onValj,
  finns,
  onLaggTill,
}: {
  modell: Modell<Katalogprodukt>
  vald: Katalogprodukt
  onValj: (id: string) => void
  finns: Katalogprodukt | null
  onLaggTill: () => void
}) {
  const id = useId()
  const [visaAlla, setVisaAlla] = useState(false)
  const { grund, viktiga, ovriga } = produktdetaljer(vald)
  const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)
  return (
    <div className="space-y-4">
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
              {v.version || 'Utan storlek'}
              <span className="tabular-nums opacity-80">{formateraVikt(v.packvikt_g)}</span>
            </button>
          ))}
        </div>
      )}

      <Detaljlista rader={[...grund, ...viktiga]} />
      {viktiga.length === 0 && ovriga.length === 0 && <p className="text-sm text-muted-foreground">Inga fler uppgifter om den här produkten än.</p>}
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Granskad produkt={vald} />
        <a href={vald.kalla} target="_blank" rel="noopener noreferrer" className={lankKlass}>
          Tillverkarens sida
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(öppnas i ny flik)</span>
        </a>
      </div>

      {finns && <IForradet produkt={finns} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onLaggTill}>Lägg i förrådet</Button>
        <Button variant="outline" disabled>
          Lägg på önskelistan
          <KommerSnartEtikett />
        </Button>
      </div>
    </div>
  )
}

/** Att produkten redan finns i förrådet, med en länk dit, filtrerat på produktens kategori och underkategori. */
function IForradet({ produkt }: { produkt: Katalogprodukt }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-sm">
      <span className="inline-flex items-center gap-1.5 font-medium text-primary">
        <Check className="size-4" aria-hidden />
        Finns i ditt förråd
      </span>
      <Link
        to={forradsadress(produkt.kategori, produkt.underkategori)}
        className={cn('inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4', fokus)}
      >
        Visa i Mitt förråd
      </Link>
    </p>
  )
}
