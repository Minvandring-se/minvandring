import { SlidersHorizontal, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { FlikAntal } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { BANDKURVOR, SOKKURVOR, TURKURVOR } from '@/components/ui/kurvdata'
import { SokFalt } from '@/components/ui/sokfalt'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Terrängerna i de mörkgröna ytorna: bandet på Hem, sökrutan och kortet Nästa tur. Var och en har sin egen viewBox.
 * Turens kurvor har topparna längst till höger, där kortets båge och bild ligger ovanpå, så de ritas från höger.
 */
const TERRANGER = {
  band: { bredd: 600, hojd: 190, linjer: BANDKURVOR, justering: 'xMidYMid slice' },
  sok: { bredd: 600, hojd: 160, linjer: SOKKURVOR, justering: 'xMidYMid slice' },
  tur: { bredd: 600, hojd: 150, linjer: TURKURVOR, justering: 'xMaxYMax slice' },
} as const

/**
 * Höjdkurvor som bakgrund i en mörkgrön yta: svaga linjer från en egen terräng per sorts yta, med topparna till höger
 * så att texten står på en lugn yta, och ett mjukt sken uppe till höger. Utan sken ritas bara linjerna, för kort där
 * en bild redan ligger till höger. Ytan tonar ut åt vänster (en mask med gradient, som i Menykurvor), så att linjerna
 * aldrig börjar med en rak kant. Skenet ligger i en egen svg och tonas inte.
 */
export function Hojdkurvor({ variant, sken = true, className }: { variant: keyof typeof TERRANGER; sken?: boolean; className?: string }) {
  const id = useId()
  const { bredd, hojd, linjer, justering } = TERRANGER[variant]
  const yta = cn('pointer-events-none absolute inset-0 size-full', className)
  return (
    <>
      {sken && (
        <svg viewBox={`0 0 ${bredd} ${hojd}`} preserveAspectRatio={justering} aria-hidden className={yta}>
          <defs>
            <radialGradient id={`${id}-sken`} cx="0.85" cy="0.1" r="0.9">
              <stop offset="0" style={{ stopColor: 'var(--color-yta-stark-linje)' }} />
              <stop offset="1" style={{ stopColor: 'var(--color-yta-stark)' }} />
            </radialGradient>
          </defs>
          <rect width={bredd} height={hojd} fill={`url(#${id}-sken)`} />
        </svg>
      )}
      <svg viewBox={`0 0 ${bredd} ${hojd}`} preserveAspectRatio={justering} aria-hidden className={cn(yta, '[mask-image:linear-gradient(to_right,transparent_5%,black_50%)]')}>
        <g fill="none" className="stroke-yta-stark-foreground" strokeOpacity="0.07" strokeWidth="1.2" strokeLinejoin="round">
          {linjer.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </>
  )
}

/**
 * Sökrutan, samma i hela appen (Matkatalogen, Utrustningskatalogen och Mitt förråd): en mörkgrön ruta med svaga
 * höjdkurvor, rubriken i Fraunces, en kort rad under (till exempel hur mycket man söker bland) och sökfältet med en
 * förklarande exempeltext. Rubriken är sidans h1, eller h2 när sidan redan har en rubrik.
 */
export function Sokruta({
  rubrik,
  rad,
  sok,
  onSok,
  placeholder,
  etikett = 'Sök',
  rubrikniva = 1,
  className,
}: {
  rubrik: string
  /** Den korta raden under rubriken. Tom medan den räknas, men raden tar plats så att rutan inte hoppar. */
  rad?: string | null
  sok: string
  onSok: (s: string) => void
  placeholder: string
  etikett?: string
  rubrikniva?: 1 | 2
  className?: string
}) {
  const id = useId()
  const Rubrik = rubrikniva === 1 ? 'h1' : 'h2'
  return (
    <section aria-labelledby={id} className={cn('relative overflow-hidden rounded-yta bg-yta-stark text-yta-stark-foreground', className)}>
      <Hojdkurvor variant="sok" />
      <div className="relative flex flex-col gap-4 px-3 pt-6 pb-5 sm:px-6">
        <div className="space-y-1.5">
          <Rubrik id={id} className="px-1 text-[1.875rem] leading-tight text-yta-stark-foreground lg:text-[2.25rem]">
            {rubrik}
          </Rubrik>
          <p className="min-h-6 px-1 text-yta-stark-muted">{rad}</p>
        </div>
        <SokFalt etikett={etikett} doldEtikett varde={sok} onAndra={onSok} placeholder={placeholder} className="max-w-2xl" />
      </div>
    </section>
  )
}

/** Knappen Filter med antalet aktiva filter. Öppnar filterpanelen. */
export function Filterknapp({ antal, onOppna, className }: { antal: number; onOppna: () => void; className?: string }) {
  return (
    <Button variant="outline" aria-haspopup="dialog" onClick={onOppna} className={cn('shrink-0 gap-2 px-3', className)}>
      <SlidersHorizontal className="size-4" aria-hidden />
      Filter
      {antal > 0 && (
        <>
          <FlikAntal antal={antal} />
          <span className="sr-only">aktiva</span>
        </>
      )}
    </Button>
  )
}

/** Raden under sökrutan: flikarna för vad man söker i till vänster (om sidan har några) och Filter till höger. */
export function Sokrad({ flikar, antalFilter, onFilter }: { flikar?: ReactNode; antalFilter: number; onFilter: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {/* overflow-hidden: en flikrad som går att svepa stannar till vänster om Filter. */}
      <div className="min-w-0 flex-1 overflow-hidden">{flikar}</div>
      <Filterknapp antal={antalFilter} onOppna={onFilter} />
    </div>
  )
}

export interface AktivtFilter {
  nyckel: string
  text: string
  onTaBort: () => void
}

/** De aktiva filtren som små etiketter med kryss, och Rensa allt. Visas inte utan filter. */
export function AktivaFilter({ filter, onRensaAllt }: { filter: readonly AktivtFilter[]; onRensaAllt: () => void }) {
  if (filter.length === 0) return null
  return (
    <div role="group" aria-label="Aktiva filter" className="flex flex-wrap items-center gap-2">
      {filter.map((f) => (
        <button
          key={f.nyckel}
          type="button"
          onClick={f.onTaBort}
          className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary-soft py-1 pr-2.5 pl-3.5 text-sm font-medium text-primary hover:bg-muted', fokus)}
        >
          {f.text}
          <X className="size-4" aria-hidden />
          <span className="sr-only">, ta bort filtret</span>
        </button>
      ))}
      <button type="button" onClick={onRensaAllt} className={cn('inline-flex min-h-11 items-center px-2 text-sm font-medium text-primary underline underline-offset-4', fokus)}>
        Rensa allt
      </button>
    </div>
  )
}

/**
 * Filtren i en panel: ett blad nerifrån i mobil och en panel från höger på dator. Visa stänger panelen, Rensa allt
 * tar bort alla filter i panelen.
 */
export function Filterpanel({ visa, onStang, onRensaAllt, harFilter, children }: { visa: string; onStang: () => void; onRensaAllt: () => void; harFilter: boolean; children: ReactNode }) {
  return (
    <Panel
      etikett="Filter"
      onStang={onStang}
      rubrik={<h2 className="text-2xl text-primary">Filter</h2>}
      fot={
        <div className="flex flex-wrap gap-2">
          <Button onClick={onStang}>{visa}</Button>
          {harFilter && (
            <Button variant="outline" onClick={onRensaAllt}>
              Rensa allt
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">{children}</div>
    </Panel>
  )
}
