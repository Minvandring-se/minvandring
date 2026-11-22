import { SidRubrik } from '@/components/app/SidRubrik'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { useSidtitel } from '@/hooks/useSidtitel'
import { SIDOR, type Sida } from '@/lib/meny'

/** En sida i menyn som inte är byggd än: rubriken, etiketten "Kommer snart" och en mening om vad sidan blir. */
export function PlaneradSida({ sida }: { sida: Sida }) {
  const { namn, blir } = SIDOR[sida]
  useSidtitel(namn)
  return (
    <div className="space-y-6">
      <SidRubrik rubrik={namn} etikett={<KommerSnartEtikett />} text={blir} />
    </div>
  )
}
