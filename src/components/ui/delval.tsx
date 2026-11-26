import { cn } from '@/lib/utils'

export interface Del<T extends string> {
  nyckel: T
  namn: string
}

/**
 * Ett val i två eller tre delar, till exempel Påsar, Märkesvaror och Livsmedel. Delarna är lika breda och den valda
 * är markerad i grönt. Knappar med aria-pressed, eftersom valet byter innehåll på samma sida.
 */
export function Delval<T extends string>({
  etikett,
  delar,
  vald,
  onValj,
  className,
}: {
  etikett: string
  delar: readonly Del<T>[]
  vald: T
  onValj: (d: T) => void
  className?: string
}) {
  return (
    <div role="group" aria-label={etikett} className={cn('flex gap-1 rounded-lg border border-border bg-muted p-1', className)}>
      {delar.map((d) => (
        <button
          key={d.nyckel}
          type="button"
          aria-pressed={d.nyckel === vald}
          onClick={() => onValj(d.nyckel)}
          className={cn(
            'min-h-11 min-w-0 flex-auto rounded-md px-1 text-[0.8125rem] transition-colors sm:px-2 sm:text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
            d.nyckel === vald ? 'bg-card font-semibold text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {d.namn}
        </button>
      ))}
    </div>
  )
}
