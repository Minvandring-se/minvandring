import { useEffect, useState } from 'react'
import { rangordnaLivsmedel, sokordForDatabasen, type Livsmedel } from '@/lib/livsmedel'
import { supabase } from '@/lib/supabase'

export type Livsmedelsforslag = Pick<Livsmedel, 'nummer' | 'namn' | 'tillstand' | 'kcal_per_100g' | 'protein_per_100g'>

/** Tecknen som betyder något i ilike tas som vanliga tecken. */
const utanJoker = (text: string) => text.replace(/[\\%_]/g, (t) => `\\${t}`)

/**
 * Förslag ur livsmedlen för det man har skrivit. Databasen söker på det längsta ordet efter en kort paus i
 * skrivandet, och rangordnaLivsmedel väljer de bästa. Går det inte att hämta blir det inga förslag, och man kan
 * skriva sin vara själv som förut.
 */
export function useLivsmedelForslag(sok: string, max = 5): Livsmedelsforslag[] {
  const [svar, setSvar] = useState<{ sok: string; forslag: Livsmedelsforslag[] }>({ sok: '', forslag: [] })
  const sokord = sokordForDatabasen(sok)

  useEffect(() => {
    if (!supabase || !sokord) return
    let aktuell = true
    const timer = setTimeout(async () => {
      const { data, error } = await supabase!
        .from('livsmedel')
        .select('nummer, namn, tillstand, kcal_per_100g, protein_per_100g')
        .ilike('namn', `%${utanJoker(sokord)}%`)
        .limit(300)
      if (!aktuell) return
      setSvar({ sok, forslag: error ? [] : rangordnaLivsmedel((data as Livsmedelsforslag[] | null) ?? [], sok, max) })
    }, 250)
    return () => {
      aktuell = false
      clearTimeout(timer)
    }
  }, [sok, sokord, max])

  // Medan nya förslag hämtas står de förra kvar, men bara de som fortfarande passar det man har skrivit, så att
  // listan inte blinkar för varje tangent.
  if (!sokord) return []
  return svar.sok === sok ? svar.forslag : rangordnaLivsmedel(svar.forslag, sok, max)
}
