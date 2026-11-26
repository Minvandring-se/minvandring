import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { taBortLardom } from '@/hooks/useLardomar'
import { amnesEtikett, franText, type Lardom } from '@/lib/lardomar'

/** En lärdom med ämne eller tur under texten och en knapp för att ta bort den. */
export function Lardomsrad({ lardom, visa, onAndrad }: { lardom: Lardom; visa: 'amne' | 'tur' | 'bada'; onAndrad: () => Promise<void> }) {
  const [fel, setFel] = useState(false)
  const delar = [visa !== 'tur' ? amnesEtikett(lardom.amne) : null, visa !== 'amne' ? franText(lardom) : null].filter(Boolean)

  async function taBort() {
    if (!window.confirm(`Ta bort lärdomen ”${lardom.text}”?`)) return
    const ok = await taBortLardom(lardom.id)
    setFel(!ok)
    if (ok) await onAndrad()
  }

  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="break-words">{lardom.text}</p>
        {delar.length > 0 && <p className="text-sm break-words text-muted-foreground">{delar.join(' · ')}</p>}
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att ta bort. Försök igen.
          </p>
        )}
      </div>
      <Button variant="ghost" size="ikon" aria-label={`Ta bort lärdomen ${lardom.text}`} onClick={taBort}>
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </li>
  )
}
