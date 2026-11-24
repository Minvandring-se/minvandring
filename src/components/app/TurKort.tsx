import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Bricka } from '@/components/ui/bricka'
import { Namnbrickor } from '@/components/app/Namnbricka'
import { knappStil } from '@/components/ui/knappStil'
import { Nyckeltal } from '@/components/ui/nyckeltal'
import { Turbild } from '@/components/ui/turbild'
import { arProfilbildHamtad, useProfilbilder } from '@/hooks/useProfilbilder'
import { avfardEtikett, dagarVarde, datumIntervall, datumrad, deltagareText } from '@/lib/turlista'
import { cn } from '@/lib/utils'

/** En tur i listan Mina turer, med deltagarna från databasen. */
export interface TurMedDeltagare {
  id: string
  namn: string
  destination: string | null
  avresa: string | null
  hemkomst: string | null
  dagar: number | null
  skapad: string
  deltagare: { namn: string; typ: 'person' | 'hund'; user_id?: string | null }[]
}

/** Följer med när en tur öppnas från listan, så att Tillbaka i turen leder till samma plats i listan. */
const FRAN_LISTA = { franLista: true }

/**
 * Det stora kortet för nästa (eller pågående) tur, som turens huvud: text till vänster och den tecknade bildrutan
 * till höger på dator, bilden överst i mobil. Den rostfärgade etiketten säger hur långt det är kvar.
 */
export function NastaTurKort({ tur, idag }: { tur: TurMedDeltagare; idag: string }) {
  const { bildUppdaterad } = useApp()
  const deltagare = tur.deltagare.filter((d) => d.typ === 'person')
  const bilder = useProfilbilder(deltagare.map((d) => d.user_id), bildUppdaterad)
  const personer = deltagare.map((d) => ({
    namn: d.namn,
    bild: d.user_id ? bilder[d.user_id] : null,
    laddar: !!d.user_id && !arProfilbildHamtad(d.user_id),
  }))
  const etikett = avfardEtikett(tur, idag)
  return (
    <article
      aria-labelledby={`nasta-${tur.id}`}
      className="relative grid overflow-hidden rounded-[1.375rem] border border-border bg-card md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
    >
      <Turbild turId={tur.id} className="h-44 w-full sm:h-56 md:order-2 md:h-full md:min-h-80" />
      <div className="flex min-w-0 flex-col gap-3 p-5 sm:p-7 md:order-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Nästa tur</span>
          {etikett && (
            <Bricka ton="rost" stor>
              {etikett}
            </Bricka>
          )}
        </div>
        <h2 id={`nasta-${tur.id}`} className="text-2xl leading-tight font-bold break-words hyphens-auto lg:text-3xl">
          {tur.namn}
        </h2>
        {tur.destination && <p className="text-muted-foreground break-words">{tur.destination}</p>}
        <Nyckeltal
          varden={[
            { etikett: 'Datum', varde: datumIntervall(tur.avresa, tur.hemkomst) },
            { etikett: 'Vandringsdagar', varde: dagarVarde(tur.dagar) },
          ]}
        />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex min-w-0 items-center gap-3">
            <Namnbrickor personer={personer} />
            <span className="text-sm text-muted-foreground">{deltagareText(tur.deltagare)}</span>
          </div>
          {/* Länken täcker hela kortet, så att det går att trycka var som helst på det. Sidans huvudknapp. */}
          <Link
            to={`/tur/${tur.id}`}
            state={FRAN_LISTA}
            className={cn(
              knappStil(),
              // Fokusringen visas runt hela kortet, innanför kanten, eftersom hela kortet går att trycka på.
              'after:absolute after:inset-0 after:rounded-[1.375rem] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring',
            )}
          >
            Öppna turen<span className="sr-only"> {tur.namn}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

/** En tur i listan med fler turer: liten bildruta, namn, datum och destination. Hela raden är en länk. */
export function TurRadKort({ tur }: { tur: TurMedDeltagare }) {
  return (
    <Link
      to={`/tur/${tur.id}`}
      state={FRAN_LISTA}
      className="group flex h-full items-center gap-4 rounded-lg border border-border bg-card p-2 pr-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Turbild turId={tur.id} className="h-16 w-16 shrink-0 rounded-md sm:h-20 sm:w-28" />
      <div className="min-w-0 flex-1 space-y-1 py-1">
        <h3 className="text-base break-words sm:text-lg">{tur.namn}</h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <span>{datumrad(tur)}</span>
        </p>
        {tur.destination && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{tur.destination}</span>
          </p>
        )}
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
