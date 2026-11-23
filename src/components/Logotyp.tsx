import { cn } from '@/lib/utils'

const symbolKlass = '-mx-[0.18em] size-[2.1em] shrink-0'

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
        'flex items-center gap-[0.45em] font-logo text-lg font-semibold tracking-tight',
        yta === 'mork' ? 'text-pa-bild' : 'text-primary',
        className,
      )}
    >
      {/* SVG-filen är kvadratisk med luft runt symbolen. Den negativa marginalen tar bort luften på sidorna. */}
      {yta === 'mork' ? (
        <img src={symboler.mork} alt="" aria-hidden className={symbolKlass} />
      ) : (
        <>
          {/* På ljus yta: grön symbol i ljust läge och ljus symbol i mörkt läge, där ytan är mörk. */}
          <img src={symboler.ljus} alt="" aria-hidden className={cn(symbolKlass, 'mork:hidden')} />
          <img src={symboler.mork} alt="" aria-hidden className={cn(symbolKlass, 'hidden mork:block')} />
        </>
      )}
      MinVandring
    </span>
  )
}
