import { useEffect, useState } from 'react'
import { HUVUDGRUPPER, huvudgruppFor } from '@/lib/livsmedelsgrupper'
import { monsterForDatabasen, rangordnaLivsmedel } from '@/lib/livsmedel'
import { kortForLivsmedel, kortForVara, rakna, type Livsmedelskort, type Naringskort, type Varukort } from '@/lib/matkatalog'
import { supabase } from '@/lib/supabase'
import { rangordnaVaror, varumonster } from '@/lib/varukatalog'

const VARUKOLUMNER = 'id, marke, namn, kategori, kcal_per_100g, protein_per_100g, vegetarisk, vegansk, glutenfri, laktosfri, allergener, spar'
const LIVSMEDELSKOLUMNER = 'nummer, namn, grupp, tillstand, kcal_per_100g, protein_per_100g, allergener'
/** Fler än så hämtas inte för en sökning eller grupp. Den största gruppen har knappt 700 livsmedel. */
const MAX = 1000

export type Hamtat<T> = T | null | 'fel'

async function hamtaVaror(sok: string, grupp: string): Promise<Naringskort[] | 'fel'> {
  const monster = varumonster(sok)
  let fraga = supabase!.from('varukatalog').select(VARUKOLUMNER)
  // Mönstret består bara av bokstäver och siffror, så det går att sätta in i filtret som det är.
  if (monster) fraga = fraga.or(`namn.ilike.%${monster}%,marke.ilike.%${monster}%`)
  if (grupp) fraga = fraga.eq('kategori', grupp)
  const { data, error } = await fraga.order('marke').order('namn').limit(MAX)
  if (error) return 'fel'
  const rader = (data as Varukort[] | null) ?? []
  // Databasen sorterar inte Å, Ä och Ö som på svenska, så utan sökning sorteras listan här.
  const sorterade = monster ? rangordnaVaror(rader, sok, MAX) : [...rader].sort((a, b) => a.marke.localeCompare(b.marke, 'sv') || a.namn.localeCompare(b.namn, 'sv'))
  return sorterade.map(kortForVara)
}

async function hamtaLivsmedel(sok: string, grupp: string): Promise<Naringskort[] | 'fel'> {
  const monster = monsterForDatabasen(sok)
  const grupper = HUVUDGRUPPER.find((h) => h.nyckel === grupp)?.grupper
  let fraga = supabase!.from('livsmedel').select(LIVSMEDELSKOLUMNER)
  // Mönstren består bara av bokstäver, siffror och %, så de går att sätta in i filtret som de är.
  if (monster) fraga = fraga.or(monster.map((m) => `namn.ilike.%${m}%`).join(','))
  if (grupper) fraga = fraga.in('grupp', [...grupper])
  const { data, error } = await fraga.order('namn').limit(MAX)
  if (error) return 'fel'
  const rader = (data as Livsmedelskort[] | null) ?? []
  const sorterade = monster ? rangordnaLivsmedel(rader, sok, MAX) : [...rader].sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
  return sorterade.map(kortForLivsmedel)
}

/**
 * Märkesvaror eller livsmedel för det man har sökt eller den grupp man har valt, som kort. Databasen söker och
 * filtrerar på gruppen efter en kort paus i skrivandet. null medan det hämtas, och en tom sökning utan grupp ger en
 * tom lista utan att något hämtas.
 */
export function useNaringskatalog(del: 'varor' | 'livsmedel', sok: string, grupp: string): Hamtat<Naringskort[]> {
  const nyckel = `${del}|${sok}|${grupp}`
  const [svar, setSvar] = useState<{ nyckel: string; kort: Naringskort[] | 'fel' } | null>(null)
  const tom = sok.trim().length < 2 && !grupp

  useEffect(() => {
    if (!supabase || tom) return
    let aktuell = true
    const timer = setTimeout(async () => {
      const kort = del === 'varor' ? await hamtaVaror(sok, grupp) : await hamtaLivsmedel(sok, grupp)
      if (aktuell) setSvar({ nyckel, kort })
    }, 250)
    return () => {
      aktuell = false
      clearTimeout(timer)
    }
  }, [del, sok, grupp, nyckel, tom])

  if (tom) return []
  if (!supabase) return 'fel'
  return svar?.nyckel === nyckel ? svar.kort : null
}

/** Sidor om 1 000 rader, eftersom databasen inte lämnar fler åt gången. */
async function allaVarden(tabell: 'varukatalog' | 'livsmedel', kolumn: 'kategori' | 'grupp'): Promise<(string | null)[] | 'fel'> {
  const ut: (string | null)[] = []
  for (let fran = 0; ; fran += MAX) {
    const { data, error } = await supabase!.from(tabell).select(kolumn).order(kolumn).range(fran, fran + MAX - 1)
    if (error) return 'fel'
    const rader = (data as Record<string, string | null>[] | null) ?? []
    ut.push(...rader.map((r) => r[kolumn]))
    if (rader.length < MAX) return ut
  }
}

/** Hur många märkesvaror det finns per kategori, eller livsmedel per huvudgrupp, för rutorna. Tomt om det inte gick att hämta. */
export function useGruppantal(del: 'varor' | 'livsmedel'): Record<string, number> {
  const [antal, setAntal] = useState<{ del: string; antal: Record<string, number> } | null>(null)

  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    const hamta = async () => {
      const varden = del === 'varor' ? await allaVarden('varukatalog', 'kategori') : await allaVarden('livsmedel', 'grupp')
      if (!aktuell || varden === 'fel') return
      setAntal({ del, antal: rakna(del === 'varor' ? varden : varden.map(huvudgruppFor)) })
    }
    void hamta()
    return () => {
      aktuell = false
    }
  }, [del])

  return antal?.del === del ? antal.antal : {}
}

export interface Katalogantal {
  pasar: number
  varor: number
  livsmedel: number
}

/** Hur många påsar, märkesvaror och livsmedel det finns, räknat i databasen. null tills alla tre är räknade eller om det inte gick. */
export function useKatalogantal(): Katalogantal | null {
  const [antal, setAntal] = useState<Katalogantal | null>(null)

  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    const rakna = async (tabell: 'matprodukter' | 'varukatalog' | 'livsmedel') => {
      const { count, error } = await supabase!.from(tabell).select('*', { count: 'exact', head: true })
      return error ? null : count
    }
    void Promise.all([rakna('matprodukter'), rakna('varukatalog'), rakna('livsmedel')]).then(([pasar, varor, livsmedel]) => {
      if (aktuell && pasar !== null && varor !== null && livsmedel !== null) setAntal({ pasar, varor, livsmedel })
    })
    return () => {
      aktuell = false
    }
  }, [])

  return antal
}
