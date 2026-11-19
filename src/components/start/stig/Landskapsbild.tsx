import type { Landskap, Punkt } from '@/components/start/stig/geometri'
import { LANDSKAP } from '@/components/start/stig/geometri'

interface Props {
  typ: Landskap
  /** Marken, mitt under bilden. Leden går där. */
  punkt: Punkt
}

/** En gran: krona i två våningar och en kort stam. cx är mitten, h höjden utan stam. Marken ligger på y = 34. */
function gran(cx: number, h: number) {
  const t = 34 - 3 - h
  return {
    krona: `M${cx} ${t} L${cx - 0.24 * h} ${t + 0.45 * h} H${cx - 0.1 * h} L${cx - 0.34 * h} ${t + h} H${cx + 0.34 * h} L${cx + 0.1 * h} ${t + 0.45 * h} H${cx + 0.24 * h} Z`,
    stam: `M${cx} ${t + h} V34`,
  }
}

const granar = [gran(10, 21), gran(24, 28), gran(38, 16)]

/**
 * Litet landskap som leden passerar: fjäll, skog eller sjö. Samma linjestil som tältet och brasan.
 * Yttre gruppen placerar bilden med marken på leden.
 */
export function Landskapsbild({ typ, punkt }: Props) {
  const { bredd, hojd } = LANDSKAP[typ]
  return (
    <g transform={`translate(${punkt.x - bredd / 2} ${punkt.y - hojd})`} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      {typ === 'fjall' && (
        <>
          <path d="M2 34 L24 4 L35 19 L44 12 L58 34 Z" className="fill-primary-soft stroke-foreground/60" />
          <path d="M18 12 L24 4 L30 12 L27 10.5 L24 13.5 L21 10.5 Z" className="fill-card stroke-foreground/45" />
          <path d="M35 19 L31 34" className="fill-none stroke-foreground/30" />
        </>
      )}
      {typ === 'skog' &&
        granar.map((g, i) => (
          <g key={i}>
            <path d={g.stam} className="stroke-foreground/60" />
            <path d={g.krona} className="fill-illustration stroke-foreground/60" />
          </g>
        ))}
      {typ === 'sjo' && (
        <>
          <path d="M4 16 C10 6 28 3.5 38 4.5 C52 5.5 64 8 66 14.5 C61 17.5 11 18 4 16 Z" className="fill-primary-soft stroke-foreground/45" />
          <path d="M17 11 q3 -2.2 6 0 q3 2.2 6 0 M40 10.5 q3 -2.2 6 0" className="fill-none stroke-foreground/35" />
          <path d="M66 16 V7 M69.5 16 V10" className="fill-none stroke-foreground/50" />
        </>
      )}
    </g>
  )
}
