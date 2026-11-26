import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { rangordnaVaror, varumonster, type Katalogforslag } from '@/lib/varukatalog'

const KOLUMNER = 'id, marke, namn, kategori, kcal_per_100g, protein_per_100g, vegetarisk, vegansk, glutenfri, laktosfri, allergener, spar'

/**
 * Förslag ur varukatalogen för det man har skrivit, efter en kort paus i skrivandet. Databasen söker på det längsta
 * ordet i märke eller namn, och rangordnaVaror väljer de bästa. Går det inte att hämta blir det inga förslag.
 */
export function useVarukatalogForslag(sok: string, max = 3): Katalogforslag[] {
  const [svar, setSvar] = useState<{ sok: string; forslag: Katalogforslag[] }>({ sok: '', forslag: [] })
  const monster = varumonster(sok)
  // Mönstret består bara av bokstäver och siffror, så det går att sätta in i filtret som det är.
  const filter = monster ? `namn.ilike.%${monster}%,marke.ilike.%${monster}%` : null

  useEffect(() => {
    if (!supabase || !filter) return
    let aktuell = true
    const timer = setTimeout(async () => {
      const { data, error } = await supabase!.from('varukatalog').select(KOLUMNER).or(filter).limit(200)
      if (!aktuell) return
      setSvar({ sok, forslag: error ? [] : rangordnaVaror((data as Katalogforslag[] | null) ?? [], sok, max) })
    }, 250)
    return () => {
      aktuell = false
      clearTimeout(timer)
    }
  }, [sok, filter, max])

  if (!filter) return []
  return svar.sok === sok ? svar.forslag : rangordnaVaror(svar.forslag, sok, max)
}
