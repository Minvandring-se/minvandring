import { useState } from 'react'
import { initialer } from '@/lib/turlista'
import { cn } from '@/lib/utils'

const FARGER = ['bg-primary-soft', 'bg-sand', 'bg-accent-soft', 'bg-muted']

/**
 * En rund bricka med profilbilden, eller med initialer när bild saknas eller inte går att ladda.
 * Färgen väljs av namnet, så att samma person får samma färg. Brickan har samma storlek och form i båda lägena,
 * och bilden fyller den utan att tryckas ihop.
 */
export function Namnbricka({ namn, bild, className }: { namn: string; bild?: string | null; className?: string }) {
  const farg = FARGER[[...namn].reduce((s, t) => s + t.charCodeAt(0), 0) % FARGER.length]
  // Adressen som inte gick att ladda. En ny adress får ett nytt försök.
  const [trasig, setTrasig] = useState<string | null>(null)
  const visaBild = !!bild && bild !== trasig
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-foreground ring-2 ring-card',
        farg,
        className,
      )}
    >
      {visaBild ? (
        <img src={bild} alt="" width={256} height={256} decoding="async" className="size-full object-cover" onError={() => setTrasig(bild)} />
      ) : (
        initialer(namn)
      )}
    </span>
  )
}

/** Några namnbrickor omlott och "+n" om det är fler. Namnen står i text bredvid, brickorna är bara dekor. */
export function Namnbrickor({ personer, max = 4 }: { personer: readonly { namn: string; bild?: string | null }[]; max?: number }) {
  const synliga = personer.slice(0, max)
  const fler = personer.length - synliga.length
  if (personer.length === 0) return null
  return (
    <span className="flex -space-x-2" aria-hidden>
      {synliga.map((p, i) => (
        <Namnbricka key={i} namn={p.namn} bild={p.bild} />
      ))}
      {fler > 0 && <Namnbricka namn={`+ ${fler}`} className="bg-card text-muted-foreground" />}
    </span>
  )
}
