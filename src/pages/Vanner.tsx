import { UserMinus, UserPlus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Button } from '@/components/ui/button'
import { Sektion } from '@/components/ui/sektion'
import { LaggTillVan } from '@/components/vanner/LaggTillVan'
import { Personrad } from '@/components/vanner/Personrad'
import { useProfilbilder } from '@/hooks/useProfilbilder'
import { useSidtitel } from '@/hooks/useSidtitel'
import { angraVanforfragan, skickaVanforfraganTill, svaraVanforfragan, taBortVan, useVanner, type Vanlistor } from '@/hooks/useVanner'
import { skickadText, turerIhopText, VANNER_I_TURER, vanfel } from '@/lib/vanner'

/**
 * Sidan Vänner: lägg till en vän, förfrågningar att svara på, dina vänner, de du har vandrat med och förfrågningar
 * som väntar på svar. I mobil kommer förfrågningarna före vännerna, på dator ligger de i högra spalten.
 */
export function Vanner() {
  useSidtitel('Vänner')
  const { notiser } = useApp()
  // Listorna hämtas igen när notiserna ändras, till exempel när någon godkänner en förfrågan.
  const version = Array.isArray(notiser.notiser) ? notiser.notiser.map((n) => n.id).join(',') : ''
  const { lage, laddaOm } = useVanner(version)

  async function andrad() {
    await Promise.all([laddaOm(), notiser.laddaOm()])
  }

  return (
    <div className="space-y-6">
      <SidRubrik rubrik="Vänner" text="Dem du vandrar med, samlade på ett ställe." />
      {lage.lage === 'laddar' && (
        <Laddar text="Hämtar dina vänner">
          <Skelett className="h-56 rounded-[1.375rem]" />
          <Skelett className="h-40 rounded-ruta" />
        </Laddar>
      )}
      {lage.lage === 'fel' && <Laddfel vad="dina vänner" onForsokIgen={laddaOm} />}
      {lage.lage === 'klar' && <Innehall listor={lage} onAndrad={() => void andrad()} />}
    </div>
  )
}

function Innehall({ listor, onAndrad }: { listor: Vanlistor; onAndrad: () => void }) {
  const { vanner, forfragningar, skickade, vandratIhop, lank } = listor
  const bilder = useProfilbilder([...vanner, ...vandratIhop].filter((p) => p.bild_uppdaterad).map((p) => p.user_id))
  const [fel, setFel] = useState('')
  const [nu] = useState(() => new Date())

  async function gor(atgard: Promise<{ fel: string | null }>) {
    setFel('')
    const { fel: f } = await atgard
    if (f) setFel(vanfel(f))
    onAndrad()
  }

  return (
    <>
      <LaggTillVan lank={lank} onAndrad={onAndrad} />
      {fel && (
        <p role="alert" className="text-destructive">
          {fel}
        </p>
      )}
      {/* Förfrågningarna först i mobil. På dator spänner vännerna över högra spaltens rader. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]">
        {forfragningar.length > 0 && (
          <Del rubrik="Vänförfrågningar" antal={forfragningar.length} text={VANNER_I_TURER} className="lg:col-start-2 lg:row-start-1">
            {forfragningar.map((f) => (
              <Personrad
                key={f.id}
                namn={f.namn}
                under="Vill bli din vän"
                knappar={
                  <>
                    <Button onClick={() => void gor(svaraVanforfragan(f.id, true))}>Godkänn</Button>
                    <Button variant="outline" onClick={() => void gor(svaraVanforfragan(f.id, false))}>
                      Neka
                    </Button>
                  </>
                }
              />
            ))}
          </Del>
        )}

        <Del rubrik="Dina vänner" antal={vanner.length} className="lg:col-start-1 lg:row-span-3 lg:row-start-1">
          {vanner.length === 0 ? (
            <li className="py-3 text-muted-foreground">Inga vänner än. Skicka en förfrågan eller din vänlänk till dem du vandrar med.</li>
          ) : (
            vanner.map((v) => (
              <Personrad
                key={v.user_id}
                namn={v.namn}
                bild={bilder[v.user_id]}
                under={turerIhopText(v.turer_ihop, v.senaste_tur)}
                knappar={
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Ta bort ${v.namn} som vän? Ni är kvar i turerna ni har ihop.`)) void gor(taBortVan(v.user_id))
                    }}
                  >
                    <UserMinus className="size-4" aria-hidden />
                    Ta bort vän
                  </Button>
                }
              />
            ))
          )}
        </Del>

        {vandratIhop.length > 0 && (
          <Del rubrik="Ni har vandrat ihop" text="Personer från era turer som inte är dina vänner än." className="lg:col-start-2">
            {vandratIhop.map((p) => (
              <Personrad
                key={p.user_id}
                namn={p.namn}
                bild={bilder[p.user_id]}
                under={p.turer_ihop === 1 ? '1 tur ihop' : `${p.turer_ihop} turer ihop`}
                knappar={
                  <Button variant="outline" onClick={() => void gor(skickaVanforfraganTill(p.user_id))}>
                    <UserPlus className="size-4" aria-hidden />
                    Skicka förfrågan
                  </Button>
                }
              />
            ))}
          </Del>
        )}

        {skickade.length > 0 && (
          <Del rubrik="Väntar på svar" className="lg:col-start-2">
            {skickade.map((s) => (
              <Personrad
                key={s.id}
                namn={s.visas}
                under={skickadText(s.skapad, nu)}
                knappar={
                  <Button variant="ghost" onClick={() => void gor(angraVanforfragan(s.id))}>
                    Ångra
                  </Button>
                }
              />
            ))}
          </Del>
        )}
      </div>
    </>
  )
}

function Del({ rubrik, antal, text, className, children }: { rubrik: string; antal?: number; text?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Sektion rubrik={rubrik} atgard={antal ? <span className="text-sm font-medium text-muted-foreground tabular-nums">{antal}</span> : undefined}>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
        <ul className="divide-y divide-border">{children}</ul>
      </Sektion>
    </div>
  )
}
