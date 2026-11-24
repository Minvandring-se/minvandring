import { useCallback, useEffect, useState } from 'react'
import type { Deltagare as Matdeltagare } from '@/lib/vikt'
import { ingredienserTillDatabasen, pasnamn, type TolkadIngrediens } from '@/lib/mat'
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
    supabase.from('kostbehov').select('deltagare_id, vegetarisk, vegansk, glutenfri, laktosfri, utan, samtycke_tid').in(
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
export function useMatkatalog(): { katalog: Matprodukt[] | null | 'fel'; forsokIgen: () => void } {
  const [katalog, setKatalog] = useState<Matprodukt[] | null | 'fel'>(null)
  // Räknas upp av Försök igen, så att katalogen hämtas igen.
  const [omgang, setOmgang] = useState(0)
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
  }, [omgang])
  const forsokIgen = useCallback(() => {
    setKatalog(null)
    setOmgang((n) => n + 1)
  }, [])
  return { katalog, forsokIgen }
}

// ─── Spara ─────────────────────────────────────────────────────────────────
// Funktionerna svarar true när det gick. Databasen avgör vem som får ändra (RLS). En ändring eller borttagning som
// RLS stoppar ger inget fel, bara noll rader, så de funktionerna läser tillbaka raderna och räknar dem.

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
  const { data, error } = await supabase.from('maltider').delete().eq('id', maltidId).select('id')
  return !error && data.length === 1
}

/**
 * Sparar en egen rätt med ingredienser och svarar med rättens id, eller null om det inte gick. Görs av funktionen
 * spara_egen_ratt i databasen, i en transaktion: allt sparas eller ingenting. Varor som redan finns i turen (samma
 * namn) används igen och får de nya uppgifterna om kcal och protein när de är ifyllda. En rätt som ändras får alla
 * sina ingredienser på nytt. Med maltid läggs en ny rätt också i måltiden, i samma transaktion.
 */
export async function sparaEgenRatt(
  turId: string,
  rattId: string | null,
  namn: string,
  rader: readonly TolkadIngrediens[],
  maltid?: { dag: number; maltid: Maltid; sortering: number },
): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('spara_egen_ratt', {
    t: turId,
    r: rattId,
    ratt_namn: namn,
    rader: ingredienserTillDatabasen(rader),
    dag_nr: maltid?.dag ?? null,
    maltid_typ: maltid?.maltid ?? null,
    plats: maltid?.sortering ?? 0,
  })
  return error || typeof data !== 'string' ? null : data
}

/** Ändrar en rad i inköpslistan: en vara (ansvarig, klart, varifrån) eller en påse (ansvarig, klart). */
export async function andraInkopsrad(
  typ: 'vara' | 'pase',
  id: string,
  andring: { ansvarig?: string | null; klart?: boolean; varifran?: 'kopa' | 'hemifran' },
): Promise<boolean> {
  if (!supabase) return false
  if (typ === 'pase' && andring.varifran) return false
  // En påse är en rätt med matprodukt_id. Egna rätter har ansvarig och klart på varorna.
  const { data, error } =
    typ === 'vara'
      ? await supabase.from('varor').update(andring).eq('id', id).select('id')
      : await supabase.from('ratter').update(andring).eq('id', id).not('matprodukt_id', 'is', null).select('id')
  return !error && data.length === 1
}

/**
 * Sparar den inloggades kostbehov med tiden för samtycket. Anropas bara när kryssrutan för samtycke är ikryssad.
 * En rad utan några val sparas också: den betyder att personen har sagt att den inte har några kostbehov, till
 * skillnad från ingen rad alls. Samtycket återkallas med taBortKostbehov.
 */
export async function sparaKostbehov(behov: Omit<Kostbehov, 'samtycke_tid'>): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('kostbehov').upsert({ ...behov, samtycke_tid: new Date().toISOString() })
  return !error
}

/** Tar bort den inloggades kostbehov i turen. Samtycket är då återkallat. */
export async function taBortKostbehov(deltagareId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('kostbehov').delete().eq('deltagare_id', deltagareId).select('deltagare_id')
  return !error && data.length === 1
}

/**
 * Raderar en egen rätt ur turen, med måltiderna den ligger i och varorna som ingen annan rätt använder.
 * Görs av funktionen ta_bort_egen_ratt i databasen, i en transaktion och utifrån databasens läge.
 */
export async function taBortEgenRatt(rattId: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.rpc('ta_bort_egen_ratt', { r: rattId })
  return !error
}
