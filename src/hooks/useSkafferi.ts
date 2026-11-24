import { useCallback, useEffect, useState } from 'react'
import { antalPasar } from '@/lib/mat'
import { MAX_ANTAL, type Bokning, type Bokningstur } from '@/lib/skafferi'
import { lage, lokaltDatum } from '@/lib/turlista'
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

/** Påsarna i ens andra turer: för Senast använda och för det som redan går till andra turer ur skafferiet. */
export interface AndraTurer {
  turer: Bokningstur[]
  /** Påsarna i de andra turerna. */
  pasar: { turId: string; matproduktId: string }[]
  /** Påsarna man själv ansvarar för i andra turer som inte är avslutade, med antal påsar som turen behöver. */
  bokningar: Bokning[]
}

const INGA_ANDRA: AndraTurer = { turer: [], pasar: [], bokningar: [] }

type Turrad = Bokningstur & { reservdagar: number }

async function hamtaAndraTurer(turId: string, userId: string): Promise<AndraTurer> {
  if (!supabase) return INGA_ANDRA
  // RLS (ar_medlem) gör att bara turer man är med i kommer med.
  const [turer, ratter, deltagare] = await Promise.all([
    supabase.from('turer').select('id, avresa, hemkomst, dagar, reservdagar, skapad'),
    supabase.from('ratter').select('id, tur_id, matprodukt_id, ansvarig').neq('tur_id', turId).not('matprodukt_id', 'is', null),
    supabase.from('deltagare').select('id, tur_id, typ, user_id').neq('tur_id', turId),
  ])
  if (turer.error || ratter.error || deltagare.error) return INGA_ANDRA
  const turrader = turer.data as Turrad[]
  const rattrader = ratter.data as { id: string; tur_id: string; matprodukt_id: string; ansvarig: string | null }[]
  const deltagarrader = deltagare.data as { id: string; tur_id: string; typ: string; user_id: string | null }[]

  const idag = lokaltDatum()
  const aktiva = new Map(turrader.filter((t) => t.id !== turId && lage(t, idag) !== 'tidigare').map((t) => [t.id, t]))
  const mina = new Set(deltagarrader.filter((d) => d.user_id === userId).map((d) => d.id))
  const ansvarar = rattrader.filter((r) => r.ansvarig && mina.has(r.ansvarig) && aktiva.has(r.tur_id))

  let bokningar: Bokning[] = []
  if (ansvarar.length > 0) {
    const [maltider, pasar] = await Promise.all([
      supabase.from('maltider').select('ratt_id, dag').in('ratt_id', ansvarar.map((r) => r.id)),
      supabase.from('matprodukter').select('id, portioner').in('id', [...new Set(ansvarar.map((r) => r.matprodukt_id))]),
    ])
    if (!maltider.error && !pasar.error) {
      const portioner = new Map((pasar.data as { id: string; portioner: number }[]).map((p) => [p.id, p.portioner]))
      bokningar = ansvarar.map((r) => {
        const tur = aktiva.get(r.tur_id)!
        const sista = (tur.dagar ?? 0) + tur.reservdagar
        const ganger = (maltider.data as { ratt_id: string; dag: number }[]).filter((m) => m.ratt_id === r.id && m.dag <= sista).length
        const personer = deltagarrader.filter((d) => d.tur_id === r.tur_id && d.typ === 'person').length
        return { turId: r.tur_id, matproduktId: r.matprodukt_id, pasar: antalPasar(ganger, personer, portioner.get(r.matprodukt_id) ?? 1) }
      })
    }
  }
  return { turer: turrader, pasar: rattrader.map((r) => ({ turId: r.tur_id, matproduktId: r.matprodukt_id })), bokningar }
}

/**
 * Ens andra turer, för Senast använda och bokningen ur skafferiet. Går det inte att hämta visas matplanen ändå,
 * utan de uppgifterna.
 */
export function useAndraTurer(turId: string, userId: string | null): AndraTurer {
  const [andra, setAndra] = useState<AndraTurer>(INGA_ANDRA)
  useEffect(() => {
    if (!userId) return
    let aktuell = true
    hamtaAndraTurer(turId, userId).then((a) => {
      if (aktuell) setAndra(a)
    })
    return () => {
      aktuell = false
    }
  }, [turId, userId])
  return andra
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
