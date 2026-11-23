import { useCallback, useEffect, useState } from 'react'
import type { Deltagare as Matdeltagare } from '@/lib/vikt'
import { pasnamn, type TolkadIngrediens } from '@/lib/mat'
import { supabase } from '@/lib/supabase'
import type { Ingrediens, Kostbehov, Maltid, Maltidsrad, Matprodukt, Ratt, Vara } from '@/lib/typer'

/** Allt i turens matplan. Påsarna är de som turens rätter pekar på. */
export interface Matplan {
  ratter: Ratt[]
  ingredienser: Ingrediens[]
  varor: Vara[]
  maltider: Maltidsrad[]
  pasar: Map<string, Matprodukt>
  kostbehov: Kostbehov[]
  /** Deltagarna med matandel och hundmat, för vikten per person. */
  matdeltagare: Matdeltagare[]
}

export type Matlage = { lage: 'laddar' } | { lage: 'fel' } | { lage: 'klar'; plan: Matplan }

const MATPRODUKT = 'id, marke, namn, maltid, torkning, vikt_torr_g, portioner, kcal, protein_g, fett_g, kolhydrater_g, vatten_ml, tillagning_vatten, tillagning_min, vegetarisk, vegansk, glutenfri, laktosfri, allergener, spar, pris_sek_ca, pris_kalla, kalla, kontrollerad'

async function hamtaMatplan(turId: string): Promise<Matplan | null> {
  if (!supabase) return null
  const [ratter, ingredienser, varor, maltider, deltagare] = await Promise.all([
    supabase.from('ratter').select('id, namn, matprodukt_id, ansvarig, klart').eq('tur_id', turId).order('namn'),
    supabase.from('ingredienser').select('id, ratt_id, vara_id, gram_per_portion').eq('tur_id', turId),
    supabase.from('varor').select('id, namn, kcal_per_100g, protein_per_100g, extra_g, varifran, ansvarig, klart').eq('tur_id', turId).order('namn'),
    supabase.from('maltider').select('id, dag, maltid, ratt_id, sortering').eq('tur_id', turId).order('sortering'),
    supabase.from('deltagare').select('id, typ, matandel, hundmat_per_dag_g').eq('tur_id', turId),
  ])
  if (ratter.error || ingredienser.error || varor.error || maltider.error || deltagare.error) return null

  const rattrader = ratter.data as Ratt[]
  const deltagarrader = deltagare.data as { id: string; typ: 'person' | 'hund'; matandel: number | null; hundmat_per_dag_g: number | null }[]
  const pasIds = [...new Set(rattrader.map((r) => r.matprodukt_id).filter((id): id is string => id !== null))]
  const [pasar, kostbehov] = await Promise.all([
    pasIds.length ? supabase.from('matprodukter').select(MATPRODUKT).in('id', pasIds) : Promise.resolve({ data: [], error: null }),
    supabase.from('kostbehov').select('deltagare_id, vegetarisk, vegansk, glutenfri, laktosfri, utan').in(
      'deltagare_id',
      deltagarrader.map((d) => d.id),
    ),
  ])
  if (pasar.error || kostbehov.error) return null

  return {
    ratter: rattrader,
    ingredienser: ingredienser.data as Ingrediens[],
    varor: varor.data as Vara[],
    maltider: maltider.data as Maltidsrad[],
    pasar: new Map((pasar.data as Matprodukt[]).map((p) => [p.id, p])),
    kostbehov: kostbehov.data as Kostbehov[],
    matdeltagare: deltagarrader.map((d) => ({ id: d.id, typ: d.typ, matandel: d.matandel, hundmatPerDagG: d.hundmat_per_dag_g })),
  }
}

/** Turens matplan. laddaOm hämtar allt igen efter en ändring. */
export function useMatplan(turId: string): { lage: Matlage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Matlage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const plan = await hamtaMatplan(turId)
    setLage(plan ? { lage: 'klar', plan } : { lage: 'fel' })
  }, [turId])

  useEffect(() => {
    let aktuell = true
    hamtaMatplan(turId).then((plan) => {
      if (aktuell) setLage(plan ? { lage: 'klar', plan } : { lage: 'fel' })
    })
    return () => {
      aktuell = false
    }
  }, [turId])

  return { lage, laddaOm }
}

