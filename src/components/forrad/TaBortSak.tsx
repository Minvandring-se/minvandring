import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { taBortFraga } from '@/lib/forradskok'
import { supabase } from '@/lib/supabase'
import type { Forradssak } from '@/lib/typer'

/**
 * Ta bort en sak direkt från den utfällda raden. Första trycket frågar på plats, det andra tar bort. Turer där saken
 * redan ligger i packlistan påverkas inte, eftersom namn och vikt kopierades dit.
 */
export function TaBortSak({ sak, alla, onBorttagen }: { sak: Forradssak; alla: Forradssak[]; onBorttagen: () => void }) {
  const [fragar, setFragar] = useState(false)
  const [tarBort, setTarBort] = useState(false)
  const [fel, setFel] = useState(false)

  async function taBort() {
    if (!supabase) return
    setTarBort(true)
    setFel(false)
    const { error, count } = await supabase.from('forradssaker').delete({ count: 'exact' }).eq('id', sak.id)
    setTarBort(false)
    if (error || count !== 1) return setFel(true)
    onBorttagen()
  }

  if (!fragar)
    return (
      <Button variant="ghost" className="text-destructive" onClick={() => setFragar(true)}>
        <Trash2 className="size-4" aria-hidden />
        Ta bort
      </Button>
    )

  return (
    <div role="group" aria-label={`Ta bort ${sak.namn}`} className="w-full space-y-2 rounded-lg border border-border bg-card p-3">
      <p className="text-sm">{taBortFraga(sak, alla)}</p>
      <div className="flex flex-wrap gap-2">
        <Button autoFocus variant="outline" className="text-destructive" disabled={tarBort} onClick={taBort}>
          <Trash2 className="size-4" aria-hidden />
          {tarBort ? 'Tar bort …' : 'Ja, ta bort'}
        </Button>
        <Button variant="ghost" disabled={tarBort} onClick={() => setFragar(false)}>
          Avbryt
        </Button>
      </div>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          Det gick inte att ta bort. Kontrollera uppkopplingen och försök igen.
        </p>
      )}
    </div>
  )
}
