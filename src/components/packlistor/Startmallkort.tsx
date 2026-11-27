import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { sakerText } from '@/lib/packmallar'
import { antalSaker, type Startmall } from '@/lib/startmallar'

/** En av MinVandrings startmallar som kort: namn, beskrivning och antal saker. Ett tryck öppnar den. */
export function Startmallkort({ mall }: { mall: Startmall }) {
  return (
    <li>
      <Link
        to={`/packlistor/minvandring/${mall.id}`}
        className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-xl font-semibold break-words">{mall.namn}</span>
          <span className="block text-sm text-muted-foreground">{mall.beskrivning}</span>
          <span className="mt-1 block text-sm">{sakerText(antalSaker(mall))}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}
