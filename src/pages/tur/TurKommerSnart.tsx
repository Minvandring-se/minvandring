import { Backpack, CookingPot, Route, type LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useTur } from '@/components/tur/turKontext'
import { turdelAdress, type Turdel } from '@/lib/turdelar'

const DELAR: Record<Exclude<Turdel, 'oversikt'>, { ikon: LucideIcon; rubrik: string; text: string }> = {
  packa: {
    ikon: Backpack,
    rubrik: 'Packa',
    text: 'Här kommer gruppens packlista: vem som bär vad, vikten per ryggsäck och bockar för det som är packat.',
  },
  mat: {
    ikon: CookingPot,
    rubrik: 'Mat',
    text: 'Här kommer matplanen dag för dag och en inköpslista som går att bocka av.',
  },
  rutt: {
    ikon: Route,
    rubrik: 'Rutt',
    text: 'Här kommer dagsetapperna längs vägen och en färdplan som går att dela med någon hemma.',
  },
}

/** En del av turen som inte är byggd än. Säger det rakt ut och pekar tillbaka till översikten. */
export function TurKommerSnart({ del }: { del: Exclude<Turdel, 'oversikt'> }) {
  const { tur } = useTur()
  const { state } = useLocation()
  const { ikon: Ikon, rubrik, text } = DELAR[del]
  return (
    <section aria-labelledby="del-rubrik" className="space-y-3 rounded-lg border border-dashed border-border px-5 py-8 sm:px-8">
      <Ikon className="size-7 text-muted-foreground" aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="del-rubrik" className="text-2xl">
          {rubrik}
        </h2>
        <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">Kommer snart</span>
      </div>
      <p className="max-w-prose text-muted-foreground">{text}</p>
      <Link
        to={turdelAdress(tur.id, 'oversikt')}
        replace
        state={state}
        className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
      >
        Till översikten
      </Link>
    </section>
  )
}
