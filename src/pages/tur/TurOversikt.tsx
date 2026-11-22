import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { glomTurlistan } from '@/components/app/turlistaMinne'
import { Deltagarlista } from '@/components/tur/Deltagarlista'
import {
  AttGora,
  Dagsetapper,
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

// Från lg tre kolumner med de breda delarna över två. Från 1920 px (3xl) två kolumner för huvudsektionerna.
// På 2xl (1536 px) vore de kolumnerna för smala, eftersom sektionerna anpassar sig efter skärmen och inte kolumnen.
const BRED = 'lg:col-span-2 3xl:col-span-1'
const HEL = 'lg:col-span-3 3xl:col-span-2'

/**
 * Turens översikt, enligt skissen Dator-v3 och Mobil-v2. Riktiga delar: turens uppgifter och deltagarna med inbjudan.
 * Resten visar hur delarna kommer att se ut, med etiketten "Kommer snart" (se Exempelsektioner.tsx).
 * I mobil en kolumn, på dator tre. Från 1920 px (3xl) ligger huvudsektionerna i två kolumner och Deltagare,
 * Turens uppgifter och Kom ihåg i en högerkolumn som ligger kvar när man scrollar.
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
      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start 3xl:grid-cols-2 3xl:gap-6 3xl:pr-[calc(25rem+1.5rem)]">
        {/*
          Högerkolumnen. Under 3xl är omslaget display: contents, så att delarna ligger i rutnätet som vanligt.
          Från 3xl ligger det i luften till höger om rutnätet, och innehållet ligger kvar när man scrollar.
        */}
        <div className="contents 3xl:absolute 3xl:top-0 3xl:right-0 3xl:bottom-0 3xl:block 3xl:w-[25rem]">
          <div className="contents 3xl:sticky 3xl:top-6 3xl:flex 3xl:max-h-[calc(100dvh-3rem)] 3xl:flex-col 3xl:gap-5 3xl:-m-2 3xl:overflow-y-auto 3xl:p-2">
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
          </div>
        </div>

        <RedoForAvfard className={BRED} />
        <AttGora className={BRED} />
        <ResanDitOchHem />
        <Dagsetapper className={BRED} />
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
