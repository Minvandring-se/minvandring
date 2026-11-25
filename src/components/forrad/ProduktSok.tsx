import { ChevronDown, Plus, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Laddfel } from '@/components/app/Laddfel'
import { Granskad } from '@/components/forrad/Granskad'
import { KokSteg } from '@/components/forrad/KokSteg'
import { granskning } from '@/lib/granskning'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { KATEGORIER, arKategori, arUnderkategori, formateraVikt, kategoriFor, underkategoriFor, underkategorierFor, type KategoriNyckel, type UnderkategoriNyckel } from '@/lib/forrad'
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
import { KOKVARMARE } from '@/lib/kokkarl'
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
  /** Underkategorin som är vald när rutan öppnas, och som följer med till Lägg till egen sak. */
  startUnderkategori?: UnderkategoriNyckel
  /** Användaren vill skriva in saken själv. Söktexten följer med som namn, och den valda kategorin som förval. */
  onEgen: (soktext: string, kategori?: KategoriNyckel, underkategori?: UnderkategoriNyckel) => void
}

/** Flest produkter som hämtas åt gången. Listan scrollar, så alla i en kategori ska få plats. */
const MAX_PRODUKTER = 500
/** Väntan efter senaste tangenttryckningen innan sökningen skickas. */
const FORDROJNING_MS = 250

/** Resultatet av en sökning. nyckel säger vilken kategori, underkategori, vilket märke och vilken söktext det hör till. */
type Lage = { nyckel: string; modeller: Modell[]; avkortad: boolean } | { nyckel: string; fel: true } | null

const radKlass =
  'flex min-h-14 w-full items-center gap-3 px-3 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60'

/**
 * Första steget i Lägg till: välj kategori och märke och sök i produktkatalogen.
 * Varje modell är en rad. Har den flera storlekar väljer man en av dem, annars läggs saken till direkt.
 */
