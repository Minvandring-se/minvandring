import { useCallback, useEffect, useState } from 'react'
import type { Grupp } from '@/lib/grupper'
import { supabase } from '@/lib/supabase'

/** null medan grupperna hämtas, 'fel' när de inte gick att hämta. */
export type Grupplage = Grupp[] | null | 'fel'

async function hamta(): Promise<Grupp[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('grupper').select('id, namn, gruppmedlemmar(medlem_id)').order('namn')
  // PGRST205: tabellen finns inte än (migreringen är inte körd). Då finns inga grupper.
  if (error?.code === 'PGRST205') return []
  if (error) return null
  return (data as { id: string; namn: string; gruppmedlemmar: { medlem_id: string }[] }[]).map((g) => ({
    id: g.id,
    namn: g.namn,
    medlemmar: g.gruppmedlemmar.map((m) => m.medlem_id),
  }))
}

/** Ens egna grupper med medlemmarna. Hämtas först när aktiv är sann. */
export function useGrupper(aktiv = true): { grupper: Grupplage; laddaOm: () => Promise<void> } {
  const [grupper, setGrupper] = useState<Grupplage>(null)

  const laddaOm = useCallback(async () => {
    setGrupper((await hamta()) ?? 'fel')
  }, [])

  useEffect(() => {
    if (!aktiv) return
    let aktuell = true
    hamta().then((g) => {
      if (aktuell) setGrupper(g ?? 'fel')
    })
    return () => {
      aktuell = false
    }
  }, [aktiv])

  return { grupper, laddaOm }
}

/** Sparar en grupp med namn och medlemmar. Utan id skapas en ny. */
export async function sparaGrupp(id: string | null, namn: string, medlemmar: string[]): Promise<{ fel: string | null }> {
  if (!supabase) return { fel: null }
  const { error } = await supabase.rpc('spara_grupp', { grupp: id, namn: namn.trim(), medlemmar })
  return { fel: error ? error.message : null }
}

/** Tar bort en grupp. Vännerna finns kvar. */
export async function taBortGrupp(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('grupper').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}
