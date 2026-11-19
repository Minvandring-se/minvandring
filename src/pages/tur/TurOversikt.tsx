import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Namnbrickor } from '@/components/app/Namnbricka'
import { TurBild } from '@/components/app/TurBild'
import { glomTurlistan } from '@/components/app/turlistaMinne'
import { Deltagarlista } from '@/components/tur/Deltagarlista'
import { useTur } from '@/components/tur/turKontext'
import { TurUppgifter } from '@/components/tur/TurUppgifter'
import { Button } from '@/components/ui/button'
import { ROLLNAMN, arAgare, kanAndra } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import { deltagareText } from '@/lib/turlista'

/** Turens översikt: bilden, gruppen, turens uppgifter och deltagarna med inbjudan. */
export function TurOversikt() {
  const navigate = useNavigate()
  const { tur, deltagare, minRoll, mittUserId, setTur, uppdateraDeltagare } = useTur()
  const [raderfel, setRaderfel] = useState(false)
  const personer = deltagare.filter((d) => d.typ === 'person').map((d) => d.namn)

  async function radera() {
    if (!supabase) return
    if (!window.confirm(`Radera ${tur.namn}? Allt i turen försvinner för alla och går inte att få tillbaka.`)) return
    setRaderfel(false)
    const { error } = await supabase.from('turer').delete().eq('id', tur.id)
    if (error) return setRaderfel(true)
    glomTurlistan()
    navigate('/turer', { replace: true, state: { besked: `${tur.namn} är raderad.` } })
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <TurBild
        turId={tur.id}
        sizes="(min-width: 1024px) 960px, 100vw"
        prioritet
        // Lägre i mobil, så att datum, gruppen och uppgifterna syns tidigare.
        className="aspect-[5/2] max-h-40 w-full rounded-lg shadow-soft sm:aspect-[21/8] sm:max-h-none lg:aspect-[3/1]"
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {personer.length > 0 && (
          <a
            href="#deltagare"
            className="inline-flex min-h-11 items-center gap-3 rounded-md font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Namnbrickor namn={personer} />
            Gruppen · {deltagareText(deltagare)}
          </a>
        )}
        {minRoll && <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">Du är {ROLLNAMN[minRoll].toLowerCase()}</span>}
      </div>

      {/* I mobil kommer uppgifterna först och gruppen sedan. På dator står gruppen i en egen kolumn till höger. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <TurUppgifter key={tur.id} tur={tur} kanAndra={kanAndra(minRoll)} onSparad={setTur} />

        <div id="deltagare" className="scroll-mt-4">
          <Deltagarlista
            tur={tur}
            deltagare={deltagare}
            minRoll={minRoll}
            mittUserId={mittUserId}
            onAndrad={uppdateraDeltagare}
            onLamnat={() => {
              glomTurlistan()
              navigate('/turer', { replace: true })
            }}
          />
        </div>
      </div>

      {arAgare(minRoll) && (
        <div className="space-y-2 border-t border-border pt-4">
          <Button variant="ghost" className="text-destructive" onClick={radera}>
            <Trash2 className="size-4" aria-hidden />
            Radera turen
          </Button>
          {raderfel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att radera turen. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
