import type { CSSProperties } from 'react'

const rader = [
  // y är mitten av raden. Bockarna ritas in en i taget, en gång (se mv-bock i index.css).
  { y: 80, d: '1.2s' },
  { y: 110, d: '2.9s' },
  { y: 140, d: '4.6s' },
]
const ringar = [54, 76, 98, 120, 142]

/**
 * Ett uppslaget anteckningsblock med ringar, en liten skiss, en kryssruteslista och en penna.
 * Den mellersta raden är en gasolflaska, de andra är enkla linjer. Dekorativ.
 * Bockarna ritas i en och en när illustrationen syns och står sedan kvar.
 */
export function AnteckningIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 70 136, 130 146, 190 138 S 285 134, 320 144 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="156" cy="177" rx="112" ry="6" className="fill-foreground/10" />

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Pärm och sidor */}
        <rect x="52" y="34" width="208" height="138" rx="9" className="fill-illustration" />
        <rect x="60" y="41" width="94" height="124" rx="4" className="fill-card" />
        <rect x="158" y="41" width="94" height="124" rx="4" className="fill-card" />

        {/* Vänstra sidan: rubrik, en liten skiss av fjäll och sol, några rader */}
        <path d="M74 58 H116" className="fill-none stroke-foreground/35" strokeWidth="3.5" />
        <circle cx="128" cy="78" r="5.5" className="fill-accent" strokeWidth="1.5" />
        <path d="M74 112 L92 86 L103 101 L112 90 L130 112 Z" className="fill-primary-soft stroke-illustration" strokeWidth="1.8" />
        <path d="M74 128 H136 M74 140 H128 M74 152 H110" className="fill-none stroke-foreground/20" strokeWidth="3" />

        {/* Högra sidan: rubrik, rutor och rader */}
        <path d="M172 58 H206" className="fill-none stroke-foreground/35" strokeWidth="3.5" />
        {rader.map(({ y }) => (
          <rect key={y} x="172" y={y - 8} width="16" height="16" rx="3" className="fill-card" strokeWidth="2" />
        ))}
        <path d="M198 80 H238" className="fill-none stroke-foreground/30" strokeWidth="3" />
        <path d="M198 140 H226" className="fill-none stroke-foreground/30" strokeWidth="3" />

        {/* Ringar över ryggen */}
        {ringar.map((y) => (
          <rect key={y} x="149" y={y} width="14" height="6" rx="3" className="fill-sand" strokeWidth="1.8" />
        ))}
      </g>

      {/* Gasolflaska i stället för text på mellersta raden */}
      <g className="stroke-foreground" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <rect x="206.5" y="96.5" width="7" height="5.5" rx="1.5" className="fill-foreground" />
        <path d="M199 106 C 199 103, 203 102, 210 102 C 217 102, 221 103, 221 106 V117 C 221 119.5, 217 120.5, 210 120.5 C 203 120.5, 199 119.5, 199 117 Z" className="fill-accent" />
        <path d="M199 111 H221" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
      </g>

      {/* Bockarna */}
      {rader.map(({ y, d }) => (
        <path
          key={y}
          d={`M175.5 ${y} l4.5 5 l9.5 -12.5`}
          pathLength="10"
          strokeDasharray="10"
          className="mv-bock fill-none stroke-illustration"
          style={{ '--d': d } as CSSProperties}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Pennan ligger snett över blockets hörn med spetsen mot listan */}
      <g transform="translate(243 154) rotate(37)" className="stroke-foreground" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path d="M-5.5 -15 L0 0 L5.5 -15 Z" className="fill-sand" />
        <path d="M-1.9 -5.2 L0 0 L1.9 -5.2 Z" className="fill-foreground" strokeWidth="1" />
        <rect x="-5.5" y="-66" width="11" height="51" className="fill-accent" />
        <path d="M0 -64 V-17" className="fill-none stroke-foreground/30" strokeWidth="1.5" />
        <rect x="-5.5" y="-72" width="11" height="6" className="fill-muted" />
        <rect x="-5.5" y="-81" width="11" height="9" rx="2.5" className="fill-illustration" />
      </g>
    </svg>
  )
}
