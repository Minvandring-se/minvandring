import { useCallback, useEffect, useState } from 'react'
import type { Amne, Lardom } from '@/lib/lardomar'
import { supabase } from '@/lib/supabase'

export type Lardomslage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; lardomar: Lardom[] }

const KOLUMNER = 'id, tur_id, tur_namn, amne, text, skapad'

async function hamta(): Promise<Lardom[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('lardomar').select(KOLUMNER).order('skapad', { ascending: false })
  return error ? null : (data as Lardom[])
}

/** Den inloggades lärdomar från alla turer. Bara de egna går att läsa. */
export function useLardomar(): { lage: Lardomslage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Lardomslage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const lardomar = await hamta()
    setLage(lardomar ? { lage: 'klar', lardomar } : { lage: 'fel' })
  }, [])

  useEffect(() => {
    let aktuell = true
    hamta().then((lardomar) => {
      if (aktuell) setLage(lardomar ? { lage: 'klar', lardomar } : { lage: 'fel' })
    })
    return () => {
      aktuell = false
    }
  }, [])

  return { lage, laddaOm }
}

/** Sparar en lärdom, med eller utan tur. Ger true när det gick. */
export async function laggTillLardom(turId: string | null, amne: Amne, text: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('lardomar').insert({ tur_id: turId, amne, text })
  return !error
}

/** Tar bort en lärdom. Ger true när det gick. */
export async function taBortLardom(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('lardomar').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}
