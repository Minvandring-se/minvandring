import { useEffect, useState } from 'react'
import type { Behov } from '@/lib/kost'
import type { Katalogrecept } from '@/lib/receptkatalog'
import { supabase } from '@/lib/supabase'
import type { Ingrediens, Kostbehov, Ratt, Vara } from '@/lib/typer'

const KOLUMNER = `id, namn, maltid, portioner, kok_kravs, torkning_hemma, beskrivning, mangder, inspirerat_av, inspirerat_av_url, status,
  ingredienser:receptkatalog_ingredienser(ordning, ingrediens, mangd, enhet, packas, kommentar, livsmedel_nummer, varukatalog_id,
    livsmedel(namn, grupp, allergener, kcal_per_100g, protein_per_100g),
    varukatalog(vegetarisk, vegansk, glutenfri, laktosfri, allergener, spar, kcal_per_100g, protein_per_100g)),
  steg:receptkatalog_steg(steg_nr, var, steg, tid_min)`

const tal = (v: unknown) => (v === null || v === undefined ? null : Number(v))

/** MinVandrings recept med ingredienser, kopplingar och steg. null medan de hämtas, 'fel' om det inte gick. */
export function useReceptkatalog(): Katalogrecept[] | null | 'fel' {
  const [recept, setRecept] = useState<Katalogrecept[] | null | 'fel'>(null)

  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    supabase
      .from('receptkatalog')
      .select(KOLUMNER)
      .order('namn')
      .then(({ data, error }) => {
        if (!aktuell) return
        if (error) return setRecept('fel')
        // Postgres numeric kommer som text.
        const rader = (data as unknown as Katalogrecept[]).map((r) => ({
          ...r,
          ingredienser: r.ingredienser.map((i) => ({
            ...i,
            mangd: tal(i.mangd),
            livsmedel: i.livsmedel && { ...i.livsmedel, kcal_per_100g: tal(i.livsmedel.kcal_per_100g), protein_per_100g: tal(i.livsmedel.protein_per_100g) },
            varukatalog: i.varukatalog && { ...i.varukatalog, protein_per_100g: tal(i.varukatalog.protein_per_100g) },
          })),
        }))
        setRecept(rader)
      })
    return () => {
      aktuell = false
    }
  }, [])

  return recept
}

/** En tur man kan lägga ett recept i: man är ägare eller redigerare. */
export interface RedigerbarTur {
  id: string
  namn: string
  avresa: string | null
}

/** Turerna där man är ägare eller redigerare. null medan de hämtas, 'fel' om det inte gick. */
export function useRedigerbaraTurer(): RedigerbarTur[] | null | 'fel' {
  const [turer, setTurer] = useState<RedigerbarTur[] | null | 'fel'>(null)

  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    const hamta = async () => {
      const { data: anvandare } = await supabase!.auth.getUser()
      if (!anvandare.user) return aktuell && setTurer('fel')
      const { data, error } = await supabase!.from('deltagare').select('roll, tur:turer(id, namn, avresa)').eq('user_id', anvandare.user.id).in('roll', ['owner', 'editor'])
      if (!aktuell) return
      if (error) return setTurer('fel')
      const lista = ((data as unknown as { tur: RedigerbarTur | null }[]) ?? []).flatMap((d) => (d.tur ? [d.tur] : []))
      // Kommande turer först, i datumordning, och turer utan datum sist.
      setTurer(lista.sort((a, b) => (a.avresa ?? '9999').localeCompare(b.avresa ?? '9999') || a.namn.localeCompare(b.namn, 'sv')))
    }
    void hamta()
    return () => {
      aktuell = false
    }
  }, [])

  return turer
}

/** Det som behövs för att lägga ett recept i en tur: turens rätter, ingredienser och varor och gruppens kostbehov. */
export interface Turlage {
  ratter: Ratt[]
  ingredienser: Ingrediens[]
  varor: Vara[]
  behov: Behov[]
}

export async function hamtaTurlage(turId: string): Promise<Turlage | null> {
  if (!supabase) return null
  const [ratter, ingredienser, varor, deltagare] = await Promise.all([
    supabase.from('ratter').select('id, namn, matprodukt_id, ansvarig, klart').eq('tur_id', turId),
    supabase.from('ingredienser').select('id, ratt_id, vara_id, mangd, enhet, gram_per_portion').eq('tur_id', turId),
    supabase.from('varor').select('id, namn, kcal_per_100g, protein_per_100g, extra_g, varifran, ansvarig, klart, avdelning, varukatalog_id').eq('tur_id', turId),
    supabase.from('deltagare').select('id, namn').eq('tur_id', turId),
  ])
  if (ratter.error || ingredienser.error || varor.error || deltagare.error) return null
  // Kostbehoven hör till deltagarna, och RLS släpper bara fram dem i turer man är med i.
  const kostbehov = await supabase
    .from('kostbehov')
    .select('deltagare_id, vegetarisk, vegansk, glutenfri, laktosfri, utan, samtycke_tid')
    .in(
      'deltagare_id',
      (deltagare.data as { id: string }[]).map((d) => d.id),
    )
  if (kostbehov.error) return null
  const namn = new Map((deltagare.data as { id: string; namn: string }[]).map((d) => [d.id, d.namn]))
  return {
    ratter: ratter.data as Ratt[],
    ingredienser: (ingredienser.data as Ingrediens[]).map((i) => ({ ...i, mangd: i.mangd === null ? null : Number(i.mangd) })),
    varor: (varor.data as Vara[]).map((v) => ({ ...v, protein_per_100g: v.protein_per_100g === null ? null : Number(v.protein_per_100g) })),
    behov: (kostbehov.data as Kostbehov[]).flatMap((k) => (namn.has(k.deltagare_id) ? [{ ...k, namn: namn.get(k.deltagare_id)! }] : [])),
  }
}
