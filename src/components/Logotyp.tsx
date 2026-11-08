import { cn } from '@/lib/utils'

const symboler = {
  ljus: '/brand/minvandring-symbol-green.svg',
  mork: '/brand/minvandring-symbol-cream.svg',
}

/**
 * Symbolen och namnet. yta="mork" på mörka ytor och bilder (ljus symbol), annars grön symbol.
 * Storleken följer textstorleken, så className="text-xl" gör hela logotypen större.
 */
export function Logotyp({ yta = 'ljus', className }: { yta?: 'ljus' | 'mork'; className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center gap-[0.45em] font-heading text-lg font-semibold tracking-tight',
        yta === 'mork' ? 'text-logo-ljus' : 'text-logo-gron',
        className,
      )}
    >
      {/* SVG-filen är kvadratisk med luft runt symbolen. Den negativa marginalen tar bort luften på sidorna. */}
      <img src={symboler[yta]} alt="" aria-hidden className="-mx-[0.18em] size-[2.1em] shrink-0" />
      MinVandring
    </span>
  )
}
