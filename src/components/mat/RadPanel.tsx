import { useId, useState } from 'react'
import { Initial } from '@/components/mat/Initial'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { cn } from '@/lib/utils'

// Raden får fokusringen när radioknappen eller kryssrutan i den har tangentbordsfokus.
const fokus = 'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring'

export interface Person {
  id: string
  namn: string
}

/**
 * Vem som bär en rätt i en måltid och vem som äter den. Gäller alla rader i gruppen, till exempel alla sex
 * puddingar. Alla ikryssade betyder att alla äter, och då sparas inga ätare.
 */
export function RadPanel({
  rubrik,
  undertext,
  personer,
  farger,
  barsAv,
  atare,
  onSpara,
  onStang,
}: {
  rubrik: string
  /** Till exempel "Lunch dag 1, 6 st". */
  undertext: string
  personer: readonly Person[]
  farger: ReadonlyMap<string, string>
  barsAv: string | null
  /** De som äter i dag. Tom: alla. */
  atare: readonly string[]
  onSpara: (barsAv: string | null, atare: string[]) => Promise<boolean>
  onStang: () => void
}) {
  const id = useId()
  const [barare, setBarare] = useState<string | null>(barsAv)
  const [ater, setAter] = useState<Set<string>>(() => new Set(atare.length > 0 ? atare : personer.map((p) => p.id)))
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  async function spara() {
    if (ater.size === 0) {
      setFel('Välj minst en som äter.')
      return
    }
    setSparar(true)
    setFel(null)
    const alla = personer.every((p) => ater.has(p.id))
    const ok = await onSpara(barare, alla ? [] : personer.filter((p) => ater.has(p.id)).map((p) => p.id))
    setSparar(false)
    if (ok) onStang()
    else setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
  }

  const val = (vald: boolean) =>
    cn('flex min-h-11 w-full items-center gap-3 rounded-knapp border px-3 py-1.5 text-left', fokus, vald ? 'border-primary bg-primary-soft font-semibold' : 'border-border bg-card hover:bg-muted')

  return (
    <Panel
      mitten
      etikett={`Vem bär och äter ${rubrik}`}
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          <h2 className="text-2xl break-words">{rubrik}</h2>
          <p className="text-sm text-muted-foreground">{undertext}</p>
        </div>
      }
      fot={
        <div className="space-y-2">
          {fel && (
            <p role="alert" className="text-sm text-destructive">
              {fel}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button disabled={sparar} onClick={spara}>
              {sparar ? 'Sparar …' : 'Spara'}
            </Button>
            <Button variant="outline" onClick={onStang}>
              Avbryt
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="mb-2 font-sans text-base font-semibold">Vem bär</legend>
          <label className={val(barare === null)}>
            <input type="radio" name={`${id}-bar`} checked={barare === null} onChange={() => setBarare(null)} className="size-5 accent-primary" />
            Ingen än
          </label>
          {personer.map((p) => (
            <label key={p.id} className={val(barare === p.id)}>
              <input type="radio" name={`${id}-bar`} checked={barare === p.id} onChange={() => setBarare(p.id)} className="size-5 accent-primary" />
              <Initial namn={p.namn} farg={farger.get(p.id)} className="size-7 text-sm" />
              <span className="min-w-0 break-words">{p.namn}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-1 font-sans text-base font-semibold">Vem äter</legend>
          <p className="mb-2 text-sm text-muted-foreground">Mängderna i inköpslistan räknas efter dem som äter.</p>
          {personer.map((p) => (
            <label key={p.id} className={val(ater.has(p.id))}>
              <input
                type="checkbox"
                checked={ater.has(p.id)}
                onChange={(e) =>
                  setAter((forut) => {
                    const ny = new Set(forut)
                    if (e.target.checked) ny.add(p.id)
                    else ny.delete(p.id)
                    return ny
                  })
                }
                className="size-5 accent-primary"
              />
              <span className="min-w-0 break-words">{p.namn}</span>
            </label>
          ))}
        </fieldset>
      </div>
    </Panel>
  )
}
