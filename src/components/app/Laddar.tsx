import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ett laddläge: platshållare i samma form som innehållet som kommer, så att sidan inte hoppar när det är hämtat.
 * Skärmläsare får texten, till exempel "Hämtar dina turer". Platshållarna är dolda för dem.
 */
export function Laddar({ text, children, className }: { text: string; children: ReactNode; className?: string }) {
  return (
    <div role="status" className={className}>
      <span className="sr-only">{text}</span>
      <div aria-hidden className="space-y-4">
        {children}
      </div>
    </div>
  )
}

/** En lugn grå yta i platshållarens form. Pulserar svagt, utom när "minska rörelse" är på. */
export function Skelett({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block rounded-md bg-muted motion-safe:animate-pulse', className)} />
}
