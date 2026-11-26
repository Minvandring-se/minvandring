import type { ReactNode } from 'react'
import { Namnbricka } from '@/components/app/Namnbricka'

/**
 * En person i listorna på sidan Vänner: bild eller initial, namnet, en rad under och knapparna. Knapparna hamnar
 * under namnet i mobil och till höger från sm.
 */
export function Personrad({ namn, under, bild, knappar }: { namn: string; under: string; bild?: string | null; knappar?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:flex-nowrap">
      <Namnbricka namn={namn} bild={bild} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold break-words">{namn}</p>
        <p className="text-sm break-words text-muted-foreground">{under}</p>
      </div>
      {knappar && <div className="flex w-full flex-wrap gap-2 pl-12 sm:w-auto sm:shrink-0 sm:pl-0">{knappar}</div>}
    </li>
  )
}
