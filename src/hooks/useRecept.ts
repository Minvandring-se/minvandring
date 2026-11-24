import { useCallback, useEffect, useState } from 'react'
import { ingredienserTillDatabasen, type TolkadIngrediens } from '@/lib/mat'
import { supabase } from '@/lib/supabase'
import type { Recept } from '@/lib/typer'

/** Ens egna recept. null medan de hämtas, 'fel' om det inte gick. */
export type Receptlage = Recept[] | null | 'fel'

const KOLUMNER = 'id, namn, rader:receptrader(id, recept_id, vara, mangd, enhet, gram_per_portion, kcal_per_100g, protein_per_100g, sortering)'

async function hamtaRecept(): Promise<Recept[] | 'fel'> {
  if (!supabase) return 'fel'
  // RLS gör att bara ens egna recept kommer tillbaka, även i en delad tur.
  const { data, error } = await supabase.from('recept').select(KOLUMNER).order('namn')
  if (error) return 'fel'
  return (data as unknown as Recept[]).map((r) => ({
    ...r,
    // Postgres numeric kommer som text.
    rader: r.rader.map((x) => ({ ...x, mangd: x.mangd === null ? null : Number(x.mangd), protein_per_100g: x.protein_per_100g === null ? null : Number(x.protein_per_100g) })),
  }))
}

/** Ens recept, sorterade efter namn. laddaOm hämtar dem igen efter en ändring. */
export function useRecept(): { recept: Receptlage; laddaOm: () => Promise<void> } {
  const [recept, setRecept] = useState<Receptlage>(null)

  const laddaOm = useCallback(async () => {
    setRecept(await hamtaRecept())
  }, [])

  useEffect(() => {
    let aktuell = true
    hamtaRecept().then((r) => {
      if (aktuell) setRecept(r)
    })
    return () => {
      aktuell = false
    }
  }, [])

  return { recept, laddaOm }
}

/**
 * Sparar ett nytt eller ändrat recept och svarar med receptets id, eller null om det inte gick. Görs av funktionen
 * spara_recept i databasen, i en transaktion: ett ändrat recept får alla sina ingredienser på nytt, eller behåller
 * de gamla om något går fel.
 */
export async function sparaRecept(receptId: string | null, namn: string, rader: readonly TolkadIngrediens[]): Promise<string | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('spara_recept', { r: receptId, recept_namn: namn, rader: ingredienserTillDatabasen(rader) })
  return error || typeof data !== 'string' ? null : data
}

/** Raderar ett recept med dess ingredienser. Turer där det redan ligger påverkas inte. */
export async function taBortRecept(id: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('recept').delete().eq('id', id).select('id')
  return !error && data.length === 1
}
