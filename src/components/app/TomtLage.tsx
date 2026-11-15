import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Ett lugnt tomt läge: bild eller ikon, rubrik, kort text och en knapp. */
export function TomtLage({
  bild,
  rubrik,
  text,
  knapp,
  className,
}: {
  bild?: ReactNode
  rubrik: string
  text: ReactNode
  knapp?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card shadow-soft', className)}>
      {bild}
      <div className="space-y-3 p-6 sm:p-8">
        <h2 className="text-2xl">{rubrik}</h2>
        <p className="max-w-prose text-muted-foreground">{text}</p>
        {knapp && <div className="pt-2">{knapp}</div>}
      </div>
    </div>
  )
}
