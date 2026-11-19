import { Link } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { ForradIllustration } from '@/components/illustrationer/ForradIllustration'
import { Levande } from '@/components/start/Levande'
import { useSidtitel } from '@/hooks/useSidtitel'

/** Mitt förråd. Finns inte än, så sidan säger det rakt ut och pekar tillbaka till turerna. */
export function Forrad() {
  useSidtitel('Mitt förråd')
  return (
    <div className="space-y-8">
      <SidRubrik rubrik="Mitt förråd" text="Din egen utrustning, samlad på ett ställe." />

      <div className="grid overflow-hidden rounded-lg border border-border bg-primary-soft/60 shadow-soft md:grid-cols-2">
        <Levande>
          <ForradIllustration className="block aspect-[8/5] w-full" />
        </Levande>
        <div className="space-y-3 p-6 sm:p-8">
          <span className="inline-block rounded-full bg-card px-3 py-1 text-sm font-medium text-muted-foreground">Inte byggt än</span>
          <h2 className="text-2xl">Här kommer dina saker att ligga</h2>
          <p className="text-muted-foreground">
            Tanken är att du ska kunna lägga in din utrustning med vikt en gång och sedan använda den i varje tur. Förrådet finns inte än, så
            tills vidare planerar du i turerna.
          </p>
          <Link
            to="/turer"
            className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            Till Mina turer
          </Link>
        </div>
      </div>
    </div>
  )
}
