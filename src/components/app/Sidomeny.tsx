import { Link } from 'react-router'
import { DinaTurer } from '@/components/app/DinaTurer'
import { Skelett } from '@/components/app/Laddar'
import { MENYIKON } from '@/components/app/menyIkoner'
import { Namnbricka } from '@/components/app/Namnbricka'
import { Logotyp } from '@/components/Logotyp'
import { Sidfot } from '@/components/Sidfot'
import { Snart } from '@/components/ui/snart'
import { MENYGRUPPER, SIDOR, type Sida } from '@/lib/meny'
import type { TurIListan } from '@/lib/turlista'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** En rad i sidomenyn: ikon, namn och "Snart" för sidor som inte är byggda. Aktiv sida får en rostfärgad markering. */
function Menyrad({ sida, aktiv }: { sida: Sida; aktiv: boolean }) {
  const { namn, till, byggd } = SIDOR[sida]
  const Ikon = MENYIKON[sida]
  return (
    <Link
      to={till}
      aria-current={aktiv ? 'page' : undefined}
      className={cn(
        'relative flex min-h-11 items-center gap-3 rounded-md px-3 py-1.5 text-[0.9375rem] transition-colors',
        fokus,
        aktiv ? 'bg-primary-soft font-semibold text-primary' : 'text-foreground hover:bg-muted',
      )}
    >
      {aktiv && <span aria-hidden className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent" />}
      <Ikon className="size-5 shrink-0" aria-hidden strokeWidth={aktiv ? 2.25 : 1.75} />
      <span className="min-w-0 flex-1">{namn}</span>
      {!byggd && <Snart />}
    </Link>
  )
}

/**
 * Sidomenyn på dator, enligt skissen Sidomeny-dator: logotypen, grupperna Planera, Utrustning, Minnen och Folk,
 * listan Dina turer, och längst ner användaren (Profil), Inställningar och sidfoten. Ligger kvar när man scrollar.
 */
export function Sidomeny({
  aktiv,
  turer,
  oppenTurId,
  namn,
  epost,
  bild,
  bildLaddar,
  profilHamtad,
}: {
  aktiv: Sida | null
  turer: TurIListan[] | null
  oppenTurId: string | null
  namn: string
  epost: string
  bild: string | undefined
  bildLaddar: boolean
  profilHamtad: boolean
}) {
  return (
    <aside className="hidden border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:overflow-y-auto">
      <div className="flex flex-1 flex-col px-4 pt-6 pb-4">
        <Link to="/turer" className={cn('flex min-h-11 items-center rounded-md px-2', fokus)}>
          <Logotyp className="text-xl" />
        </Link>
        <nav aria-label="Huvudmeny" className="mt-2">
          {MENYGRUPPER.map((g) => (
            <div key={g.rubrik}>
              <h2 className="px-3 pt-4 pb-1 font-sans text-xs font-semibold text-muted-foreground">{g.rubrik}</h2>
              <ul className="space-y-0.5">
                {g.sidor.map((s) => (
                  <li key={s}>
                    <Menyrad sida={s} aktiv={aktiv === s} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <DinaTurer turer={turer} oppenTurId={oppenTurId} />
      </div>

      <div className="space-y-0.5 border-t border-border px-4 pt-3 pb-3">
        <Link
          to="/profil"
          aria-current={aktiv === 'profil' ? 'page' : undefined}
          className={cn('flex min-h-12 items-center gap-3 rounded-md px-2 transition-colors', fokus, aktiv === 'profil' ? 'bg-primary-soft text-primary' : 'hover:bg-muted')}
        >
          <Namnbricka namn={namn || epost || '?'} bild={bild} laddar={bildLaddar} />
          {profilHamtad ? (
            <span className="min-w-0 flex-1 truncate font-medium">{namn || 'Din profil'}</span>
          ) : (
            <>
              <Skelett className="h-4 w-24" />
              <span className="sr-only">Din profil</span>
            </>
          )}
        </Link>
        <Menyrad sida="installningar" aktiv={aktiv === 'installningar'} />
        <Sidfot variant="meny" className="px-3 pt-1 text-xs" />
      </div>
    </aside>
  )
}
