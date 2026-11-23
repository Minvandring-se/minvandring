import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { ALLERGENER, KOSTVAL, type Allergen, type Kostfilter, type Kostval } from '@/lib/kost'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** En knapp som är vald eller inte, i filtren för kost och allergener. */
const valknapp = (vald: boolean) =>
  cn(
    'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
    fokus,
    vald ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-border bg-card hover:bg-muted',
  )

/** Knapparna för de fyra kostvalen och "Utan" allergener, som fälls ut. Används i Välj rätt och i Matkatalogen. */
export function Kostfilterval({ filter, onAndra }: { filter: Kostfilter; onAndra: (f: Kostfilter) => void }) {
  const id = useId()
  const [visaAllergener, setVisaAllergener] = useState(filter.utan.length > 0)

  const vaxlaVal = (val: Kostval) => onAndra({ ...filter, val: filter.val.includes(val) ? filter.val.filter((v) => v !== val) : [...filter.val, val] })
  const vaxlaAllergen = (a: Allergen) => onAndra({ ...filter, utan: filter.utan.includes(a) ? filter.utan.filter((x) => x !== a) : [...filter.utan, a] })

  return (
    <>
      <div role="group" aria-label="Kost" className="flex flex-wrap gap-2">
        {KOSTVAL.map((k) => (
          <button key={k.nyckel} type="button" aria-pressed={filter.val.includes(k.nyckel)} onClick={() => vaxlaVal(k.nyckel)} className={valknapp(filter.val.includes(k.nyckel))}>
            {k.etikett}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          aria-expanded={visaAllergener}
          aria-controls={`${id}-allergener`}
          onClick={() => setVisaAllergener((v) => !v)}
          className={cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary', fokus)}
        >
          Utan allergener{filter.utan.length > 0 && ` (${filter.utan.length})`}
          <ChevronDown className={cn('size-4 transition-transform', visaAllergener && 'rotate-180')} aria-hidden />
        </button>
        <div id={`${id}-allergener`} role="group" aria-label="Utan allergener" hidden={!visaAllergener} className="flex flex-wrap gap-2">
          {ALLERGENER.map((a) => (
            <button key={a.nyckel} type="button" aria-pressed={filter.utan.includes(a.nyckel)} onClick={() => vaxlaAllergen(a.nyckel)} className={valknapp(filter.utan.includes(a.nyckel))}>
              Utan {a.etikett.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
