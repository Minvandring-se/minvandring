import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TurIListan } from '@/lib/turlista'

/** En tur i listan, med reservdagarna som matplanen behöver. */
export type DinTur = TurIListan & { reservdagar: number }

export interface DinaTurer {
  /** null medan listan hämtas första gången, eller när den inte gick att hämta. */
  turer: DinTur[] | null
  /** Sant när den senaste hämtningen misslyckades. En lista som redan hämtats står då kvar. */
  fel: boolean
  /** Hämtar listan igen. */
  forsokIgen: () => void
}

/**
 * Turerna man är med i, för sidomenyns lista Dina turer och för Mina matplaner. Hämtas om när man byter sida,
 * så att en ny, ändrad eller raderad tur syns direkt.
 */
export function useDinaTurer(anvandarId: string, sida: string): DinaTurer {
  const [turer, setTurer] = useState<DinTur[] | null>(null)
  const [fel, setFel] = useState(false)
  const [omgang, setOmgang] = useState(0)

  useEffect(() => {
    if (!supabase || !anvandarId) return
    let aktuell = true
    supabase
      .from('turer')
      .select('id, namn, avresa, hemkomst, dagar, reservdagar, skapad')
      .then(({ data, error }) => {
        if (!aktuell) return
        setFel(!!error)
        // Går det inte att hämta står den förra listan kvar.
        if (!error) setTurer((data as DinTur[] | null) ?? [])
      })
    return () => {
      aktuell = false
    }
  }, [anvandarId, sida, omgang])

  const forsokIgen = useCallback(() => {
    setFel(false)
    setOmgang((n) => n + 1)
  }, [])

  return { turer, fel, forsokIgen }
}
