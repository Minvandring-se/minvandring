import { Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Skelett } from '@/components/app/Laddar'
import { delaUppTurer, kortNedrakning, lokaltDatum, type TurIListan } from '@/lib/turlista'
import { cn } from '@/lib/utils'

/** Hur många kommande turer sidomenyn visar. Resten finns på Mina turer. */
const MAX = 5

/**
 * Sidomenyns lista över kommande turer, med dagar kvar. Nästa tur har en rostfärgad prick, de andra en grön.
 * Turen man har öppen är markerad. Sist en länk för att skapa en ny tur.
 */
export function DinaTurer({ turer, oppenTurId }: { turer: TurIListan[] | null; oppenTurId: string | null }) {
  const idag = lokaltDatum()
  const { nasta, kommande } = delaUppTurer(turer ?? [], idag)
  const lista = [nasta, ...kommande].filter((t): t is TurIListan => t !== null).slice(0, MAX)
  const radKlass =
    'flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return (
    <nav aria-labelledby="dina-turer-rubrik" className="space-y-1">
      <h2 id="dina-turer-rubrik" className="px-3 pb-1 font-sans text-xs font-semibold text-muted-foreground">
        Dina turer
      </h2>
      {turer === null ? (
        <div className="space-y-2 px-3 py-1" aria-hidden>
          <Skelett className="h-4 w-36" />
          <Skelett className="h-4 w-28" />
        </div>
      ) : (
        <ul className="space-y-1">
          {lista.map((tur) => {
            const oppen = tur.id === oppenTurId
            return (
              <li key={tur.id}>
                <Link
                  to={`/tur/${tur.id}`}
                  aria-current={oppen ? 'page' : undefined}
                  className={cn(radKlass, 'border', oppen ? 'border-border bg-background font-semibold' : 'border-transparent text-foreground hover:bg-muted')}
                >
                  <span aria-hidden className={cn('size-2 shrink-0 rounded-full', tur === nasta ? 'bg-accent' : 'bg-illustration/60')} />
                  {tur === nasta && <span className="sr-only">Nästa tur:</span>}
                  <span className="min-w-0 flex-1 truncate">{tur.namn}</span>
                  <span className="shrink-0 text-xs font-normal text-muted-foreground">{kortNedrakning(tur, idag)}</span>
                </Link>
              </li>
            )
          })}
          <li>
            <Link to="/turer?ny=1" className={cn(radKlass, 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <Plus className="size-4 shrink-0" aria-hidden />
              Ny tur
            </Link>
          </li>
        </ul>
      )}
    </nav>
  )
}
