import { Plus, X } from 'lucide-react'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { IngrediensSok } from '@/components/mat/IngrediensSok'
import { Input } from '@/components/ui/input'
import { formateraVikt } from '@/lib/forrad'
import { formateraKcal, MAX_RATTNAMN, naringForRader, orimligPortion, tolkaRattformular, type Ingrediensfalt, type TolkadIngrediens } from '@/lib/mat'
import { faltFranLivsmedel } from '@/lib/livsmedel'
import { raderTillFalt } from '@/lib/recept'
import type { Vara } from '@/lib/typer'

const TOM_RAD: Ingrediensfalt = { vara: '', gram: '', kcal: '', protein: '' }

/** En vara som föreslås, med kcal och protein som fylls i när man väljer den. */
type Forslag = Pick<Vara, 'namn' | 'kcal_per_100g' | 'protein_per_100g'>

/** Texterna som skiljer en rätt i en tur från ett eget recept. */
const TEXTER = {
  ratt: {
    namn: 'Rättens namn',
    nySpara: 'Spara och lägg till i måltiden',
    sparaFel: 'Det gick inte att spara rätten. Kontrollera uppkopplingen och att ingen annan rätt i turen heter likadant.',
    raderaFel: 'Det gick inte att ta bort rätten. Kontrollera uppkopplingen och försök igen.',
    raderaFraga: 'Rätten tas bort ur turen och ur alla måltider. Varor som bara den använde tas också bort. Det går inte att få tillbaka.',
    radera: 'Ta bort rätten',
    raderaJa: 'Ja, ta bort rätten',
    raderaNej: 'Nej, behåll rätten',
  },
  recept: {
    namn: 'Receptets namn',
    nySpara: 'Spara receptet',
    sparaFel: 'Det gick inte att spara receptet. Kontrollera uppkopplingen och att du inte redan har ett recept som heter likadant.',
    raderaFel: 'Det gick inte att ta bort receptet. Kontrollera uppkopplingen och försök igen.',
    raderaFraga: 'Receptet tas bort. Turer där det redan ligger påverkas inte. Det går inte att få tillbaka.',
    radera: 'Ta bort receptet',
    raderaJa: 'Ja, ta bort receptet',
    raderaNej: 'Nej, behåll receptet',
  },
} as const

/** Fälten för en vara som föreslås, så att kcal och protein fylls i när man väljer den. */
function faltForVara(vara: Forslag, gram = ''): Ingrediensfalt {
  return {
    vara: vara.namn,
    gram,
    kcal: vara.kcal_per_100g?.toString() ?? '',
    protein: vara.protein_per_100g?.toString().replace('.', ',') ?? '',
  }
}

/**
 * Formuläret för en egen rätt eller ett eget recept: namn och ingredienser med gram per portion, kcal och protein
 * per 100 g. Visar energin och vikten per portion medan man skriver. Varor som redan finns föreslås.
 * Formuläret ligger i en Panel: ram får fälten och knapparna, och knapparna läggs i panelens fot.
 */
export function EgenRattFormular({
  typ = 'ratt',
  ny,
  forsta,
  varor,
  onSpara,
  onAvbryt,
  onTaBort,
  ram,
}: {
  /** Lägger fälten i en panel och knapparna Spara och Avbryt i dess fot. */
  ram: (falt: ReactNode, knappar: ReactNode) => ReactNode
  typ?: 'ratt' | 'recept'
  /** En ny rätt läggs i måltiden när den sparas. Ett nytt recept sparas bara. */
  ny: boolean
  forsta?: { namn: string; rader: readonly TolkadIngrediens[] }
  /** Varor som föreslås: turens varor, eller varorna i ens recept. */
  varor: readonly Forslag[]
  onSpara: (namn: string, rader: TolkadIngrediens[]) => Promise<boolean>
  onAvbryt: () => void
  /** Finns när en befintlig rätt eller ett befintligt recept ändras. */
  onTaBort?: () => Promise<boolean>
}) {
  const id = useId()
  const t = TEXTER[typ]
  const [namn, setNamn] = useState(forsta?.namn ?? '')
  const [falt, setFalt] = useState<Ingrediensfalt[]>(() =>
    forsta?.rader.length ? raderTillFalt(forsta.rader) : [{ ...TOM_RAD }],
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
    if (!ok) setFel(t.raderaFel)
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
    if (!ok) setFel(t.sparaFel)
  }

  // Knapparna står i panelens fot, utanför formuläret, och hör till det med form-attributet.
  const knappar = (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" form={`${id}-formular`} disabled={sparar}>
        {sparar ? 'Sparar …' : ny ? t.nySpara : 'Spara ändringarna'}
      </Button>
      <Button type="button" variant="outline" onClick={onAvbryt}>
        Avbryt
      </Button>
    </div>
  )

  return ram(
    <form id={`${id}-formular`} onSubmit={spara} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-namn`} className="text-sm font-medium">
          {t.namn}
        </label>
        <Input id={`${id}-namn`} data-autofokus value={namn} maxLength={MAX_RATTNAMN} onChange={(e) => setNamn(e.target.value)} placeholder="Till exempel Gröt med russin" />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Ingredienser per portion</legend>
        {falt.map((rad, i) => (
          <div key={i} className="space-y-2 rounded-ruta border border-border p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <label htmlFor={`${id}-vara-${i}`} className="text-sm font-medium">
                  Ingrediens {i + 1}
                </label>
                <IngrediensSok
                  id={`${id}-vara-${i}`}
                  varde={rad.vara}
                  varor={varor}
                  onAndra={(text) => andra(i, { vara: text })}
                  onValjVara={(v) => andra(i, { ...faltForVara(v), gram: rad.gram })}
                  // Värdena kopieras och går att ändra. Raden pekar inte på livsmedlet efteråt.
                  onValjLivsmedel={(l) => andra(i, { vara: l.namn, ...faltFranLivsmedel(l) })}
                />
              </div>
              {falt.length > 1 && (
                <Button type="button" variant="ghost" size="ikon" className="mt-6" aria-label={`Ta bort ingrediens ${i + 1}`} onClick={() => setFalt((f) => f.filter((_, j) => j !== i))}>
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
            {orimligPortion(portion) && <span className="font-medium text-accent-strong"> Ovanligt stor portion. Kontrollera mängderna.</span>}
          </>
        )}
      </p>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      {onTaBort && (
        <div className="space-y-2 border-t border-border pt-4">
          {sakerPa && (
            <p className="text-sm">{t.raderaFraga}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" className="text-destructive" disabled={sparar} onClick={taBort}>
              {sakerPa ? t.raderaJa : t.radera}
            </Button>
            {sakerPa && (
              <Button type="button" variant="outline" disabled={sparar} onClick={() => setSakerPa(false)}>
                {t.raderaNej}
              </Button>
            )}
          </div>
        </div>
      )}
    </form>,
    knappar,
  )
}
