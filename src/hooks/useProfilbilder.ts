import { useEffect, useState } from 'react'
import { ADRESS_GILTIG_S, PROFILBILD_BUCKET, behoverHamtas, bildsokvag, type Minnesrad } from '@/lib/profilbild'
import { supabase } from '@/lib/supabase'

// Signerade adresser till profilbilder, delade mellan alla komponenter på sidan.
// Andra användares profiler går inte att läsa, så appen frågar lagringen direkt: den som har en bild
// man får se ger en adress, alla andra ger ett fel och visas med sin bokstav.
const minne = new Map<string, Minnesrad>()

/** Glömmer en användares adress, så att den hämtas på nytt. Används när man har bytt eller tagit bort sin bild. */
export function glomProfilbild(userId: string) {
  minne.delete(userId)
}

/** true när frågan om användarens bild har besvarats, med eller utan bild. Används för att visa en platshållare medan den hämtas. */
export function arProfilbildHamtad(userId: string): boolean {
  return minne.has(userId)
}

function fraMinnet(ids: readonly string[]): Record<string, string> {
  const ut: Record<string, string> = {}
  for (const id of ids) {
    const adress = minne.get(id)?.adress
    if (adress) ut[id] = adress
  }
  return ut
}

/** Hämtar adresserna som saknas i minnet eller är för gamla. Anropar klar när minnet har fyllts på. */
function hamtaSaknade(ids: readonly string[], klar: () => void) {
  const attHamta = behoverHamtas(ids, minne, Date.now())
  if (!supabase || attHamta.length === 0) return
  supabase.storage
    .from(PROFILBILD_BUCKET)
    .createSignedUrls(attHamta.map(bildsokvag), ADRESS_GILTIG_S)
    .then(({ data, error }) => {
      // Går frågan inte fram alls sparas inget, så att ett nytt försök görs vid nästa visning.
      if (error || !data) return
      const nu = Date.now()
      attHamta.forEach((id, i) => minne.set(id, { adress: data[i]?.error ? null : (data[i]?.signedUrl ?? null), hamtad: nu }))
      klar()
    })
}

/**
 * Adresserna till profilbilderna för de här användarna. Bara de som har en bild finns med i svaret.
 * `version` byts när den egna bilden har ändrats, så att den hämtas om.
 */
export function useProfilbilder(userIds: readonly (string | null | undefined)[], version?: string | null): Record<string, string> {
  const ids = [...new Set(userIds.filter((id): id is string => !!id))].sort()
  const nyckel = ids.join(',')
  // Adresserna ligger i det delade minnet. Räknaren ritar bara om komponenten när nya har hämtats.
  const [, setOmgang] = useState(0)

  useEffect(() => {
    let avbruten = false
    hamtaSaknade(nyckel ? nyckel.split(',') : [], () => {
      if (!avbruten) setOmgang((n) => n + 1)
    })
    return () => {
      avbruten = true
    }
  }, [nyckel, version])

  return fraMinnet(ids)
}
