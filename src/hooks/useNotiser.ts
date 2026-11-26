import { useCallback, useEffect, useState } from 'react'
import { ANTAL_I_KLOCKAN, synligaNotiser, type Notis } from '@/lib/notiser'
import { supabase } from '@/lib/supabase'

/** null medan notiserna hämtas, 'fel' när de inte gick att hämta. */
export type Notislage = Notis[] | null | 'fel'

const KOLUMNER = 'id, typ, text, lank, tur_id, vanforfragan_id, last, skapad'

async function hamta(): Promise<Notis[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('notiser').select(KOLUMNER).order('skapad', { ascending: false }).limit(ANTAL_I_KLOCKAN)
  // PGRST205: tabellen finns inte än (migreringen är inte körd). Då finns inga notiser.
  if (error?.code === 'PGRST205') return []
  return error ? null : synligaNotiser(data as Notis[])
}

export interface Notiser {
  notiser: Notislage
  olasta: number
  /** Markerar alla som lästa, när klockan öppnas. */
  markeraLasta: () => Promise<void>
  /** Hämtar notiserna igen, till exempel när en förfrågan har besvarats och notisen om den är borta. */
  laddaOm: () => Promise<void>
}

/**
 * Den inloggades senaste notiser. Hämtas igen när en notis kommer eller ändras, så att klockan visar nya notiser
 * direkt. RLS gör att man bara får sina egna. Borttagningar lyssnar den inte på, eftersom de skickas till alla som
 * lyssnar på tabellen. En notis som databasen tar bort försvinner vid nästa hämtning.
 */
export function useNotiser(anvandarId: string): Notiser {
  const [notiser, setNotiser] = useState<Notislage>(null)

  useEffect(() => {
    if (!anvandarId) return
    let aktuell = true
    const hamtaNu = () =>
      hamta().then((n) => {
        if (aktuell) setNotiser(n ?? 'fel')
      })
    hamtaNu()
    const kanal = supabase
      ?.channel(`notiser-${anvandarId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notiser', filter: `user_id=eq.${anvandarId}` }, hamtaNu)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notiser', filter: `user_id=eq.${anvandarId}` }, hamtaNu)
      .subscribe()
    return () => {
      aktuell = false
      if (kanal) supabase?.removeChannel(kanal)
    }
  }, [anvandarId])

  const markeraLasta = useCallback(async () => {
    if (!supabase) return
    const nu = new Date().toISOString()
    const { error } = await supabase.from('notiser').update({ last: nu }).is('last', null)
    if (!error) setNotiser((n) => (Array.isArray(n) ? n.map((x) => (x.last ? x : { ...x, last: nu })) : n))
  }, [])

  const laddaOm = useCallback(async () => {
    const n = await hamta()
    setNotiser(n ?? 'fel')
  }, [])

  const olasta = Array.isArray(notiser) ? notiser.filter((n) => !n.last).length : 0
  return { notiser, olasta, markeraLasta, laddaOm }
}
