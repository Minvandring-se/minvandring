import { Search } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Granskad } from '@/components/forrad/Granskad'
import { Kategorifilter } from '@/components/forrad/Kategorifilter'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { arKategori, formateraVikt, KATEGORIER, kategoriFor, underkategoriFor, underkategorierFor, type KategoriNyckel } from '@/lib/forrad'
import { antalText, gArAttSoka, grupperaModeller, produktnamn, sokfilter, sokord, sorteraTraffar, type Modell } from '@/lib/produktsok'
import { supabase } from '@/lib/supabase'
import type { Produkt } from '@/lib/typer'
import { cn } from '@/lib/utils'

const MAX = 200
const FORDROJNING_MS = 250
const KOLUMNER = 'id, marke, modell, version, kategori, underkategori, packvikt_g, kontrollerad, granskad, kalla_typ'

type Lage = { nyckel: string; modeller: Modell[]; avkortad: boolean } | { nyckel: string; fel: true } | null

/**
 * Utrustningskatalogen: sök och filtrera bland produkterna i katalogen och se vikten. Att lägga en produkt i
 * förrådet görs från Mitt förråd. Jämförelse sida vid sida kommer senare.
 */
export function Utrustningskatalog() {
  useSidtitel('Utrustningskatalog')
  const id = useId()
  const [text, setText] = useState('')
  const [kategori, setKategori] = useState<KategoriNyckel | ''>('')
  const [underkategori, setUnderkategori] = useState('')
  const [antal, setAntal] = useState<number | null>(null)
  const [lage, setLage] = useState<Lage>(null)

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
      const produkter = (data as Produkt[] | null) ?? []
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
        {!gammal && modeller?.length === 0 && (
          <p>{underkategori && !harText ? 'Inga produkter i katalogen i den här underkategorin än.' : 'Inga produkter matchar din sökning.'}</p>
        )}
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
            <Produktkort key={m.nyckel} modell={m} />
          ))}
        </ul>
      )}

      <Sektion rubrik="Jämför sida vid sida" kommerSnart>
        <p className="max-w-prose text-sm text-muted-foreground">Välj två eller tre produkter och se vikt, mått och pris bredvid varandra.</p>
      </Sektion>
    </div>
  )
}

/** En modell i katalogen: namn, kategori, vikten och storlekarna om det finns flera. */
function Produktkort({ modell }: { modell: Modell }) {
  const forsta = modell.varianter[0]
  const { ikon: Ikon, etikett } = kategoriFor(forsta.kategori)
  const flera = modell.varianter.length > 1
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Ikon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-sans text-base font-semibold break-words">{produktnamn(modell)}</h2>
          <p className="text-sm text-muted-foreground">{flera ? `${etikett}, ${modell.varianter.length} storlekar` : [etikett, forsta.version].filter(Boolean).join(', ')}</p>
        </div>
        <p className="shrink-0 font-heading text-lg font-semibold tabular-nums">
          {flera && <span className="font-sans text-sm font-normal text-muted-foreground">från </span>}
          {formateraVikt(forsta.packvikt_g)}
        </p>
      </div>
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
    </li>
  )
}
