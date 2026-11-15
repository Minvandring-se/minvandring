import { useOutletContext } from 'react-router'
import type { Roll } from '@/lib/roller'
import type { DeltagareRad, Tur } from '@/lib/typer'

/** Det som turens delsidor får från ramen (TurRam): turen, deltagarna och den inloggades roll. */
export interface TurKontext {
  tur: Tur
  deltagare: DeltagareRad[]
  /** null om den inloggade inte finns bland deltagarna. */
  minRoll: Roll | null
  mittUserId: string
  /** Uppdaterar turen i ramen efter att den har sparats. */
  setTur: (tur: Tur) => void
  /** Hämtar om deltagarna efter en ändring. */
  uppdateraDeltagare: () => Promise<void>
}

export function useTur(): TurKontext {
  return useOutletContext<TurKontext>()
}
