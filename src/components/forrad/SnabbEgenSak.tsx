import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_NAMN, kategoriFor, underkategoriFor, type KategoriNyckel, type UnderkategoriNyckel } from '@/lib/forrad'
import { snabbSak } from '@/lib/forradTillagg'
import { supabase } from '@/lib/supabase'
import { visaTolkning } from '@/lib/viktfalt'

/**
 * En egen sak med bara namn och vikt, för det som inte finns i katalogen. Kategorin gissas från namnet, eller är den
 * som är vald i sökningen, och går att ändra senare med Ändra. Fler uppgifter öppnar hela formuläret.
 */
export function SnabbEgenSak({
  startnamn,
  kategori,
  underkategori,
  onTillagd,
  onFler,
}: {
  startnamn: string
  kategori?: KategoriNyckel
  underkategori?: UnderkategoriNyckel
  onTillagd: (sakId: string, namn: string) => void
  onFler: (namn: string) => void
}) {
  const id = useId()
  const [namn, setNamn] = useState(startnamn)
  const [vikt, setVikt] = useState('')
  const [fel, setFel] = useState('')
  const [sparar, setSparar] = useState(false)
  const tolkad = snabbSak(namn, vikt, { kategori, underkategori })
  const hamnar = tolkad.ok
    ? [kategoriFor(tolkad.varden.kategori).etikett, underkategoriFor(tolkad.varden.kategori, tolkad.varden.underkategori)?.etikett].filter(Boolean).join(', ')
    : null
  const tolkning = visaTolkning(vikt)

  async function spara(e: FormEvent) {
    e.preventDefault()
    if (!tolkad.ok) return setFel(tolkad.fel)
    if (!supabase) return
    setFel('')
    setSparar(true)
    const { data, error } = await supabase.from('forradssaker').insert({ ...tolkad.varden, produkt_id: null }).select('id').single()
    setSparar(false)
    if (error || !data) return setFel('Det gick inte att lägga till. Kontrollera uppkopplingen och försök igen.')
    onTillagd((data as { id: string }).id, tolkad.varden.namn)
    setNamn('')
    setVikt('')
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3 rounded-lg border border-border bg-card p-3">
      <p className="text-sm font-semibold">Ny egen sak</p>
      <div className="grid gap-3 @md:grid-cols-[minmax(0,1fr)_9rem]">
        <div className="space-y-1">
          <label htmlFor={`${id}-namn`} className="block text-sm font-medium">
            Namn
          </label>
          <Input id={`${id}-namn`} value={namn} maxLength={MAX_NAMN} onChange={(e) => setNamn(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${id}-vikt`} className="block text-sm font-medium">
            Vikt (frivillig)
          </label>
          <Input id={`${id}-vikt`} value={vikt} inputMode="decimal" placeholder="g eller kg" onChange={(e) => setVikt(e.target.value)} aria-describedby={`${id}-hjalp`} />
        </div>
      </div>
      <p id={`${id}-hjalp`} className="text-sm text-muted-foreground" aria-live="polite">
        {[tolkning, hamnar && `Hamnar i ${hamnar}. Du kan ändra det sedan.`].filter(Boolean).join(' ')}
      </p>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Lägger till …' : 'Lägg till'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => onFler(namn)}>
          Fler uppgifter
        </Button>
      </div>
    </form>
  )
}
