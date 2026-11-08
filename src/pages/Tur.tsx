import { Backpack, CookingPot, Route, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Deltagarlista } from '@/components/tur/Deltagarlista'
import { TurUppgifter } from '@/components/tur/TurUppgifter'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useSession } from '@/hooks/useSession'
import { ROLLNAMN, arAgare, kanAndra } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import type { DeltagareRad, Tur } from '@/lib/typer'

export function TurSida() {
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()
  const mittUserId = session?.user.id ?? ''
  const [tur, setTur] = useState<Tur | null | undefined>(undefined)
  const [deltagare, setDeltagare] = useState<DeltagareRad[]>([])

  const hamtaDeltagare = useCallback(async () => {
    if (!supabase || !id) return
    const { data } = await supabase.from('deltagare').select('id, namn, typ, roll, user_id').eq('tur_id', id).order('sortering')
    setDeltagare((data as DeltagareRad[]) ?? [])
  }, [id])

  useEffect(() => {
    if (!supabase || !id) return
    supabase
      .from('turer')
      .select('id, namn, destination, startpunkt, avresa, hemkomst, dagar, reservdagar, inbjudningskod')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => setTur(data as Tur | null))
    supabase
      .from('deltagare')
      .select('id, namn, typ, roll, user_id')
      .eq('tur_id', id)
      .order('sortering')
      .then(({ data }) => setDeltagare((data as DeltagareRad[]) ?? []))
  }, [id])

  if (tur === undefined) return <p className="text-muted-foreground">Laddar …</p>
  if (tur === null) return <p>Turen finns inte, eller så är du inte med i den.</p>

  const minRoll = deltagare.find((d) => d.user_id === mittUserId)?.roll ?? null

  async function radera() {
    if (!supabase || !tur) return
    if (!window.confirm(`Radera ${tur.namn}? Allt i turen försvinner för alla och går inte att få tillbaka.`)) return
    const { error } = await supabase.from('turer').delete().eq('id', tur.id)
    if (!error) navigate('/turer', { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl break-words">{tur.namn}</h1>
        {minRoll && <p className="text-sm text-muted-foreground">Du är {ROLLNAMN[minRoll].toLowerCase()}</p>}
      </div>

      <TurUppgifter key={tur.id} tur={tur} kanAndra={kanAndra(minRoll)} onSparad={setTur} />

      <Deltagarlista
        tur={tur}
        deltagare={deltagare}
        minRoll={minRoll}
        mittUserId={mittUserId}
        onAndrad={hamtaDeltagare}
        onLamnat={() => navigate('/turer', { replace: true })}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { ikon: Backpack, namn: 'Packa' },
          { ikon: CookingPot, namn: 'Mat' },
          { ikon: Route, namn: 'Rutt' },
        ].map(({ ikon: Ikon, namn }) => (
          <Card key={namn} className="flex items-center gap-3 opacity-60">
            <Ikon className="size-5 text-primary" aria-hidden />
            <span className="font-medium">{namn}</span>
            <span className="ml-auto text-xs text-muted-foreground">Kommer snart</span>
          </Card>
        ))}
      </div>

      {arAgare(minRoll) && (
        <div className="pt-4">
          <Button variant="ghost" className="text-destructive" onClick={radera}>
            <Trash2 className="size-4" aria-hidden />
            Radera turen
          </Button>
        </div>
      )}
    </div>
  )
}
