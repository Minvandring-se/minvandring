import { Ikon } from '@/components/ikoner/Ikon'
import { Link } from 'react-router'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Sektion } from '@/components/ui/sektion'
import { type Arstid, formateraPatroner, gasbehov, patronforslag, PRIMUS_G } from '@/lib/bransle'
import { formateraVikt } from '@/lib/forrad'

/** Primus siffror som patroner, till exempel "100 g för en dag, 230 g för en helg och 2 × 230 g för en vecka". */
function primusText(arstid: Arstid): string {
  const { dag, helg, vecka } = PRIMUS_G[arstid]
  const p = (g: number) => formateraPatroner(patronforslag(g) ?? [])
  return `${p(dag)} för en dag, ${p(helg)} för en helg och ${p(vecka)} för en vecka`
}

function Forslag({ personer, dagar, arstid }: { personer: number; dagar: number; arstid: Arstid }) {
  const behov = gasbehov(personer, dagar, arstid)
  const patroner = patronforslag(behov)
  return (
    <>
      <span className="block">{patroner ? formateraPatroner(patroner) : 'Fler än åtta patroner'}</span>
      <span className="block text-sm font-normal text-muted-foreground">cirka {formateraVikt(behov)} gas</span>
    </>
  )
}

/**
 * Patronerna som räcker till turen enligt Primus riktlinje för en person med eget kök, på sommaren och med
 * snösmältning, räknat på personer och dagar med reservdagarna.
 */
export function Gasbehov({ personer, dagar }: { personer: number; dagar: number }) {
  if (gasbehov(personer, dagar) === 0) return null
  return (
    <Sektion rubrik="Gas till köket" ikon={<Ikon namn="gaspatron" storlek={28} className="text-primary" />}>
      <Nyckeltal
        varden={[
          { etikett: 'Sommar', varde: <Forslag personer={personer} dagar={dagar} arstid="sommar" /> },
          { etikett: 'Med snösmältning', varde: <Forslag personer={personer} dagar={dagar} arstid="vinter" /> },
        ]}
      />
      <p className="text-sm text-muted-foreground">
        {personer === 1 ? '1 person' : `${personer} personer`} i {dagar === 1 ? '1 dag' : `${dagar} dagar`} med reservdagarna. Förslaget
        följer Primus riktlinje för en person med eget kök: {primusText('sommar')} på sommaren, och {primusText('vinter')} när man
        smälter snö. Delar ni kök går det åt mindre per person, och blåst och kyla kan kräva mer.
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
