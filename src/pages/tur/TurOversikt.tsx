import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { glomTurlistan } from '@/components/app/turlistaMinne'
import { Deltagarlista } from '@/components/tur/Deltagarlista'
import { EtapperIOversikten } from '@/components/tur/EtapperIOversikten'
import {
  AttGora,
  DelaOchSpara,
  DeladeKostnader,
  DinVikt,
  EfterTuren,
  Fardplan,
  GemensamUtrustning,
  KartaOchHojdprofil,
  KomIhag,
  MatPerDag,
  Omrostning,
  Packlage,
  RedoForAvfard,
  ResanDitOchHem,
  SenasteIGruppen,
  ViktPerPerson,
} from '@/components/tur/Exempelsektioner'
import { useTur } from '@/components/tur/turKontext'
import { TurUppgifter } from '@/components/tur/TurUppgifter'
import { Button } from '@/components/ui/button'
import { useProfilbilder } from '@/hooks/useProfilbilder'
import { arAgare, kanAndra } from '@/lib/roller'
import { supabase } from '@/lib/supabase'

// Från lg tre kolumner med de breda delarna över två. Innehållet är högst 1200 px brett (AppSkal), så samma
// rutnät räcker även på stora skärmar.
const BRED = 'lg:col-span-2'
const HEL = 'lg:col-span-3'

/**
 * Turens översikt, enligt skissen Dator-v3 och Mobil-v2. Riktiga delar: turens uppgifter och deltagarna med inbjudan.
 * Resten visar hur delarna kommer att se ut, med etiketten "Kommer snart" (se Exempelsektioner.tsx).
 * I mobil en kolumn, på dator tre.
 */
export function TurOversikt() {
  const navigate = useNavigate()
  const { tur, deltagare, minRoll, mittUserId, setTur, uppdateraDeltagare } = useTur()
  const [raderfel, setRaderfel] = useState(false)
  const { bildUppdaterad } = useApp()
  const bilder = useProfilbilder(deltagare.map((d) => d.user_id), bildUppdaterad)

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        {/* Deltagarna får två kolumner på lg, så att namn och roller ryms. Uppgifterna är korta och får en. */}
        <div id="deltagare" className={`scroll-mt-4 ${BRED}`}>
          <Deltagarlista
            tur={tur}
            deltagare={deltagare}
            bilder={bilder}
            minRoll={minRoll}
            mittUserId={mittUserId}
            onAndrad={uppdateraDeltagare}
            onLamnat={() => {
              glomTurlistan()
              navigate('/turer', { replace: true })
            }}
          />
        </div>
        <TurUppgifter key={tur.id} tur={tur} kanAndra={kanAndra(minRoll)} onSparad={setTur} />
        <KomIhag />

        <RedoForAvfard className={BRED} />
        <AttGora className={BRED} />
        <ResanDitOchHem />
        <EtapperIOversikten tur={tur} kanAndra={kanAndra(minRoll)} className={BRED} />
        <DinVikt />
        <MatPerDag className={BRED} />
        <ViktPerPerson />
        <GemensamUtrustning className={BRED} />
        <DeladeKostnader />
        <KartaOchHojdprofil className={BRED} />
        <SenasteIGruppen />
        <Omrostning />
        <Packlage />
        <DelaOchSpara />
        <Fardplan className={HEL} />
        <EfterTuren className={HEL} />
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
