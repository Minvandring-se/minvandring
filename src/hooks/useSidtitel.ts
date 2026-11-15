import { useEffect } from 'react'
import { sidtitel, STANDARDTITEL } from '@/lib/sidtitel'

/** Sätter titeln i webbläsarens flik medan sidan visas, och återställer den efteråt. */
export function useSidtitel(sida: string | null | undefined) {
  useEffect(() => {
    document.title = sidtitel(sida)
    return () => {
      document.title = STANDARDTITEL
    }
  }, [sida])
}
