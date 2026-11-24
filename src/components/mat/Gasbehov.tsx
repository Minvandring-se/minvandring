import { Link } from 'react-router'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { formateraPatroner, gasbehov, GAS_PER_PERSON_OCH_DAG_G, patronforslag } from '@/lib/bransle'
import { formateraVikt } from '@/lib/forrad'

/** Gasen turen behöver till ett gaskök och patronerna som räcker, räknat på personer och dagar med reservdagarna. */
export function Gasbehov({ personer, dagar }: { personer: number; dagar: number }) {
  const behov = gasbehov(personer, dagar)
  if (behov === 0) return null
  const patroner = patronforslag(behov)
  return (
    <Sektion rubrik="Gas till köket">
      <Nyckeltal
        varden={[
          { etikett: 'Gas för turen', varde: formateraVikt(behov) },
          { etikett: 'Patroner som räcker', varde: patroner ? formateraPatroner(patroner) : 'Fler än åtta' },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        {personer === 1 ? '1 person' : `${personer} personer`} i {dagar === 1 ? '1 dag' : `${dagar} dagar`} med reservdagarna, och{' '}
        {GAS_PER_PERSON_OCH_DAG_G.sommar} g gas per person och dag som Primus räknar med på sommaren. När man smälter snö räknar
        Primus med {GAS_PER_PERSON_OCH_DAG_G.vinter} g.
      </p>
      <Link
        to="/matplanering/tips"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Mer om bränsle i tipsen
      </Link>
    </Sektion>
  )
}
