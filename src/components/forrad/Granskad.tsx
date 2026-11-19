import { Check } from 'lucide-react'
import { useId, useState } from 'react'
import { datumText } from '@/lib/datum'
import { cn } from '@/lib/utils'

/**
 * Märkningen på en produkt ur katalogen. Granskad: en liten etikett som visar en förklaring när man trycker på den.
 * Inte granskad: diskret grå text. Saker man har skrivit in själv får ingen märkning och använder inte komponenten.
 */
export function Granskad({ kontrollerad, className }: { kontrollerad: string | null; className?: string }) {
  const id = useId()
  const [oppen, setOppen] = useState(false)

  if (!kontrollerad) return <p className={cn('text-xs text-muted-foreground', className)}>Inte granskad än</p>

  return (
    <div className={className}>
      {/* Knappen är 44 px hög för fingret, etiketten inuti är mindre. */}
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={id}
        onClick={() => setOppen((o) => !o)}
        className="group -my-2 inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary group-hover:bg-primary-soft/70">
          <Check className="size-3.5" aria-hidden />
          Granskad
        </span>
      </button>
      <p id={id} hidden={!oppen} role="status" className="mt-1 text-xs text-muted-foreground">
        Vi har jämfört vikt och mått med tillverkarens uppgifter {datumText(kontrollerad)}.
      </p>
    </div>
  )
}
