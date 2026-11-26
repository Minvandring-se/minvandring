import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Ett lugnt tomt läge: bild eller ikon, rubrik, eventuellt en kort text och en knapp.
 * Den stora varianten är för en sida utan innehåll. Den kompakta (streckad kant, ingen bild) är för en del
 * av en sida, till exempel en flik utan turer eller en filtrering utan träffar.
 */
export function TomtLage({
  bild,
  ikon,
  rubrik,
  text,
  knapp,
  kompakt = false,
  className,
}: {
  bild?: ReactNode
  /** En ikon i det kompakta läget, till exempel en av MinVandrings egna ikoner. Dekor. */
  ikon?: ReactNode
  rubrik?: string
  text?: ReactNode
  knapp?: ReactNode
  kompakt?: boolean
  className?: string
}) {
  if (kompakt)
    return (
      <div className={cn('space-y-3 rounded-lg border border-dashed border-border px-5 py-6', className)}>
        {ikon}
        {rubrik && <h3 className="text-lg">{rubrik}</h3>}
        {text && <p className="max-w-prose text-muted-foreground">{text}</p>}
        {knapp && <div>{knapp}</div>}
      </div>
    )
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card shadow-soft', className)}>
      {bild}
      <div className="space-y-3 p-6 sm:p-8">
        {rubrik && <h2 className="text-2xl">{rubrik}</h2>}
        {text && <p className="max-w-prose text-muted-foreground">{text}</p>}
        {knapp && <div className="pt-2">{knapp}</div>}
      </div>
    </div>
  )
}
