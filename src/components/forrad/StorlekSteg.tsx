import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { konEtikett, storlekarFor, viktlage, viktlageText, viktstorlek } from '@/lib/kladstorlek'
import { produktnamn } from '@/lib/produktsok'
import type { Produkt } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Steget innan ett klädesplagg läggs i förrådet: välj din storlek och se om tillverkarens vikt gäller den.
 * Storleken är frivillig. Vikten är alltid katalogens, eftersom vikt per storlek nästan aldrig anges.
 */
export function StorlekSteg({
  produkt,
  sparar,
  onLaggTill,
  onTillbaka,
}: {
  produkt: Produkt
  sparar: boolean
  onLaggTill: (storlek: string | null) => void
  onTillbaka: () => void
}) {
  const kon = konEtikett(produkt.egenskaper)
  const viktFor = viktstorlek(produkt.egenskaper)
  const [vald, setVald] = useState<string | null>(null)
  const lage = viktlage(viktFor, vald)

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="font-heading text-xl font-semibold break-words">{produktnamn(produkt)}</h3>
        {kon && <p className="text-sm text-muted-foreground">{kon}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">
          Din storlek
        </legend>
        <div className="flex flex-wrap gap-2">
          {storlekarFor(viktFor, kon, produkt.underkategori).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={vald === s}
              onClick={() => setVald((v) => (v === s ? null : s))}
              className={cn(
                'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                vald === s ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-border bg-card hover:bg-muted',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>

      <div aria-live="polite" className="rounded-lg border border-border bg-muted/40 p-3">
        <p>
          <span className="font-heading text-lg font-semibold tabular-nums">{formateraVikt(produkt.packvikt_g)}</span>
          {viktFor && <span className="text-sm text-muted-foreground"> i storlek {viktFor}</span>}
        </p>
        <p className={cn('text-sm', lage.lage === 'samma' ? 'text-primary' : 'text-muted-foreground')}>
          {vald || lage.lage === 'okand' ? viktlageText(lage) : 'Välj din storlek för att se om vikten gäller den.'}
        </p>
        {vald && lage.lage !== 'samma' && (
          <p className="mt-1 text-sm text-muted-foreground">Vill du ha exakt vikt kan du väga plagget och ändra vikten i förrådet.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={sparar} onClick={() => onLaggTill(vald)}>
          {vald ? `Lägg till i storlek ${vald}` : 'Lägg till utan storlek'}
        </Button>
        <Button type="button" variant="outline" disabled={sparar} onClick={onTillbaka}>
          <ArrowLeft className="size-4" aria-hidden />
          Tillbaka
        </Button>
      </div>
    </div>
  )
}
