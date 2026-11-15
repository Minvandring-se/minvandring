import { Link } from 'react-router'
import { Kontaktlank } from '@/components/Kontaktlank'
import { KONTAKT_MEJL } from '@/lib/kontakt'
import { cn } from '@/lib/utils'

const lank =
  'inline-flex min-h-11 items-center rounded-sm underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Sidfoten på alla sidor utom startsidan: kontakt, adressen i klartext och integritetspolicyn.
 * "rad" ligger längst ner på sidan, "meny" står staplad längst ner i sidomenyn på dator.
 */
export function Sidfot({ variant = 'rad', className }: { variant?: 'rad' | 'meny'; className?: string }) {
  return (
    <footer className={cn('text-sm text-muted-foreground', variant === 'rad' && 'border-t border-border pt-2', className)}>
      <ul className={cn(variant === 'rad' ? 'flex flex-wrap items-center justify-center gap-x-5' : 'flex flex-col items-start')}>
        {KONTAKT_MEJL && (
          <>
            <li>
              <Kontaktlank className={lank}>Kontakt och feedback</Kontaktlank>
            </li>
            {/* I klartext, så att adressen går att kopiera även utan mejlprogram. */}
            <li className="inline-flex min-h-11 items-center break-all select-all">{KONTAKT_MEJL}</li>
          </>
        )}
        <li>
          <Link to="/integritet" className={lank}>
            Integritetspolicy
          </Link>
        </li>
      </ul>
    </footer>
  )
}
