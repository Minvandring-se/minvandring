/** En ryggsäck i samma stil som korten, i koordinaterna x 134–212 med botten på y 170. */
function Ryggsack({ kropp, ficka, spanne }: { kropp: string; ficka: string; spanne: string }) {
  return (
    <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M164 58 C 164 47, 182 47, 182 58" className="fill-none" />
      <path d="M134 170 V98 C 134 72, 150 58, 173 58 C 196 58, 212 72, 212 98 V170 Z" className={kropp} />
      <path d="M139 96 C 139 76, 154 66, 173 66 C 192 66, 207 76, 207 96 C 192 103, 154 103, 139 96 Z" className={kropp} />
      <path d="M139 96 C 154 103, 192 103, 207 96" className="fill-none stroke-card/60" strokeWidth="1.5" />
      <rect x="168" y="96" width="10" height="9" rx="2" className={spanne} />
      <rect x="149" y="120" width="48" height="40" rx="11" className={ficka} />
      <path d="M155 131 H191" className="fill-none stroke-foreground/50" strokeWidth="1.5" />
      <path d="M134 116 H146 M200 116 H212" className="fill-none" />
    </g>
  )
}

/** En enkel, vänlig hund som sitter och tittar mot ryggsäckarna. Botten på y 172. */
function Hund() {
  return (
    <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Svans */}
      <path d="M252 166 C 264 166, 270 158, 268 148" className="fill-none" strokeWidth="6" />
      <path d="M252 166 C 264 166, 270 158, 268 148" className="fill-none stroke-sand" strokeWidth="2.5" />
      {/* Kropp och framben */}
      <path d="M222 172 C 218 152, 224 134, 236 130 C 250 132, 256 150, 254 172 Z" className="fill-sand" />
      <path d="M228 150 V172" className="fill-none stroke-foreground/45" strokeWidth="1.5" />
      {/* Halsband */}
      <path d="M226 136 C 232 140, 242 140, 248 135" className="fill-none stroke-accent" strokeWidth="4" />
      {/* Huvud, nos och öra */}
      <circle cx="236" cy="118" r="14" className="fill-sand" />
      <path d="M226 116 C 218 116, 214 122, 216 127 C 219 131, 228 130, 231 126" className="fill-sand" />
      <circle cx="216.5" cy="121" r="2.5" className="fill-foreground" strokeWidth="0" />
      <circle cx="232" cy="114" r="1.8" className="fill-foreground" strokeWidth="0" />
      <path d="M219 128 C 222 130, 225 130, 227 128" className="fill-none" strokeWidth="1.5" />
      <path d="M240 106 C 250 104, 254 116, 248 126 C 243 122, 240 114, 240 106 Z" className="fill-illustration" />
    </g>
  )
}

/**
 * Två ryggsäckar sida vid sida och en hund som sitter bredvid. Dekorativ och statisk.
 * Ingen egen bakgrundsyta, den ligger på sektionens beige yta.
 */
export function TankenIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <ellipse cx="164" cy="174" rx="116" ry="7" className="fill-foreground/10" />

      {/* Den större ryggsäcken */}
      <g transform="translate(-72 2)">
        <Ryggsack kropp="fill-illustration" ficka="fill-primary-soft" spanne="fill-card" />
      </g>

      {/* Den mindre ryggsäcken, mörkare grön med orange detaljer */}
      <g transform="translate(43.5 39.4) scale(0.78)">
        <Ryggsack kropp="fill-primary" ficka="fill-accent" spanne="fill-accent" />
      </g>

      <Hund />
    </svg>
  )
}
