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
 * Flikar som byter del av en sida: turens delar, Matplaneringens delar och förrådets delar. I mobil runda knappar i en
 * rad som går att svepa, skrollad fram till den aktiva fliken. På dator flikar med en rostfärgad linje under den aktiva.
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
      className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:border-b md:border-border md:px-0"
    >
      <ul className="flex gap-2 py-1 md:-mb-px md:flex-wrap md:gap-1 md:py-0">
        {flikar.map((f) => (
          <li key={f.nyckel} className="shrink-0">
            {f.till ? (
              <Link
                to={f.till}
                {...lank}
                aria-current={aktiv === f.nyckel ? 'page' : undefined}
                className={cn(
                  bas,
                  // Fokusringen ligger utanför knappen i mobil, så att den syns även på den mörka aktiva fliken.
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:focus-visible:-outline-offset-2',
                  aktiv === f.nyckel
                    ? 'border-primary bg-primary font-semibold text-primary-foreground md:border-accent md:bg-transparent md:text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground md:border-transparent md:bg-transparent',
                )}
              >
                <Innehall flik={f} />
                {f.kommerSnart && <span className="sr-only"> (kommer snart)</span>}
              </Link>
            ) : (
              // En del som inte finns än. Ingen länk, eftersom den inte går att öppna.
              <span className={cn(bas, 'border-border bg-card text-muted-foreground md:border-transparent md:bg-transparent')}>
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
  'flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition-colors md:rounded-none md:border-0 md:border-b-[3px] md:px-3.5 md:text-[0.9375rem]'

function Innehall({ flik }: { flik: Flik }): ReactNode {
  return (
    <>
      {flik.namn}
      {flik.antal !== undefined && <FlikAntal antal={flik.antal} />}
    </>
  )
}
