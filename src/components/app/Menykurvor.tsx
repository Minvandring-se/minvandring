import { useId } from 'react'
import { MENYKURVOR } from '@/components/ui/kurvdata'
import { cn } from '@/lib/utils'

/**
 * Svaga höjdkurvor längst ner i sidomenyn på dator, enligt skissen i Claude outputs/design-skisser/hojdkurvor/.
 * Kurvorna sitter i nedre delen och tonar ut uppåt (masken), så att de inte hamnar bakom menyvalen. Färgen är
 * primary med 7 % styrka: mörkgrön i ljust läge och ljusgrön i mörkt läge. Ligger bakom menyns innehåll (-z-10).
 */
export function Menykurvor({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg
      viewBox="56.25 268.12 143.75 400"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 size-full text-primary', className)}
    >
      <defs>
        <linearGradient id={`${id}-tona`} gradientUnits="userSpaceOnUse" x1="0" y1="460.1" x2="0" y2="540.1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect x="56.25" y="268.12" width="143.75" height="400" fill={`url(#${id}-tona)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-mask)`} fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="1.2" strokeLinejoin="round">
        {MENYKURVOR.map((d, i) => (
          <path key={i} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
    </svg>
  )
}
