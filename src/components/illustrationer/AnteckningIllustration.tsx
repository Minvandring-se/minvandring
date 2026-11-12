import type { CSSProperties } from 'react'

const rader = [
  // y är mitten av raden. Bockarna ritas in en i taget, en gång (se mv-bock i index.css).
  { y: 72, d: '1.2s' },
  { y: 106, d: '2.9s' },
  { y: 140, d: '4.6s' },
]

/**
 * Ett uppslaget anteckningsblock med en kryssruteslista och en penna. Den mellersta raden är en gasolflaska,
 * de andra är enkla linjer. Dekorativ. Bockarna ritas i en och en när illustrationen syns och står sedan kvar.
 */
export function AnteckningIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 70 136, 130 146, 190 138 S 285 134, 320 144 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="160" cy="176" rx="112" ry="6" className="fill-foreground/10" />

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Pärm och sidor */}
        <rect x="62" y="34" width="196" height="136" rx="8" className="fill-illustration" />
        <rect x="70" y="40" width="90" height="124" rx="5" className="fill-card" />
        <rect x="160" y="40" width="90" height="124" rx="5" className="fill-card" />
        {/* Vänstra sidan: några lugna linjer */}
        <path d="M84 66 H140 M84 84 H132 M84 102 H138 M84 120 H120" className="fill-none stroke-foreground/20" strokeWidth="3" />

        {/* Rutor och rader */}
        {rader.map(({ y }) => (
          <rect key={y} x="172" y={y - 8} width="16" height="16" rx="3" className="fill-card" strokeWidth="2" />
        ))}
        <path d="M198 72 H238" className="fill-none stroke-foreground/35" strokeWidth="3" />
        <path d="M198 140 H232" className="fill-none stroke-foreground/35" strokeWidth="3" />
      </g>

      {/* Gasolflaska i stället för text på mellersta raden */}
      <g className="stroke-foreground" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <rect x="205" y="98" width="8" height="5" rx="1.5" className="fill-foreground" />
        <path d="M199 104 C 199 101, 219 101, 219 104 V115 C 219 118, 199 118, 199 115 Z" className="fill-accent" />
        <path d="M199 109 H219" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
      </g>

      {/* Bockarna */}
      {rader.map(({ y, d }) => (
        <path
          key={y}
          d={`M175 ${y} l4 4.5 l8 -10`}
          pathLength="10"
          strokeDasharray="10"
          className="mv-bock fill-none stroke-illustration"
          style={{ '--d': d } as CSSProperties}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Penna som ligger snett bredvid blocket */}
      <g transform="rotate(28 282 110)" className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="276" y="56" width="12" height="80" rx="3" className="fill-accent" />
        <rect x="276" y="56" width="12" height="12" rx="3" className="fill-illustration" />
        <path d="M276 136 L282 152 L288 136 Z" className="fill-sand" />
        <path d="M280.5 147 L282 152 L283.5 147 Z" className="fill-foreground" strokeWidth="1" />
      </g>
    </svg>
  )
}
