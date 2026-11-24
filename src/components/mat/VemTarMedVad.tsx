import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { platsText, type Ansvarsratt } from '@/lib/mat'
import type { DeltagareRad } from '@/lib/typer'

/**
 * Vem tar med vad: rätterna som saknar ansvarig överst, med Jag tar den, och sedan varje person med sina rätter.
 * Bygger på samma ansvariga som inköpslistan. Läsare ser listan men kan inte ta något.
 */
export function VemTarMedVad({
  rader,
  deltagare,
  mittDeltagareId,
  kanAndra,
  onTa,
}: {
  rader: readonly Ansvarsratt[]
  deltagare: readonly DeltagareRad[]
  mittDeltagareId: string | null
  kanAndra: boolean
  onTa: (ratt: Ansvarsratt) => Promise<boolean>
}) {
  const id = useId()
  const [tar, setTar] = useState<string | null>(null)
  const [fel, setFel] = useState(false)
  const saknar = rader.filter((r) => r.saknarAnsvarig)
  const ansvariga = [...new Set(rader.flatMap((r) => r.ansvariga))]
  const ordning = deltagare.map((d) => d.id)
  ansvariga.sort((a, b) => (ordning.indexOf(a) === -1 ? 999 : ordning.indexOf(a)) - (ordning.indexOf(b) === -1 ? 999 : ordning.indexOf(b)))
  const namnFor = (deltagareId: string) => deltagare.find((d) => d.id === deltagareId)?.namn ?? 'Inte längre med i turen'

  async function ta(r: Ansvarsratt) {
    setTar(r.rattId)
    setFel(!(await onTa(r)))
    setTar(null)
  }

  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-xl lg:text-2xl">
        Vem tar med vad
      </h2>
      {rader.length === 0 ? (
        <p className="rounded-ruta border border-dashed border-border p-4 text-sm text-muted-foreground">När ni har lagt rätter i planen syns här vem som tar med vad.</p>
      ) : (
        <div className="overflow-hidden rounded-ruta border border-border bg-card">
          {fel && (
            <p role="alert" className="px-4 pt-3 text-sm text-destructive sm:px-5">
              Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
          {saknar.length > 0 && (
            <div className="space-y-2 bg-accent-soft px-4 py-3 sm:px-5">
              <h3 className="font-sans text-sm font-semibold text-accent-strong">Saknar ansvarig</h3>
              <ul className="divide-y divide-accent/20">
                {saknar.map((r) => (
                  <li key={r.rattId} className="flex items-center justify-between gap-3 py-2">
                    <Ratt ratt={r} />
                    {kanAndra && mittDeltagareId && (
                      <Button variant="outline" className="shrink-0" disabled={tar !== null} onClick={() => ta(r)} aria-label={`Jag tar den, ${r.namn}`}>
                        {tar === r.rattId ? 'Sparar …' : 'Jag tar den'}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="divide-y divide-border">
            {ansvariga.map((a) => {
              const namn = namnFor(a)
              return (
                <li key={a} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary">
                    {namn.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="font-sans text-base font-semibold break-words">{a === mittDeltagareId ? `${namn} (du)` : namn}</h3>
                    <ul className="space-y-1">
                      {rader
                        .filter((r) => r.ansvariga.includes(a))
                        .map((r) => (
                          <li key={r.rattId}>
                            <Ratt ratt={r} />
                          </li>
                        ))}
                    </ul>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="border-t border-border px-4 py-1 sm:px-5">
            <a href="#inkopslista" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              Till inköpslistan
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

function Ratt({ ratt }: { ratt: Ansvarsratt }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="font-medium wrap-anywhere">{ratt.namn}</span>
      <span className="text-sm text-muted-foreground">{ratt.platser.map((p, i) => (i === 0 ? platsText(p) : platsText(p).toLowerCase())).join(', ')}</span>
    </span>
  )
}
