import { createElement, useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { IKONER, MASK, type Ikonelement } from './ikondata'

/** Namnen på MinVandrings egna ikoner, till exempel mina-turer eller etapp. */
export type IkonNamn = keyof typeof IKONER

/** Ritar ett element och byter platshållaren för maskens id mot det unika id:t. */
function rita(element: Ikonelement, nyckel: number, maskId: string): ReactNode {
  const [tagg, attribut, barn] = element
  const attr: Record<string, string> = {}
  for (const [namn, varde] of Object.entries(attribut)) attr[namn] = varde === MASK ? maskId : varde.replaceAll(`url(#${MASK})`, `url(#${maskId})`)
  return createElement(tagg, { key: nyckel, ...attr }, ...barn.map((b, i) => rita(b, i, maskId)))
}

/**
 * En av MinVandrings egna ikoner i linosnitt: en fylld form i textens färg (currentColor) med genomskinliga urtag, så
 * att ikonen fungerar på alla ytor, i den aktiva menyraden och i mörkt läge. Urtagen görs med en mask, och maskens id
 * är unikt per ikon på sidan (useId). 24 px som standard: 24 i menyn, 28 i listor och 32 till 36 i större kort.
 * Utan etikett är ikonen dekor och dold för skärmläsare. Med etikett läses den upp. En knapp med bara en ikon behöver
 * i stället en aria-label på knappen. Vanliga knappar (sök, plus, pilar, stäng) använder fortfarande lucide-react.
 */
export function Ikon({ namn, storlek = 24, etikett, className }: { namn: IkonNamn; storlek?: number; etikett?: string; className?: string }) {
  // useId ger till exempel «r1» eller :r1:, och bara bokstäver, siffror och bindestreck fungerar säkert i url(#...).
  const maskId = `ikon-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={storlek}
      height={storlek}
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      {...(etikett ? { role: 'img', 'aria-label': etikett } : { 'aria-hidden': true, focusable: 'false' })}
    >
      {IKONER[namn].map((e, i) => rita(e, i, maskId))}
    </svg>
  )
}
