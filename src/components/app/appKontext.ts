import { useOutletContext } from 'react-router'

/** Det som de inloggade sidorna får från ramen (AppSkal): användaren och namnet från profilen. */
export interface AppKontext {
  anvandarId: string
  epost: string
  /** Namnet i profilen. Tom sträng medan det hämtas eller om det saknas. */
  namn: string
  /** Uppdaterar namnet i ramen efter att profilen har sparats. */
  setNamn: (namn: string) => void
}

export function useApp(): AppKontext {
  return useOutletContext<AppKontext>()
}
