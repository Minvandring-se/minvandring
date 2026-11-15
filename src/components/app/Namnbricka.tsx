import { initialer } from '@/lib/turlista'
import { cn } from '@/lib/utils'

const FARGER = ['bg-primary-soft', 'bg-sand', 'bg-accent-soft', 'bg-muted']

/** En rund bricka med initialer. Färgen väljs av namnet, så att samma person får samma färg. */
export function Namnbricka({ namn, className }: { namn: string; className?: string }) {
  const farg = FARGER[[...namn].reduce((s, t) => s + t.charCodeAt(0), 0) % FARGER.length]
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-foreground ring-2 ring-card',
        farg,
        className,
      )}
    >
      {initialer(namn)}
    </span>
  )
}

/** Några namnbrickor omlott och "+n" om det är fler. Namnen står i text bredvid, brickorna är bara dekor. */
export function Namnbrickor({ namn, max = 4 }: { namn: readonly string[]; max?: number }) {
  const synliga = namn.slice(0, max)
  const fler = namn.length - synliga.length
  if (namn.length === 0) return null
  return (
    <span className="flex -space-x-2" aria-hidden>
      {synliga.map((n, i) => (
        <Namnbricka key={i} namn={n} />
      ))}
      {fler > 0 && <Namnbricka namn={`+ ${fler}`} className="bg-card text-muted-foreground" />}
    </span>
  )
}
