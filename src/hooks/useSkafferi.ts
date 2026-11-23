import { useCallback, useEffect, useState } from 'react'
import { MAX_ANTAL } from '@/lib/skafferi'
import { supabase } from '@/lib/supabase'
import type { Skafferirad } from '@/lib/typer'

/** Ens eget skafferi och ens favoriter. RLS gör att bara ens egna rader kommer tillbaka, även i en delad tur. */
export interface Skafferi {
  rader: Skafferirad[]
  /** Påsarnas id. */
  favoriter: Set<string>
}

export type Skafferilage = Skafferi | null | 'fel'

async function hamtaSkafferi(): Promise<Skafferi | 'fel'> {
  if (!supabase) return 'fel'
  const [rader, favoriter] = await Promise.all([
    supabase.from('skafferi').select('id, matprodukt_id, antal, bast_fore'),
    supabase.from('matfavoriter').select('matprodukt_id'),
  ])
  if (rader.error || favoriter.error) return 'fel'
  return {
    rader: rader.data as Skafferirad[],
    favoriter: new Set((favoriter.data as { matprodukt_id: string }[]).map((f) => f.matprodukt_id)),
  }
}

/** Skafferiet. null medan det hämtas, 'fel' om det inte gick. laddaOm hämtar det igen efter en ändring. */
export function useSkafferi(): { skafferi: Skafferilage; laddaOm: () => Promise<void> } {
  const [skafferi, setSkafferi] = useState<Skafferilage>(null)

  const laddaOm = useCallback(async () => {
    setSkafferi(await hamtaSkafferi())
  }, [])

  useEffect(() => {
    let aktuell = true
    hamtaSkafferi().then((s) => {
      if (aktuell) setSkafferi(s)
    })
    return () => {
      aktuell = false
    }
  }, [])

  return { skafferi, laddaOm }
}

// ─── Spara ─────────────────────────────────────────────────────────────────
// Funktionerna svarar true när det gick. En ändring som RLS stoppar ger inget fel, bara noll rader,
// så de läser tillbaka raden och räknar.

/** Lägger en påse i skafferiet, eller en till om den redan finns där. */
export async function laggISkafferi(matproduktId: string, befintlig: Skafferirad | undefined): Promise<boolean> {
  if (!supabase) return false
  if (befintlig) return andraSkafferirad(befintlig.id, { antal: Math.min(MAX_ANTAL, befintlig.antal + 1) })
  const { error } = await supabase.from('skafferi').insert({ matprodukt_id: matproduktId })
  return !error
}

/** Ändrar antalet eller bäst-före-datumet. null tar bort datumet. */
export async function andraSkafferirad(id: string, andring: { antal?: number; bast_fore?: string | null }): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('skafferi').update(andring).eq('id', id).select('id')
  return !error && data.length === 1
}

export async function taBortUrSkafferi(id: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('skafferi').delete().eq('id', id).select('id')
  return !error && data.length === 1
}

/** Gör påsen till en favorit eller tar bort stjärnan. */
export async function sattFavorit(matproduktId: string, favorit: boolean): Promise<boolean> {
  if (!supabase) return false
  if (favorit) {
    // Redan en favorit, till exempel från en annan flik, räknas som att det gick.
    const { error } = await supabase.from('matfavoriter').upsert({ matprodukt_id: matproduktId }, { onConflict: 'user_id,matprodukt_id', ignoreDuplicates: true })
    return !error
  }
  const { error } = await supabase.from('matfavoriter').delete().eq('matprodukt_id', matproduktId)
  return !error
}
