import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { KATEGORIER } from '@/lib/forrad'
import { sakerText } from '@/lib/packmallar'
import { antalSaker, type Startmall } from '@/lib/startmallar'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** En av MinVandrings startmallar: namn, beskrivning och antal saker. Sakerna fälls ut per kategori. */
export function Startmallkort({ mall }: { mall: Startmall }) {
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const kategorier = KATEGORIER.flatMap((k) => {
    const rader = mall.rader.filter((r) => r.kategori === k.nyckel)
    return rader.length ? [{ nyckel: k.nyckel, etikett: k.etikett, rader }] : []
  })

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-heading text-xl font-semibold break-words">{mall.namn}</h3>
      <p className="text-sm text-muted-foreground">{mall.beskrivning}</p>
      <p className="mt-1 text-sm">{sakerText(antalSaker(mall))}</p>
      <button
        type="button"
        aria-expanded={oppen}
        aria-controls={`${id}-rader`}
        onClick={() => setOppen(!oppen)}
        className={`mt-2 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-knapp px-2 text-sm font-medium text-primary hover:bg-muted ${fokus}`}
      >
        <ChevronDown className={`size-4 transition-transform ${oppen ? 'rotate-180' : ''}`} aria-hidden />
        {oppen ? 'Dölj sakerna' : 'Visa sakerna'}
      </button>
      {oppen && (
        <div id={`${id}-rader`} className="mt-2 space-y-3">
          {kategorier.map((k) => (
            <div key={k.nyckel}>
              <h4 className="text-sm font-semibold">{k.etikett}</h4>
              <ul className="divide-y divide-border text-sm">
                {k.rader.map((r) => (
                  <li key={r.namn} className="flex items-baseline justify-between gap-3 py-1.5">
                    <span className="min-w-0 break-words">
                      {r.antal && r.antal > 1 ? `${r.antal} × ` : ''}
                      {r.namn}
                    </span>
                    <span className="shrink-0 text-muted-foreground">{r.vem === 'gemensam' ? 'Gemensam' : 'Alla har'}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
