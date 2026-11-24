import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt } from '@/lib/forrad'
import { formateraKcal, saknasMeningar, type Matsummering as Summering, type Saknade } from '@/lib/mat'

/**
 * Siffrorna överst i matplanen: energi och protein per person och dag, matvikten för turen och per person,
 * hur många huvudmåltider som saknas, och vilka rätter som saknar vikt, energi eller protein.
 */
export function Matsummering({
  summering,
  saknade,
  totaltG,
  perPerson,
}: {
  summering: Summering
  /** Rätterna som saknar vikt, energi eller protein, så att summorna kan bli för låga. */
  saknade: Saknade
  totaltG: number
  /** Namn och matvikt i gram för varje deltagare som bär mat. */
  perPerson: readonly { id: string; namn: string; g: number }[]
}) {
  const { snittKcal, lagstaKcal, snittProteinG, saknadeMaltider } = summering
  const meningar = saknasMeningar(saknade)
  return (
    <Sektion rubrik="Summering">
      <Nyckeltal
        varden={[
          { etikett: 'Energi per person och dag', varde: formateraKcal(snittKcal) },
          { etikett: 'Minst energi en dag', varde: formateraKcal(lagstaKcal) },
          { etikett: 'Protein per dag', varde: `${Math.round(snittProteinG)} g` },
          { etikett: 'Matvikt', varde: formateraVikt(totaltG) },
        ]}
      />
      {saknadeMaltider > 0 && (
        <p className="font-medium text-accent-strong">
          {saknadeMaltider === 1 ? 'En måltid saknas.' : `${saknadeMaltider} måltider saknas.`} Frukost, lunch och middag räknas, mellanmål är frivilliga.
        </p>
      )}
      {meningar.length > 0 && <p className="text-sm text-muted-foreground">{meningar.join(' ')} Summorna och matvikten blir därför för låga.</p>}
      {perPerson.length > 0 && totaltG > 0 && (
        <div className="space-y-2">
          <h3 className="text-base">Matvikt per person vid start</h3>
          <ul className="divide-y divide-border">
            {perPerson.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 break-words">{p.namn}</span>
                <span className="font-semibold tabular-nums">{formateraVikt(p.g)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sektion>
  )
}
