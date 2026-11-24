import { useEffect, useState } from 'react'
import { monsterForDatabasen, rangordnaLivsmedel, type Livsmedel } from '@/lib/livsmedel'
import { supabase } from '@/lib/supabase'

export type Livsmedelsforslag = Pick<Livsmedel, 'nummer' | 'namn' | 'grupp' | 'tillstand' | 'kcal_per_100g' | 'protein_per_100g' | 'allergener'>

/**
 * Förslag ur livsmedlen för det man har skrivit. Databasen söker med mönstren från monsterForDatabasen (det längsta
 * ordet, också delat så att sammansatta ord hittas) efter en kort paus i skrivandet, och rangordnaLivsmedel väljer
 * de bästa. Går det inte att hämta blir det inga förslag, och man kan skriva sin vara själv som förut.
 */
export function useLivsmedelForslag(sok: string, max = 5): Livsmedelsforslag[] {
  const [svar, setSvar] = useState<{ sok: string; forslag: Livsmedelsforslag[] }>({ sok: '', forslag: [] })
  const monster = monsterForDatabasen(sok)
  // Mönstren består bara av bokstäver, siffror och %, så de går att sätta in i filtret som de är.
  const filter = monster?.map((m) => `namn.ilike.%${m}%`).join(',') ?? null

  useEffect(() => {
    if (!supabase || !filter) return
    let aktuell = true
    const timer = setTimeout(async () => {
      const { data, error } = await supabase!
        .from('livsmedel')
        .select('nummer, namn, grupp, tillstand, kcal_per_100g, protein_per_100g, allergener')
        .or(filter)
        .limit(300)
      if (!aktuell) return
      setSvar({ sok, forslag: error ? [] : rangordnaLivsmedel((data as Livsmedelsforslag[] | null) ?? [], sok, max) })
    }, 250)
    return () => {
      aktuell = false
      clearTimeout(timer)
    }
  }, [sok, filter, max])

  // Medan nya förslag hämtas står de förra kvar, men bara de som fortfarande passar det man har skrivit, så att
  // listan inte blinkar för varje tangent.
  if (!filter) return []
  return svar.sok === sok ? svar.forslag : rangordnaLivsmedel(svar.forslag, sok, max)
}
