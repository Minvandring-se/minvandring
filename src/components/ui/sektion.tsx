import { useId, type ReactNode } from 'react'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { cn } from '@/lib/utils'

type Variant = 'yta' | 'stark' | 'accent' | 'hjortron'

const VARIANT: Record<Variant, string> = {
  // Vit yta med tunn kant på den nästan vita bakgrunden. Det vanliga.
  yta: 'border border-border bg-card text-card-foreground',
  // Den mörkgröna ytan, för en eller två saker per sida.
  stark: 'bg-yta-stark text-yta-stark-foreground',
  // Rostens mjuka ton, för det man ska komma ihåg.
  accent: 'border border-accent/25 bg-accent-soft text-foreground',
  // Hjortronets mjuka ton, för möjligheter och det positiva. Rubriken står i hjortron-strong.
  hjortron: 'border border-hjortron/30 bg-hjortron-soft text-foreground',
}

/**
 * En del av en sida: rubrik, valfri etikett och valfri länk eller knapp till höger, och innehållet under.
 * kommerSnart visar etiketten "Kommer snart" för delar som inte är byggda än.
 */
export function Sektion({
  rubrik,
  overrubrik,
  atgard,
  etikett,
  kommerSnart = false,
  variant = 'yta',
  rubrikniva = 2,
  rubrikKlass,
  className,
  children,
}: {
  rubrik: string
  /** En kort rad ovanför rubriken, till exempel vilken tur något kommer från. */
  overrubrik?: ReactNode
  /** En länk eller knapp till höger om rubriken. */
  atgard?: ReactNode
  /** En egen etikett bredvid rubriken. */
  etikett?: ReactNode
  kommerSnart?: boolean
  variant?: Variant
  rubrikniva?: 2 | 3
  /** Egen storlek på rubriken, till exempel text-[22px]. */
  rubrikKlass?: string
  className?: string
  children?: ReactNode
}) {
  const id = useId()
  const Rubrik = rubrikniva === 2 ? 'h2' : 'h3'
  // I en del som inte är byggd är överrubrik, etikett och åtgärd också exempel. De döljs för skärmläsare och går inte
  // att trycka på, som exempelinnehållet i KommerSnart. Sektionen blir då inte heller ett eget landmärke.
  const exempel = kommerSnart ? { inert: true, 'aria-hidden': true as const } : {}
  return (
    <section aria-labelledby={kommerSnart ? undefined : id} className={cn('flex min-w-0 flex-col gap-4 rounded-yta p-5 sm:p-6', VARIANT[variant], className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 space-y-1">
          {overrubrik && (
            <p {...exempel} className={cn('text-sm font-semibold', variant === 'stark' ? 'text-yta-stark-muted' : 'text-accent-strong')}>
              {overrubrik}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Rubrik id={id} className={cn('min-w-0 text-xl wrap-anywhere lg:text-2xl', variant === 'hjortron' && 'text-hjortron-strong', rubrikKlass)}>
              {rubrik}
            </Rubrik>
            {etikett && <span {...exempel}>{etikett}</span>}
            {kommerSnart && <KommerSnartEtikett stark={variant === 'stark'} />}
          </div>
        </div>
        {atgard && (
          <div {...exempel} className="flex max-w-full flex-wrap gap-2">
            {atgard}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}