export function ProduktSok({ finnsRedan, startKategori, startUnderkategori, onTillagd, onEgen }: Props) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>(startKategori ?? '')
  const [underkategori, setUnderkategori] = useState<UnderkategoriNyckel | ''>(startKategori && startUnderkategori ? startUnderkategori : '')
  const [marke, setMarke] = useState('')
  // Märkena i den valda kategorin och underkategorin. Hör till valet i `for`, så att en gammal lista inte visas för ett nytt val.
  const [marken, setMarken] = useState<{ for: string; lista: Marke[] } | null>(null)
  const [lage, setLage] = useState<Lage>(null)
  const [utfalld, setUtfalld] = useState<string | null>(null)
  const [laggerTill, setLaggerTill] = useState<string | null>(null)
  const [fel, setFel] = useState('')
  // En brännare eller ett komplett kök som just har lagts i förrådet. Då visas kokkärl och bränsle som passar.
  const [kokSteg, setKokSteg] = useState<{ sakId: string; namn: string; produktId: string } | null>(null)

  useEffect(() => falt.current?.focus(), [])

  // Märkena hämtas en gång per kategori och underkategori.
  const valt = `${kategori}|${underkategori}`
  useEffect(() => {
    if (!supabase || !kategori) return
    let avbruten = false
    let fraga = supabase
      .from('produkter')
      .select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ')
      .eq('kategori', kategori)
    if (underkategori) fraga = fraga.eq('underkategori', underkategori)
    fraga.limit(MAX_PRODUKTER).then(({ data }) => {
      if (!avbruten) setMarken({ for: `${kategori}|${underkategori}`, lista: markenMedAntal(grupperaModeller((data as Produkt[] | null) ?? [])) })
    })
    return () => {
      avbruten = true
    }
  }, [kategori, underkategori])

  // Det går att söka när en kategori är vald eller när texten är lång nog.
  const harText = gArAttSoka(text)
  const sokbar = harText || kategori !== ''
  const nyckel = `${kategori}|${underkategori}|${marke}|${text}`

  useEffect(() => {
    if (!supabase || !sokbar) return
    const klient = supabase
    let avbruten = false
    const timer = window.setTimeout(async () => {
      let fraga = klient.from('produkter').select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ').limit(MAX_PRODUKTER)
      if (kategori) fraga = fraga.eq('kategori', kategori)
      if (kategori && underkategori) fraga = fraga.eq('underkategori', underkategori)
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
  }, [text, kategori, underkategori, marke, harText, sokbar, nyckel])

  function bytKategori(varde: string) {
    setKategori(arKategori(varde) ? varde : '')
    // Underkategorin och märket hör till kategorin, så de nollställs.
    setUnderkategori('')
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
      setFel('Det gick inte att lägga till. Kontrollera uppkopplingen och försök igen.')
      return
    }
    const sakId = (data as { id: string }).id
    if ((KOKVARMARE as readonly string[]).includes(p.underkategori)) setKokSteg({ sakId, namn: sak.namn, produktId: p.id })
    else onTillagd(sakId, sak.namn)
  }

  // Resultatet gäller bara om det hör till det som är valt just nu.
  const aktuellt = sokbar && lage?.nyckel === nyckel ? lage : null
  const modeller = aktuellt && 'modeller' in aktuellt ? aktuellt.modeller : null
  const markeslista = kategori && marken?.for === valt ? marken.lista : []
  const underkategorier = kategori ? underkategorierFor(kategori) : []
  const valdEtikett = (kategori && underkategoriFor(kategori, underkategori)?.etikett) || (kategori ? kategoriFor(kategori).etikett : '')
  const upptagen = laggerTill !== null

  if (kokSteg) return <KokSteg {...kokSteg} onKlar={() => onTillagd(kokSteg.sakId, kokSteg.namn)} />

  return (
    // Ligger i en Panel, som har rubriken och stängknappen.
    <div className="@container space-y-4">
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

        {underkategorier.length > 1 && (
          <div className="space-y-1">
            <label htmlFor={`${id}-underkategori`} className="block text-sm font-medium">
              Sort
            </label>
            <Select
              id={`${id}-underkategori`}
              value={underkategori}
              onChange={(e) => {
                setUnderkategori(arUnderkategori(kategori, e.target.value) ? e.target.value : '')
                // Märket hör till sorten, så det nollställs.
                setMarke('')
                setUtfalld(null)
              }}
            >
              <option value="">Alla i {kategoriFor(kategori).etikett.toLowerCase()}</option>
              {underkategorier.map((u) => (
                <option key={u.nyckel} value={u.nyckel}>
                  {u.etikett}
                </option>
              ))}
            </Select>
          </div>
        )}

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
          Sök i katalogen på märke, modell eller version
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={`${id}-sok`}
            ref={falt}
            data-autofokus
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={80}
            className="pl-10"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby={`${id}-sokhjalp`}
          />
        </div>
        <p id={`${id}-sokhjalp`} className="text-sm text-muted-foreground">
          Välj en träff, så fylls vikt och uppgifter i åt dig.
        </p>
      </div>

      <div className="space-y-2">
        <div aria-live="polite" className="text-sm text-muted-foreground">
          {sokbar && !aktuellt && <p>Hämtar produkter …</p>}
          {aktuellt && 'fel' in aktuellt && <Laddfel vad="produkterna" />}
          {modeller?.length === 0 && (
            <p>
              {/* "Inga produkter matchar" sägs bara när man har sökt. En kategori utan produkter är något annat. */}
              {harText ? 'Inga produkter matchar din sökning.' : `Katalogen har inga produkter i ${valdEtikett} än.`}
            </p>
          )}
          {modeller && modeller.length > 0 && (
            <p id={`${id}-antal`} className="font-medium text-foreground">
              {antalText(modeller.length)}
              {aktuellt && 'avkortad' in aktuellt && aktuellt.avkortad && <span className="font-normal text-muted-foreground">. Skriv mer för att se fler.</span>}
            </p>
          )}
        </div>

        {/*
          I en smal ruta, som i mobilen, följer listan rutans egen scroll, så att fler träffar syns samtidigt. När rutan
          är bred har listan en fast höjd för ungefär fem rader och scrollar för sig, med finger, mus eller tangentbord.
        */}
        {modeller && modeller.length > 0 && (
          <div
            role="group"
            tabIndex={0}
            aria-labelledby={`${id}-antal`}
            className="rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring @2xl:max-h-96 @2xl:overflow-y-auto @2xl:overscroll-contain"
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
      <div className="flex flex-wrap items-center gap-x-2 border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Hittar du den inte?</span>
        <button
          type="button"
          onClick={() => onEgen(text, kategori || undefined, (kategori && underkategori) || undefined)}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus className="size-4" aria-hidden />
          Ny egen sak
        </button>
      </div>
    </div>
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
      <button type="button" disabled={upptagen} onClick={() => onValj(produkt)} className={cn(radKlass, granskning(produkt).marke ? 'pt-2 pb-1' : 'py-2', indragen && 'pl-11')}>
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
      <Granskad produkt={produkt} className="px-3 pl-11" />
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
