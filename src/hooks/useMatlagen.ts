import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Maltid } from '@/lib/typer'

type Rad = { tur_id: string; dag: number; maltid: Maltid }

export interface Matlagen {
  /** Måltidsraderna per tur. null medan de hämtas, 'fel' när de inte gick att hämta. */
  rader: ReadonlyMap<string, { dag: number; maltid: Maltid }[]> | null | 'fel'
  forsokIgen: () => void
}

/**
 * Vilka måltider som har en rätt i varje tur, för Mina matplaner. Bara dag och måltid hämtas, inte rätterna.
 * Hämtas i en fråga för alla turerna. RLS (ar_medlem) gör att bara turer man är med i kommer med.
 */
export function useMatlagen(turIds: readonly string[]): Matlagen {
  const [rader, setRader] = useState<Matlagen['rader']>(null)
  const [omgang, setOmgang] = useState(0)
  const nyckel = turIds.join(',')

  useEffect(() => {
    if (!supabase) return
    if (!nyckel) return
    const ids = nyckel.split(',')
    let aktuell = true
    supabase
      .from('maltider')
      .select('tur_id, dag, maltid')
      .in('tur_id', ids)
      .then(({ data, error }) => {
        if (!aktuell) return
        if (error) {
          setRader('fel')
          return
        }
        const perTur = new Map<string, { dag: number; maltid: Maltid }[]>()
        for (const r of (data as Rad[] | null) ?? []) {
          const lista = perTur.get(r.tur_id) ?? []
          lista.push({ dag: r.dag, maltid: r.maltid })
          perTur.set(r.tur_id, lista)
        }
        setRader(perTur)
      })
    return () => {
      aktuell = false
    }
  }, [nyckel, omgang])

  const forsokIgen = useCallback(() => {
    setRader(null)
    setOmgang((n) => n + 1)
  }, [])

  // Utan turer finns inget att hämta.
  return { rader: nyckel ? rader : INGA, forsokIgen }
}

const INGA: ReadonlyMap<string, { dag: number; maltid: Maltid }[]> = new Map()
