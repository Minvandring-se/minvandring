import { Plus } from 'lucide-react'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt, type FyraTunga as FyraTungaData, type Uppmaning } from '@/lib/forrad'
import { cn } from '@/lib/utils'

/**
 * Sammanfattningen av de fyra tunga: ryggsäck, tält, sovsäck och liggunderlag. Summan står stort, och under den en rad
 * per grupp med saken som räknas eller en knapp för det som saknas. På dator ligger den kvar bredvid listan när man scrollar.
 */
export function FyraTunga({ tunga, onUppmaning, className }: { tunga: FyraTungaData; onUppmaning: (u: Uppmaning) => void; className?: string }) {
  return (
    <Sektion rubrik="De fyra tunga" className={className}>
      <div>
        <p className="font-heading text-3xl font-bold tracking-tight">{tunga.varde ?? 'Ingen vikt än'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {tunga.komplett
            ? 'Ryggsäck, tält, sovsäck och liggunderlag. Den lättaste i varje grupp räknas.'
            : `${tunga.medVikt} av 4 har vikt. Lägg till eller fyll i vikt för resten, så blir summan hel.`}
        </p>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {tunga.grupper.map((g) => (
          <li key={g.grupp} className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{g.namn}</span>
              {(g.sak ?? g.utanVikt) && <span className="block text-sm break-words text-muted-foreground">{g.sak?.namn ?? g.utanVikt}</span>}
            </span>
            {g.sak ? (
              <span className="text-sm font-semibold tabular-nums">{formateraVikt(g.sak.viktG)}</span>
            ) : (
              g.uppmaning && (
                <button
                  type="button"
                  onClick={() => onUppmaning(g.uppmaning!)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-md text-left text-sm font-medium text-accent-strong underline underline-offset-4',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  {g.uppmaning.gor === 'laggTill' && <Plus className="size-4 shrink-0" aria-hidden />}
                  {g.uppmaning.text}
                </button>
              )
            )}
          </li>
        ))}
      </ul>
    </Sektion>
  )
}
