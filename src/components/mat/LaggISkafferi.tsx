import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { BastForeVal } from '@/components/mat/BastForeVal'
import { Button } from '@/components/ui/button'
import { MAX_ANTAL, skafferibesked, tolkaBastFore } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'

/**
 * Formuläret för att lägga påsar i skafferiet: antal med minus och plus (1–999, förvalt 1), bäst före som månad och år,
 * och Spara och Avbryt. Finns påsen redan hemma står hur många, och antalet läggs till. Efter sparandet visas en kort
 * bekräftelse, till exempel "Nu har du 3 hemma, bäst före mars 2027."
 */
export function LaggISkafferi({
  namn,
  hemma,
  onSpara,
  onKlar,
}: {
  /** Påsens namn, för etiketterna till skärmläsare. */
  namn: string
  /** Hur många man har hemma nu. */
  hemma: number
  /** Sparar och svarar med raden som den blev, eller null när det inte gick. */
  onSpara: (antal: number, bastFore: string | null) => Promise<{ antal: number; bast_fore: string | null } | null>
  /** Stänger formuläret: efter Avbryt, eller efter att bekräftelsen har visats och man trycker Klar. */
  onKlar: () => void
}) {
  const idag = lokaltDatum()
  const [antal, setAntal] = useState(1)
  const [manad, setManad] = useState('')
  const [ar, setAr] = useState('')
  const [datumfel, setDatumfel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState(false)
  const [besked, setBesked] = useState<string | null>(null)

  async function spara() {
    const datum = tolkaBastFore(manad, ar, idag)
    if (!datum.ok) return setDatumfel(datum.fel)
    setDatumfel(null)
    setFel(false)
    setSparar(true)
    const rad = await onSpara(antal, datum.datum)
    setSparar(false)
    if (rad) setBesked(skafferibesked(rad.antal, rad.bast_fore))
    else setFel(true)
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
    <div className="space-y-3 rounded-ruta border border-border bg-card p-3">
      {hemma > 0 && <p className="text-sm text-muted-foreground">Du har {hemma} hemma. Antalet läggs till och det tidigaste bäst före gäller.</p>}
      <div className="space-y-1">
        <p className="text-sm font-medium">
          Antal
        </p>
        <div role="group" aria-label={`Antal ${namn} att lägga till`} className="flex items-center gap-1">
          <Button variant="outline" size="ikon" aria-label="Minska antalet" disabled={antal <= 1} onClick={() => setAntal((a) => Math.max(1, a - 1))}>
            <Minus className="size-4" aria-hidden />
          </Button>
          <span aria-live="polite" className="min-w-10 text-center font-semibold tabular-nums">
            {antal}
          </span>
          <Button variant="outline" size="ikon" autoFocus aria-label="Öka antalet" disabled={antal >= MAX_ANTAL} onClick={() => setAntal((a) => Math.min(MAX_ANTAL, a + 1))}>
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
