import { Plus } from 'lucide-react'
import { formateraVikt, type FyraTunga, type TungRad, type Uppmaning } from '@/lib/forrad'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Grunden, enligt skissen Forrad-dator: de fyra tunga (ryggsäck, tält, sovsäck och liggunderlag) som fyra rutor med
 * sak och vikt. En tom ruta är streckad och säger Saknas, med en knapp för att lägga till. Har saken ingen vikt
 * finns en knapp för att fylla i den. Den lättaste saken med vikt i varje grupp räknas.
 */
export function Grunden({ tunga, onUppmaning, className }: { tunga: FyraTunga; onUppmaning: (u: Uppmaning) => void; className?: string }) {
  return (
    <section aria-labelledby="grunden-rubrik" className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="grunden-rubrik" className="text-xl">
          Grunden
        </h2>
        <p className="text-sm text-muted-foreground">
          De fyra tunga{tunga.varde && <>: <span className="font-semibold text-foreground">{tunga.varde}</span></>}, {tunga.medVikt} av 4 på plats
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tunga.grupper.map((g) => (
          <li key={g.grupp} className="min-w-0">
            <Ruta rad={g} onUppmaning={onUppmaning} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Ruta({ rad, onUppmaning }: { rad: TungRad; onUppmaning: (u: Uppmaning) => void }) {
  if (rad.sak) {
    return (
      <div className="flex h-full min-h-28 flex-col rounded-lg border border-border bg-card p-3.5 sm:p-4">
        <p className="text-xs font-semibold text-muted-foreground">{rad.namn}</p>
        <p className="mt-0.5 text-sm font-medium break-words">{rad.sak.namn}</p>
        <p className="mt-auto pt-2 font-heading text-xl font-bold tabular-nums">{formateraVikt(rad.sak.viktG)}</p>
      </div>
    )
  }
  const u = rad.uppmaning
  // En tom ruta är en knapp i sin helhet, så att hela ytan går att trycka på.
  return (
    <button
      type="button"
      disabled={!u}
      onClick={() => u && onUppmaning(u)}
      className={cn(
        'flex h-full min-h-28 w-full flex-col rounded-lg border-2 border-dashed border-muted-foreground/40 p-3.5 text-left transition-colors hover:border-primary hover:bg-card sm:p-4',
        fokus,
      )}
    >
      <span className="text-xs font-semibold text-muted-foreground">{rad.namn}</span>
      <span className="mt-0.5 text-sm break-words text-muted-foreground">{rad.utanVikt ? `${rad.utanVikt}, vikt saknas` : 'Saknas'}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-accent-strong">
        {u?.gor === 'laggTill' && <Plus className="size-4" aria-hidden />}
        {u?.gor === 'laggTill' ? 'Lägg till' : 'Fyll i vikt'}
        <span className="sr-only">: {u?.text}</span>
      </span>
    </button>
  )
}
