import type { ReactNode } from 'react'

/** En vandringsryggsäck i samma stil som korten, i koordinaterna x 134–212 med botten på y 170. */
function Ryggsack({ kropp, ficka, spanne, children }: { kropp: string; ficka: string; spanne: string; children?: ReactNode }) {
  return (
    <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M164 58 C 164 47, 182 47, 182 58" className="fill-none" />
      <path d="M138 170 C 135.8 170, 134 168.2, 134 166 V98 C 134 72, 150 58, 173 58 C 196 58, 212 72, 212 98 V166 C 212 168.2, 210.2 170, 208 170 Z" className={kropp} />
      <path d="M139 96 C 139 76, 154 66, 173 66 C 192 66, 207 76, 207 96 C 192 103, 154 103, 139 96 Z" className={kropp} />
      <path d="M139 96 C 154 103, 192 103, 207 96" className="fill-none stroke-card/60" strokeWidth="1.5" />
      <rect x="168" y="96" width="10" height="9" rx="2" className={spanne} />
      <rect x="149" y="120" width="48" height="40" rx="11" className={ficka} />
      <path d="M155 131 H191" className="fill-none stroke-foreground/50" strokeWidth="1.5" />
      <path d="M134 116 H146 M200 116 H212" className="fill-none" />
      {children}
    </g>
  )
}

/** En enkel, vänlig hund som sitter i profil och tittar mot ryggsäckarna. Botten på y 172. */
function Hund() {
  return (
    <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Svans */}
      <path d="M264 162 C 274 162, 279 154, 277 145" className="fill-none" strokeWidth="7" />
      <path d="M264 162 C 274 162, 279 154, 277 145" className="fill-none stroke-card" strokeWidth="2.6" />
      {/* Kropp med framben och lår */}
      <path d="M230 172 V148 C 229 140, 232 134, 238 130 L246 126 C 258 134, 268 148, 268 162 C 268 168, 264 172, 258 172 Z" className="fill-card" />
      <path d="M240 152 V172" className="fill-none" strokeWidth="1.8" />
      <path d="M250 172 C 246 161, 253 151, 263 154" className="fill-none" strokeWidth="1.8" />
      {/* Huvud med nos och hängande öra */}
      <g transform="translate(3 2)">
      <path d="M226 108 C 232 100, 246 101, 248 113 C 249 122, 244 129, 236 129 L224 129 C 218 129, 214 126, 214 121.5 C 214 117.5, 218 115, 224 115 C 224 112, 225 110, 226 108 Z" className="fill-card" />
      <ellipse cx="215.6" cy="119.6" rx="2.8" ry="2.4" className="fill-foreground" strokeWidth="0" />
      <circle cx="231.5" cy="112" r="1.9" className="fill-foreground" strokeWidth="0" />
      <path d="M217.5 124.5 C 221 126.5, 225 126.5, 228 123.5" className="fill-none" strokeWidth="1.5" />
      <path d="M239 104 C 247 101, 254 109, 252 123 C 251 128, 246 128, 244 123 C 242 117, 239 111, 239 104 Z" className="fill-foreground" strokeWidth="1.5" />
      </g>
      {/* Halsband med bricka */}
      <path d="M235 132.5 C 240 136.5, 247 135.5, 251 130.5" className="fill-none stroke-accent" strokeWidth="4.5" />
      <circle cx="241" cy="139" r="2.4" className="fill-accent" strokeWidth="1.3" />
    </g>
  )
}

/**
 * Två vandringsryggsäckar sida vid sida och en hund som sitter bredvid. Dekorativ och statisk.
 * Ingen egen bakgrundsyta, den ligger på sektionens beige yta.
 */
export function TankenIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <ellipse cx="166" cy="174" rx="128" ry="7" className="fill-foreground/10" />

      {/* Den större ryggsäcken med liggunderlaget fastspänt överst */}
      <g transform="translate(-84 2)">
        <Ryggsack kropp="fill-illustration" ficka="fill-primary-soft" spanne="fill-card">
          <rect x="130" y="38" width="86" height="21" rx="10.5" className="fill-sand" />
          <circle cx="205.5" cy="48.5" r="10.5" className="fill-sand" />
          <path d="M205.5 48.5 m-3.5 0 a3.5 3.5 0 1 0 3.5 -3.5 a6.5 6.5 0 1 0 6.5 6.5" className="fill-none" strokeWidth="1.5" />
          <path d="M152 38.5 V62 M184 38.5 V62" className="fill-none" strokeWidth="2.2" />
        </Ryggsack>
      </g>

      {/* Den mindre ryggsäcken, mörkare grön med orange detaljer och en flaska i sidofickan */}
      <g transform="translate(31.5 39.4) scale(0.78)">
        <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
          <rect x="207" y="112" width="15" height="40" rx="5" className="fill-primary-soft" />
          <rect x="210.5" y="103" width="8" height="10" rx="2" className="fill-foreground" />
        </g>
        <Ryggsack kropp="fill-primary" ficka="fill-accent" spanne="fill-accent">
          <path d="M212 134 H222 C 224.5 134, 226 135.5, 226 138 V160 C 226 164, 223 166, 220 166 H212 Z" className="fill-primary" />
        </Ryggsack>
      </g>

      <g transform="translate(2 0)">
        <Hund />
      </g>
    </svg>
  )
}
