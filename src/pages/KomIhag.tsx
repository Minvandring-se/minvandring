import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { LardomFormular } from '@/components/lardomar/LardomFormular'
import { Lardomsrad } from '@/components/lardomar/Lardomsrad'
import { Sektion } from '@/components/ui/sektion'
import { useLardomar } from '@/hooks/useLardomar'
import { useSidtitel } from '@/hooks/useSidtitel'
import { perAmne } from '@/lib/lardomar'

/** Kom ihåg till nästa tur: alla dina lärdomar, sorterade efter ämne. Bara du ser dem. */
export function KomIhag() {
  useSidtitel('Kom ihåg till nästa tur')
  const { lage, laddaOm } = useLardomar()

  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Kom ihåg till nästa tur"
        text="Det du har lärt dig på dina turer, sorterat efter ämne. Bara du ser det, och det visas i dina nästa turer under Anteckningar."
      />
      <Sektion rubrik="Ny lärdom">
        <LardomFormular turId={null} onSparad={laddaOm} />
      </Sektion>
      {lage.lage === 'laddar' && (
        <Laddar text="Hämtar lärdomarna">
          <Skelett className="h-32 rounded-ruta" />
        </Laddar>
      )}
      {lage.lage === 'fel' && <Laddfel vad="lärdomarna" onForsokIgen={laddaOm} />}
      {lage.lage === 'klar' &&
        (lage.lardomar.length === 0 ? (
          <TomtLage kompakt rubrik="Inga lärdomar än" text="Skriv ner det du vill göra annorlunda nästa gång, här eller under Anteckningar i en tur." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {perAmne(lage.lardomar).map((g) => (
              <Sektion key={g.amne} rubrik={g.etikett} rubrikniva={2}>
                <ul className="divide-y divide-border">
                  {g.lardomar.map((l) => (
                    <Lardomsrad key={l.id} lardom={l} visa="tur" onAndrad={laddaOm} />
                  ))}
                </ul>
              </Sektion>
            ))}
          </div>
        ))}
    </div>
  )
}
