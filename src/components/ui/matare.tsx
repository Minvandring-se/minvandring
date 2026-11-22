import type { ReactNode } from 'react'
import { procent, ringBage } from '@/lib/matt'
import { cn } from '@/lib/utils'

/**
 * En ring som visar en andel, med text i mitten. Värdet är mellan 0 och 1.
 * Ringen är dekor. Värdet läses upp som text, och etiketten säger vad det gäller.
 * stark används på den mörkgröna ytan, där ringen och texten behöver ljusa färger.
 */
export function Matare({
  varde,
  etikett,
  storlek = 120,
  tjocklek = 10,
  undertext,
  stark = false,
  className,
}: {
  varde: number
  etikett: string
  storlek?: number
  tjocklek?: number
  /** Texten under procenten, till exempel "redo". */
  undertext?: ReactNode
  stark?: boolean
  className?: string
}) {
  const radie = (storlek - tjocklek) / 2
  const { omkrets, fylld } = ringBage(varde, radie)
  const mitt = storlek / 2
  // Hårt mellanslag före procenttecknet, så att talet och tecknet inte hamnar på olika rader.
  const text = `${procent(varde)} %`
  return (
    <div role="img" aria-label={`${etikett}: ${text}`} className={cn('relative shrink-0', className)} style={{ width: storlek, height: storlek }}>
      <svg aria-hidden width={storlek} height={storlek} viewBox={`0 0 ${storlek} ${storlek}`} className="block">
        <circle cx={mitt} cy={mitt} r={radie} fill="none" strokeWidth={tjocklek} className={stark ? 'stroke-yta-stark-muted/30' : 'stroke-muted'} />
        <circle
          cx={mitt}
          cy={mitt}
          r={radie}
          fill="none"
          strokeWidth={tjocklek}
          strokeLinecap="round"
          strokeDasharray={`${fylld} ${omkrets}`}
          transform={`rotate(-90 ${mitt} ${mitt})`}
          className={stark ? 'stroke-yta-stark-foreground' : 'stroke-primary'}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-heading font-bold tabular-nums', storlek < 100 ? 'text-lg' : 'text-2xl')}>{text}</span>
        {undertext && <span className={cn('text-xs', stark ? 'text-yta-stark-muted' : 'text-muted-foreground')}>{undertext}</span>}
      </div>
    </div>
  )
}
