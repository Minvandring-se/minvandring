import { useId, useState } from 'react'
import { Initial } from '@/components/mat/Initial'
import type { Person } from '@/components/mat/RadPanel'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { platserText, type Barrad } from '@/lib/mat'

/**
 * Vem tar med vad, per person: det som ingen bär överst i en kompakt lista, med Jag tar den och Fördela, och sedan
 * varje person med sin färg, sin matvikt och det hen bär. Alla som är med i turen, även läsare, kan ta en rätt
 * själva och släppa det de bär. Fördela är för ägare och redigerare.
 */
export function VemTarMedVad({
  rader,
  personer,
  farger,
  vikter,
  mittDeltagareId,
  kanAndra,
  onTa,
  onSlapp,
  onFordela,
}: {
  rader: readonly Barrad[]
  personer: readonly Person[]
  farger: ReadonlyMap<string, string>
  /** Matvikten varje deltagare bär, i gram. */
  vikter: ReadonlyMap<string, number>
  mittDeltagareId: string | null
  kanAndra: boolean
  onTa: (rad: Barrad) => Promise<boolean>
  onSlapp: (rad: Barrad) => Promise<boolean>
  /** Delar ut det som ingen bär så att vikten blir jämn. */
  onFordela: () => Promise<boolean>
}) {
  const id = useId()
  const [sparar, setSparar] = useState<string | null>(null)
  const [fel, setFel] = useState(false)
  const saknar = rader.filter((r) => r.barsAv === null)
  const barare = [...personer.map((p) => p.id), ...new Set(rader.map((r) => r.barsAv).filter((b): b is string => !!b && !personer.some((p) => p.id === b)))]
  const namnFor = (deltagareId: string) => personer.find((p) => p.id === deltagareId)?.namn ?? 'Inte längre med i turen'

  async function gor(nyckel: string, fn: () => Promise<boolean>) {
    setSparar(nyckel)
    setFel(!(await fn()))
    setSparar(null)
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
            <div className="space-y-1 bg-accent-soft px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <h3 className="font-sans text-sm font-semibold text-accent-strong">Saknar ansvarig ({saknar.length})</h3>
                {kanAndra && personer.length > 0 && (
                  <Button variant="outline" disabled={sparar !== null} onClick={() => gor('fordela', onFordela)}>
                    {sparar === 'fordela' ? 'Fördelar …' : 'Fördela'}
                  </Button>
                )}
              </div>
              <ul className="divide-y divide-accent/20">
                {saknar.map((r) => (
                  <li key={r.nyckel} className="flex items-center justify-between gap-3 py-1">
                    <Rad rad={r} />
                    {mittDeltagareId && (
                      <Button
                        variant="ghost"
                        className="shrink-0 px-3 text-primary"
                        disabled={sparar !== null}
                        onClick={() => gor(r.nyckel, () => onTa(r))}
                        aria-label={`Jag tar den, ${r.namn}`}
                      >
                        {sparar === r.nyckel ? 'Sparar …' : 'Jag tar den'}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="divide-y divide-border">
            {barare.map((b) => {
              const egna = rader.filter((r) => r.barsAv === b)
              if (egna.length === 0) return null
              const namn = namnFor(b)
              const vikt = vikter.get(b) ?? 0
              return (
                <li key={b} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <Initial namn={namn} farg={farger.get(b)} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="flex flex-wrap items-baseline justify-between gap-x-3 font-sans text-base font-semibold break-words">
                      {b === mittDeltagareId ? `${namn} (du)` : namn}
                      {vikt > 0 && <span className="text-sm font-normal text-muted-foreground tabular-nums">{formateraVikt(vikt)}</span>}
                    </h3>
                    <ul className="space-y-1">
                      {egna.map((r) => (
                        <li key={r.nyckel} className="flex items-center justify-between gap-3">
                          <Rad rad={r} />
                          {b === mittDeltagareId && (
                            <Button
                              variant="ghost"
                              className="shrink-0 px-3 text-muted-foreground"
                              disabled={sparar !== null}
                              onClick={() => gor(r.nyckel, () => onSlapp(r))}
                              aria-label={`Släpp ${r.namn}`}
                            >
                              {sparar === r.nyckel ? 'Sparar …' : 'Släpp'}
                            </Button>
                          )}
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

/** En rätt och dess måltider på en rad: "Pudding · mellanmål dag 3 (6 st)". */
function Rad({ rad }: { rad: Barrad }) {
  return (
    <span className="min-w-0 text-sm">
      <span className="font-medium wrap-anywhere">{rad.namn}</span>
      <span className="text-muted-foreground"> · {platserText(rad.platser).charAt(0).toLowerCase() + platserText(rad.platser).slice(1)}</span>
    </span>
  )
}
