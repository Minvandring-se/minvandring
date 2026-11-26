import { PackagePlus, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { LaggRattHemma } from '@/components/mat/LaggRattHemma'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { laggRattISkafferi, sattReceptfavorit, useSkafferi } from '@/hooks/useSkafferi'
import { arReceptfavorit, kopplingsnyckel } from '@/lib/skafferiratter'
import type { Receptkoppling } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Receptet i ens skafferi: en stjärna som gör det till en favorit, och Lägg i skafferiet för en rätt man har lagat efter
 * receptet. Båda är personliga och syns bara i ens eget skafferi.
 */
export function ReceptISkafferiet({ koppling, namn }: { koppling: Receptkoppling; namn: string }) {
  const { skafferi, laddaOm } = useSkafferi()
  const [fel, setFel] = useState(false)
  const [oppen, setOppen] = useState(false)
  const redo = skafferi !== null && skafferi !== 'fel'
  const favorit = redo && arReceptfavorit(skafferi.receptfavoriter, koppling)

  async function vaxla() {
    const ok = await sattReceptfavorit(koppling, !favorit)
    setFel(!ok)
    if (ok) await laddaOm()
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" aria-pressed={favorit} disabled={!redo} onClick={() => void vaxla()}>
          <Star className={cn('size-4', favorit ? 'fill-hjortron text-hjortron-ikon' : 'text-muted-foreground')} aria-hidden />
          {favorit ? 'Favorit' : 'Gör till favorit'}
        </Button>
        <Button variant="outline" disabled={!redo} onClick={() => setOppen(true)}>
          <PackagePlus className="size-4" aria-hidden />
          Lägg i skafferiet
        </Button>
      </div>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
        </p>
      )}
      {skafferi === 'fel' && <p className="text-sm text-destructive">Det gick inte att hämta ditt skafferi. Ladda om sidan och försök igen.</p>}
      {oppen && redo && (
        <Panel mitten etikett={`Lägg ${namn} i skafferiet`} onStang={() => setOppen(false)} rubrik={<h2 className="text-2xl">Lägg i skafferiet</h2>}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Har du lagat rätten och har den hemma, till exempel torkad i frysen? Den syns i{' '}
              <Link to="/matplanering/skafferi" className={cn('font-medium text-primary underline underline-offset-4', fokus)}>
                ditt skafferi
              </Link>{' '}
              och går att välja när du planerar en måltid.
            </p>
            <LaggRattHemma
              ratter={skafferi.ratter}
              egnaRecept={[]}
              katalogrecept={[]}
              forval={{ namn, nyckel: kopplingsnyckel({ recept_id: null, receptkatalog_id: null, ...koppling }) }}
              onSpara={async (n, befintlig, portioner, bastFore, k) => {
                // Receptvalet visas inte här, så kopplingen är alltid receptet man står på.
                const ok = await laggRattISkafferi(n, befintlig, portioner, bastFore, k ?? koppling)
                if (ok) await laddaOm()
                return ok
              }}
              onKlar={() => setOppen(false)}
            />
          </div>
        </Panel>
      )}
    </div>
  )
}
