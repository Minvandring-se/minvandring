import { ChevronRight } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { Matflikar } from '@/components/mat/Matflikar'
import { NastaTurMat } from '@/components/mat/NastaTurMat'
import { knappStil } from '@/components/ui/knappStil'
import { useDinaTurer, type DinTur } from '@/hooks/useDinaTurer'
import { useMatlagen, type Matlagen } from '@/hooks/useMatlagen'
import { useSidtitel } from '@/hooks/useSidtitel'
import { maltidsAdress, matdagar, matstatus, saknasText, type Matstatus } from '@/lib/mat'
import { turdelAdress } from '@/lib/turdelar'
import { datumIntervall, delaUppTurer, lokaltDatum } from '@/lib/turlista'

/**
 * Mina matplaner, den första delen av Matplanering: nästa tur överst på den mörkgröna ytan, och sedan övriga kommande
 * och tidigare turer som tunna rader. Varje tur visar hur många måltider som saknas.
 */
export function Matplanering() {
  const rubrik = 'Mina matplaner'
  useSidtitel(rubrik)
  const { anvandarId } = useApp()
  const { turer, fel, forsokIgen } = useDinaTurer(anvandarId, 'matplanering')

  return (
    <div className="space-y-6 lg:space-y-8">
      <Matflikar />
      <SidRubrik rubrik={rubrik} text="Planera maten dag för dag för varje tur." />
      {turer === null && fel ? (
        <Laddfel vad="dina turer" onForsokIgen={forsokIgen} />
      ) : turer === null ? (
        <Laddar text="Hämtar dina turer" className="space-y-4">
          <Skelett className="h-80 rounded-yta" />
          <Skelett className="h-36 rounded-ruta" />
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

function Turlistor({ turer }: { turer: DinTur[] }) {
  const { nasta, kommande, tidigare } = delaUppTurer(turer, lokaltDatum())
  const lagen = useMatlagen(turer.map((t) => t.id))
  const status = (t: DinTur) => statusFor(t, lagen.rader)
  return (
    <div className="space-y-8 lg:space-y-10">
      {lagen.rader === 'fel' && <Laddfel vad="hur långt matplanerna har kommit" onForsokIgen={lagen.forsokIgen} />}
      {nasta && <NastaTurMat tur={nasta} status={status(nasta)} />}
      {kommande.length > 0 && <Lista rubrik={nasta ? 'Övriga kommande turer' : 'Kommande turer'} turer={kommande} status={status} />}
      {tidigare.length > 0 && <Lista rubrik="Tidigare turer" turer={tidigare} status={status} />}
    </div>
  )
}

function statusFor(tur: DinTur, rader: Matlagen['rader']): Matstatus | null | 'fel' {
  if (rader === null || rader === 'fel') return rader
  return matstatus(matdagar(tur.dagar, tur.reservdagar), rader.get(tur.id) ?? [])
}

function Lista({ rubrik, turer, status }: { rubrik: string; turer: DinTur[]; status: (t: DinTur) => Matstatus | null | 'fel' }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-3 lg:space-y-4">
      <h2 id={id} className="text-xl lg:text-2xl">
        {rubrik}
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-ruta border border-border bg-card">
        {turer.map((t) => (
          <li key={t.id}>
            <Turrad tur={t} status={status(t)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** En tur som en tunn rad: namn, datum och status. I mobil under varandra, på dator i kolumner. */
function Turrad({ tur, status }: { tur: DinTur; status: Matstatus | null | 'fel' }) {
  const forsta = status !== null && status !== 'fel' ? status.forsta : null
  return (
    <Link
      to={forsta ? maltidsAdress(tur.id, forsta.dag.dag, forsta.maltid) : turdelAdress(tur.id, 'mat')}
      className="grid min-h-[4.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-3.5 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6 md:grid-cols-[minmax(0,1fr)_12rem_11rem_auto]"
    >
      <span className="flex min-w-0 flex-col gap-1 md:contents">
        <span className="font-heading text-lg font-semibold wrap-anywhere lg:text-xl">{tur.namn}</span>
        <span className="text-sm text-muted-foreground lg:text-[0.9375rem]">{datumIntervall(tur.avresa, tur.hemkomst)}</span>
        <Radstatus status={status} />
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

function Radstatus({ status }: { status: Matstatus | null | 'fel' }) {
  const klass = 'text-sm font-medium lg:text-[0.9375rem]'
  if (status === null) return <Skelett className="h-4 w-32" />
  if (status === 'fel') return <span />
  if (status.totalt === 0) return <span className={`${klass} text-muted-foreground`}>Inga dagar angivna</span>
  if (status.saknas === 0) return <span className={`${klass} text-primary`}>Matplanen är klar</span>
  return <span className={`${klass} text-accent-strong`}>{saknasText(status.saknas)}</span>
}
