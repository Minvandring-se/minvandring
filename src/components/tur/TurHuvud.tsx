import { ChevronLeft, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Namnbrickor } from '@/components/app/Namnbricka'
import { TillbakaLank } from '@/components/tur/Tillbaka'
import { Bricka } from '@/components/ui/bricka'
import { Flikrad } from '@/components/ui/flikrad'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { knappStil } from '@/components/ui/knappStil'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Turbild } from '@/components/ui/turbild'
import { arProfilbildHamtad, useProfilbilder } from '@/hooks/useProfilbilder'
import { ROLLNAMN, kanAndra, type Roll } from '@/lib/roller'
import { aktivTurdel, TURDELAR, turdelAdress } from '@/lib/turdelar'
import { avfardEtikett, dagarVarde, datumIntervall, deltagarNamn, lokaltDatum } from '@/lib/turlista'
import type { DeltagareRad, Tur } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Turens huvud på alla flikar: åtgärderna, turen (namn, destination, datum, dagar och deltagarna) med den tecknade
 * bildrutan, och flikraden. På dator står texten till vänster och bilden till höger. I mobil ligger bilden överst
 * och turens kort delvis ovanpå den.
 */
export function TurHuvud({ tur, deltagare, minRoll }: { tur: Tur; deltagare: DeltagareRad[]; minRoll: Roll | null }) {
  const { state } = useLocation()
  const { bildUppdaterad } = useApp()
  const bilder = useProfilbilder(deltagare.map((d) => d.user_id), bildUppdaterad)
  const personer = deltagare
    .filter((d) => d.typ === 'person')
    .map((d) => ({ namn: d.namn, bild: d.user_id ? bilder[d.user_id] : null, laddar: !!d.user_id && !arProfilbildHamtad(d.user_id) }))
  const etikett = avfardEtikett(tur, lokaltDatum())
  const farBjudaIn = minRoll !== null && kanAndra(minRoll)
  // Bjud in leder till Deltagare på översikten, där inbjudan öppnas direkt.
  const bjudIn = `${turdelAdress(tur.id, 'oversikt')}#bjud-in`

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Brödsmulor och åtgärder, på dator. I mobil ligger Tillbaka och Bjud in på bilden. */}
      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <nav aria-label="Brödsmulor" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <TillbakaLank className={cn('inline-flex min-h-11 items-center rounded-md hover:text-foreground', fokus)}>Mina turer</TillbakaLank>
          <span aria-hidden>/</span>
          <span className="min-w-0 truncate font-medium text-foreground" aria-current="page">
            {tur.namn}
          </span>
        </nav>
        <div className="flex flex-wrap gap-2">
          {/* Planerade åtgärder. De ser ut som knappar men går inte att trycka på. */}
          {['Skriv ut packlista', 'Skicka färdplan'].map((text) => (
            <span key={text} className={cn(knappStil({ variant: 'outline' }), 'cursor-default gap-2.5 text-muted-foreground hover:bg-card')}>
              {text}
              <KommerSnartEtikett />
            </span>
          ))}
          {farBjudaIn && (
            <Link to={bjudIn} state={state} className={knappStil({ variant: 'outline' })}>
              <UserPlus className="size-4" aria-hidden />
              Bjud in
            </Link>
          )}
        </div>
      </div>

      <section aria-labelledby="tur-namn" className="md:grid md:grid-cols-2 md:overflow-hidden md:rounded-[1.375rem] md:border md:border-border md:bg-card">
        <div className="relative md:order-2">
          <Turbild turId={tur.id} className="h-52 w-full rounded-lg sm:h-64 md:h-full md:min-h-96 md:rounded-none" />
          {/* I mobil: Tillbaka och Bjud in som runda knappar på bilden. */}
          <div className="absolute inset-x-2 top-2 flex justify-between md:hidden">
            <TillbakaLank aria-label="Tillbaka till Mina turer" className={cn('flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft', fokus)}>
              <ChevronLeft className="size-5" aria-hidden />
            </TillbakaLank>
            {farBjudaIn && (
              <Link to={bjudIn} state={state} aria-label="Bjud in" className={cn('flex size-11 items-center justify-center rounded-full bg-card/90 text-foreground shadow-soft', fokus)}>
                <UserPlus className="size-5" aria-hidden />
              </Link>
            )}
          </div>
        </div>

        <div className="relative mx-2 -mt-8 flex flex-col gap-3 rounded-[1.375rem] border border-border bg-card p-5 md:order-1 md:m-0 md:justify-center md:gap-3.5 md:rounded-none md:border-0 md:p-8 lg:p-9">
          {(etikett || minRoll) && (
            <div className="flex flex-wrap gap-2">
              {etikett && (
                <Bricka ton="rost" stor>
                  {etikett}
                </Bricka>
              )}
              {minRoll && <Bricka stor>Du är {ROLLNAMN[minRoll].toLowerCase()}</Bricka>}
            </div>
          )}
          {/* Långa ord avstavas på svenska (lang="sv") i stället för att brytas mitt i. */}
          <h1 id="tur-namn" className="text-3xl leading-tight font-semibold break-words hyphens-auto lg:text-4xl xl:text-5xl xl:leading-[1.05]">
            {tur.namn}
          </h1>
          {tur.destination && <p className="text-muted-foreground break-words lg:text-lg">{tur.destination}</p>}
          <Nyckeltal
            className="mt-1"
            varden={[
              { etikett: 'Datum', varde: datumIntervall(tur.avresa, tur.hemkomst) },
              { etikett: 'Vandringsdagar', varde: dagarVarde(tur.dagar) },
            ]}
          />
          {personer.length > 0 && (
            // Leder till Deltagare på översikten, även från de andra flikarna.
            <Link
              to={`${turdelAdress(tur.id, 'oversikt')}#deltagare`}
              replace
              state={state}
              className={cn('flex min-h-11 items-center gap-3 self-start rounded-md text-sm text-muted-foreground hover:text-foreground', fokus)}
            >
              <Namnbrickor personer={personer} />
              <span className="min-w-0">{deltagarNamn(deltagare)}</span>
            </Link>
          )}
        </div>
      </section>

      <TurFlikar turId={tur.id} />
    </div>
  )
}

/**
 * Turens flikar. Översikt och Mat är byggda, de andra visar vad de blir med "Kommer snart".
 * Flikarna byter del utan att lägga till ett steg i historiken, så att bakåt alltid leder ut ur turen.
 */
export function TurFlikar({ turId }: { turId: string }) {
  const { pathname, state } = useLocation()
  return (
    <Flikrad
      etikett="Turens delar"
      aktiv={aktivTurdel(pathname)}
      lank={{ replace: true, state }}
      flikar={TURDELAR.map(({ del, namn, byggd }) => ({ nyckel: del, namn, till: turdelAdress(turId, del), kommerSnart: !byggd }))}
    />
  )
}
