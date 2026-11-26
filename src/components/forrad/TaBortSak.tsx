import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Ta bort en sak direkt från den utfällda raden, med Ångra en stund efteråt. Turer där saken redan ligger i
 * packlistan påverkas inte, eftersom namn och vikt kopierades dit.
 */
export function TaBortSak({ onTaBort }: { onTaBort: () => void }) {
  return (
    <Button variant="ghost" className="text-destructive" onClick={onTaBort}>
      <Trash2 className="size-4" aria-hidden />
      Ta bort
    </Button>
  )
}
