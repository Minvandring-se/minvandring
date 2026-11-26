import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { BastForeVal } from '@/components/mat/BastForeVal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { MAX_ANTAL, manadOchAr, tidigasteDatum, tolkaBastFore } from '@/lib/skafferi'
import { MAX_RATTNAMN, nyaPortioner, portionertext, rattMedNamn, rattnamnFel, tolkaKoppling } from '@/lib/skafferiratter'
import { lokaltDatum } from '@/lib/turlista'
import type { Receptkoppling, Skafferiratt } from '@/lib/typer'

/** Ett recept att koppla rätten till, med nyckeln från kopplingsnyckel. */
export interface Receptval {
  nyckel: string
  namn: string
}

/**
 * Formuläret för att lägga en egen rätt man har lagat i skafferiet: namn, portioner med minus och plus (1–999),
 * bäst före och frivilligt receptet den kommer från. Väljs ett recept medan namnet är tomt tar rätten receptets namn.
 * Finns en rätt med samma namn hemma läggs portionerna till och det tidigaste bäst före gäller.
 */
export function LaggRattHemma({
  ratter,
  egnaRecept,
  katalogrecept,
  forval,
  onSpara,
  onKlar,
}: {
  /** Rätterna man redan har hemma. */
  ratter: readonly Skafferiratt[]
  egnaRecept: readonly Receptval[]
  katalogrecept: readonly Receptval[]
  /** När man kommer från ett recept: namnet och kopplingen är ifyllda. */
  forval?: { namn: string; nyckel: string }
  onSpara: (namn: string, befintlig: Skafferiratt | undefined, portioner: number, bastFore: string | null, koppling: Receptkoppling | null) => Promise<boolean>
  onKlar: () => void
}) {
  const id = useId()
  const idag = lokaltDatum()
  const [namn, setNamn] = useState(forval?.namn ?? '')
  const [nyckel, setNyckel] = useState(forval?.nyckel ?? '')
  const [portioner, setPortioner] = useState(1)
  const [manad, setManad] = useState('')
  const [ar, setAr] = useState('')
  const [namnfel, setNamnfel] = useState<string | null>(null)
  const [datumfel, setDatumfel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)
  const [besked, setBesked] = useState<string | null>(null)
  const befintlig = rattMedNamn(ratter, namn)

  function valjRecept(ny: string) {
    setNyckel(ny)
    if (namn.trim()) return
    const valt = [...egnaRecept, ...katalogrecept].find((r) => r.nyckel === ny)
    if (valt) setNamn(valt.namn.slice(0, MAX_RATTNAMN))
  }

  async function spara() {
    const nf = rattnamnFel(namn)
    const datum = tolkaBastFore(manad, ar, idag)
    setNamnfel(nf)
    setDatumfel(datum.ok ? null : datum.fel)
    if (nf || !datum.ok) return
    setFel(false)
    setSparar(true)
    const ok = await onSpara(namn, befintlig, portioner, datum.datum, tolkaKoppling(nyckel))
    setSparar(false)
    if (!ok) return setFel(true)
    const totalt = nyaPortioner(befintlig?.portioner ?? 0, portioner)
    const bastFore = befintlig ? tidigasteDatum(befintlig.bast_fore, datum.datum) : datum.datum
    setBesked(`Nu har du ${portionertext(totalt)} hemma${bastFore ? `, bäst före ${manadOchAr(bastFore)}` : ''}.`)
  }

  if (besked) {
    return (
      <div className="space-y-2">
        <p role="status" className="text-sm font-medium text-primary">
          {besked}
        </p>
        <Button variant="outline" autoFocus onClick={onKlar}>
          Klar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label htmlFor={`${id}-namn`} className="block text-sm font-medium">
          Rätten
        </label>
        <Input
          id={`${id}-namn`}
          value={namn}
          maxLength={MAX_RATTNAMN}
          autoFocus={!forval}
          placeholder="Till exempel Mammas korvstroganoff"
          aria-invalid={!!namnfel}
          aria-describedby={namnfel ? `${id}-namnfel` : befintlig ? `${id}-finns` : undefined}
          onChange={(e) => {
            setNamn(e.target.value)
            setNamnfel(null)
          }}
        />
        {namnfel && (
          <p id={`${id}-namnfel`} className="text-sm text-destructive">
            {namnfel}
          </p>
        )}
        {befintlig && !namnfel && (
          <p id={`${id}-finns`} className="text-sm text-muted-foreground">
            Du har {portionertext(befintlig.portioner)} hemma. Portionerna läggs till och det tidigaste bäst före gäller.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Portioner</p>
        <div role="group" aria-label="Portioner att lägga till" className="flex items-center gap-1">
          <Button variant="outline" size="ikon" aria-label="Färre portioner" disabled={portioner <= 1} onClick={() => setPortioner((p) => Math.max(1, p - 1))}>
            <Minus className="size-4" aria-hidden />
          </Button>
          <span aria-live="polite" className="min-w-10 text-center font-semibold tabular-nums">
            {portioner}
          </span>
          <Button variant="outline" size="ikon" autoFocus={!!forval} aria-label="Fler portioner" disabled={portioner >= MAX_ANTAL} onClick={() => setPortioner((p) => Math.min(MAX_ANTAL, p + 1))}>
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <BastForeVal
        manad={manad}
        ar={ar}
        idag={idag}
        fel={datumfel}
        onAndra={(m, a) => {
          setManad(m)
          setAr(a)
          setDatumfel(null)
        }}
      />

      {(egnaRecept.length > 0 || katalogrecept.length > 0) && (
        <div className="space-y-1">
          <label htmlFor={`${id}-recept`} className="block text-sm font-medium">
            Receptet (frivilligt)
          </label>
          <Select id={`${id}-recept`} value={nyckel} onChange={(e) => valjRecept(e.target.value)}>
            <option value="">Inget recept</option>
            {egnaRecept.length > 0 && (
              <optgroup label="Dina recept">
                {egnaRecept.map((r) => (
                  <option key={r.nyckel} value={r.nyckel}>
                    {r.namn}
                  </option>
                ))}
              </optgroup>
            )}
            {katalogrecept.length > 0 && (
              <optgroup label="MinVandrings recept">
                {katalogrecept.map((r) => (
                  <option key={r.nyckel} value={r.nyckel}>
                    {r.namn}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </div>
      )}

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={sparar} onClick={spara}>
          {sparar ? 'Sparar …' : 'Spara'}
        </Button>
        <Button variant="outline" onClick={onKlar}>
          Avbryt
        </Button>
      </div>
    </div>
  )
}
