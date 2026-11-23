import { useCallback, useEffect, useState } from 'react'
import type { TolkadIngrediens } from '@/lib/mat'
import { supabase } from '@/lib/supabase'
import type { Recept } from '@/lib/typer'

/** Ens egna recept. null medan de hämtas, 'fel' om det inte gick. */
export type Receptlage = Recept[] | null | 'fel'

const KOLUMNER = 'id, namn, rader:receptrader(id, recept_id, vara, gram_per_portion, kcal_per_100g, protein_per_100g, sortering)'

async function hamtaRecept(): Promise<Recept[] | 'fel'> {
  if (!supabase) return 'fel'
  // RLS gör att bara ens egna recept kommer tillbaka, även i en delad tur.
  const { data, error } = await supabase.from('recept').select(KOLUMNER).order('namn')
  if (error) return 'fel'
  return (data as unknown as Recept[]).map((r) => ({
    ...r,
    rader: r.rader.map((x) => ({ ...x, protein_per_100g: x.protein_per_100g === null ? null : Number(x.protein_per_100g) })),
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
 * Sparar ett nytt eller ändrat recept och svarar med receptets id, eller null om det inte gick. Ett ändrat recept
 * får alla sina ingredienser på nytt. Ett nytt recept som inte gick att spara helt tas bort igen.
 */
export async function sparaRecept(receptId: string | null, namn: string, rader: readonly TolkadIngrediens[]): Promise<string | null> {
  if (!supabase) return null
  const db = supabase
  let id = receptId
  if (id) {
    const { data, error } = await db.from('recept').update({ namn }).eq('id', id).select('id')
    if (error || data.length !== 1) return null
    const bort = await db.from('receptrader').delete().eq('recept_id', id)
    if (bort.error) return null
  } else {
    const { data, error } = await db.from('recept').insert({ namn }).select('id').single()
    if (error) return null
    id = data.id as string
  }
  const { error } = await db.from('receptrader').insert(
    rader.map((r, i) => ({
      recept_id: id,
      vara: r.vara.trim(),
      gram_per_portion: r.gram,
      kcal_per_100g: r.kcalPer100g,
      protein_per_100g: r.proteinPer100g,
      sortering: i,
    })),
  )
  if (error) {
    if (!receptId) await db.from('recept').delete().eq('id', id)
    return null
  }
  return id
}

/** Raderar ett recept med dess ingredienser. Turer där det redan ligger påverkas inte. */
export async function taBortRecept(id: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.from('recept').delete().eq('id', id).select('id')
  return !error && data.length === 1
}
