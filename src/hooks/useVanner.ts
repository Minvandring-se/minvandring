import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Forfragan, Skickad, VandratIhop, Van, Vanlank } from '@/lib/vanner'

export interface Vanlistor {
  vanner: Van[]
  forfragningar: Forfragan[]
  skickade: Skickad[]
  vandratIhop: VandratIhop[]
  lank: Vanlank | null
}

export type Vanlage = { lage: 'laddar' } | { lage: 'fel' } | ({ lage: 'klar' } & Vanlistor)

async function hamta(): Promise<Vanlistor | null> {
  if (!supabase) return null
  const [vanner, forfragningar, skickade, vandratIhop, lank] = await Promise.all([
    supabase.rpc('mina_vanner'),
    supabase.rpc('mina_forfragningar'),
    supabase.rpc('mina_skickade'),
    supabase.rpc('vandrat_ihop'),
    supabase.rpc('min_vanlank'),
  ])
  if (vanner.error || forfragningar.error || skickade.error || vandratIhop.error) return null
  return {
    vanner: vanner.data as Van[],
    forfragningar: forfragningar.data as Forfragan[],
    skickade: skickade.data as Skickad[],
    vandratIhop: vandratIhop.data as VandratIhop[],
    // Länken är inte nödvändig för resten av sidan. Utan den visas bara inte Kopiera min vänlänk.
    lank: lank.error ? null : ((lank.data as Vanlank[])[0] ?? null),
  }
}

/** Allt på sidan Vänner. Hämtas igen efter varje ändring och när en notis kommer. */
export function useVanner(notisversion: string): { lage: Vanlage; laddaOm: () => Promise<void> } {
  const [lage, setLage] = useState<Vanlage>({ lage: 'laddar' })

  const laddaOm = useCallback(async () => {
    const listor = await hamta()
    setLage(listor ? { lage: 'klar', ...listor } : { lage: 'fel' })
  }, [])

  useEffect(() => {
    let aktuell = true
    hamta().then((listor) => {
      if (aktuell) setLage(listor ? { lage: 'klar', ...listor } : { lage: 'fel' })
    })
    return () => {
      aktuell = false
    }
  }, [notisversion])

  return { lage, laddaOm }
}

type Svar = { fel: string | null }

async function anropa(funktion: string, argument: Record<string, unknown>): Promise<Svar> {
  if (!supabase) return { fel: null }
  const { error } = await supabase.rpc(funktion, argument)
  return { fel: error ? error.message : null }
}

export const skickaVanforfragan = (epost: string) => anropa('skicka_vanforfragan', { epost })
export const skickaVanforfraganTill = (person: string) => anropa('skicka_vanforfragan_till', { person })
export const svaraVanforfragan = (forfragan: string, ja: boolean) => anropa('svara_vanforfragan', { forfragan, ja })
export const angraVanforfragan = (forfragan: string) => anropa('angra_vanforfragan', { forfragan })
export const taBortVan = (person: string) => anropa('ta_bort_van', { person })

/** Ens vänlänk, till kortet Lägg till vänner på Hem. null medan den hämtas eller om den inte gick att hämta. */
export function useMinVanlank(anvandarId: string): Vanlank | null {
  const [lank, setLank] = useState<Vanlank | null>(null)
  useEffect(() => {
    if (!supabase || !anvandarId) return
    let aktuell = true
    supabase.rpc('min_vanlank').then(({ data, error }) => {
      if (aktuell && !error) setLank((data as Vanlank[])[0] ?? null)
    })
    return () => {
      aktuell = false
    }
  }, [anvandarId])
  return lank
}

/** En ny vänlänk. Den gamla slutar fungera. */
export async function nyVanlank(): Promise<Vanlank | null> {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('ny_vanlank')
  return error ? null : ((data as Vanlank[])[0] ?? null)
}

/** Ens vänner, för att välja vilka som ska med i en tur. Hämtas först när aktiv är sann. */
export function useMinaVanner(aktiv: boolean): Van[] | null | 'fel' {
  const [vanner, setVanner] = useState<Van[] | null | 'fel'>(null)
  useEffect(() => {
    if (!aktiv || !supabase) return
    let aktuell = true
    supabase.rpc('mina_vanner').then(({ data, error }) => {
      if (aktuell) setVanner(error ? 'fel' : (data as Van[]))
    })
    return () => {
      aktuell = false
    }
  }, [aktiv])
  return vanner
}

/** Lägger till vänner i en tur. Ger antalet som lades till, eller felet. */
export async function laggTillVannerITur(tur: string, personer: string[]): Promise<{ antal: number; fel: string | null }> {
  if (!supabase) return { antal: 0, fel: null }
  const { data, error } = await supabase.rpc('lagg_till_vanner', { tur, personer })
  return error ? { antal: 0, fel: error.message } : { antal: typeof data === 'number' ? data : 0, fel: null }
}
