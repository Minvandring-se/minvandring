import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sökfältet, samma överallt: 56 px högt, text 17 px, ljus yta med mörk text i både ljust och mörkt läge, förstoringsglas
 * till vänster och en knapp som tömmer fältet. Fokus syns både på ljusa sidor (ring) och på den mörkgröna ytan i
 * Matkatalogen (hjortron). Etiketten syns, eller läses bara av skärmläsare med doldEtikett.
 */
export function SokFalt({
  etikett,
  doldEtikett = false,
  varde,
  onAndra,
  onKlar,
  placeholder,
  hjalp,
  autofokus = false,
  className,
}: {
  etikett: string
  doldEtikett?: boolean
  varde: string
  onAndra: (text: string) => void
  /** När man trycker Enter eller lämnar fältet, till exempel för att spara sökningen. */
  onKlar?: (text: string) => void
  placeholder?: string
  /** En kort hjälptext under fältet, som skärmläsare läser med fältet. */
  hjalp?: ReactNode
  /** Fältet får fokus när det visas, också i en dialog (data-autofokus). */
  autofokus?: boolean
  className?: string
}) {
  const id = useId()
  const falt = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autofokus) falt.current?.focus()
  }, [autofokus])

  function tangent(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onKlar?.(varde)
  }

  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className={doldEtikett ? 'sr-only' : 'block text-sm font-medium'}>
        {etikett}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-sokfalt-foreground" aria-hidden />
        <input
          ref={falt}
          id={id}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          maxLength={80}
          placeholder={placeholder}
          value={varde}
          data-autofokus={autofokus || undefined}
          aria-describedby={hjalp ? `${id}-hjalp` : undefined}
          onChange={(e) => onAndra(e.target.value)}
          onKeyDown={tangent}
          onBlur={() => onKlar?.(varde)}
          className={cn(
            'h-14 w-full rounded-ruta border border-sokfalt-foreground/25 bg-sokfalt pl-11 text-[17px] text-sokfalt-foreground shadow-soft placeholder:text-sokfalt-foreground/60',
            varde ? 'pr-12' : 'pr-3',
            '[&::-webkit-search-cancel-button]:appearance-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-hjortron',
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
            className="absolute top-1/2 right-1.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-sokfalt-foreground/70 hover:text-sokfalt-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden />
          </button>
        )}
      </div>
      {hjalp && (
        <p id={`${id}-hjalp`} className="text-sm text-muted-foreground">
          {hjalp}
        </p>
      )}
    </div>
  )
}
