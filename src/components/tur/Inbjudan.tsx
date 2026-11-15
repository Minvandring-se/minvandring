import { Check, Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { arAgare, type Roll } from '@/lib/roller'
import { supabase } from '@/lib/supabase'

/**
 * Inbjudningslänken. Visas bara för ägare och redigerare, och databasen släpper bara fram koden till dem.
 * Ägaren kan skapa en ny länk, och då slutar den gamla fungera.
 */
export function Inbjudan({ turId, minRoll }: { turId: string; minRoll: Roll }) {
  const [kod, setKod] = useState<string | null | undefined>(undefined)
  const [kopierad, setKopierad] = useState(false)
  const [skapar, setSkapar] = useState(false)
  const [fel, setFel] = useState('')

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
    await navigator.clipboard.writeText(lank)
    setKopierad(true)
    setTimeout(() => setKopierad(false), 2000)
  }

  async function skapaNy() {
    if (!supabase) return
    if (!window.confirm('Skapa en ny länk? Den gamla slutar fungera, men de som redan är med finns kvar.')) return
    setFel('')
    setSkapar(true)
    const { data, error } = await supabase.rpc('ny_inbjudningskod', { t: turId })
    setSkapar(false)
    if (error || typeof data !== 'string') {
      setFel('Det gick inte att skapa en ny länk.')
      return
    }
    setKod(data)
    setKopierad(false)
  }

  return (
    <div className="space-y-2 rounded-md bg-muted p-3">
      <p className="text-sm font-medium">Bjud in fler</p>
      <p className="text-sm text-muted-foreground">Den som går med via länken blir redigerare. Ägaren kan ändra rollen efteråt.</p>
      {kod === undefined && <p className="text-sm text-muted-foreground">Hämtar länken …</p>}
      {kod === null && <p className="text-sm text-destructive">Det gick inte att hämta länken.</p>}
      {kod && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-md bg-card px-3 py-2 text-sm">{lank}</code>
          <Button variant="outline" onClick={kopiera}>
            {kopierad ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {kopierad ? 'Kopierad' : 'Kopiera länk'}
          </Button>
        </div>
      )}
      {arAgare(minRoll) && kod !== undefined && (
        <div className="space-y-1">
          <Button variant="ghost" onClick={skapaNy} disabled={skapar} className="px-3">
            <RefreshCw className="size-4" aria-hidden />
            Skapa ny länk
          </Button>
          <p className="text-xs text-muted-foreground">Gör att den gamla länken slutar fungera.</p>
        </div>
      )}
      {fel && <p className="text-sm text-destructive">{fel}</p>}
    </div>
  )
}
