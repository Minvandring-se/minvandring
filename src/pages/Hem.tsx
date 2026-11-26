import { HemVy, type Inspiration } from '@/components/hem/HemVy'
import { useApp } from '@/components/app/appKontext'
import { useHem } from '@/hooks/useHem'
import { useLardomar } from '@/hooks/useLardomar'
import { useReceptkatalog } from '@/hooks/useReceptkatalog'
import { useSidtitel } from '@/hooks/useSidtitel'
import { arstidFor } from '@/lib/arstid'
import { TIPS_FOR_ARSTID, veckansRecept } from '@/lib/hem'
import { guideFor } from '@/lib/tips'
import { lokaltDatum } from '@/lib/turlista'

/**
 * Hem, första sidan efter inloggning. Hämtar turerna, Att göra för nästa tur, den senaste egna lärdomen och
 * receptkatalogen, och visar dem med HemVy. Tipset väljs efter årstiden för nästa tur, eller för i dag utan tur.
 */
export function Hem() {
  useSidtitel('Hem')
  const { anvandarId, namn } = useApp()
  const idag = lokaltDatum()
  const { turer, nasta, attgora } = useHem(anvandarId)
  const { lage } = useLardomar()
  const recept = useReceptkatalog()

  const senaste = lage.lage === 'klar' ? lage.lardomar[0] : undefined
  const veckans = Array.isArray(recept) ? veckansRecept(recept, idag) : null
  const tipsval = TIPS_FOR_ARSTID[arstidFor(nasta?.avresa ?? idag)]
  const guide = guideFor(tipsval.nyckel)
  const inspiration: Inspiration = {
    lardom: senaste ? { text: senaste.text } : null,
    recept: veckans ? { id: veckans.id, namn: veckans.namn } : null,
    tips: guide ? { nyckel: guide.nyckel, rubrik: guide.rubrik, etikett: tipsval.etikett } : null,
  }

  return <HemVy namn={namn} idag={idag} turer={turer} nasta={nasta} attgora={attgora} inspiration={inspiration} />
}
