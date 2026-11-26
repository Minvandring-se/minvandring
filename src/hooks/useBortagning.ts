import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Sekunder som Ångra går att trycka på. */
export const ANGRA_SEKUNDER = 10

export interface Bortagning {
  /** Sakerna som väntar på att tas bort och kan ångras. */
  vantar: readonly string[]
  /** Sakerna som inte ska visas: de som väntar och de som redan är borttagna men kanske inte hämtats om än. */
  dolda: ReadonlySet<string>
  /** Sekunder kvar att ångra. */
  sekunder: number
  /** Sant när borttagningen inte gick, så att sakerna visas igen. */
  fel: boolean
  taBort: (ids: readonly string[]) => void
  angra: () => void
}

async function radera(ids: readonly string[]): Promise<boolean> {
  if (!supabase || ids.length === 0) return true
  const { error } = await supabase.from('forradssaker').delete().in('id', [...ids])
  return !error
}

/**
 * Tar bort saker ur förrådet efter en stund, så att det går att ångra. Sakerna döljs direkt och tas bort när tiden
 * har gått, när något nytt tas bort eller när man lämnar sidan. Stängs fliken innan dess finns sakerna kvar.
 */
export function useBortagning(onBorttagna: () => void): Bortagning {
  const [vantar, setVantar] = useState<readonly string[]>([])
  const [sekunder, setSekunder] = useState(0)
  const [fel, setFel] = useState(false)
  const [borttagna, setBorttagna] = useState<ReadonlySet<string>>(new Set())
  const aktuella = useRef<readonly string[]>([])
  const senaste = useRef(onBorttagna)
  useEffect(() => {
    senaste.current = onBorttagna
  })

  const genomfor = useCallback(async () => {
    const ids = aktuella.current
    if (ids.length === 0) return
    aktuella.current = []
    const ok = await radera(ids)
    if (ok) setBorttagna((b) => new Set([...b, ...ids]))
    // Samma lista när inget av det väntar längre, så att en nyare borttagnings tid inte börjar om.
    setVantar((v) => (v.some((id) => ids.includes(id)) ? v.filter((id) => !ids.includes(id)) : v))
    setFel(!ok)
    senaste.current()
  }, [])

  useEffect(() => {
    if (vantar.length === 0) return
    const tick = window.setInterval(() => setSekunder((s) => Math.max(0, s - 1)), 1000)
    const klar = window.setTimeout(() => void genomfor(), ANGRA_SEKUNDER * 1000)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(klar)
    }
  }, [vantar, genomfor])

  // Lämnar man sidan tas det som väntar bort direkt.
  useEffect(() => () => void genomfor(), [genomfor])

  const taBort = useCallback(
    (ids: readonly string[]) => {
      // Det som redan väntar tas bort först, så att bara den senaste borttagningen går att ångra.
      void genomfor()
      aktuella.current = [...ids]
      setFel(false)
      setSekunder(ANGRA_SEKUNDER)
      setVantar([...ids])
    },
    [genomfor],
  )

  const angra = useCallback(() => {
    aktuella.current = []
    setVantar([])
  }, [])

  const dolda = new Set([...vantar, ...borttagna])
  return { vantar, dolda, sekunder, fel, taBort, angra }
}
