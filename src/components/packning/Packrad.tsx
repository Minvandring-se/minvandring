import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { somPackar, statusnyckel } from '@/lib/packlista'
import type { DeltagareRad, PackradRad, PackstatusRad } from '@/lib/typer'
import { cn } from '@/lib/utils'

/** Vem som tar med raden, i ord. */
function barare(rad: PackradRad, namn: ReadonlyMap<string, string>, mittId: string | null): string | null {
  if (rad.alla) return 'Alla har var sin'
  const vem = rad.bars_av ? (rad.bars_av === mittId ? 'Du' : (namn.get(rad.bars_av) ?? 'Någon')) : null
  if (rad.gemensam) return vem ? `Gemensam, ${vem === 'Du' ? 'du tar med den' : `${vem} tar med den`}` : null
  return vem
}

/**
 * En rad i packlistan: bocken för den inloggade när hen ska packa raden (hela raden går att trycka på), namn, vikt
 * och vem som tar med den. På en rad som alla ska ha visas ens egen modell. Den som får ändra raderna kan ta bort
 * den, efter en fråga.
 */
export function Packrad({
  rad,
  mittId,
  status,
  deltagare,
  namn,
  kanAndra,
  sparar,
  onBock,
  onValjEgen,
  onTaMed,
  onTaBort,
}: {
  rad: PackradRad
  mittId: string | null
  status: ReadonlyMap<string, PackstatusRad>
  deltagare: readonly DeltagareRad[]
  namn: ReadonlyMap<string, string>
  kanAndra: boolean
  sparar: boolean
  onBock: (packad: boolean) => void
  onValjEgen: () => void
  onTaMed: (ta: boolean) => void
  onTaBort: () => void
}) {
  const [fragar, setFragar] = useState(false)
  const packare = somPackar(rad, deltagare)
  const minBock = mittId !== null && packare.includes(mittId)
  const min = mittId ? status.get(statusnyckel(rad.id, mittId)) : undefined
  const egen = rad.alla ? min : undefined
  const styckvikt = egen?.vikt_g ?? rad.vikt_g
  const vikt = styckvikt === null ? null : styckvikt * Math.max(1, rad.antal)
  const vem = barare(rad, namn, mittId)
  const ingen = rad.gemensam && !rad.bars_av
  const packadeAv = packare.filter((id) => status.get(statusnyckel(rad.id, id))?.packad).length
  const packad = minBock && !!min?.packad

  const namnrad = (
    <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
      {/* Ord bryts aldrig mitt i, och bindestreck är hårda (U+2011), som i förrådet. */}
      <span className={cn('line-clamp-2 min-w-0 [overflow-wrap:normal]', packad && 'text-muted-foreground line-through')}>
        {rad.antal > 1 && `${rad.antal} × `}
        {rad.namn.replaceAll('-', '‑')}
      </span>
      <span className="shrink-0 text-sm tabular-nums">{vikt === null ? 'Ingen vikt' : formateraVikt(vikt)}</span>
    </span>
  )

  return (
    <li className="space-y-1 py-2">
      {minBock ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={packad} disabled={sparar} onChange={(e) => onBock(e.target.checked)} className="size-5 shrink-0 accent-primary" />
          {namnrad}
        </label>
      ) : (
        <div className="flex min-h-11 items-center gap-3">
          <span className="size-5 shrink-0" aria-hidden />
          {namnrad}
        </div>
      )}
      <div className="flex items-start gap-2 pl-8">
        <div className="min-w-0 flex-1 space-y-1">
          {egen?.namn && <p className="text-sm break-words">Din modell: {egen.namn}</p>}
          <p className={cn('text-sm', ingen ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>
            {ingen ? 'Ingen tar med ännu' : vem}
            {rad.alla && packare.length > 0 && `. ${packadeAv} av ${packare.length} har packat`}
            {!rad.med && '. Tas inte med'}
          </p>
          {(rad.alla || rad.gemensam) && mittId && (
            <div className="-ml-3 flex flex-wrap gap-2">
              {rad.alla && (
                <Button variant="ghost" className="px-3 text-primary" onClick={onValjEgen}>
                  {egen?.namn ? 'Byt din modell' : 'Välj din modell'}
                  <span className="sr-only">: {rad.namn}</span>
                </Button>
              )}
              {ingen && (
                <Button variant="ghost" className="px-3 text-primary" disabled={sparar} onClick={() => onTaMed(true)}>
                  Jag tar med den
                  <span className="sr-only">: {rad.namn}</span>
                </Button>
              )}
              {rad.gemensam && rad.bars_av !== null && rad.bars_av === mittId && (
                <Button variant="ghost" className="px-3 text-primary" disabled={sparar} onClick={() => onTaMed(false)}>
                  Jag tar inte med den
                  <span className="sr-only">: {rad.namn}</span>
                </Button>
              )}
            </div>
          )}
          {fragar && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-sm font-medium">Ta bort för alla i turen?</span>
              <Button variant="outline" className="text-destructive" disabled={sparar} onClick={onTaBort}>
                Ta bort
                <span className="sr-only"> {rad.namn}</span>
              </Button>
              <Button variant="ghost" onClick={() => setFragar(false)}>
                Avbryt
              </Button>
            </div>
          )}
        </div>
        {kanAndra && !fragar && (
          <Button variant="ghost" size="ikon" aria-label={`Ta bort ${rad.namn}`} className="-mt-2 text-muted-foreground" onClick={() => setFragar(true)}>
            <X className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  )
}
