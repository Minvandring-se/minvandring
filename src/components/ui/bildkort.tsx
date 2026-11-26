import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bildkortet, samma på alla översiktssidor: turkortet, turens översikt, Mina matplaner, recepten och tipsen.
 * Kortet räknar ut sin form efter sin egen bredd (container query), så samma kort fungerar i en lista och i ett rutnät:
 * - Brett (från 42rem): texten till vänster och bilden till höger, 40 procent av bredden. Textdelen buktar ut över
 *   bildens vänstra kant i en mjuk båge i kortets färg.
 * - Smalt: bilden överst, 200 px hög (120 px i mobil med lagBild), och den tonar ut nedåt mot texten i kortets färg.
 * Kort som går att trycka på (klickbar) lyfts vid hovring och fokus (lyft). Bilden ges som bild och ska fylla sin ruta
 * (absolute inset-0 size-full). Det som ska ligga ovanpå bilden, till exempel knappar, ges som paBilden.
 */
export function Bildkort({
  bild,
  paBilden,
  ton = 'kort',
  klickbar = false,
  lagBild = false,
  element: Element = 'article',
  className,
  textKlass,
  children,
  ...rest
}: {
  bild: ReactNode
  paBilden?: ReactNode
  /** kort: vit yta. stark: den mörkgröna ytan. Bågen och toningen får samma färg som kortet. */
  ton?: 'kort' | 'stark'
  klickbar?: boolean
  /** Lägre bild i mobil (120 px i stället för 200 px), för listor där fler kort ska synas per skärm. */
  lagBild?: boolean
  element?: 'article' | 'section' | 'div'
  className?: string
  textKlass?: string
  children: ReactNode
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  const stark = ton === 'stark'
  return (
    <Element
      {...rest}
      className={cn(
        '@container relative overflow-hidden rounded-[1.375rem]',
        stark ? 'bg-yta-stark text-yta-stark-foreground' : 'border border-border bg-card',
        klickbar && 'lyft',
        className,
      )}
    >
      <div className="grid h-full @2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className={cn('relative @2xl:order-2 @2xl:h-auto @2xl:min-h-72', lagBild ? 'h-[120px] md:h-[200px]' : 'h-[200px]')}>
          {bild}
          <svg
            aria-hidden
            viewBox="0 0 100 300"
            preserveAspectRatio="none"
            className={cn('absolute inset-y-0 -left-px hidden h-full w-[5.5rem] @2xl:block', stark ? 'fill-yta-stark' : 'fill-card')}
          >
            <path d="M0 0 H38 C 92 70, 92 230, 38 300 H0 Z" />
          </svg>
          <div aria-hidden className={cn('absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t to-transparent @2xl:hidden', stark ? 'from-yta-stark' : 'from-card')} />
          {paBilden}
        </div>
        <div className={cn('flex min-w-0 flex-col @2xl:order-1', textKlass)}>{children}</div>
      </div>
    </Element>
  )
}

/** En bild i bildkortet med två storlekar. Dekorativ (alt tomt). Bara det första kortet på sidan laddar bilden direkt. */
export function Kortbild({ src, srcSet, forst = false, className }: { src: string; srcSet?: string; forst?: boolean; className?: string }) {
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 768px) 40vw, 100vw"
      alt=""
      loading={forst ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('absolute inset-0 size-full object-cover', className)}
    />
  )
}
