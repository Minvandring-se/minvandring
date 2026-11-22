import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Granskad } from '@/components/forrad/Granskad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { KATEGORIER, arKategori, formateraVikt, kategoriFor, type KategoriNyckel } from '@/lib/forrad'
import {
  antalText,
  gArAttSoka,
  grupperaModeller,
  markenMedAntal,
  produktnamn,
  sakFranProdukt,
  sokfilter,
  sokord,
  sorteraTraffar,
  type Marke,
  type Modell,
} from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Produkt } from '@/lib/typer'
import { cn } from '@/lib/utils'

interface Props {
  /** Produkterna som redan ligger i förrådet, för att visa det i träfflistan. */
  finnsRedan: ReadonlySet<string>
  /** En produkt har lagts i förrådet. */
  onTillagd: (sakId: string, namn: string) => void
  /** Kategorin som är vald när rutan öppnas, till exempel från en uppmaning i De fyra tunga. */
  startKategori?: KategoriNyckel
  /** Användaren vill skriva in saken själv. Söktexten följer med som namn, och den valda kategorin som förval. */
  onEgen: (soktext: string, kategori?: KategoriNyckel) => void
  onStang: () => void
}

/** Flest produkter som hämtas åt gången. Listan scrollar, så alla i en kategori ska få plats. */
const MAX_PRODUKTER = 500
/** Väntan efter senaste tangenttryckningen innan sökningen skickas. */
const FORDROJNING_MS = 250

/** Resultatet av en sökning. nyckel säger vilken kategori, vilket märke och vilken söktext det hör till. */
type Lage = { nyckel: string; modeller: Modell[]; avkortad: boolean } | { nyckel: string; fel: true } | null

const radKlass =
  'flex min-h-14 w-full items-center gap-3 px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60'

/**
 * Första steget i Lägg till: välj kategori och märke och sök i produktkatalogen.
 * Varje modell är en rad. Har den flera storlekar väljer man en av dem, annars läggs saken till direkt.
 */
