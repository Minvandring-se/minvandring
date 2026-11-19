import { Plus, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Granskad } from '@/components/forrad/Granskad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formateraVikt, kategoriFor } from '@/lib/forrad'
import { gArAttSoka, produktnamn, sakFranProdukt, sokfilter, sokord, sorteraTraffar } from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Produkt } from '@/lib/typer'

interface Props {
  /** Produkterna som redan ligger i förrådet, för att visa det i träfflistan. */
  finnsRedan: ReadonlySet<string>
  /** En produkt har lagts i förrådet. */
  onTillagd: (sakId: string, namn: string) => void
  /** Användaren vill skriva in saken själv. Söktexten följer med som namn. */
  onEgen: (soktext: string) => void
  onStang: () => void
}

const MAX_TRAFFAR = 20
/** Väntan efter senaste tangenttryckningen innan sökningen skickas. */
const FORDROJNING_MS = 250

type Lage = { text: string; traffar: Produkt[] } | { text: string; fel: true } | null

/** Första steget i Lägg till: sök i produktkatalogen. Ett tryck på en träff lägger saken i förrådet. */
export function ProduktSok({ finnsRedan, onTillagd, onEgen, onStang }: Props) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [lage, setLage] = useState<Lage>(null)
  const [laggerTill, setLaggerTill] = useState<string | null>(null)
  const [fel, setFel] = useState('')

  useEffect(() => falt.current?.focus(), [])

  const sokbar = gArAttSoka(text)

  useEffect(() => {
    if (!supabase || !sokbar) return
    const klient = supabase
    let avbruten = false
    const timer = window.setTimeout(async () => {
      let fraga = klient.from('produkter').select('id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad').limit(MAX_TRAFFAR)
      for (const ord of sokord(text)) fraga = fraga.or(sokfilter(ord))
      const { data, error } = await fraga
      if (avbruten) return
      setLage(error ? { text, fel: true } : { text, traffar: sorteraTraffar((data as Produkt[] | null) ?? [], text) })
    }, FORDROJNING_MS)
    return () => {
      avbruten = true
      window.clearTimeout(timer)
    }
  }, [text, sokbar])

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

  // Resultatet gäller bara om det hör till texten som står i rutan just nu.
  const aktuellt = sokbar && lage?.text === text ? lage : null
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
        {traffar?.length === 0 && <p className="text-sm text-muted-foreground">Inga produkter matchar ”{text.trim()}”.</p>}
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
        <Button type="button" variant="outline" onClick={() => onEgen(text)}>
          <Plus className="size-4" aria-hidden />
          Lägg till den själv
        </Button>
      </div>
    </section>
  )
}
