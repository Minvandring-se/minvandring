import { SlidersHorizontal, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { FlikAntal } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { SokFalt } from '@/components/ui/sokfalt'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Höjdkurvor som bakgrund i den gröna rutan: svaga, lugna linjer och ett mjukt sken uppe till höger. */
function Hojdkurvor() {
  const id = useId()
  return (
    <svg viewBox="0 0 358 260" preserveAspectRatio="xMidYMid slice" aria-hidden className="absolute inset-0 size-full">
      <defs>
        <radialGradient id={`${id}-sken`} cx="0.85" cy="0.1" r="0.9">
          <stop offset="0" style={{ stopColor: 'var(--color-yta-stark-linje)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-yta-stark)' }} />
        </radialGradient>
      </defs>
      <rect width="358" height="260" fill={`url(#${id}-sken)`} />
      {Array.from({ length: 12 }, (_, i) => {
        const y = 30 + i * 22
        return <path key={y} d={`M-20 ${y} C 60 ${y - 18}, 120 ${y + 14}, 190 ${y - 6} S 320 ${y - 22}, 380 ${y}`} fill="none" className="stroke-yta-stark-foreground" strokeOpacity="0.07" strokeWidth="1.2" />
      })}
    </svg>
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
      <Hojdkurvor />
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
