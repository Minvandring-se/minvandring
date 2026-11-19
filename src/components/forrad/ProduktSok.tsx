import { Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Granskad } from '@/components/forrad/Granskad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KATEGORIER, arKategori, formateraVikt, kategoriFor, type KategoriNyckel } from '@/lib/forrad'
import { gArAttSoka, produktnamn, sakFranProdukt, sokfilter, sokord, sorteraTraffar } from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Produkt } from '@/lib/typer'

interface Props {
  /** Produkterna som redan ligger i förrådet, för att visa det i träfflistan. */
  finnsRedan: ReadonlySet<string>
  /** En produkt har lagts i förrådet. */
  onTillagd: (sakId: string, namn: string) => void
  /** Användaren vill skriva in saken själv. Söktexten följer med som namn, och den valda kategorin som förval. */
  onEgen: (soktext: string, kategori?: KategoriNyckel) => void
  onStang: () => void
}

const MAX_TRAFFAR = 30
/** Väntan efter senaste tangenttryckningen innan sökningen skickas. */
const FORDROJNING_MS = 250

/** Resultatet av en sökning. nyckel säger vilken kategori och söktext det hör till. */
type Lage = { nyckel: string; traffar: Produkt[] } | { nyckel: string; fel: true } | null

/**
 * Första steget i Lägg till: välj kategori och sök i produktkatalogen. Ett tryck på en träff lägger saken i förrådet.
 * Med en kategori vald visas kategorins produkter redan innan man har skrivit något.
 */
export function ProduktSok({ finnsRedan, onTillagd, onEgen, onStang }: Props) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>('')
  const [lage, setLage] = useState<Lage>(null)
  const [laggerTill, setLaggerTill] = useState<string | null>(null)
  const [fel, setFel] = useState('')

  useEffect(() => falt.current?.focus(), [])

  // Det går att söka när en kategori är vald eller när texten är lång nog.
  const harText = gArAttSoka(text)
  const sokbar = harText || kategori !== ''
  const nyckel = `${kategori}|${text}`

  useEffect(() => {
    if (!supabase || !sokbar) return
    const klient = supabase
    let avbruten = false
    const timer = window.setTimeout(async () => {
      let fraga = klient.from('produkter').select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad').limit(MAX_TRAFFAR)
      if (kategori) fraga = fraga.eq('kategori', kategori)
      if (harText) for (const ord of sokord(text)) fraga = fraga.or(sokfilter(ord))
      const { data, error } = await fraga.order('marke').order('modell')
      if (avbruten) return
      setLage(error ? { nyckel, fel: true } : { nyckel, traffar: sorteraTraffar((data as Produkt[] | null) ?? [], harText ? text : '') })
    }, FORDROJNING_MS)
    return () => {
      avbruten = true
      window.clearTimeout(timer)
    }
  }, [text, kategori, harText, sokbar, nyckel])

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

  // Resultatet gäller bara om det hör till kategorin och texten som är valda just nu.
  const aktuellt = sokbar && lage?.nyckel === nyckel ? lage : null
  const traffar = aktuellt && 'traffar' in aktuellt ? aktuellt.traffar : null

  return (
    <section aria-labelledby={`${id}-rubrik`} className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 id={`${id}-rubrik`} className="text-xl">
          Lägg till en sak
        </h2>
        <Button type="button" variant="ghost" className="-mt-2 -mr-2 size-11 px-0" aria-label="Stäng" onClick={onStang}>
          <X className="size-5" aria-hidden />
        </Button>
      </div>

      <div className="space-y-1">
        <label htmlFor={`${id}-kategori`} className="block text-sm font-medium">
          Kategori
        </label>
        <select
          id={`${id}-kategori`}
          className="h-11 w-full rounded-md border border-border bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          value={kategori}
          onChange={(e) => setKategori(arKategori(e.target.value) ? e.target.value : '')}
        >
          <option value="">Alla kategorier</option>
          {KATEGORIER.map((k) => (
            <option key={k.nyckel} value={k.nyckel}>
              {k.etikett}
            </option>
          ))}
        </select>
      </div>

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

      <div aria-live="polite" className="space-y-3">
        {sokbar && !aktuellt && <p className="text-sm text-muted-foreground">Söker …</p>}
        {aktuellt && 'fel' in aktuellt && <p className="text-sm text-destructive">Det gick inte att söka. Försök igen.</p>}
        {traffar?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {harText
              ? `Inga produkter${kategori ? ` i ${kategoriFor(kategori).etikett}` : ''} matchar ”${text.trim()}”.`
              : `Katalogen har inga produkter i ${kategoriFor(kategori).etikett} än.`}
          </p>
        )}
        {traffar && traffar.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {traffar.map((p) => {
              const Ikon = kategoriFor(p.kategori).ikon
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={laggerTill !== null}
                    onClick={() => laggTill(p)}
                    className="flex min-h-14 w-full items-center gap-3 px-3 pt-2 pb-1 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
                  >
                    <Ikon className="size-5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium break-words">
                        <span className="sr-only">Lägg till </span>
                        {produktnamn(p)}
                      </span>
                      {p.version && <span className="block text-sm break-words text-muted-foreground">{p.version}</span>}
                      {finnsRedan.has(p.id) && <span className="block text-sm text-muted-foreground">Finns redan i ditt förråd</span>}
                    </span>
                    <span className="shrink-0 text-sm font-medium">{formateraVikt(p.packvikt_g)}</span>
                    <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                  {/* Märkningen ligger utanför knappen, eftersom den granskade etiketten själv går att trycka på. */}
                  <Granskad kontrollerad={p.kontrollerad} className="px-3 pb-2 pl-11" />
                </li>
              )
            })}
          </ul>
        )}
        {traffar?.length === MAX_TRAFFAR && <p className="text-sm text-muted-foreground">Visar de första {MAX_TRAFFAR}. Skriv mer för att hitta rätt.</p>}
      </div>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

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
