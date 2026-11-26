import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Mallkort } from '@/components/packlistor/Mallkort'
import { Startmallkort } from '@/components/packlistor/Startmallkort'
import { usePackmallar } from '@/hooks/usePackmallar'
import { useSidtitel } from '@/hooks/useSidtitel'
import { STARTMALLAR } from '@/lib/startmallar'

const lank =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Packlistor: dina mallar från tidigare turer, som bara du ser, och MinVandrings startmallar. */
export function Packlistor() {
  useSidtitel('Packlistor')
  const { lage, laddaOm } = usePackmallar()

  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Packlistor"
        text="Färdiga packlistor att starta från, och dina egna mallar från tidigare turer. Lägg en mall i en tur med Från mall under Packning."
      />
      <section aria-labelledby="dina-mallar" className="space-y-3">
        <h2 id="dina-mallar" className="text-xl lg:text-2xl">Dina mallar</h2>
        <p className="text-sm text-muted-foreground">Spara en packlista som mall under Packning i en tur. Bara du ser dina mallar.</p>
        {lage.lage === 'laddar' && (
          <Laddar text="Hämtar dina mallar" className="grid gap-3 md:grid-cols-2">
            <Skelett className="h-28 rounded-lg" />
            <Skelett className="h-28 rounded-lg" />
          </Laddar>
        )}
        {lage.lage === 'fel' && <Laddfel vad="dina mallar" onForsokIgen={laddaOm} />}
        {lage.lage === 'klar' &&
          (lage.mallar.length === 0 ? (
            <TomtLage
              kompakt
              rubrik="Inga mallar än"
              text="Öppna Packning i en tur och välj Spara som mall. Då kommer mallen hit och kan läggas i nästa tur."
              knapp={
                <Link to="/turer" className={lank}>
                  Till Mina turer
                </Link>
              }
            />
          ) : (
            <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
              {lage.mallar.map((m) => (
                <Mallkort key={m.id} mall={m} onAndrad={laddaOm} />
              ))}
            </ul>
          ))}
      </section>

      <section aria-labelledby="fran-minvandring" className="space-y-3">
        <h2 id="fran-minvandring" className="text-xl lg:text-2xl">Från MinVandring</h2>
        <p className="text-sm text-muted-foreground">Saker utan vikt. Var och en väljer sin egen modell, och det gemensamma bär ingen förrän någon tar det.</p>
        <ul className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {STARTMALLAR.map((m) => (
            <Startmallkort key={m.id} mall={m} />
          ))}
        </ul>
      </section>
    </div>
  )
}
