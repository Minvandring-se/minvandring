import { andel, procent } from '@/lib/matt'
import { cn } from '@/lib/utils'

/**
 * En stapel som visar hur långt något har kommit, till exempel packningen. Värdet är mellan 0 och 1.
 * stark används på den mörkgröna ytan, där spåret och fyllningen behöver ljusa färger.
 */
export function Framsteg({
  varde,
  etikett,
  stark = false,
  fargKlass,
  className,
}: {
  varde: number
  etikett: string
  stark?: boolean
  /** Fyllningens färg, till exempel bg-illustration. Standard är primary, eller ljus på den mörkgröna ytan. */
  fargKlass?: string
  className?: string
}) {
  const a = andel(varde)
  return (
    <span
      role="progressbar"
      aria-label={etikett}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={procent(a)}
      className={cn('block h-2 overflow-hidden rounded-full', stark ? 'bg-yta-stark-muted/30' : 'bg-muted', className)}
    >
      <span className={cn('block h-full rounded-full', fargKlass ?? (stark ? 'bg-yta-stark-foreground' : 'bg-primary'))} style={{ width: `${a * 100}%` }} />
    </span>
  )
}
