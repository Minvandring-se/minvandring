import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { formateraVikt } from '@/lib/forrad'
import { uppraknade } from '@/lib/kost'
import { formateraKcal, platsText, saknasMeningar, type Matsummering as Summering, type Plats, type Saknade } from '@/lib/mat'

/**
 * Siffrorna i matplanen: energi och protein per person och dag, den person och dag som får minst, matvikten för turen
 * och per person, hur många huvudmåltider som saknas, och vilka rätter som saknar vikt, energi eller protein.
 * Energin räknas efter vem som äter, och vikten efter vem som bär, i hela påsar.
 */
export function Matsummering({
  summering,
  saknade,
  saknasPerson = [],
  totaltG,
  perPerson,
  inteFordelat = 0,
  namnFor = () => undefined,
}: {
  summering: Summering
  /** Rätterna som saknar vikt, energi eller protein, så att summorna kan bli för låga. */
  saknade: Saknade
  /** Huvudmåltider som bara vissa personer saknar, för att de inte äter någon av måltidens rätter. */
  saknasPerson?: readonly { namn: string; platser: readonly Plats[] }[]
  totaltG: number
  /** Namn och matvikt i gram för varje deltagare som bär mat. */
  perPerson: readonly { id: string; namn: string; g: number }[]
  /** Maten som ingen bär än, i gram. */
  inteFordelat?: number
  /** Namnet på personen som får minst energi. undefined när namnet inte ska visas, till exempel när turen har en person. */
  namnFor?: (id: string) => string | undefined
}) {
  const { snittKcal, lagsta, snittProteinG, saknadeMaltider } = summering
  const meningar = saknasMeningar(saknade)
  const lagstaNamn = lagsta?.olika ? namnFor(lagsta.person) : undefined
  return (
    <Sektion rubrik="Summering">
      <Nyckeltal
        tvaKolumnerIMobil
        varden={[
          { etikett: 'Energi per person och dag', varde: formateraKcal(snittKcal) },
          {
            etikett: 'Minst energi en dag',
            varde: (
              <>
                {formateraKcal(lagsta?.kcal ?? 0)}
                {lagsta && (
                  <span className="block text-xs font-normal text-muted-foreground first-letter:uppercase">
                    {lagstaNamn ? `${lagstaNamn}, ${lagsta.dag.namn.toLowerCase()}` : lagsta.dag.namn}
                  </span>
                )}
              </>
            ),
          },
          { etikett: 'Protein per person och dag', varde: `${Math.round(snittProteinG)} g` },
          { etikett: 'Matvikt', varde: formateraVikt(totaltG) },
        ]}
      />
      {saknadeMaltider > 0 && (
        <p className="font-medium text-accent-strong">
          {saknadeMaltider === 1 ? 'En måltid saknas.' : `${saknadeMaltider} måltider saknas.`} Frukost, lunch och middag räknas, mellanmål är frivilliga.
        </p>
      )}
      {saknasPerson.map((p) => (
        <p key={p.namn} className="font-medium text-accent-strong">
          {p.namn} saknar {uppraknade(p.platser.map((x) => platsText(x).toLowerCase()))}.
        </p>
      ))}
      {meningar.length > 0 && <p className="text-sm text-muted-foreground">{meningar.join(' ')} Det som saknas räknas inte med, så summorna kan bli för låga.</p>}
      {(perPerson.length > 0 || inteFordelat > 0) && totaltG > 0 && (
        <div className="space-y-2">
          <h3 className="text-base">Matvikt per person vid start</h3>
          <p className="text-sm text-muted-foreground">Räknat i hela påsar, som i inköpslistan.</p>
          <ul className="divide-y divide-border">
            {perPerson.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 break-words">{p.namn}</span>
                <span className="font-semibold tabular-nums">{formateraVikt(p.g)}</span>
              </li>
            ))}
            {inteFordelat > 0 && (
              <li className="flex items-center justify-between gap-3 py-2 text-accent-strong">
                <span className="min-w-0 break-words">Inte fördelat</span>
                <span className="font-semibold tabular-nums">{formateraVikt(inteFordelat)}</span>
              </li>
            )}
          </ul>
          {inteFordelat > 0 && <p className="text-sm text-muted-foreground">Välj vem som bär rätterna i ”Vem tar med vad”.</p>}
        </div>
      )}
    </Sektion>
  )
}
