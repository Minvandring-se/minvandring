import { RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Tillbaka } from '@/components/tur/Tillbaka'
import type { TurKontext } from '@/components/tur/turKontext'
import { TurHuvud } from '@/components/tur/TurHuvud'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { tolkaRad } from '@/lib/hamtning'
import { supabase } from '@/lib/supabase'
import { aktivTurdel, turdel } from '@/lib/turdelar'
import type { DeltagareRad, Tur } from '@/lib/typer'

/** Deltagarna i turen, eller null om de inte gick att hämta. */
async function hamtaDeltagare(id: string | undefined): Promise<DeltagareRad[] | null> {
  if (!supabase || !id) return null
  const { data, error } = await supabase.from('deltagare').select('id, namn, typ, roll, user_id').eq('tur_id', id).order('sortering')
  return error ? null : ((data as DeltagareRad[]) ?? [])
}

/** Turen och deltagarna. Utan deltagarna vet vi inte vilken roll man har, så då räknas hela hämtningen som misslyckad. */
async function hamtaTur(id: string | undefined): Promise<{ tur: Tur | 'saknas' | 'fel'; deltagare: DeltagareRad[] }> {
  if (!supabase || !id) return { tur: 'saknas', deltagare: [] }
  const [svar, deltagare] = await Promise.all([
    supabase.from('turer').select('id, namn, destination, startpunkt, avresa, hemkomst, dagar, reservdagar').eq('id', id).maybeSingle(),
    hamtaDeltagare(id),
  ])
  const rad = tolkaRad<Tur>({ data: svar.data as Tur | null, error: svar.error })
  if (rad.lage !== 'klar') return { tur: rad.lage, deltagare: [] }
  return deltagare ? { tur: rad.data, deltagare } : { tur: 'fel', deltagare: [] }
}

/** Ramen för en tur. Varje tur får en egen uppsättning tillstånd, så att förra turen aldrig syns medan nästa hämtas. */
export function TurRam() {
  const { id } = useParams()
  return <Ram key={id} id={id} />
}

/**
 * Hämtar turen och deltagarna en gång och delar dem med delsidorna (Översikt, Packa, Mat, Rutt).
 * Visar turens namn, datum och flikarna, och tar hand om saknad tur och fel vid hämtningen.
 */
function Ram({ id }: { id: string | undefined }) {
  const { pathname } = useLocation()
  const { anvandarId: mittUserId } = useApp()
  // undefined medan turen hämtas, 'saknas' när den inte finns (eller man inte är med) och 'fel' när den inte gick att hämta.
  const [tur, setTur] = useState<Tur | 'saknas' | 'fel' | undefined>(undefined)
  const [deltagare, setDeltagare] = useState<DeltagareRad[]>([])
  const aktiv = aktivTurdel(pathname)

  const uppdateraDeltagare = useCallback(async () => {
    const rader = await hamtaDeltagare(id)
    if (rader) setDeltagare(rader)
  }, [id])

  const visa = useCallback((svar: Awaited<ReturnType<typeof hamtaTur>>) => {
    setDeltagare(svar.deltagare)
    setTur(svar.tur)
  }, [])

  useEffect(() => {
    hamtaTur(id).then(visa)
  }, [id, visa])

  const delnamn = turdel(aktiv).namn
  useSidtitel(typeof tur === 'object' ? (aktiv === 'oversikt' ? tur.namn : `${delnamn} · ${tur.namn}`) : tur === undefined ? 'Hämtar turen' : 'Tur')

  if (tur === undefined)
    return (
      <Laddar text="Hämtar turen" className="space-y-4 lg:space-y-6">
        <Skelett className="hidden h-11 w-72 md:block" />
        <Skelett className="h-80 rounded-lg md:h-96 md:rounded-[1.375rem]" />
        <Skelett className="h-11 w-full max-w-2xl" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Skelett className="h-56 rounded-lg lg:col-span-2" />
          <Skelett className="h-56 rounded-lg" />
        </div>
      </Laddar>
    )
  if (tur === 'saknas')
    return (
      <div className="space-y-4">
        <Tillbaka />
        <p>Turen finns inte, eller så är du inte med i den.</p>
      </div>
    )
  if (tur === 'fel')
    return (
      <div className="space-y-4">
        <Tillbaka />
        <div role="alert" className="space-y-3">
          <p className="text-destructive">Det gick inte att hämta turen. Kontrollera uppkopplingen och försök igen.</p>
          <Button
            variant="outline"
            onClick={() => {
              setTur(undefined)
              hamtaTur(id).then(visa)
            }}
          >
            <RefreshCw className="size-4" aria-hidden />
            Försök igen
          </Button>
        </div>
      </div>
    )

  const kontext: TurKontext = {
    tur,
    deltagare,
    minRoll: deltagare.find((d) => d.user_id === mittUserId)?.roll ?? null,
    mittUserId,
    setTur,
    uppdateraDeltagare,
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <TurHuvud tur={tur} deltagare={deltagare} minRoll={kontext.minRoll} />
      <Outlet context={kontext} />
    </div>
  )
}
