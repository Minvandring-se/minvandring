import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Mallkort } from '@/components/packlistor/Mallkort'
import { usePackmallar } from '@/hooks/usePackmallar'
import { useSidtitel } from '@/hooks/useSidtitel'

const lank =
  'inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Packlistor: dina mallar från tidigare turer. Bara du ser dem. */
export function Packlistor() {
  useSidtitel('Packlistor')
  const { lage, laddaOm } = usePackmallar()

  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Packlistor"
        text="Dina mallar från tidigare turer. Spara en packlista som mall under Packning i en tur, och lägg den i nästa tur med Från mall. Bara du ser dina mallar."
      />
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
    </div>
  )
}
