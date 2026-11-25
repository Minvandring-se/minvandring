import { useCallback, useEffect, useState } from 'react'
import type { NyPackrad } from '@/lib/packlista'
import { supabase } from '@/lib/supabase'
import type { Forradssak, PackradRad, PackstatusRad } from '@/lib/typer'

export interface Packlista {
  rader: PackradRad[]
  status: PackstatusRad[]
}

export type Packlage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; lista: Packlista }

const RAD = 'id, tur_id, namn, kategori, underkategori, produkt_id, antal, vikt_g, typ, bars_av, alla, gemensam, dubblett_ok, med, notering, sortering'
const STATUS = 'packrad_id, deltagare_id, tur_id, packad, namn, vikt_g, produkt_id'

async function hamtaPacklista(turId: string): Promise<Packlista | null> {
  if (!supabase) return null
  const [rader, status] = await Promise.all([
    supabase.from('packrader').select(RAD).eq('tur_id', turId),
    supabase.from('packstatus').select(STATUS).eq('tur_id', turId),
  ])
  if (rader.error || status.error) return null
  return { rader: rader.data as PackradRad[], status: status.data as PackstatusRad[] }
}

/**
 * Turens packlista. Hämtas igen när någon i turen ändrar en rad eller en bock, så att alla ser samma lista.
 * laddaOm hämtar allt igen efter en egen ändring.
 */
export function usePacklista(turId: string): { lage: Packlage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Packlage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const lista = await hamtaPacklista(turId)
    setLage(lista ? { lage: 'klar', lista } : { lage: 'fel' })
  }, [turId])

  useEffect(() => {
    let aktuell = true
    const hamta = () =>
      hamtaPacklista(turId).then((lista) => {
        if (aktuell) setLage(lista ? { lage: 'klar', lista } : { lage: 'fel' })
      })
    hamta()
    const kanal = supabase
      ?.channel(`packlista-${turId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packrader', filter: `tur_id=eq.${turId}` }, hamta)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'packstatus', filter: `tur_id=eq.${turId}` }, hamta)
      .subscribe()
    return () => {
      aktuell = false
      if (kanal) supabase?.removeChannel(kanal)
    }
  }, [turId])

  return { lage, laddaOm }
}

/** Ens eget förråd, för att lägga till saker i packlistan. null medan det hämtas, 'fel' om det inte gick. */
export function useMittForrad(): { saker: Forradssak[] | null | 'fel'; forsokIgen: () => void } {
  const [saker, setSaker] = useState<Forradssak[] | null | 'fel'>(null)
  const [omgang, setOmgang] = useState(0)
  useEffect(() => {
    let aktuell = true
    supabase
      ?.from('forradssaker')
      .select('id, produkt_id, namn, kategori, underkategori, antal, vikt_g, typ, notering, kok_id')
      .order('namn')
      .then(({ data, error }) => {
        if (aktuell) setSaker(error ? 'fel' : ((data as Forradssak[] | null) ?? []))
      })
    return () => {
      aktuell = false
    }
  }, [omgang])
  return { saker, forsokIgen: () => setOmgang((n) => n + 1) }
}

export async function laggTillPackrader(rader: NyPackrad[]): Promise<boolean> {
  if (!supabase || rader.length === 0) return false
  const { error } = await supabase.from('packrader').insert(rader)
  return !error
}

export async function taBortPackrad(id: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('packrader').delete().eq('id', id)
  return !error
}

/** Bocken för en deltagare på en rad. Skapar raden i packstatus om den inte finns. */
export async function satPackad(rad: PackradRad, deltagareId: string, packad: boolean): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase
    .from('packstatus')
    .upsert({ packrad_id: rad.id, deltagare_id: deltagareId, tur_id: rad.tur_id, packad }, { onConflict: 'packrad_id,deltagare_id' })
  return !error
}

/** Ens egen modell på en rad som alla ska ha. Bocken lämnas som den är. */
export async function sparaEgenModell(
  modell: Pick<PackstatusRad, 'packrad_id' | 'deltagare_id' | 'tur_id' | 'namn' | 'vikt_g' | 'produkt_id'>,
): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('packstatus').upsert(modell, { onConflict: 'packrad_id,deltagare_id' })
  return !error
}

/** Tar på sig en gemensam rad som ingen bär, eller släpper en rad man själv bär. Fungerar även för läsare. */
export async function taMedGemensam(radId: string, ta: boolean): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.rpc('ta_med_gemensam', { rad: radId, ta })
  return !error
}

/** Svaret att alla rader av samma sort behövs. */
export async function dubbletterBehovs(radIds: string[]): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('packrader').update({ dubblett_ok: true }).in('id', radIds)
  return !error
}
