import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { rensaFraga } from '@/lib/forrad'
import { supabase } from '@/lib/supabase'

/**
 * Ta bort alla saker i en kategori på en gång. Första trycket frågar på plats, det andra tar bort de saker som visas.
 */
export function RensaKategori({ etikett, ids, iKategorin, onRensad }: { etikett: string; ids: string[]; iKategorin: number; onRensad: () => void }) {
  const [fragar, setFragar] = useState(false)
  const [tarBort, setTarBort] = useState(false)
  const [fel, setFel] = useState(false)

  async function rensa() {
    if (!supabase || ids.length === 0) return
    setTarBort(true)
    setFel(false)
    const { error } = await supabase.from('forradssaker').delete().in('id', ids)
    setTarBort(false)
    if (error) return setFel(true)
    setFragar(false)
    onRensad()
  }

  if (!fragar)
    return (
      <Button variant="ghost" className="-ml-3 text-destructive" onClick={() => setFragar(true)}>
        <Trash2 className="size-4" aria-hidden />
        Rensa {etikett.toLowerCase()}
      </Button>
    )

  return (
    <div role="group" aria-label={`Rensa ${etikett.toLowerCase()}`} className="space-y-2 rounded-lg border border-border bg-card p-3">
      <p className="text-sm">{rensaFraga(etikett, ids.length, iKategorin)}</p>
      <div className="flex flex-wrap gap-2">
        <Button autoFocus variant="outline" className="text-destructive" disabled={tarBort} onClick={rensa}>
          <Trash2 className="size-4" aria-hidden />
          {tarBort ? 'Tar bort …' : ids.length === 1 ? 'Ja, ta bort 1 sak' : `Ja, ta bort ${ids.length} saker`}
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
