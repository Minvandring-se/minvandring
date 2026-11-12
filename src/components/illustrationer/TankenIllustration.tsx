import type { CSSProperties } from 'react'

/** En ryggsäck i samma stil som korten, i koordinaterna (x 134–212, botten y 170). */
function Ryggsack({ kropp, ficka }: { kropp: string; ficka: string }) {
  return (
    <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M164 58 C 164 47, 182 47, 182 58" className="fill-none" />
      <path d="M134 170 V98 C 134 72, 150 58, 173 58 C 196 58, 212 72, 212 98 V170 Z" className={kropp} />
      <path d="M139 96 C 139 76, 154 66, 173 66 C 192 66, 207 76, 207 96 C 192 103, 154 103, 139 96 Z" className={kropp} />
      <path d="M139 96 C 154 103, 192 103, 207 96" className="fill-none stroke-card/60" strokeWidth="1.5" />
      <rect x="168" y="96" width="10" height="9" rx="2" className="fill-card" />
      <rect x="149" y="120" width="48" height="40" rx="11" className={ficka} />
      <path d="M155 131 H191" className="fill-none stroke-foreground/50" strokeWidth="1.5" />
      <path d="M134 116 H146 M200 116 H212" className="fill-none" />
    </g>
  )
}

/**
 * Två ryggsäckar framför fjällen, med packning utspridd på marken som mitt i en omfördelning. Dekorativ.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css): sakerna dyker upp en i taget och står sedan kvar.
 * Ingen egen bakgrundsyta, den ligger på sektionens beige yta.
 */
export function TankenIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      {/* Fjällsiluett, tunt och lugnt */}
      <path
        d="M0 128 L46 92 L74 110 L124 58 L164 98 L204 72 L248 110 L284 88 L320 112 V160 H0 Z"
        className="fill-muted stroke-illustration/35"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M110 72 L124 58 L138 72 L130 70 L124 76 L117 70 Z M194 80 L204 72 L214 80 L208 79 L204 83 L199 79 Z" className="fill-card" />

      <path d="M0 146 C 80 132, 150 142, 210 134 S 290 132, 320 140 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="166" cy="174" rx="140" ry="7" className="fill-foreground/10" />

      {/* Den större ryggsäcken */}
      <g className="mv-in" style={{ '--d': '0.3s' } as CSSProperties}>
        <g transform="translate(-42 2)">
          <Ryggsack kropp="fill-illustration" ficka="fill-primary-soft" />
        </g>
      </g>

      {/* Den mindre ryggsäcken */}
      <g className="mv-in" style={{ '--d': '1.2s' } as CSSProperties}>
        <g transform="translate(73.5 39.4) scale(0.78)">
          <Ryggsack kropp="fill-accent" ficka="fill-sand" />
        </g>
      </g>

      {/* Flaska */}
      <g className="mv-in stroke-foreground" style={{ '--d': '2.1s' } as CSSProperties} strokeWidth="2.5" strokeLinejoin="round">
        <rect x="246" y="134" width="16" height="38" rx="5" className="fill-primary-soft" />
        <rect x="250" y="126" width="8" height="9" rx="2" className="fill-foreground" />
      </g>

      {/* Kastrull med lock */}
      <g className="mv-in stroke-foreground" style={{ '--d': '3.0s' } as CSSProperties} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M306 158 H316" className="fill-none" strokeWidth="3" />
        <rect x="272" y="152" width="34" height="20" rx="4" className="fill-illustration" />
        <rect x="269" y="148" width="40" height="6" rx="3" className="fill-illustration" />
        <rect x="285" y="143" width="8" height="5" rx="2.5" className="fill-foreground" />
      </g>

      {/* Våg med sovsäcken i sin packpåse, som i packningskortet */}
      <g className="mv-in" style={{ '--d': '3.9s' } as CSSProperties}>
        <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M34 146 C 31 122, 38 108, 52 106 C 66 108, 73 122, 70 146 Z" className="fill-sand" />
          <path d="M44 109 L40 100 M60 109 L64 100" className="fill-none" strokeWidth="2" />
          <path d="M42 124 C 48 128, 58 128, 64 124" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
          <rect x="24" y="145" width="56" height="6" rx="3" className="fill-foreground" />
          <rect x="20" y="151" width="64" height="20" rx="6" className="fill-card" />
          <rect x="37" y="156" width="30" height="10" rx="2" className="fill-primary-soft" strokeWidth="1.5" />
        </g>
        <text x="52" y="164" textAnchor="middle" className="fill-foreground font-heading text-[7px] font-bold">
          0,9 kg
        </text>
      </g>
    </svg>
  )
}
