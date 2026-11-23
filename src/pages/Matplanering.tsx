import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Matflikar } from '@/components/mat/Matflikar'
import { knappStil } from '@/components/ui/knappStil'
import { useDinaTurer } from '@/hooks/useDinaTurer'
import { useSidtitel } from '@/hooks/useSidtitel'
import { turdelAdress } from '@/lib/turdelar'
import { datumrad, delaUppTurer, lokaltDatum, type TurIListan } from '@/lib/turlista'

/** Mina matplaner, den första delen av Matplanering: dina turer, med en länk till varje turs matplan. Kommande turer först. */
export function Matplanering() {
  const rubrik = 'Mina matplaner'
  useSidtitel(rubrik)
  const { anvandarId } = useApp()
  const turer = useDinaTurer(anvandarId, 'matplanering')

  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik rubrik={rubrik} text="Välj en tur för att planera maten dag för dag." />
      {turer === null ? (
        <Laddar text="Hämtar dina turer" className="space-y-3">
          <Skelett className="h-16 rounded-lg" />
          <Skelett className="h-16 rounded-lg" />
        </Laddar>
      ) : turer.length === 0 ? (
        <TomtLage
          kompakt
          rubrik="Du har inga turer än"
          text="Matplanen hör till en tur. Skapa en tur först, så kan ni planera maten i den."
          knapp={
            <Link to="/turer" className={knappStil({ variant: 'outline' })}>
              Till Mina turer
            </Link>
          }
        />
      ) : (
        <Turlistor turer={turer} />
      )}
    </div>
  )
}

function Turlistor({ turer }: { turer: TurIListan[] }) {
  const { nasta, kommande, tidigare } = delaUppTurer(turer, lokaltDatum())
  const framat = [nasta, ...kommande].filter((t): t is TurIListan => t !== null)
  return (
    <div className="space-y-6">
      {framat.length > 0 && <Lista rubrik="Kommande turer" turer={framat} />}
      {tidigare.length > 0 && <Lista rubrik="Tidigare turer" turer={tidigare} />}
    </div>
  )
}

function Lista({ rubrik, turer }: { rubrik: string; turer: TurIListan[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl">{rubrik}</h2>
      <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {turer.map((t) => (
          <li key={t.id}>
            <Link
              to={turdelAdress(t.id, 'mat')}
              className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg font-semibold break-words">{t.namn}</span>
                <span className="block text-sm text-muted-foreground">{datumrad(t)}</span>
              </span>
              <span className="sr-only">, öppna matplanen</span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