export function ProduktSok({ finnsRedan, startKategori, onTillagd, onEgen, onStang }: Props) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>(startKategori ?? '')
  const [marke, setMarke] = useState('')
  // Märkena i den valda kategorin. Hör till kategorin i `for`, så att en gammal lista inte visas för en ny kategori.
  const [marken, setMarken] = useState<{ for: string; lista: Marke[] } | null>(null)
  const [lage, setLage] = useState<Lage>(null)
  const [utfalld, setUtfalld] = useState<string | null>(null)
  const [laggerTill, setLaggerTill] = useState<string | null>(null)
  const [fel, setFel] = useState('')

  useEffect(() => falt.current?.focus(), [])

  // Märkena hämtas en gång per kategori.
  useEffect(() => {
    if (!supabase || !kategori) return
    let avbruten = false
    supabase
      .from('produkter')
      .select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad')
      .eq('kategori', kategori)
      .limit(MAX_PRODUKTER)
      .then(({ data }) => {
        if (!avbruten) setMarken({ for: kategori, lista: markenMedAntal(grupperaModeller((data as Produkt[] | null) ?? [])) })
      })
    return () => {
      avbruten = true
    }
  }, [kategori])

  // Det går att söka när en kategori är vald eller när texten är lång nog.
  const harText = gArAttSoka(text)
  const sokbar = harText || kategori !== ''
  const nyckel = `${kategori}|${marke}|${text}`

  useEffect(() => {
    if (!supabase || !sokbar) return
    const klient = supabase
    let avbruten = false
    const timer = window.setTimeout(async () => {
      let fraga = klient.from('produkter').select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad').limit(MAX_PRODUKTER)
      if (kategori) fraga = fraga.eq('kategori', kategori)
      if (marke) fraga = fraga.eq('marke', marke)
      if (harText) for (const ord of sokord(text)) fraga = fraga.or(sokfilter(ord))
      const { data, error } = await fraga.order('marke').order('modell')
      if (avbruten) return
      const produkter = (data as Produkt[] | null) ?? []
      setLage(
        error
          ? { nyckel, fel: true }
          : { nyckel, modeller: grupperaModeller(sorteraTraffar(produkter, harText ? text : '')), avkortad: produkter.length === MAX_PRODUKTER },
      )
    }, FORDROJNING_MS)
    return () => {
      avbruten = true
      window.clearTimeout(timer)
    }
  }, [text, kategori, marke, harText, sokbar, nyckel])

  function bytKategori(varde: string) {
    setKategori(arKategori(varde) ? varde : '')
    // Märket hör till kategorin, så det nollställs.
    setMarke('')
    setUtfalld(null)
  }

  async function laggTill(p: Produkt) {
    if (!supabase || laggerTill) return
    setLaggerTill(p.id)
    setFel('')
    const sak = sakFranProdukt(p)
    const { data, error } = await supabase.from('forradssaker').insert(sak).select('id').single()
    setLaggerTill(null)
    if (error || !data) {
      setFel('Det gick inte att lägga till. Försök igen.')
      return
    }
    onTillagd((data as { id: string }).id, sak.namn)
  }

  // Resultatet gäller bara om det hör till det som är valt just nu.
  const aktuellt = sokbar && lage?.nyckel === nyckel ? lage : null
  const modeller = aktuellt && 'modeller' in aktuellt ? aktuellt.modeller : null
  const markeslista = kategori && marken?.for === kategori ? marken.lista : []
  const upptagen = laggerTill !== null

  return (
    <section aria-labelledby={`${id}-rubrik`} className="@container space-y-4 rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${id}-rubrik`} className="text-xl">
          Lägg till utrustning
        </h2>
        <Button type="button" variant="ghost" className="-mt-2 -mr-2 size-11 px-0" aria-label="Stäng" onClick={onStang}>
          <X className="size-5" aria-hidden />
        </Button>
      </div>

      {/*
        När rutan är bred nog står kategori och märke i en smal kolumn bredvid sökningen och träffarna.
        Annars ligger allt i en kolumn. Det är samma fält i båda lägena, så söktext och val finns kvar när bredden ändras.
      */}
      <div className="grid gap-4 @2xl:grid-cols-[220px_minmax(0,1fr)] @2xl:gap-6">
      <div className="grid content-start gap-4 @md:grid-cols-2 @2xl:grid-cols-1">
        <div className="space-y-1">
          <label htmlFor={`${id}-kategori`} className="block text-sm font-medium">
            Kategori
          </label>
          <Select id={`${id}-kategori`} value={kategori} onChange={(e) => bytKategori(e.target.value)}>
            <option value="">Alla kategorier</option>
            {KATEGORIER.map((k) => (
              <option key={k.nyckel} value={k.nyckel}>
                {k.etikett}
              </option>
            ))}
          </Select>
        </div>

        {/* Visas bara när kategorin har produkter i katalogen. */}
        {markeslista.length > 0 && (
          <div className="space-y-1">
            <label htmlFor={`${id}-marke`} className="block text-sm font-medium">
              Märke
            </label>
            <Select
              id={`${id}-marke`}
              value={marke}
              onChange={(e) => {
                setMarke(e.target.value)
                setUtfalld(null)
              }}
            >
              <option value="">Alla märken</option>
              {markeslista.map((m) => (
                <option key={m.marke} value={m.marke}>
                  {m.marke} ({m.antal})
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-4">
      <div className="space-y-1">
        <label htmlFor={`${id}-sok`} className="block text-sm font-medium">
          Sök din produkt, till exempel tält eller sovsäck
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={`${id}-sok`}
            ref={falt}
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

      <div className="space-y-2">
        <div aria-live="polite" className="text-sm text-muted-foreground">
          {sokbar && !aktuellt && <p>Söker …</p>}
          {aktuellt && 'fel' in aktuellt && <p className="text-destructive">Det gick inte att söka. Försök igen.</p>}
          {modeller?.length === 0 && (
            <p>
              {/* "Inga produkter matchar" sägs bara när man har sökt. En kategori utan produkter är något annat. */}
              {harText ? 'Inga produkter matchar din sökning.' : `Katalogen har inga produkter i ${kategoriFor(kategori).etikett} än.`}
            </p>
          )}
          {modeller && modeller.length > 0 && (
            <p id={`${id}-antal`} className="font-medium text-foreground">
              {antalText(modeller.length)}
              {aktuellt && 'avkortad' in aktuellt && aktuellt.avkortad && <span className="font-normal text-muted-foreground">. Skriv mer för att se fler.</span>}
            </p>
          )}
        </div>

        {/* Fast höjd för ungefär fem rader. Resten nås genom att scrolla i listan, med finger, mus eller tangentbord. */}
        {modeller && modeller.length > 0 && (
          <div
            role="group"
            tabIndex={0}
            aria-labelledby={`${id}-antal`}
            className="max-h-96 overflow-y-auto overscroll-contain rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ul className="divide-y divide-border">
              {modeller.map((m) => (
                <li key={m.nyckel}>
                  {m.varianter.length === 1 ? (
                    <Produktrad
                      produkt={m.varianter[0]}
                      rubrik={produktnamn(m)}
                      underrad={m.varianter[0].version}
                      finnsRedan={finnsRedan.has(m.varianter[0].id)}
                      upptagen={upptagen}
                      onValj={laggTill}
                    />
                  ) : (
                    <Modellrad
                      modell={m}
                      utfalld={utfalld === m.nyckel}
                      onVaxla={() => setUtfalld((u) => (u === m.nyckel ? null : m.nyckel))}
                      finnsRedan={finnsRedan}
                      upptagen={upptagen}
                      onValj={laggTill}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      </div>
      </div>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      {/* Ligger utanför listan, så att den syns utan att man scrollar i träffarna. */}
      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium">Hittar du inte din produkt?</p>
        <Button type="button" variant="outline" onClick={() => onEgen(text, kategori || undefined)}>
          <Plus className="size-4" aria-hidden />
          Lägg till den själv
        </Button>
      </div>
    </section>
  )
}

/** En produkt som läggs till med ett tryck: en modell med en enda variant, eller en storlek i en utfälld modell. */
function Produktrad({
  produkt,
  rubrik,
  underrad,
  finnsRedan,
  upptagen,
  indragen,
  onValj,
}: {
  produkt: Produkt
  rubrik: string
  underrad?: string | null
  finnsRedan: boolean
  upptagen: boolean
  indragen?: boolean
  onValj: (p: Produkt) => void
}) {
  const Ikon = kategoriFor(produkt.kategori).ikon
  return (
    <>
      <button type="button" disabled={upptagen} onClick={() => onValj(produkt)} className={cn(radKlass, produkt.kontrollerad ? 'pt-2 pb-1' : 'py-2', indragen && 'pl-11')}>
        {!indragen && <Ikon className="size-5 shrink-0 text-primary" aria-hidden />}
        <span className="min-w-0 flex-1">
          <span className="block font-medium break-words">
            <span className="sr-only">Lägg till </span>
            {rubrik}
          </span>
          {underrad && <span className="block text-sm break-words text-muted-foreground">{underrad}</span>}
          {finnsRedan && <span className="block text-sm text-muted-foreground">Finns redan i ditt förråd</span>}
        </span>
        <span className="shrink-0 text-sm font-medium">{formateraVikt(produkt.packvikt_g)}</span>
        <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      {/* Bara granskade produkter har en etikett. Den ligger utanför knappen, eftersom den själv går att trycka på. */}
      <Granskad kontrollerad={produkt.kontrollerad} className="px-3 pb-2 pl-11" />
    </>
  )
}

/** En modell med flera storlekar. Raden fäller ut storlekarna, och ett tryck på en storlek lägger till den. */
function Modellrad({
  modell,
  utfalld,
  onVaxla,
  finnsRedan,
  upptagen,
  onValj,
}: {
  modell: Modell
  utfalld: boolean
  onVaxla: () => void
  finnsRedan: ReadonlySet<string>
  upptagen: boolean
  onValj: (p: Produkt) => void
}) {
  const id = useId()
  const Ikon = kategoriFor(modell.varianter[0].kategori).ikon
  const antalIForradet = modell.varianter.filter((v) => finnsRedan.has(v.id)).length
  return (
    <>
      <button type="button" aria-expanded={utfalld} aria-controls={id} onClick={onVaxla} className={cn(radKlass, 'py-2')}>
        <Ikon className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-medium break-words">{produktnamn(modell)}</span>
          <span className="block text-sm text-muted-foreground">
            {modell.varianter.length} storlekar
            {antalIForradet > 0 && ', finns redan i ditt förråd'}
          </span>
        </span>
        <span className="shrink-0 text-sm font-medium">från {formateraVikt(modell.varianter[0].packvikt_g)}</span>
        <ChevronDown className={cn('size-5 shrink-0 text-muted-foreground transition-transform', utfalld && 'rotate-180')} aria-hidden />
      </button>
      <ul id={id} hidden={!utfalld} aria-label={`Storlekar av ${produktnamn(modell)}`} className="divide-y divide-border border-t border-border bg-muted/40">
        {modell.varianter.map((v) => (
          <li key={v.id}>
            <Produktrad produkt={v} rubrik={v.version || 'Utan storlek'} finnsRedan={finnsRedan.has(v.id)} upptagen={upptagen} indragen onValj={onValj} />
          </li>
        ))}
      </ul>
    </>
  )
}
