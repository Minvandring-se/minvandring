import { useEffect, useState } from 'react'
import type { TurMedDeltagare } from '@/components/app/TurKort'
import { attGora, type Attgora } from '@/lib/hem'
import { matdagar, matstatus } from '@/lib/mat'
import { packat, statusKarta, utanBarare } from '@/lib/packlista'
import { supabase } from '@/lib/supabase'
import { delaUppTurer, lokaltDatum } from '@/lib/turlista'
import type { Maltid, PackradRad, PackstatusRad } from '@/lib/typer'

/** En tur på Hem: som i Mina turer, och med reservdagarna som matplanen räknar med. */
export type HemTur = TurMedDeltagare & { reservdagar: number }

export interface Hem {
  /** null medan turerna hämtas, 'fel' om det inte gick. */
  turer: HemTur[] | null | 'fel'
  /** Nästa (eller pågående) tur. null när ingen finns. */
  nasta: HemTur | null
  /** Att göra för nästa tur. null medan det räknas, 'fel' om det inte gick och tom när inget är kvar. */
  attgora: Attgora[] | null | 'fel'
}

const PACKRAD = 'id, tur_id, namn, kategori, underkategori, produkt_id, antal, vikt_g, typ, bars_av, alla, gemensam, dubblett_ok, med, notering, sortering'
const PACKSTATUS = 'packrad_id, deltagare_id, tur_id, packad, namn, vikt_g, produkt_id'

/** Det som Att göra räknas ur för en tur: måltiderna, packraderna, bockarna och ens egen rad i deltagarna. */
async function hamtaAttGora(tur: HemTur, anvandarId: string): Promise<Attgora[] | 'fel'> {
  const [maltider, rader, status, deltagare] = await Promise.all([
    supabase!.from('maltider').select('dag, maltid').eq('tur_id', tur.id),
    supabase!.from('packrader').select(PACKRAD).eq('tur_id', tur.id),
    supabase!.from('packstatus').select(PACKSTATUS).eq('tur_id', tur.id),
    supabase!.from('deltagare').select('id, typ, user_id').eq('tur_id', tur.id),
  ])
  if (maltider.error || rader.error || status.error || deltagare.error) return 'fel'
  const packrader = (rader.data as PackradRad[] | null) ?? []
  const mig = ((deltagare.data as { id: string; typ: 'person' | 'hund'; user_id: string | null }[] | null) ?? []).find((d) => d.user_id === anvandarId)
  const dagar = matdagar(tur.dagar, tur.reservdagar)
  return attGora(tur, {
    // En tur utan antal dagar har ingen matplan att räkna på.
    mat: dagar.length ? matstatus(dagar, (maltider.data as { dag: number; maltid: Maltid }[] | null) ?? []) : null,
    utanBarare: utanBarare(packrader),
    packat: mig ? packat(packrader, statusKarta((status.data as PackstatusRad[] | null) ?? []), mig) : null,
  })
}

/** Turerna och Att göra för nästa tur, för sidan Hem. */
export function useHem(anvandarId: string): Hem {
  const [turer, setTurer] = useState<HemTur[] | null | 'fel'>(null)
  const [attgora, setAttgora] = useState<{ turId: string; rader: Attgora[] | 'fel' } | null>(null)

  useEffect(() => {
    if (!supabase || !anvandarId) return
    let aktuell = true
    supabase
      .from('turer')
      .select('id, namn, destination, avresa, hemkomst, dagar, reservdagar, skapad, deltagare(namn, typ, sortering, user_id)')
      .order('sortering', { referencedTable: 'deltagare' })
      .then(({ data, error }) => {
        if (aktuell) setTurer(error ? 'fel' : ((data as HemTur[] | null) ?? []))
      })
    return () => {
      aktuell = false
    }
  }, [anvandarId])

  const nasta = Array.isArray(turer) ? delaUppTurer(turer, lokaltDatum()).nasta : null

  useEffect(() => {
    if (!supabase || !nasta) return
    let aktuell = true
    void hamtaAttGora(nasta, anvandarId).then((rader) => {
      if (aktuell) setAttgora({ turId: nasta.id, rader })
    })
    return () => {
      aktuell = false
    }
  }, [nasta, anvandarId])

  return { turer, nasta, attgora: nasta && attgora?.turId === nasta.id ? attgora.rader : null }
}
