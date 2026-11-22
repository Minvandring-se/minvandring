import { BadgeCheck, Check } from 'lucide-react'
import { useId, useState } from 'react'
import { granskning, type Granskningsuppgifter } from '@/lib/granskning'
import { cn } from '@/lib/utils'

/**
 * Märket på en produkt ur katalogen som har granskats: Stickprovskontrollerad eller Granskad mot tillverkaren.
 * Ett tryck visar en förklaring med datum. En produkt utan nivå får inget märke. Det står i stället i den utfällda detaljen i förrådet.
 */
export function Granskad({ produkt, className }: { produkt: Granskningsuppgifter; className?: string }) {
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const { niva, marke, forklaring } = granskning(produkt)

  if (!marke) return null
  const Ikon = niva === 'stickprov' ? BadgeCheck : Check

  return (
    <div className={className}>
      {/* Knappen är 44 px hög för fingret, märket inuti är mindre. Ingen negativ marginal, så att ytan inte överlappar raden ovanför. */}
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={id}
        onClick={() => setOppen((o) => !o)}
        className="group inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {/* Nivåerna skiljs med text och ikon. Den högre nivån har dessutom fylld bakgrund, den lägre en ram. */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium text-primary',
            niva === 'stickprov' ? 'bg-primary-soft group-hover:bg-primary-soft/70' : 'border border-border group-hover:bg-primary-soft/40',
          )}
        >
          <Ikon className="size-3.5" aria-hidden />
          {marke}
        </span>
      </button>
      <p id={id} hidden={!oppen} role="status" className="mt-1 text-sm text-muted-foreground">
        {forklaring}
      </p>
    </div>
  )
}
