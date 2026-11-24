import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { laddfelText } from '@/lib/texter'

/**
 * Det som visas när något inte gick att hämta: samma mening överallt och knappen Försök igen.
 * Utan onForsokIgen visas bara texten, till exempel inne i en panel där man kan stänga och öppna igen.
 */
export function Laddfel({ vad, onForsokIgen }: { vad: string; onForsokIgen?: () => void }) {
  return (
    <div role="alert" className="space-y-3">
      <p className="text-destructive">{laddfelText(vad)}</p>
      {onForsokIgen && (
        <Button variant="outline" onClick={onForsokIgen}>
          <RefreshCw className="size-4" aria-hidden />
          Försök igen
        </Button>
      )}
    </div>
  )
}
