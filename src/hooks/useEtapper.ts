import { useCallback, useEffect, useState } from 'react'
import type { Etappvarden } from '@/lib/etapper'
import { supabase } from '@/lib/supabase'
import type { Etapp } from '@/lib/typer'

export type Etapplage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; etapper: Etapp[] }

const KOLUMNER = 'id, tur_id, dag, fran, till, km, natt, boende, bokad, notering'

async function hamta(turId: string): Promise<Etapp[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('etapper').select(KOLUMNER).eq('tur_id', turId).order('dag')
  return error ? null : (data as Etapp[])
}

/** Turens etapper. Hämtas igen när någon i turen ändrar en etapp. laddaOm hämtar igen efter en egen ändring. */
export function useEtapper(turId: string): { lage: Etapplage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Etapplage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const etapper = await hamta(turId)
    setLage(etapper ? { lage: 'klar', etapper } : { lage: 'fel' })
  }, [turId])

  useEffect(() => {
    let aktuell = true
    const hamtaNu = () =>
      hamta(turId).then((etapper) => {
        if (aktuell) setLage(etapper ? { lage: 'klar', etapper } : { lage: 'fel' })
      })
    hamtaNu()
    const kanal = supabase
      ?.channel(`etapper-${turId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'etapper', filter: `tur_id=eq.${turId}` }, hamtaNu)
      .subscribe()
    return () => {
      aktuell = false
      if (kanal) supabase?.removeChannel(kanal)
    }
  }, [turId])

  return { lage, laddaOm }
}

/** Sparar dagens etapp, ny eller ändrad. Ger true när det gick. */
export async function sparaEtapp(turId: string, dag: number, varden: Etappvarden): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('etapper').upsert({ tur_id: turId, dag, ...varden }, { onConflict: 'tur_id,dag' })
  return !error
}

/** Tar bort en dags etapp. Ger true när det gick. */
export async function taBortEtapp(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('etapper').delete().eq('id', id)
  return !error
}
