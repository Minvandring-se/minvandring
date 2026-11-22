import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Siffror i en rad: etikett över värdet och en tunn linje mellan varje. Linjerna över och under kan tas bort med ram={false}.
 * I mobil får varje värde lika stor del av bredden, så långa värden bryts i stället för att trycka ut raden.
 */
export function Nyckeltal({
  varden,
  ram = true,
  stark = false,
  className,
}: {
  varden: readonly { etikett: string; varde: ReactNode }[]
  ram?: boolean
  /** På den mörkgröna ytan. */
  stark?: boolean
  className?: string
}) {
  if (varden.length === 0) return null
  return (
    <dl
      className={cn(
        'grid',
        ram && (stark ? 'border-y border-yta-stark-muted/30' : 'border-y border-border'),
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${varden.length}, minmax(0, 1fr))` }}
    >
      {varden.map(({ etikett, varde }, i) => (
        <div
          key={etikett}
          className={cn('min-w-0 py-3', i > 0 && 'border-l pl-3 sm:pl-4', stark ? 'border-yta-stark-muted/30' : 'border-border')}
        >
          <dt className={cn('text-xs break-words', stark ? 'text-yta-stark-muted' : 'text-muted-foreground')}>{etikett}</dt>
          <dd className="mt-0.5 font-semibold break-words tabular-nums">{varde}</dd>
        </div>
      ))}
    </dl>
  )
}