/** Hela matkatalogen, hämtad när man väljer en rätt. null medan den hämtas, 'fel' om det inte gick. */
export function useMatkatalog(): Matprodukt[] | null | 'fel' {
  const [katalog, setKatalog] = useState<Matprodukt[] | null | 'fel'>(null)
  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    supabase
      .from('matprodukter')
      .select(MATPRODUKT)
      .order('marke')
      .order('namn')
      .then(({ data, error }) => {
        if (aktuell) setKatalog(error ? 'fel' : (data as Matprodukt[]))
      })
    return () => {
      aktuell = false
    }
  }, [])
  return katalog
}

// ─── Spara ─────────────────────────────────────────────────────────────────
// Funktionerna svarar true när det gick. Databasen avgör vem som får ändra (RLS), så en läsare får alltid false.

/** Lägger en rätt som redan finns i turen i en måltid, sist. */
export async function laggIMaltid(turId: string, rattId: string, dag: number, maltid: Maltid, sortering: number): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('maltider').insert({ tur_id: turId, dag, maltid, ratt_id: rattId, sortering })
  return !error
}

/** Lägger en påse ur katalogen i en måltid. Rätten för påsen skapas första gången påsen används i turen. */
export async function laggTillPase(
  turId: string,
  pase: Matprodukt,
  befintlig: Ratt | undefined,
  dag: number,
  maltid: Maltid,
  sortering: number,
): Promise<boolean> {
  if (!supabase) return false
  let rattId = befintlig?.id
  if (!rattId) {
    const { data, error } = await supabase
      .from('ratter')
      .insert({ tur_id: turId, namn: pasnamn(pase), matprodukt_id: pase.id })
      .select('id')
      .single()
    if (error) return false
    rattId = data.id as string
  }
  return laggIMaltid(turId, rattId, dag, maltid, sortering)
}

export async function taBortUrMaltid(maltidId: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('maltider').delete().eq('id', maltidId)
  return !error
}

/**
 * Sparar en egen rätt med ingredienser och svarar med rättens id. Varor som redan finns i turen (samma namn)
 * används igen och får de nya uppgifterna om kcal och protein när de är ifyllda. En ny rätt som inte gick att
 * spara helt tas bort igen. En rätt som ändras får alla sina ingredienser på nytt.
 */
export async function sparaEgenRatt(
  turId: string,
  rattId: string | null,
  namn: string,
  rader: readonly TolkadIngrediens[],
  varor: readonly Vara[],
): Promise<string | null> {
  if (!supabase) return null
  const db = supabase

  let id = rattId
  if (id) {
    const { error } = await db.from('ratter').update({ namn }).eq('id', id)
    if (error) return null
    const bort = await db.from('ingredienser').delete().eq('ratt_id', id)
    if (bort.error) return null
  } else {
    const { data, error } = await db.from('ratter').insert({ tur_id: turId, namn }).select('id').single()
    if (error) return null
    id = data.id as string
  }

  const misslyckades = async () => {
    if (!rattId) await db.from('ratter').delete().eq('id', id)
    return null
  }

  const varuIds: string[] = []
  for (const rad of rader) {
    const finns = varor.find((v) => v.namn.toLowerCase() === rad.vara.toLowerCase())
    const uppgifter = {
      ...(rad.kcalPer100g !== null && { kcal_per_100g: rad.kcalPer100g }),
      ...(rad.proteinPer100g !== null && { protein_per_100g: rad.proteinPer100g }),
    }
    if (finns) {
      if (Object.keys(uppgifter).length) {
        const { error } = await db.from('varor').update(uppgifter).eq('id', finns.id)
        if (error) return misslyckades()
      }
      varuIds.push(finns.id)
    } else {
      const { data, error } = await db.from('varor').insert({ tur_id: turId, namn: rad.vara, ...uppgifter }).select('id').single()
      if (error) return misslyckades()
      varuIds.push(data.id as string)
    }
  }

  const { error } = await db
    .from('ingredienser')
    .insert(rader.map((r, i) => ({ tur_id: turId, ratt_id: id, vara_id: varuIds[i], gram_per_portion: r.gram })))
  if (error) return misslyckades()
  return id
}
