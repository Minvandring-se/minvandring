import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bricka: en kort uppgift i en rund form. Tonen säger vad den betyder (docs/design/riktning.md):
 * gra för fakta (storlek, typ, kost), rost för det man ska lägga märke till (avfärd, det som saknas),
 * hjortron för det positiva (det man har, mest energi). Stor används bara i turens huvud och på turkortet.
 */
export type Brickton = 'gra' | 'rost' | 'hjortron'

const TON: Record<Brickton, string> = {
  gra: 'bg-muted text-muted-foreground font-medium',
  rost: 'bg-accent-soft text-accent-strong font-semibold',
  hjortron: 'bg-hjortron-soft text-hjortron-strong font-medium',
}

export function Bricka({ ton = 'gra', stor = false, className, children }: { ton?: Brickton; stor?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex w-fit items-center gap-1 rounded-full break-words', stor ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs', TON[ton], className)}>
      {children}
    </span>
  )
}

/** Antalet i en flik, till exempel Mitt förråd 2 eller Kommande 3: en liten prick i hjortron. */
export function FlikAntal({ antal }: { antal: number }) {
  return <span className="rounded-full bg-hjortron px-1.5 text-xs font-semibold text-yta-stark tabular-nums">{antal}</span>
}
