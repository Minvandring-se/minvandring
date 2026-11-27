import { useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { laggTillPackrader } from '@/hooks/usePacklista'
import { anvandPackmall, usePackmallar } from '@/hooks/usePackmallar'
import { formateraVikt } from '@/lib/forrad'
import { sakerText, sammanfatta } from '@/lib/packmallar'
import { STARTMALLAR, antalSaker, startmallTillPackrader, type Startmall } from '@/lib/startmallar'

const lank =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Lägg en av sina mallar eller en av MinVandrings startmallar sist i turens packlista. För ägare och redigerare. */
export function LaggTillFranMall({ turId, sist, onTillagd, onStang }: { turId: string; sist: number; onTillagd: () => Promise<void>; onStang: () => void }) {
  const { lage, laddaOm } = usePackmallar()
  const [lagger, setLagger] = useState<string | null>(null)
  const [fel, setFel] = useState(false)

  async function laggTill(mallId: string) {
    setFel(false)
    setLagger(mallId)
    const antal = await anvandPackmall(mallId, turId)
    setLagger(null)
    if (antal === null) return setFel(true)
    await onTillagd()
    onStang()
  }

  async function laggTillStartmall(mall: Startmall) {
    setFel(false)
    setLagger(mall.id)
    const ok = await laggTillPackrader(startmallTillPackrader(mall, turId, sist))
    setLagger(null)
    if (!ok) return setFel(true)
    await onTillagd()
    onStang()
  }

  return (
    <Panel etikett="Lägg till från packlista" mitten onStang={onStang} rubrik={<h2 className="text-2xl">Lägg till från packlista</h2>}>
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Sakerna läggs sist i packlistan. Det du bar själv bär du här också, och det gemensamma bär ingen förrän någon tar det. Saker som redan
          finns läggs till en gång till. För tält, kök och några andra sorter frågar appen om alla behövs.
        </p>
        <h3 className="pt-1 font-sans text-base font-semibold">Dina packlistor</h3>
        {lage.lage === 'laddar' && (
          <Laddar text="Hämtar dina packlistor" className="space-y-2">
            <Skelett className="h-16 rounded-lg" />
            <Skelett className="h-16 rounded-lg" />
          </Laddar>
        )}
        {lage.lage === 'fel' && <Laddfel vad="dina packlistor" onForsokIgen={laddaOm} />}
        {lage.lage === 'klar' && lage.mallar.length === 0 && (
          <TomtLage
            kompakt
            text="Du har inga egna packlistor än. Spara packlistan i en tur, eller gör en under Packlistor."
            knapp={
              <Link to="/packlistor" className={lank}>
                Till Packlistor
              </Link>
            }
          />
        )}
        {lage.lage === 'klar' && lage.mallar.length > 0 && (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {lage.mallar.map((m) => {
              const s = sammanfatta(m.packmallrader)
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words">{m.namn}</p>
                    <p className="text-sm text-muted-foreground">
                      {sakerText(s.saker)}
                      {s.basvikt_g > 0 && `, basvikt ${formateraVikt(s.basvikt_g)}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={lagger !== null || m.packmallrader.length === 0}
                    aria-label={`Lägg till ${m.namn}`}
                    onClick={() => laggTill(m.id)}
                  >
                    {lagger === m.id ? 'Lägger till …' : 'Lägg till'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
        <h3 className="pt-3 font-sans text-base font-semibold">Från MinVandring</h3>
        <p className="text-sm text-muted-foreground">Saker utan vikt. Var och en väljer sin egen modell, och det gemensamma bär ingen förrän någon tar det.</p>
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {STARTMALLAR.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{m.namn}</p>
                <p className="text-sm text-muted-foreground">
                  {m.beskrivning} {sakerText(antalSaker(m))}.
                </p>
              </div>
              <Button variant="outline" disabled={lagger !== null} aria-label={`Lägg till ${m.namn}`} onClick={() => laggTillStartmall(m)}>
                {lagger === m.id ? 'Lägger till …' : 'Lägg till'}
              </Button>
            </li>
          ))}
        </ul>
        {fel && (
          <p role="alert" className="text-sm text-destructive">
            Det gick inte att lägga till packlistan. Kontrollera uppkopplingen och försök igen.
          </p>
        )}
      </div>
    </Panel>
  )
}
