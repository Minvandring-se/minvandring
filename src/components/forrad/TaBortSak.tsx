import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { taBortFraga } from '@/lib/forradskok'
import type { Forradssak } from '@/lib/typer'

/**
 * Ta bort en sak direkt från den utfällda raden. Första trycket frågar på plats, det andra tar bort, med Ångra en
 * stund efteråt. Turer där saken redan ligger i packlistan påverkas inte, eftersom namn och vikt kopierades dit.
 */
export function TaBortSak({ sak, alla, onTaBort }: { sak: Forradssak; alla: Forradssak[]; onTaBort: () => void }) {
  const [fragar, setFragar] = useState(false)

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
        <Button autoFocus variant="outline" className="text-destructive" onClick={onTaBort}>
          <Trash2 className="size-4" aria-hidden />
          Ja, ta bort
        </Button>
        <Button variant="ghost" onClick={() => setFragar(false)}>
          Avbryt
        </Button>
      </div>
    </div>
  )
}
