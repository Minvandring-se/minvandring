import { Check } from 'lucide-react'
import { useId, useState } from 'react'
import { datumText } from '@/lib/datum'

/**
 * Etiketten på en produkt ur katalogen som vi har granskat. Ett tryck visar en förklaring med datum.
 * En produkt som inte är granskad får ingen etikett. Det står i stället i den utfällda detaljen i förrådet.
 */
export function Granskad({ kontrollerad, className }: { kontrollerad: string | null; className?: string }) {
  const id = useId()
  const [oppen, setOppen] = useState(false)

  if (!kontrollerad) return null

  return (
    <div className={className}>
      {/* Knappen är 44 px hög för fingret, etiketten inuti är mindre. Ingen negativ marginal, så att ytan inte överlappar raden ovanför. */}
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={id}
        onClick={() => setOppen((o) => !o)}
        className="group inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-sm font-medium text-primary group-hover:bg-primary-soft/70">
          <Check className="size-3.5" aria-hidden />
          Granskad
        </span>
      </button>
      <p id={id} hidden={!oppen} role="status" className="mt-1 text-sm text-muted-foreground">
        Vi har jämfört vikt och mått med tillverkarens uppgifter {datumText(kontrollerad)}.
      </p>
    </div>
  )
}
