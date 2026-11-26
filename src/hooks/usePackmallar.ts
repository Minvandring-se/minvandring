import { useCallback, useEffect, useState } from 'react'
import type { Packmall } from '@/lib/packmallar'
import { supabase } from '@/lib/supabase'

export type Mallage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; mallar: Packmall[] }

const KOLUMNER = 'id, namn, fran_tur_namn, skapad, packmallrader (id, namn, kategori, underkategori, antal, vikt_g, typ, alla, gemensam, egen_namn, egen_vikt_g, sortering)'

async function hamta(): Promise<Packmall[] | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('packmallar').select(KOLUMNER).order('skapad', { ascending: false })
  return error ? null : (data as Packmall[])
}

/** Den inloggades mallar med rader. Bara de egna går att läsa. */
export function usePackmallar(): { lage: Mallage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Mallage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const mallar = await hamta()
    setLage(mallar ? { lage: 'klar', mallar } : { lage: 'fel' })
  }, [])

  useEffect(() => {
    let aktuell = true
    hamta().then((mallar) => {
      if (aktuell) setLage(mallar ? { lage: 'klar', mallar } : { lage: 'fel' })
    })
    return () => {
      aktuell = false
    }
  }, [])

  return { lage, laddaOm }
}

/** Ett fel från databasen: namnet finns redan bland ens mallar, eller något annat. */
export type Mallfel = 'namnet-finns' | 'annat'

/** Sparar turens packlista som en ny mall. Ger felet, eller null när det gick. */
export async function sparaPackmall(turId: string, namn: string): Promise<Mallfel | null> {
  if (!supabase) return 'annat'
  const { error } = await supabase.rpc('spara_packmall', { t: turId, mall_namn: namn })
  if (!error) return null
  return error.code === '23505' ? 'namnet-finns' : 'annat'
}

/** Lägger mallens rader sist i turen. Ger antalet rader som lades till, eller null när det inte gick. */
export async function anvandPackmall(mallId: string, turId: string): Promise<number | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('anvand_packmall', { mall: mallId, t: turId })
  return error ? null : (data as number)
}

/** Byter namn på en mall. Ger felet, eller null när det gick. */
export async function bytMallnamn(id: string, namn: string): Promise<Mallfel | null> {
  if (!supabase) return 'annat'
  const { error, count } = await supabase.from('packmallar').update({ namn }, { count: 'exact' }).eq('id', id)
  if (error) return error.code === '23505' ? 'namnet-finns' : 'annat'
  return count === 1 ? null : 'annat'
}

/** Tar bort en mall med alla rader. Ger true när det gick. */
export async function taBortPackmall(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('packmallar').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}
