import { ArrowLeftRight } from 'lucide-react'
import { Link } from 'react-router'
import { Skelett } from '@/components/app/Laddar'
import { knappStil } from '@/components/ui/knappStil'
import type { Matstatus } from '@/lib/mat'
import { datumIntervall } from '@/lib/turlista'
import type { Tur } from '@/lib/typer'
import { cn } from '@/lib/utils'

/**
 * Turens kompakta huvud på fliken Mat: den mörkgröna ytan med Byt tur, turens namn, datum och vandringsdagar, och hur
 * många måltider som är planerade med en tunn förloppslist i hjortron. Ersätter det stora huvudet på den här fliken,
 * så att maten syns direkt i mobil.
 */
export function TurMatHuvud({ tur, status }: { tur: Tur; status: Matstatus | null }) {
  return (
    <section aria-labelledby="tur-namn" className="rounded-yta bg-yta-stark p-5 text-yta-stark-foreground sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-3">
          <Link to="/matplanering" className={cn(knappStil({ variant: 'kant-stark' }), 'self-start px-3.5')}>
            <ArrowLeftRight className="size-4" aria-hidden />
            Byt tur
          </Link>
          {/* Långa ord avstavas på svenska (lang="sv") i stället för att brytas mitt i. */}
          <h1 id="tur-namn" className="text-[2rem] leading-tight break-words hyphens-auto lg:text-5xl lg:leading-[1.05]">
            {tur.namn}
          </h1>
          <ul className="flex flex-col gap-y-1 text-[0.9375rem] text-yta-stark-muted min-[23.75rem]:flex-row lg:text-base">
            <li className="min-[23.75rem]:pr-4">{datumIntervall(tur.avresa, tur.hemkomst)}</li>
            {tur.dagar !== null && (
              <li className="min-[23.75rem]:border-l min-[23.75rem]:border-yta-stark-linje min-[23.75rem]:pl-4">
                {tur.dagar} {tur.dagar === 1 ? 'vandringsdag' : 'vandringsdagar'}
              </li>
            )}
          </ul>
        </div>
        {status === null ? (
          <Skelett className="h-14 w-full bg-yta-stark-linje lg:w-80" />
        ) : (
          status.totalt > 0 && <Planerade planerade={status.planerade} totalt={status.totalt} />
        )}
      </div>
    </section>
  )
}

function Planerade({ planerade, totalt }: { planerade: number; totalt: number }) {
  const andel = Math.round((planerade / totalt) * 100)
  const text = `${planerade} av ${totalt} måltider planerade`
  return (
    <div className="flex w-full shrink-0 flex-col gap-2.5 lg:w-80">
      <p className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-yta-stark-muted lg:text-[0.9375rem]">Måltider planerade</span>
        <span className="font-heading text-2xl font-semibold text-hjortron tabular-nums lg:text-[1.75rem]" aria-hidden>
          {planerade} av {totalt}
        </span>
        <span className="sr-only">{text}</span>
      </p>
      <div role="progressbar" aria-label="Måltider planerade" aria-valuemin={0} aria-valuemax={totalt} aria-valuenow={planerade} aria-valuetext={text} className="h-2 overflow-hidden rounded-full bg-yta-stark-linje">
        <div className="h-full rounded-full bg-hjortron transition-[width]" style={{ width: `${andel}%` }} />
      </div>
    </div>
  )
}
