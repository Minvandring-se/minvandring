import { Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { IngrediensSok } from '@/components/mat/IngrediensSok'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formateraVikt } from '@/lib/forrad'
import { ENHETER } from '@/lib/handla'
import { formateraKcal, MAX_RATTNAMN, naringForRader, orimligPortion, tolkaRattformular, type Ingrediensfalt, type TolkadIngrediens } from '@/lib/mat'
import { faltFranLivsmedel } from '@/lib/livsmedel'
import { raderTillFalt } from '@/lib/recept'
import { varunamnFor, type Katalogforslag } from '@/lib/varukatalog'
import type { Vara } from '@/lib/typer'

// Gram är förvalt, eftersom det är det vanligaste för friluftsmat och ger energin direkt.
const TOM_RAD: Ingrediensfalt = { vara: '', mangd: '', enhet: 'g', gram: '', kcal: '', protein: '' }

/** Vikten skrivs för sig bara när enheten inte är en vikt. */
const behoverVikt = (enhet: string) => enhet !== 'g' && enhet !== 'kg'

/** En vara som föreslås, med kcal och protein som fylls i när man väljer den. */
type Forslag = Pick<Vara, 'namn' | 'kcal_per_100g' | 'protein_per_100g' | 'varukatalog_id'>

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
function faltForVara(vara: Forslag): Pick<Ingrediensfalt, 'vara' | 'kcal' | 'protein' | 'varukatalogId'> {
  return {
    vara: vara.namn,
    kcal: vara.kcal_per_100g?.toString() ?? '',
    protein: vara.protein_per_100g?.toString().replace('.', ',') ?? '',
    varukatalogId: vara.varukatalog_id ?? null,
  }
}

/** Fälten för en vara ur varukatalogen: namnet, kcal och protein, och kopplingen som ger allergenerna. */
function faltForKatalogvara(v: Katalogforslag): Pick<Ingrediensfalt, 'vara' | 'kcal' | 'protein' | 'varukatalogId'> {
  return {
    vara: varunamnFor(v),
    kcal: String(v.kcal_per_100g),
    protein: v.protein_per_100g === null ? '' : String(Math.round(v.protein_per_100g * 10) / 10).replace('.', ','),
    varukatalogId: v.id,
  }
}

/**
 * Formuläret för en egen rätt eller ett eget recept: namn och ingredienser med mängd och enhet per portion, kcal och
 * protein per 100 g. För andra enheter än g och kg kan vikten skrivas för sig, så att energin räknas. En rätt får
 * sakna ingredienser. Visar energin och vikten per portion medan man skriver. Varor som redan finns föreslås.
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
  const fraga = useRef<HTMLDivElement>(null)
  // Frågan och knapparna ligger längst ner i panelen, så de skrollas fram när de visas.
  useEffect(() => {
    if (sakerPa) fraga.current?.scrollIntoView({ block: 'nearest' })
  }, [sakerPa])

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
        // Skriver man ett annat namn gäller inte kopplingen till varukatalogen längre.
        if (del.vara !== undefined && !('varukatalogId' in del) && del.vara.trim().toLowerCase() !== rad.vara.trim().toLowerCase()) ny.varukatalogId = null
        // Väljer man en vara som finns i turen fylls kcal och protein i, om de är tomma.
        const finns = del.vara !== undefined ? varor.find((v) => v.namn.toLowerCase() === del.vara!.trim().toLowerCase()) : undefined
        if (finns) {
          const kand = faltForVara(finns)
          return { ...ny, kcal: ny.kcal || kand.kcal, protein: ny.protein || kand.protein, varukatalogId: ny.varukatalogId ?? kand.varukatalogId }
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
        <p className="text-sm text-muted-foreground">
          {typ === 'ratt' ? 'Du kan också spara utan ingredienser, till exempel för en måltid som någon annan bjuder på.' : 'Du kan också spara receptet utan ingredienser.'}
        </p>
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
                  onValjVara={(v) => andra(i, faltForVara(v))}
                  // Värdena kopieras och går att ändra. Raden pekar inte på livsmedlet efteråt.
                  onValjLivsmedel={(l) => andra(i, { vara: l.namn, ...faltFranLivsmedel(l), varukatalogId: null })}
                  onValjKatalogvara={(v) => andra(i, faltForKatalogvara(v))}
                  varuetikett={typ === 'recept' ? 'I dina recept' : 'I turen'}
                />
              </div>
              {falt.length > 1 && (
                <Button type="button" variant="ghost" size="ikon" className="mt-6" aria-label={`Ta bort ingrediens ${i + 1}`} onClick={() => setFalt((f) => f.filter((_, j) => j !== i))}>
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Tal id={`${id}-mangd-${i}`} etikett="Mängd" varde={rad.mangd} onAndra={(v) => andra(i, { mangd: v })} />
              <div className="min-w-0 space-y-1">
                <label htmlFor={`${id}-enhet-${i}`} className="block text-xs leading-tight text-muted-foreground">
                  Enhet
                </label>
                <Select id={`${id}-enhet-${i}`} value={rad.enhet} onChange={(e) => andra(i, { enhet: e.target.value })}>
                  {ENHETER.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </Select>
              </div>
              {behoverVikt(rad.enhet) && <Tal id={`${id}-gram-${i}`} etikett="Vikt i gram" varde={rad.gram} onAndra={(v) => andra(i, { gram: v })} />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Tal id={`${id}-kcal-${i}`} etikett="Kcal per 100 g" varde={rad.kcal} onAndra={(v) => andra(i, { kcal: v })} />
              <Tal id={`${id}-protein-${i}`} etikett="Protein per 100 g" varde={rad.protein} onAndra={(v) => andra(i, { protein: v })} />
            </div>
            {behoverVikt(rad.enhet) && rad.mangd.trim() !== '' && rad.gram.trim() === '' && (
              <p className="text-xs text-muted-foreground">Skriv vikten i gram om energin ska räknas med.</p>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setFalt((f) => [...f, { ...TOM_RAD }])}>
          <Plus className="size-4" aria-hidden />
          Lägg till ingrediens
        </Button>
      </fieldset>

      <p aria-live="polite" className="text-sm tabular-nums">
        {portion && tolkat.ok && tolkat.rader.length > 0 && (
          <>
            Per portion: {formateraKcal(portion.kcal)}, {Math.round(portion.proteinG)} g protein och {formateraVikt(portion.gram)}.
            {portion.ofullstandig && <span className="text-muted-foreground"> Några varor saknar vikt, kcal eller protein, så energin kan bli för låg.</span>}
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
        <div ref={fraga} className="space-y-2 border-t border-border pt-4">
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

/** Ett fält för ett tal i en ingrediensrad, med etiketten ovanför. */
function Tal({ id, etikett, varde, onAndra }: { id: string; etikett: string; varde: string; onAndra: (v: string) => void }) {
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-xs leading-tight text-muted-foreground">
        {etikett}
      </label>
      <Input id={id} inputMode="decimal" className="px-3 tabular-nums" value={varde} onChange={(e) => onAndra(e.target.value)} />
    </div>
  )
}
