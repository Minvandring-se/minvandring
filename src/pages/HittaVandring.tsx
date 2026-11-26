import { SidRubrik } from '@/components/app/SidRubrik'
import { Ikon } from '@/components/ikoner/Ikon'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'

/** Den planerade kartan för att hitta nästa vandring. Inte byggd, så sidan beskriver bara vad den blir. */
export function HittaVandring() {
  useSidtitel('Hitta din nästa vandring')
  return (
    <div className="space-y-6">
      <SidRubrik
        rubrik="Hitta din nästa vandring"
        etikett={<KommerSnartEtikett />}
        text="En karta där ni kan leta upp en led, se stugor och etapper längs vägen och lägga in turen direkt i MinVandring."
      />
      <Sektion rubrik="Det här planerar vi" ikon={<Ikon namn="fjall" storlek={28} className="text-primary" />}>
        <ul className="max-w-prose list-disc space-y-2 pl-5">
          <li>Leder, stugor och etapper på Lantmäteriets öppna karta över Sverige.</li>
          <li>Välj en led och dela upp den i dagsetapper, så hamnar den som en tur med etapper.</li>
          <li>Spara rutten som en GPX-fil, så att ni kan ta med den i telefonen eller klockan.</li>
        </ul>
      </Sektion>
    </div>
  )
}
