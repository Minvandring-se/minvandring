import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Etiketten för en del som inte är byggd än. Streckad kant, så att den inte ser ut som en knapp.
 * På den mörkgröna ytan (stark) är den ljus.
 */
export function KommerSnartEtikett({ stark = false, className }: { stark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        stark ? 'border-yta-stark-muted/60 text-yta-stark-foreground' : 'border-muted-foreground/50 bg-muted text-muted-foreground',
        className,
      )}
    >
      Kommer snart
    </span>
  )
}

/**
 * Exempelinnehållet i en del som inte är byggd än. Det visar hur delen kommer att se ut, men går inte att trycka på
 * eller nå med tangentbordet (inert), och skärmläsare får bara meningen om vad delen blir.
 * Innehållet kommer från src/lib/exempeldata.ts och tas bort när delen byggs på riktigt.
 */
export function KommerSnart({
  text,
  stark = false,
  children,
  className,
}: {
  text: string
  /** På den mörkgröna ytan. */
  stark?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className={cn(children ? 'sr-only' : cn('text-sm', stark ? 'text-yta-stark-muted' : 'text-muted-foreground'))}>{text}</p>
      {children && (
        <div inert aria-hidden className="select-none">
          {children}
        </div>
      )}
    </div>
  )
}
