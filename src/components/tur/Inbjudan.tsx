import { Check, Copy, RefreshCw } from 'lucide-react'
import { Ikon } from '@/components/ikoner/Ikon'
import { useEffect, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Button } from '@/components/ui/button'
import { arAgare, type Roll } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import { laddfelText } from '@/lib/texter'

/**
 * Inbjudningslänken. Visas bara för ägare och redigerare, och databasen släpper bara fram koden till dem.
 * Ägaren kan skapa en ny länk, och då slutar den gamla fungera.
 */
export function Inbjudan({ turId, minRoll }: { turId: string; minRoll: Roll }) {
  const [kod, setKod] = useState<string | null | undefined>(undefined)
  const [kopierad, setKopierad] = useState(false)
  const [skapar, setSkapar] = useState(false)
  const [fel, setFel] = useState('')
  const [nyLank, setNyLank] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('inbjudningar')
      .select('kod')
      .eq('tur_id', turId)
      .maybeSingle()
      .then(({ data, error }) => setKod(error ? null : (data?.kod ?? null)))
  }, [turId])

  const lank = kod ? `${window.location.origin}/ga-med/${kod}` : ''

  async function kopiera() {
    setFel('')
    try {
      await navigator.clipboard.writeText(lank)
    } catch {
      setFel('Det gick inte att kopiera länken. Markera den i rutan och kopiera den själv.')
      return
    }
    setKopierad(true)
    setTimeout(() => setKopierad(false), 4000)
  }

  async function skapaNy() {
    if (!supabase) return
    if (!window.confirm('Skapa en ny länk? Den gamla slutar fungera, men de som redan är med finns kvar.')) return
    setFel('')
    setNyLank(false)
    setSkapar(true)
    const { data, error } = await supabase.rpc('ny_inbjudningskod', { t: turId })
    setSkapar(false)
    if (error || typeof data !== 'string') {
      setFel('Det gick inte att skapa en ny länk. Kontrollera uppkopplingen och försök igen.')
      return
    }
    setKod(data)
    setKopierad(false)
    setNyLank(true)
  }

  return (
    <div className="space-y-2 rounded-md bg-muted p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Ikon namn="inbjudan" storlek={20} />
        Dela länken med de som ska med
      </p>
      <p className="text-sm text-muted-foreground">Den som går med via länken blir redigerare. Ägaren kan ändra rollen efteråt.</p>
      {kod === undefined && (
        <Laddar text="Hämtar länken">
          <Skelett className="h-10 bg-card" />
        </Laddar>
      )}
      {kod === null && <p className="text-sm text-destructive">{laddfelText('länken')}</p>}
      {kod && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-card px-3 py-2 text-sm select-all">{lank}</code>
          <Button variant="outline" onClick={kopiera}>
            {kopierad ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {kopierad ? 'Kopierad' : 'Kopiera länk'}
          </Button>
        </div>
      )}
      {arAgare(minRoll) && kod && (
        <div className="space-y-1">
          <Button variant="ghost" onClick={skapaNy} disabled={skapar} className="px-3">
            <RefreshCw className="size-4" aria-hidden />
            Skapa ny länk
          </Button>
          <p className="text-sm text-muted-foreground">Gör att den gamla länken slutar fungera.</p>
        </div>
      )}
      <p role="status" className="text-sm">
        {kopierad && <span className="font-medium text-primary">Länken är kopierad. Klistra in den till de som ska med.</span>}
        {nyLank && !kopierad && <span className="font-medium text-primary">En ny länk är skapad. Den gamla fungerar inte längre.</span>}
        {fel && <span className="text-destructive">{fel}</span>}
      </p>
    </div>
  )
}
