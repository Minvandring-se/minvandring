import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formateraVikt } from '@/lib/forrad'
import { sakerText, sammanfatta, type Packmall } from '@/lib/packmallar'

/** En egen packlista som kort: namn, var den kom ifrån, antal saker och basvikt. Ett tryck öppnar den. */
export function Mallkort({ mall }: { mall: Packmall }) {
  const s = sammanfatta(mall.packmallrader)
  const detaljer = [sakerText(s.saker), s.basvikt_g > 0 ? `basvikt ${formateraVikt(s.basvikt_g)}` : null, s.gemensamt_g > 0 ? `gemensamt ${formateraVikt(s.gemensamt_g)}` : null]
  return (
    <li>
      <Link
        to={`/packlistor/${mall.id}`}
        className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card p-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-xl font-semibold break-words">{mall.namn}</span>
          {mall.fran_tur_namn && <span className="block text-sm break-words text-muted-foreground">Från {mall.fran_tur_namn}</span>}
          <span className="mt-1 block text-sm">{detaljer.filter(Boolean).join(', ')}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  )
}
