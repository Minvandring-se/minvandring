import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Uppgift } from '@/lib/uppgifter'

export type Uppgiftslage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; uppgifter: Uppgift[] }

const KOLUMNER = 'id, tur_id, text, ansvarig, klart_till, klar, sortering'

async function hamta(turId: string): Promise<Uppgift[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('uppgifter').select(KOLUMNER).eq('tur_id', turId).order('sortering').order('skapad')
  return error ? null : (data as Uppgift[])
}

/** Turens uppgifter. Alla i turen kan läsa dem. */
export function useUppgifter(turId: string): { lage: Uppgiftslage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Uppgiftslage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const uppgifter = await hamta(turId)
    setLage(uppgifter ? { lage: 'klar', uppgifter } : { lage: 'fel' })
  }, [turId])

  useEffect(() => {
    let aktuell = true
    hamta(turId).then((uppgifter) => {
      if (aktuell) setLage(uppgifter ? { lage: 'klar', uppgifter } : { lage: 'fel' })
    })
    return () => {
      aktuell = false
    }
  }, [turId])

  return { lage, laddaOm }
}

export type NyUppgift = Pick<Uppgift, 'text' | 'ansvarig' | 'klart_till'>

/** Lägger till en uppgift sist. Bara ägare och redigerare. Ger true när det gick. */
export async function laggTillUppgift(turId: string, ny: NyUppgift, sortering: number): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('uppgifter').insert({ tur_id: turId, ...ny, sortering })
  return !error
}

/** Ändrar text, ansvarig, datum eller klar. Bara ägare och redigerare. Ger true när det gick. */
export async function andraUppgift(id: string, andring: Partial<NyUppgift & { klar: boolean }>): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('uppgifter').update(andring, { count: 'exact' }).eq('id', id)
  return !error && count === 1
}

/** Bockar av eller ångrar sin egen uppgift, även som läsare. Ger true när det gick. */
export async function bockaUppgift(id: string, klar: boolean): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('bocka_uppgift', { u: id, ar_klar: klar })
  return !error && data === true
}

/** Tar bort en uppgift. Bara ägare och redigerare. Ger true när det gick. */
export async function taBortUppgift(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('uppgifter').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}
