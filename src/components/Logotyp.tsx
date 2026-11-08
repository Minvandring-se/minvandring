import { Mountain } from 'lucide-react'
import { cn } from '@/lib/utils'

/** "Min Vandring" med fjällikonen. Färgen ärvs, så den fungerar både på ljus bakgrund och på bild. */
export function Logotyp({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-heading text-lg font-semibold tracking-tight', className)}>
      <Mountain className="size-6" aria-hidden />
      Min Vandring
    </span>
  )
}
