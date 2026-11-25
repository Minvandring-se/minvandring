import { useId } from 'react'
import { Select } from '@/components/ui/select'
import { MANADER, tillatnaAr } from '@/lib/skafferi'

/**
 * Bäst före som månad och år, i två väljare. Båda tomma betyder inget datum. Felet visas vid fältet och kopplas till
 * väljarna, så att skärmläsare läser det.
 */
export function BastForeVal({
  manad,
  ar,
  idag,
  fel,
  onAndra,
}: {
  manad: string
  ar: string
  idag: string
  fel: string | null
  onAndra: (manad: string, ar: string) => void
}) {
  const id = useId()
  const arLista = tillatnaAr(idag)
  // Ett sparat år utanför listan (till exempel ett gammalt datum) visas ändå, så att det går att se och ändra.
  const visadeAr = ar && !arLista.includes(Number(ar)) ? [Number(ar), ...arLista] : arLista
  return (
    <fieldset className="space-y-1" aria-describedby={fel ? `${id}-fel` : undefined}>
      <legend className="text-sm font-medium">Bäst före (frivilligt)</legend>
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0 space-y-1">
          <label htmlFor={`${id}-manad`} className="block text-xs text-muted-foreground">
            Månad
          </label>
          <Select id={`${id}-manad`} value={manad} aria-invalid={!!fel} onChange={(e) => onAndra(e.target.value, ar)}>
            <option value="">Ingen</option>
            {MANADER.map((m, i) => (
              <option key={m} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 space-y-1">
          <label htmlFor={`${id}-ar`} className="block text-xs text-muted-foreground">
            År
          </label>
          <Select id={`${id}-ar`} value={ar} aria-invalid={!!fel} onChange={(e) => onAndra(manad, e.target.value)}>
            <option value="">Inget</option>
            {visadeAr.map((a) => (
              <option key={a} value={String(a)}>
                {a}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {fel && (
        <p id={`${id}-fel`} className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </fieldset>
  )
}
