import { useCallback, useEffect, useState } from 'react'
import { forvaldTyp } from '@/lib/forrad'
import { nyMallrad, type NyMallrad, type Packmall, type Packmallrad } from '@/lib/packmallar'
import type { Startmall } from '@/lib/startmallar'
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

export type EnMall = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'saknas' } | { lage: 'klar'; mall: Packmall }

/** En av ens mallar med raderna. 'saknas' när den inte finns eller är någon annans. */
export function usePackmall(id: string): { lage: EnMall; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<EnMall>({ lage: 'laddar' })

  const hamtaEn = useCallback(async (): Promise<EnMall> => {
    if (!supabase) return { lage: 'fel' }
    const { data, error } = await supabase.from('packmallar').select(KOLUMNER).eq('id', id).maybeSingle()
    if (error) return { lage: error.code === '22P02' ? 'saknas' : 'fel' }
    return data ? { lage: 'klar', mall: data as Packmall } : { lage: 'saknas' }
  }, [id])

  const laddaOm = useCallback(async () => setLage(await hamtaEn()), [hamtaEn])

  useEffect(() => {
    let aktuell = true
    hamtaEn().then((l) => aktuell && setLage(l))
    return () => {
      aktuell = false
    }
  }, [hamtaEn])

  return { lage, laddaOm }
}

/** Skapar en tom mall. Ger id:t, eller felet. */
export async function skapaMall(namn: string): Promise<{ id: string } | { fel: Mallfel }> {
  if (!supabase) return { fel: 'annat' }
  const { data, error } = await supabase.from('packmallar').insert({ namn }).select('id').single()
  if (error || !data) return { fel: error?.code === '23505' ? 'namnet-finns' : 'annat' }
  return { id: (data as { id: string }).id }
}

/** Lägger rader i en egen mall. Ger true när det gick. */
export async function laggTillMallrader(rader: NyMallrad[]): Promise<boolean> {
  if (!supabase || rader.length === 0) return false
  const { error } = await supabase.from('packmallrader').insert(rader)
  return !error
}

/** Ändrar en rad i en egen mall. Ger true när det gick. */
export async function andraMallrad(id: string, andring: Partial<Omit<Packmallrad, 'id'>> & { egen_produkt_id?: null }): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('packmallrader').update(andring, { count: 'exact' }).eq('id', id)
  return !error && count === 1
}

/** Tar bort en rad ur en egen mall. Ger true när det gick. */
export async function taBortMallrad(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error, count } = await supabase.from('packmallrader').delete({ count: 'exact' }).eq('id', id)
  return !error && count === 1
}

/** Gör en egen mall av en startmall. Går raderna inte att spara tas den tomma mallen bort igen. */
export async function kopieraStartmall(start: Startmall, namn: string): Promise<{ id: string } | { fel: Mallfel }> {
  const ny = await skapaMall(namn)
  if ('fel' in ny) return ny
  const rader = start.rader.map((r, i) => nyMallrad(ny.id, { ...r, antal: r.antal ?? 1, vikt_g: null, typ: forvaldTyp(r.kategori, r.underkategori) }, r.vem, i + 1))
  if (await laggTillMallrader(rader)) return ny
  await taBortPackmall(ny.id)
  return { fel: 'annat' }
}
