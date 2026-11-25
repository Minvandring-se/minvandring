import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Siffror i en rad: etikett över värdet och en tunn linje mellan varje. Linjerna över och under kan tas bort med ram={false}.
 * I mobil får varje värde lika stor del av bredden, så långa värden bryts i stället för att trycka ut raden. Med
 * tvaKolumnerIMobil står värdena två och två i mobil och i en rad från sm.
 */
export function Nyckeltal({
  varden,
  ram = true,
  stark = false,
  tvaKolumnerIMobil = false,
  className,
}: {
  varden: readonly { etikett: string; varde: ReactNode }[]
  ram?: boolean
  /** På den mörkgröna ytan. */
  stark?: boolean
  /** Två kolumner i mobil, för fyra värden som annars blir för smala. */
  tvaKolumnerIMobil?: boolean
  className?: string
}) {
  if (varden.length === 0) return null
  const kolumner = `repeat(${varden.length}, minmax(0, 1fr))`
  const linje = stark ? 'border-yta-stark-muted/30' : 'border-border'
  return (
    <dl
      className={cn('grid', tvaKolumnerIMobil && 'grid-cols-2 sm:grid-cols-(--kolumner)', ram && cn('border-y', linje), className)}
      style={tvaKolumnerIMobil ? ({ '--kolumner': kolumner } as CSSProperties) : { gridTemplateColumns: kolumner }}
    >
      {varden.map(({ etikett, varde }, i) => (
        <div
          key={etikett}
          className={cn(
            'min-w-0 py-3',
            linje,
            tvaKolumnerIMobil
              ? cn(i % 2 === 1 && 'border-l pl-3', i >= 2 && 'border-t sm:border-t-0', i > 0 && 'sm:border-l sm:pl-4')
              : i > 0 && 'border-l pl-3 sm:pl-4',
          )}
        >
          <dt className={cn('text-xs break-words', stark ? 'text-yta-stark-muted' : 'text-muted-foreground')}>{etikett}</dt>
          <dd className="mt-0.5 font-semibold break-words tabular-nums">{varde}</dd>
        </div>
      ))}
    </dl>
  )
}
