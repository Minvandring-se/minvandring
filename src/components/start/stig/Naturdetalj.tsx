import type { Ref } from 'react'
import type { Detalj, Punkt } from '@/components/start/stig/geometri'

interface Props {
  typ: Extract<Detalj, 'talt' | 'eld'>
  punkt: Punkt
  detaljRef: Ref<SVGGElement>
  flammaRef: Ref<SVGPathElement>
  glodRef: Ref<SVGEllipseElement>
}

/** Tält eller liten brasa vid leden, 44 × 36 px. Yttre gruppen placerar, den inre animeras. Tältet står kvar. */
export function Naturdetalj({ typ, punkt, detaljRef, flammaRef, glodRef }: Props) {
  return (
    <g transform={`translate(${punkt.x - 22} ${punkt.y - 36})`}>
      <g ref={detaljRef} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round" style={{ opacity: 0 }}>
        {typ === 'talt' ? (
          <>
            <path d="M3 34 L17 6 L29 8 L42 34 Z" className="fill-sand stroke-foreground/80" />
            <path d="M17 6 L25 34 M29 8 L25 34" className="fill-none stroke-foreground/60" />
            <path d="M17 14 L12 34 H23 Z" className="fill-primary stroke-foreground/70" />
            <path d="M3 34 H1 M42 34 H44" className="stroke-foreground/60" />
          </>
        ) : (
          <>
            <ellipse ref={glodRef} cx={22} cy={27} rx={19} ry={8} className="fill-accent/20" />
            <path
              ref={flammaRef}
              d="M22 3 C26 10 32 12 28 19 C33 16 35 22 33 26 C30 34 15 34 12 27 C9 21 15 17 17 12 C18 20 23 15 22 3 Z"
              className="fill-accent stroke-foreground/40"
              style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
            />
            <path d="M10 31 L34 35 M11 35 L33 31" className="stroke-foreground/80" strokeWidth={3} />
            <path d="M8 35 H36" className="stroke-foreground/35" />
          </>
        )}
      </g>
    </g>
  )
}

/**
 * Ett litet tassavtryck, 10 × 10 px, med mitten i x och y och tårna i färdriktningen (vinkel i grader).
 * Tassarna tonar in en efter en när leden ritats fram (data-dyker).
 */
export function Tass({ punkt, vinkel, andel }: { punkt: Punkt; vinkel: number; andel: number }) {
  return (
    <g transform={`translate(${punkt.x} ${punkt.y}) rotate(${vinkel + 90})`}>
      <g data-dyker="tass" data-andel={andel} className="fill-foreground/40" style={{ opacity: 0 }}>
        <ellipse cx={0} cy={2} rx={2.6} ry={2.2} />
        <circle cx={-2.7} cy={-1.4} r={1.05} />
        <circle cx={-0.95} cy={-3.1} r={1.05} />
        <circle cx={0.95} cy={-3.1} r={1.05} />
        <circle cx={2.7} cy={-1.4} r={1.05} />
      </g>
    </g>
  )
}
