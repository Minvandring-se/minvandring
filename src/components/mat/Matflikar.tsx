import { Link, useLocation } from 'react-router'
import { useAktivFlikSynlig } from '@/hooks/useAktivFlikSynlig'
import { aktivUndersida, UNDERSIDOR } from '@/lib/meny'
import { cn } from '@/lib/utils'

/**
 * Flikraden överst på Matplaneringens delar: Mina matplaner, Matkatalog, Recept, Skafferi och Tips. Samma utseende som turens
 * flikar: runda knappar i mobil, på dator flikar med en rostfärgad linje under den aktiva. I mobil skrollas raden fram
 * till den aktiva fliken.
 */
export function Matflikar() {
  const { pathname } = useLocation()
  const oppen = aktivUndersida(pathname)
  const rad = useAktivFlikSynlig<HTMLElement>(oppen)
  return (
    <nav ref={rad} aria-label="Matplanering" className="relative -mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:border-b md:border-border md:px-0">
      <ul className="flex gap-2 py-1 md:-mb-px md:flex-wrap md:gap-1 md:py-0">
        {UNDERSIDOR.matplanering!.map((u) => (
          <li key={u.till} className="shrink-0">
            <Link
              to={u.till}
              aria-current={oppen === u.till ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:focus-visible:-outline-offset-2',
                'md:rounded-none md:border-0 md:border-b-[3px] md:px-3.5 md:text-[0.9375rem]',
                oppen === u.till
                  ? 'border-primary bg-primary font-semibold text-primary-foreground md:border-accent md:bg-transparent md:text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground md:border-transparent md:bg-transparent',
              )}
            >
              {u.namn}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
