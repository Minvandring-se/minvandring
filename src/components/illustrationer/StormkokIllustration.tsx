/** Ett stormkök med kastrull, en mugg och en skål. Dekorativ. */
export function StormkokIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 146 C 80 128, 140 140, 200 130 S 290 128, 320 138 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="166" cy="174" rx="128" ry="7" className="fill-foreground/10" />

      {/* Ånga */}
      <g className="fill-none stroke-foreground/35" strokeWidth="2" strokeLinecap="round">
        <path d="M146 56 C 140 48, 152 42, 146 32" />
        <path d="M162 52 C 156 44, 168 38, 162 26" />
        <path d="M178 56 C 172 48, 184 42, 178 32" />
      </g>

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Mugg */}
        <path d="M66 140 C 58 140, 56 158, 66 158" className="fill-none" />
        <rect x="66" y="134" width="30" height="36" rx="6" className="fill-primary-soft" />

        {/* Stormkök */}
        <rect x="118" y="124" width="88" height="46" rx="7" className="fill-card" />
        <path d="M118 136 H206" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
        <circle cx="138" cy="152" r="3.5" className="fill-foreground" strokeWidth="0" />
        <circle cx="154" cy="152" r="3.5" className="fill-foreground" strokeWidth="0" />
        <circle cx="170" cy="152" r="3.5" className="fill-foreground" strokeWidth="0" />
        <circle cx="186" cy="152" r="3.5" className="fill-foreground" strokeWidth="0" />

        {/* Kastrull med lock och handtag */}
        <path d="M208 98 H232" className="fill-none" strokeWidth="4" />
        <rect x="228" y="93" width="24" height="9" rx="4.5" className="fill-accent" />
        <rect x="114" y="82" width="96" height="42" rx="8" className="fill-primary" />
        <rect x="108" y="77" width="108" height="9" rx="4.5" className="fill-primary" />
        <path d="M115 77 C 124 64, 200 64, 209 77 Z" className="fill-primary-soft" />
        <rect x="155" y="60" width="14" height="7" rx="3.5" className="fill-foreground" />

        {/* Skål med gröt och bär */}
        <path d="M236 148 H294 C 292 166, 278 174, 265 174 C 252 174, 238 166, 236 148 Z" className="fill-sand" />
        <ellipse cx="265" cy="148" rx="29" ry="5" className="fill-card" />
        <path d="M274 145 L300 124" className="fill-none" strokeWidth="3" />
      </g>
      <circle cx="256" cy="147" r="3" className="fill-accent" />
      <circle cx="264" cy="149" r="3" className="fill-primary" />
      <circle cx="252" cy="150" r="2.5" className="fill-primary" />
    </svg>
  )
}
