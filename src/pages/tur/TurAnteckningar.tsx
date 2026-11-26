import { AnteckningFormular } from '@/components/anteckningar/AnteckningFormular'
import { Anteckningskort } from '@/components/anteckningar/Anteckningskort'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { LardomFormular } from '@/components/lardomar/LardomFormular'
import { Lardomsrad } from '@/components/lardomar/Lardomsrad'
import { useTur } from '@/components/tur/turKontext'
import { Sektion } from '@/components/ui/sektion'
import { laggTillAnteckning, useAnteckningar } from '@/hooks/useAnteckningar'
import { useLardomar } from '@/hooks/useLardomar'
import { kanAndraAnteckning, kanTaBortAnteckning, skribent, sorteraAnteckningar } from '@/lib/anteckningar'
import { delaUpp } from '@/lib/lardomar'

/**
 * Turens anteckningar och det du vill komma ihåg till nästa vandring. Var och en skriver egna anteckningar,
 * delade eller bara för sig själv. Lärdomarna är personliga och följer med till dina nästa turer.
 */
export function TurAnteckningar() {
  const { tur, deltagare, minRoll, mittUserId } = useTur()
  const anteckningar = useAnteckningar(tur.id)
  const lardomar = useLardomar()

  return (
    <div className="space-y-5">
      <Sektion rubrik="Anteckningar">
        <div className="space-y-4">
          <AnteckningFormular knapptext="Spara anteckningen" onSpara={async (text, privat) => {
            const ok = await laggTillAnteckning(tur.id, text, privat)
            if (ok) await anteckningar.laddaOm()
            return ok
          }} />
          {anteckningar.lage.lage === 'laddar' && (
            <Laddar text="Hämtar anteckningarna">
              <Skelett className="h-20" />
            </Laddar>
          )}
          {anteckningar.lage.lage === 'fel' && <Laddfel vad="anteckningarna" onForsokIgen={anteckningar.laddaOm} />}
          {anteckningar.lage.lage === 'klar' &&
            (anteckningar.lage.anteckningar.length === 0 ? (
              <p className="text-muted-foreground">Inga anteckningar än. Det du skriver syns för alla i turen, om du inte väljer ”Bara jag ser den”.</p>
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {sorteraAnteckningar(anteckningar.lage.anteckningar).map((a) => (
                  <Anteckningskort
                    key={a.id}
                    anteckning={a}
                    vem={skribent(a, deltagare, mittUserId)}
                    kanAndra={kanAndraAnteckning(a, mittUserId)}
                    kanTaBort={kanTaBortAnteckning(a, mittUserId, minRoll)}
                    onAndrad={anteckningar.laddaOm}
                  />
                ))}
              </ul>
            ))}
        </div>
      </Sektion>

      <Sektion rubrik="Kom ihåg till nästa tur">
        <div className="space-y-4">
          <p className="max-w-prose text-muted-foreground">Bara du ser dina lärdomar. De samlas under Kom ihåg till nästa tur i menyn och visas i dina nästa turer.</p>
          <LardomFormular turId={tur.id} onSparad={lardomar.laddaOm} />
          {lardomar.lage.lage === 'fel' && <Laddfel vad="lärdomarna" onForsokIgen={lardomar.laddaOm} />}
          {lardomar.lage.lage === 'klar' && <Harifran turId={tur.id} lardomar={lardomar.lage.lardomar} onAndrad={lardomar.laddaOm} />}
        </div>
      </Sektion>

      {lardomar.lage.lage === 'klar' && <Tidigare turId={tur.id} lardomar={lardomar.lage.lardomar} onAndrad={lardomar.laddaOm} />}
    </div>
  )
}

type Lardomslista = { turId: string; lardomar: Parameters<typeof delaUpp>[0]; onAndrad: () => Promise<void> }

function Harifran({ turId, lardomar, onAndrad }: Lardomslista) {
  const { harifran } = delaUpp(lardomar, turId)
  if (harifran.length === 0) return null
  return (
    <ul className="divide-y divide-border border-t border-border">
      {harifran.map((l) => (
        <Lardomsrad key={l.id} lardom={l} visa="amne" onAndrad={onAndrad} />
      ))}
    </ul>
  )
}

function Tidigare({ turId, lardomar, onAndrad }: Lardomslista) {
  const { tidigare } = delaUpp(lardomar, turId)
  if (tidigare.length === 0) return null
  return (
    <Sektion rubrik="Dina andra lärdomar" variant="accent">
      <ul className="divide-y divide-accent/20">
        {tidigare.map((l) => (
          <Lardomsrad key={l.id} lardom={l} visa="bada" onAndrad={onAndrad} />
        ))}
      </ul>
    </Sektion>
  )
}
