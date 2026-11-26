import { useCallback, useEffect, useState } from 'react'
import type { Anteckning } from '@/lib/anteckningar'
import { supabase } from '@/lib/supabase'

export type Anteckningslage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; anteckningar: Anteckning[] }

const KOLUMNER = 'id, tur_id, user_id, text, privat, skapad, andrad'

async function hamta(turId: string): Promise<Anteckning[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('anteckningar').select(KOLUMNER).eq('tur_id', turId)
  return error ? null : (data as Anteckning[])
}

/** Turens anteckningar som den inloggade får se. Hämtas igen när någon i turen ändrar en anteckning. */
export function useAnteckningar(turId: string): { lage: Anteckningslage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Anteckningslage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const anteckningar = await hamta(turId)
    setLage(anteckningar ? { lage: 'klar', anteckningar } : { lage: 'fel' })
  }, [turId])

  useEffect(() => {
    let aktuell = true
    const hamtaNu = () =>
      hamta(turId).then((anteckningar) => {
        if (aktuell) setLage(anteckningar ? { lage: 'klar', anteckningar } : { lage: 'fel' })
      })
    hamtaNu()
    const kanal = supabase
      ?.channel(`anteckningar-${turId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'anteckningar', filter: `tur_id=eq.${turId}` }, hamtaNu)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'anteckningar', filter: `tur_id=eq.${turId}` }, hamtaNu)
      // En borttagning skickar bara id och går inte att filtrera på turen, så listan hämtas om vid varje borttagning.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'anteckningar' }, hamtaNu)
      .subscribe()
    return () => {
      aktuell = false
      if (kanal) supabase?.removeChannel(kanal)
    }
  }, [turId])

  return { lage, laddaOm }
}

/** Sparar en ny anteckning. Ger true när det gick. */
export async function laggTillAnteckning(turId: string, text: string, privat: boolean): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('anteckningar').insert({ tur_id: turId, text, privat })
  return !error
}

/** Ändrar en egen anteckning. Ger true när det gick. */
export async function andraAnteckning(id: string, text: string, privat: boolean): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('anteckningar').update({ text, privat }, { count: 'exact' }).eq('id', id)
  return !error && count === 1
}

/** Tar bort en anteckning. Ger true när det gick. */
export async function taBortAnteckning(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('anteckningar').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}
