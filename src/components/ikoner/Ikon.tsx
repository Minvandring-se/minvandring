import { createElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { IKONER, type Ikonelement } from './ikondata'

/** Namnen på MinVandrings egna ikoner, till exempel mina-turer eller etapp. */
export type IkonNamn = keyof typeof IKONER

function rita(element: Ikonelement, nyckel: number): ReactNode {
  const [tagg, attribut, barn] = element
  return createElement(tagg, { key: nyckel, ...attribut }, ...barn.map(rita))
}

/**
 * En av MinVandrings egna ikoner, inline så att färgerna följer variablerna --ikon-linje, --ikon-yta, --ikon-yta-2 och
 * --ikon-accent i ljust och mörkt läge. 24 px som standard. Utan etikett är ikonen dekor och dold för skärmläsare.
 * Med etikett läses den upp. En knapp med bara en ikon behöver i stället en aria-label på knappen.
 * Vanliga knappar (sök, plus, pilar, stäng) använder fortfarande lucide-react.
 */
export function Ikon({ namn, storlek = 24, etikett, className }: { namn: IkonNamn; storlek?: number; etikett?: string; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={storlek}
      height={storlek}
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      {...(etikett ? { role: 'img', 'aria-label': etikett } : { 'aria-hidden': true, focusable: 'false' })}
    >
      {IKONER[namn].map(rita)}
    </svg>
  )
}
