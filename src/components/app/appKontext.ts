import { useOutletContext } from 'react-router'
import type { Notiser } from '@/hooks/useNotiser'

/** Det som de inloggade sidorna får från ramen (AppSkal): användaren och namnet från profilen. */
export interface AppKontext {
  anvandarId: string
  epost: string
  /** Namnet i profilen. Tom sträng medan det hämtas eller om det saknas. */
  namn: string
  /** true när profilen (namn och bild) har hämtats en gång. Innan dess visas platshållare i stället för namn och bild. */
  profilHamtad: boolean
  /** Uppdaterar namnet i ramen efter att profilen har sparats. */
  setNamn: (namn: string) => void
  /** När den egna profilbilden senast byttes. null när bild saknas eller inte är hämtad än. */
  bildUppdaterad: string | null
  /** Uppdaterar ramen efter att bilden har sparats eller tagits bort. */
  setBildUppdaterad: (bildUppdaterad: string | null) => void
  /** Notiserna i klockan, så att en sida kan hämta om dem efter en ändring och följa när nya kommer. */
  notiser: Notiser
}

export function useApp(): AppKontext {
  return useOutletContext<AppKontext>()
}
