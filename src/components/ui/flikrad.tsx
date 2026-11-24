import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { FlikAntal } from '@/components/ui/bricka'
import { Snart } from '@/components/ui/snart'
import { useAktivFlikSynlig } from '@/hooks/useAktivFlikSynlig'
import { cn } from '@/lib/utils'

export interface Flik {
  nyckel: string
  namn: string
  /** Adressen. En flik utan adress är en del som inte finns än: den visas med "Snart" och går inte att öppna. */
  till?: string
  /** En del som finns som sida men inte är byggd. Skärmläsare får "(kommer snart)". */
  kommerSnart?: boolean
  antal?: number
}

/**
 * Flikar som byter del av en sida: turens delar, Matplaneringens delar och förrådets delar. Text med en rostfärgad
 * linje under den aktiva fliken, på en tunn linje över hela raden. I mobil går raden att svepa och skrollas fram till
 * den aktiva fliken.
 */
export function Flikrad({
  etikett,
  flikar,
  aktiv,
  lank,
}: {
  etikett: string
  flikar: readonly Flik[]
  aktiv: string | null
  /** Det som följer med varje länk, till exempel replace och state. */
  lank?: Pick<LinkProps, 'replace' | 'state'>
}) {
  const rad = useAktivFlikSynlig<HTMLElement>(aktiv)
  return (
    // relative: de dolda texterna för skärmläsare är absolut placerade och ska klippas av raden, inte göra sidan bredare.
    <nav
      ref={rad}
      aria-label={etikett}
      className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0"
    >
      {/* Linjen ligger på listan och fliken lägger sin linje över den, så att inget sticker ut under raden som skrollar. */}
      <ul className="flex w-max min-w-full gap-2 border-b border-border md:w-auto md:flex-wrap md:gap-x-3">
        {flikar.map((f) => (
          <li key={f.nyckel} className="-mb-px shrink-0">
            {f.till ? (
              <Link
                to={f.till}
                {...lank}
                aria-current={aktiv === f.nyckel ? 'page' : undefined}
                className={cn(
                  bas,
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  aktiv === f.nyckel ? 'border-accent font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Innehall flik={f} />
                {f.kommerSnart && <span className="sr-only"> (kommer snart)</span>}
              </Link>
            ) : (
              // En del som inte finns än. Ingen länk, eftersom den inte går att öppna.
              <span className={cn(bas, 'border-transparent text-muted-foreground')}>
                <Innehall flik={f} />
                <Snart />
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

const bas =
  'flex min-h-12 min-w-11 items-center justify-center gap-2 border-b-2 px-2 text-[0.9375rem] whitespace-nowrap transition-colors'

function Innehall({ flik }: { flik: Flik }): ReactNode {
  return (
    <>
      {flik.namn}
      {flik.antal !== undefined && <FlikAntal antal={flik.antal} />}
    </>
  )
}
