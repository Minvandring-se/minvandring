import { Search, X } from 'lucide-react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sökfältet: 56 px högt, text 17 px, förstoringsglas till vänster och en knapp som tömmer fältet. Tonen stark är för
 * den mörkgröna ytan (ljust fält med mörk text i båda lägena). Etiketten syns, eller läses bara av skärmläsare med
 * doldEtikett.
 */
export function SokFalt({
  etikett,
  doldEtikett = false,
  varde,
  onAndra,
  onKlar,
  placeholder,
  ton = 'vanlig',
  className,
}: {
  etikett: string
  doldEtikett?: boolean
  varde: string
  onAndra: (text: string) => void
  /** När man trycker Enter eller lämnar fältet, till exempel för att spara sökningen. */
  onKlar?: (text: string) => void
  placeholder?: string
  ton?: 'vanlig' | 'stark'
  className?: string
}) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)
  const stark = ton === 'stark'

  function tangent(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onKlar?.(varde)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className={doldEtikett ? 'sr-only' : 'block text-sm font-medium'}>
        {etikett}
      </label>
      <div className="relative">
        <Search className={cn('pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2', stark ? 'text-sokfalt-foreground' : 'text-muted-foreground')} aria-hidden />
        <input
          ref={falt}
          id={id}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={80}
          placeholder={placeholder}
          value={varde}
          onChange={(e) => onAndra(e.target.value)}
          onKeyDown={tangent}
          onBlur={() => onKlar?.(varde)}
          className={cn(
            'h-14 w-full rounded-ruta pl-11 text-[17px]',
            varde ? 'pr-12' : 'pr-3',
            '[&::-webkit-search-cancel-button]:appearance-none',
            'focus-visible:outline-3 focus-visible:outline-offset-2',
            stark
              ? 'bg-sokfalt text-sokfalt-foreground shadow-lyft placeholder:text-sokfalt-foreground/60 focus-visible:outline-hjortron'
              : 'border border-muted-foreground/70 bg-card focus-visible:border-ring focus-visible:outline-ring',
          )}
        />
        {varde && (
          <button
            type="button"
            aria-label="Töm sökfältet"
            onClick={() => {
              onAndra('')
              falt.current?.focus()
            }}
            className={cn(
              'absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring',
              stark ? 'text-sokfalt-foreground/70 hover:text-sokfalt-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
