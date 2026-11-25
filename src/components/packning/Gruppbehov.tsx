import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sektion } from '@/components/ui/sektion'
import { dubblettSvar, dubblettText, type Dubblett, type Forslag } from '@/lib/packlista'
import type { PackradRad } from '@/lib/typer'

/**
 * Det gruppen behöver gemensamt: frågor om dubbletter, gemensamma saker som ingen tar med ännu och förslag på det
 * en grupp brukar behöva. Visas bara när något av det finns.
 */
export function Gruppbehov({
  dubbletter,
  utanBarare,
  forslag,
  namn,
  kanAndra,
  kanTaMed,
  sparar,
  onTaMed,
  onBehovs,
  onLaggTillForslag,
}: {
  dubbletter: readonly Dubblett[]
  utanBarare: readonly PackradRad[]
  forslag: readonly Forslag[]
  namn: ReadonlyMap<string, string>
  kanAndra: boolean
  /** Den inloggade är med i turen och kan ta på sig en gemensam sak. */
  kanTaMed: boolean
  sparar: boolean
  onTaMed: (rad: PackradRad) => void
  onBehovs: (d: Dubblett) => void
  onLaggTillForslag: (valda: Forslag[]) => void
}) {
  const [valda, setValda] = useState<Set<string>>(new Set())
  const visaForslag = kanAndra && forslag.length > 0
  if (dubbletter.length === 0 && utanBarare.length === 0 && !visaForslag) return null

  return (
    <Sektion rubrik="Det gruppen behöver">
      {dubbletter.map((d) => (
        <div key={d.sort} className="space-y-3 rounded-lg border border-accent/25 bg-accent-soft p-3">
          <p className="font-medium text-accent-strong">{dubblettText(d, namn)}</p>
          {kanAndra && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={sparar} onClick={() => onBehovs(d)}>
                {dubblettSvar(d)}
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {kanAndra ? 'Behövs bara en? Ta bort den andra raden.' : 'Behövs bara en? Be en ägare eller redigerare ta bort den andra raden.'}
          </p>
        </div>
      ))}

      {utanBarare.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Ingen tar med ännu</h3>
          <ul className="divide-y divide-border">
            {utanBarare.map((r) => (
              <li key={r.id} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="min-w-0 break-words">{r.namn}</span>
                {kanTaMed && (
                  <Button variant="ghost" className="px-3 text-primary" disabled={sparar} onClick={() => onTaMed(r)}>
                    Jag tar med den
                    <span className="sr-only">: {r.namn}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {visaForslag && (
        <fieldset className="space-y-2">
          <legend className="text-base font-semibold">Det här brukar en grupp behöva</legend>
          <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {forslag.map((f) => (
              <li key={f.namn}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={valda.has(f.namn)}
                    onChange={(e) =>
                      setValda((v) => {
                        const ny = new Set(v)
                        if (e.target.checked) ny.add(f.namn)
                        else ny.delete(f.namn)
                        return ny
                      })
                    }
                    className="size-5 shrink-0 accent-primary"
                  />
                  {f.namn}
                </label>
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            className="text-primary"
            disabled={valda.size === 0 || sparar}
            onClick={() => {
              onLaggTillForslag(forslag.filter((f) => valda.has(f.namn)))
              setValda(new Set())
            }}
          >
            <Plus className="size-4" aria-hidden />
            Lägg till i listan
          </Button>
        </fieldset>
      )}
    </Sektion>
  )
}
