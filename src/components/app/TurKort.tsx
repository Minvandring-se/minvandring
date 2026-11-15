import { ArrowRight, CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { Namnbrickor } from '@/components/app/Namnbricka'
import { TurBild } from '@/components/app/TurBild'
import { datumrad, deltagareText } from '@/lib/turlista'

/** En tur i listan Mina turer, med deltagarna från databasen. */
export interface TurMedDeltagare {
  id: string
  namn: string
  destination: string | null
  avresa: string | null
  hemkomst: string | null
  dagar: number | null
  skapad: string
  deltagare: { namn: string; typ: 'person' | 'hund' }[]
}

/** Följer med när en tur öppnas från listan, så att Tillbaka i turen leder till samma plats i listan. */
const FRAN_LISTA = { franLista: true }

/** Det stora kortet för nästa (eller pågående) vandring. Bild till vänster på dator, överst i mobil. */
export function NastaTurKort({ tur, pagar }: { tur: TurMedDeltagare; pagar: boolean }) {
  const personer = tur.deltagare.filter((d) => d.typ === 'person').map((d) => d.namn)
  return (
    <article className="relative grid overflow-hidden rounded-lg border border-border bg-card shadow-soft md:grid-cols-[1.15fr_1fr]">
      <div className="relative">
        <TurBild turId={tur.id} sizes="(min-width: 768px) 560px, 100vw" prioritet className="aspect-[16/9] h-full w-full md:aspect-auto md:min-h-72" />
        <span className="absolute top-3 left-3 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-foreground shadow-soft">
          {pagar ? 'Pågår nu' : 'Nästa vandring'}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
        <div className="space-y-2">
          <h2 className="text-2xl break-words lg:text-3xl">{tur.namn}</h2>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {datumrad(tur)}
          </p>
          {tur.destination && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{tur.destination}</span>
            </p>
          )}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Namnbrickor namn={personer} />
            <span className="text-sm text-muted-foreground">{deltagareText(tur.deltagare)}</span>
          </div>
          {/* Länken täcker hela kortet, så att det går att trycka var som helst på det. */}
          <Link
            to={`/tur/${tur.id}`}
            state={FRAN_LISTA}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors after:absolute after:inset-0 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Öppna turen
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}

/** En tur i listan med fler turer: liten bild, namn och datum. Hela raden är en länk. */
export function TurRadKort({ tur }: { tur: TurMedDeltagare }) {
  return (
    <Link
      to={`/tur/${tur.id}`}
      state={FRAN_LISTA}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-2 pr-3 shadow-soft transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <TurBild turId={tur.id} sizes="160px" className="h-14 w-16 shrink-0 rounded-md sm:h-20 sm:w-32" />
      <div className="min-w-0 flex-1 space-y-1 py-1">
        <h3 className="text-base break-words sm:text-lg">{tur.namn}</h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <span>{datumrad(tur)}</span>
        </p>
        {tur.destination && <p className="truncate text-sm text-muted-foreground">{tur.destination}</p>}
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
