import { Plus, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formateraVikt } from '@/lib/forrad'
import { formateraKcal, MAX_RATTNAMN, naringForRader, tolkaRattformular, type Ingrediensfalt, type TolkadIngrediens } from '@/lib/mat'
import type { Vara } from '@/lib/typer'

const TOM_RAD: Ingrediensfalt = { vara: '', gram: '', kcal: '', protein: '' }

/** Fälten för en vara som redan finns i turen, så att kcal och protein fylls i när man väljer den. */
function faltForVara(vara: Vara, gram = ''): Ingrediensfalt {
  return {
    vara: vara.namn,
    gram,
    kcal: vara.kcal_per_100g?.toString() ?? '',
    protein: vara.protein_per_100g?.toString().replace('.', ',') ?? '',
  }
}

/**
 * Formuläret för en egen rätt: namn och ingredienser med gram per portion, kcal och protein per 100 g.
 * Visar energin och vikten per portion medan man skriver. Varor som redan finns i turen föreslås.
 */
export function EgenRattFormular({
  ny,
  forsta,
  varor,
  onSpara,
  onAvbryt,
  onTaBort,
}: {
  /** En ny rätt läggs i måltiden när den sparas. */
  ny: boolean
  forsta?: { namn: string; rader: { vara: Vara; gram: number }[] }
  varor: readonly Vara[]
  onSpara: (namn: string, rader: TolkadIngrediens[]) => Promise<boolean>
  onAvbryt: () => void
  /** Finns när en befintlig rätt ändras. Tar bort rätten ur turen. */
  onTaBort?: () => Promise<boolean>
}) {
  const id = useId()
  const [namn, setNamn] = useState(forsta?.namn ?? '')
  const [falt, setFalt] = useState<Ingrediensfalt[]>(() =>
    forsta?.rader.length ? forsta.rader.map((r) => faltForVara(r.vara, String(r.gram))) : [{ ...TOM_RAD }],
  )
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  // Borttagningen kräver två tryck: först frågar knappen, sedan tar den bort.
  const [sakerPa, setSakerPa] = useState(false)

  async function taBort() {
    if (!onTaBort) return
    if (!sakerPa) return setSakerPa(true)
    setFel(null)
    setSparar(true)
    const ok = await onTaBort()
    setSparar(false)
    if (!ok) setFel('Det gick inte att radera rätten. Kontrollera uppkopplingen och försök igen.')
  }

  const tolkat = tolkaRattformular(namn || 'namn', falt)
  const portion = tolkat.ok ? naringForRader(tolkat.rader) : null

  function andra(i: number, del: Partial<Ingrediensfalt>) {
    setFalt((f) =>
      f.map((rad, j) => {
        if (j !== i) return rad
        const ny = { ...rad, ...del }
        // Väljer man en vara som finns i turen fylls kcal och protein i, om de är tomma.
        const finns = del.vara !== undefined ? varor.find((v) => v.namn.toLowerCase() === del.vara!.trim().toLowerCase()) : undefined
        if (finns) {
          const kand = faltForVara(finns)
          return { ...ny, kcal: ny.kcal || kand.kcal, protein: ny.protein || kand.protein }
        }
        return ny
      }),
    )
  }

  async function spara(e: FormEvent) {
    e.preventDefault()
    const svar = tolkaRattformular(namn, falt)
    if (!svar.ok) return setFel(svar.fel)
    setFel(null)
    setSparar(true)
    const ok = await onSpara(svar.namn, svar.rader)
    setSparar(false)
    if (!ok) setFel('Det gick inte att spara rätten. Kontrollera uppkopplingen och att ingen annan rätt i turen heter likadant. Försök sedan igen.')
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-namn`} className="text-sm font-medium">
          Rättens namn
        </label>
        <Input id={`${id}-namn`} data-autofokus value={namn} maxLength={MAX_RATTNAMN} onChange={(e) => setNamn(e.target.value)} placeholder="Till exempel Gröt med russin" />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Ingredienser per portion</legend>
        <datalist id={`${id}-varor`}>
          {varor.map((v) => (
            <option key={v.id} value={v.namn} />
          ))}
        </datalist>
        {falt.map((rad, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`${id}-vara-${i}`} className="text-sm font-medium">
                  Ingrediens {i + 1}
                </label>
                <Input id={`${id}-vara-${i}`} list={`${id}-varor`} value={rad.vara} onChange={(e) => andra(i, { vara: e.target.value })} />
              </div>
              {falt.length > 1 && (
                <Button type="button" variant="ghost" size="ikon" aria-label={`Ta bort ingrediens ${i + 1}`} onClick={() => setFalt((f) => f.filter((_, j) => j !== i))}>
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ['gram', 'Gram'],
                  ['kcal', 'Kcal per 100 g'],
                  ['protein', 'Protein per 100 g'],
                ] as const
              ).map(([nyckel, etikett]) => (
                <div key={nyckel} className="min-w-0 space-y-1">
                  <label htmlFor={`${id}-${nyckel}-${i}`} className="block text-xs leading-tight text-muted-foreground">
                    {etikett}
                  </label>
                  <Input id={`${id}-${nyckel}-${i}`} inputMode="decimal" className="px-3 tabular-nums" value={rad[nyckel]} onChange={(e) => andra(i, { [nyckel]: e.target.value })} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setFalt((f) => [...f, { ...TOM_RAD }])}>
          <Plus className="size-4" aria-hidden />
          Lägg till ingrediens
        </Button>
      </fieldset>

      <p aria-live="polite" className="text-sm tabular-nums">
        {portion && (
          <>
            Per portion: {formateraKcal(portion.kcal)}, {Math.round(portion.proteinG)} g protein och {formateraVikt(portion.gram)}.
            {portion.ofullstandig && <span className="text-muted-foreground"> Några varor saknar kcal eller protein.</span>}
          </>
        )}
      </p>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Sparar …' : ny ? 'Spara och lägg till i måltiden' : 'Spara ändringarna'}
        </Button>
        <Button type="button" variant="outline" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>

      {onTaBort && (
        <div className="space-y-2 border-t border-border pt-4">
          {sakerPa && (
            <p className="text-sm">
              Rätten raderas och tas bort ur alla måltider i turen. Varor som bara den använde raderas också. Det går inte att få tillbaka.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="text-destructive" disabled={sparar} onClick={taBort}>
              {sakerPa ? 'Ja, radera rätten' : 'Radera rätten'}
            </Button>
            {sakerPa && (
              <Button type="button" variant="outline" disabled={sparar} onClick={() => setSakerPa(false)}>
                Nej, behåll rätten
              </Button>
            )}
          </div>
        </div>
      )}
    </form>
  )
}
