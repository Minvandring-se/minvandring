import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TurIListan } from '@/lib/turlista'

/**
 * Turerna man är med i, för sidomenyns lista Dina turer. Hämtas om när man byter sida,
 * så att en ny, ändrad eller raderad tur syns direkt. null medan listan hämtas första gången.
 */
export function useDinaTurer(anvandarId: string, sida: string): TurIListan[] | null {
  const [turer, setTurer] = useState<TurIListan[] | null>(null)

  useEffect(() => {
    if (!supabase || !anvandarId) return
    let aktuell = true
    supabase
      .from('turer')
      .select('id, namn, avresa, hemkomst, dagar, skapad')
      .then(({ data, error }) => {
        // Går det inte att hämta står den förra listan kvar.
        if (aktuell && !error) setTurer((data as TurIListan[] | null) ?? [])
      })
    return () => {
      aktuell = false
    }
  }, [anvandarId, sida])

  return turer
}
