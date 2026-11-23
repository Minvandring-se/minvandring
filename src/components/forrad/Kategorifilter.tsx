import { useId } from 'react'
import { Select } from '@/components/ui/select'
import type { Filterval } from '@/lib/forrad'
import { cn } from '@/lib/utils'

function text(val: Filterval): string {
  return val.antal === undefined ? val.etikett : `${val.etikett} (${val.antal})`
}

/**
 * Två listor för att filtrera på huvudkategori och underkategori. Underkategorin går att välja först när en
 * kategori är vald, och den går tillbaka till Alla när kategorin byts. Alternativen räknas ut av sidan.
 */
export function Kategorifilter({
  kategorier,
  underkategorier,
  kategori,
  underkategori,
  onAndra,
  className,
}: {
  kategorier: readonly Filterval[]
  /** Den valda kategorins underkategorier. */
  underkategorier: readonly Filterval[]
  kategori: string
  underkategori: string
  onAndra: (kategori: string, underkategori: string) => void
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      <div className="min-w-0 space-y-1">
        <label htmlFor={`${id}-kategori`} className="block text-sm font-medium">
          Kategori
        </label>
        <Select id={`${id}-kategori`} value={kategori} onChange={(e) => onAndra(e.target.value, '')}>
          <option value="">Alla</option>
          {kategorier.map((k) => (
            <option key={k.nyckel} value={k.nyckel}>
              {text(k)}
            </option>
          ))}
        </Select>
      </div>
      <div className="min-w-0 space-y-1">
        <label htmlFor={`${id}-under`} className="block text-sm font-medium">
          Underkategori
        </label>
        <Select
          id={`${id}-under`}
          value={underkategori}
          disabled={!kategori}
          onChange={(e) => onAndra(kategori, e.target.value)}
          className="disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <option value="">Alla</option>
          {underkategorier.map((u) => (
            <option key={u.nyckel} value={u.nyckel}>
              {text(u)}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
