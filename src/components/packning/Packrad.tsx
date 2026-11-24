import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formateraVikt } from '@/lib/forrad'
import { somPackar, statusnyckel } from '@/lib/packlista'
import type { DeltagareRad, PackradRad, PackstatusRad } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Vem som bär raden, i ord. */
function barare(rad: PackradRad, namn: ReadonlyMap<string, string>, mittId: string | null): string | null {
  if (rad.alla) return 'Alla har var sin'
  const vem = rad.bars_av ? (rad.bars_av === mittId ? 'Du' : (namn.get(rad.bars_av) ?? 'Någon')) : null
  if (rad.gemensam) return vem ? `Gemensam, ${vem === 'Du' ? 'du tar med den' : `${vem} tar med den`}` : null
  return vem
}

/**
 * En rad i packlistan: bocken för den inloggade när hen ska packa raden, namn, vikt och vem som bär. På en rad som
 * alla ska ha visas ens egen modell. Den som får ändra raderna kan ta bort den.
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
  const packare = somPackar(rad, deltagare)
  const minBock = mittId !== null && packare.includes(mittId)
  const min = mittId ? status.get(statusnyckel(rad.id, mittId)) : undefined
  const egen = rad.alla ? min : undefined
  const vikt = (egen?.vikt_g ?? rad.vikt_g) === null ? null : (egen?.vikt_g ?? rad.vikt_g)! * Math.max(1, rad.antal)
  const vem = barare(rad, namn, mittId)
  const ingen = rad.gemensam && !rad.bars_av
  const packadeAv = packare.filter((id) => status.get(statusnyckel(rad.id, id))?.packad).length
  const id = `packrad-${rad.id}`

  return (
    <li className={cn('flex items-start gap-3 py-2', !rad.med && 'opacity-60')}>
      {minBock ? (
        <input
          id={id}
          type="checkbox"
          checked={!!min?.packad}
          disabled={sparar}
          onChange={(e) => onBock(e.target.checked)}
          className="mt-3 size-5 shrink-0 accent-primary"
        />
      ) : (
        <span className="size-5 shrink-0" aria-hidden />
      )}
      <div className="min-w-0 flex-1 space-y-1 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={minBock ? id : undefined} className={cn('min-w-0 break-words', min?.packad && minBock && 'text-muted-foreground line-through')}>
            {rad.antal > 1 && `${rad.antal} × `}
            {rad.namn}
          </label>
          <span className="shrink-0 text-sm tabular-nums">{vikt === null ? 'Ingen vikt' : formateraVikt(vikt)}</span>
        </div>
        {egen?.namn && <p className="text-sm break-words">Din: {egen.namn}</p>}
        <p className={cn('text-sm', ingen ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>
          {ingen ? 'Ingen tar med ännu' : vem}
          {rad.alla && packare.length > 0 && `. ${packadeAv} av ${packare.length} har packat`}
        </p>
        <div className="flex flex-wrap gap-x-4">
          {rad.alla && mittId && (
            <button type="button" onClick={onValjEgen} className={cn('inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4', fokus)}>
              {egen?.namn ? 'Byt din' : 'Välj din'}
              <span className="sr-only"> {rad.namn}</span>
            </button>
          )}
          {ingen && mittId && (
            <button type="button" disabled={sparar} onClick={() => onTaMed(true)} className={cn('inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4', fokus)}>
              Jag tar med den
              <span className="sr-only">: {rad.namn}</span>
            </button>
          )}
          {rad.gemensam && rad.bars_av !== null && rad.bars_av === mittId && (
            <button type="button" disabled={sparar} onClick={() => onTaMed(false)} className={cn('inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4', fokus)}>
              Jag tar inte med den
              <span className="sr-only">: {rad.namn}</span>
            </button>
          )}
        </div>
      </div>
      {kanAndra && (
        <Button variant="ghost" size="ikon" aria-label={`Ta bort ${rad.namn}`} disabled={sparar} onClick={onTaBort} className="text-muted-foreground">
          <X className="size-4" aria-hidden />
        </Button>
      )}
    </li>
  )
}
