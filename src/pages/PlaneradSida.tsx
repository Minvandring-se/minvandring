import type { ReactNode } from 'react'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Dagboksexempel, Kompisexempel, Lardomsexempel, Mallexempel } from '@/components/planerade/Exempelsidor'
import { Statistikexempel } from '@/components/planerade/Statistikexempel'
import { KommerSnart, KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { useSidtitel } from '@/hooks/useSidtitel'
import { SIDOR, type Sida } from '@/lib/meny'

/** Exemplet på varje planerad sida. Innehållet ligger i src/lib/exempeldata.ts. */
const EXEMPEL: Partial<Record<Sida, ReactNode>> = {
  packlistor: <Mallexempel />,
  dagbok: <Dagboksexempel />,
  'kom-ihag': <Lardomsexempel />,
  statistik: <Statistikexempel />,
  kompisar: <Kompisexempel />,
}

/**
 * En sida i menyn som inte är byggd än: rubriken, etiketten "Kommer snart", en mening om vad sidan blir och ett exempel
 * på hur den kommer att se ut. Exemplet går inte att trycka på, och skärmläsare får bara meningen.
 */
export function PlaneradSida({ sida }: { sida: Sida }) {
  const { namn, rubrik = namn, blir } = SIDOR[sida]
  useSidtitel(rubrik)
  const exempel = EXEMPEL[sida]
  return (
    <div className="space-y-6">
      <SidRubrik rubrik={rubrik} etikett={<KommerSnartEtikett />} text={blir} />
      {exempel && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Så här kan det se ut. Exemplet är påhittat.</p>
          <KommerSnart text="Exemplet visas bara som bild.">{exempel}</KommerSnart>
        </div>
      )}
    </div>
  )
}
