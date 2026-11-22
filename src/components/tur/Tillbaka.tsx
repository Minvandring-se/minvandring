import { ChevronLeft } from 'lucide-react'
import type { MouseEvent, ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

/** Det som följer med i historiken när man öppnar en tur från listan, så att Tillbaka leder till samma plats i listan. */
export interface Ursprung {
  franLista?: boolean
}

/**
 * En länk tillbaka till Mina turer. Kom man från listan går den bakåt i historiken, så att man hamnar där man var.
 * Annars (ny tur, en delad adress) är den en vanlig länk.
 */
export function TillbakaLank({ className, children, ...rest }: { className?: string; children: ReactNode; 'aria-label'?: string }) {
  const navigate = useNavigate()
  const franLista = (useLocation().state as Ursprung | null)?.franLista === true
  return (
    <Link
      to="/turer"
      className={className}
      {...rest}
      onClick={(e: MouseEvent) => {
        if (!franLista || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(-1)
      }}
    >
      {children}
    </Link>
  )
}

/** Tillbaka till Mina turer som en textlänk, när turen inte går att visa. */
export function Tillbaka() {
  return (
    <TillbakaLank className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
      <ChevronLeft className="size-4" aria-hidden />
      Tillbaka till Mina turer
    </TillbakaLank>
  )
}
