/** En ryggsäck med liggunderlag, flaska och en liten våg. Dekorativ. */
export function RyggsackIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 140 C 70 126, 120 136, 180 128 S 280 122, 320 134 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="160" cy="173" rx="132" ry="7" className="fill-foreground/10" />

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Liggunderlag */}
        <rect x="28" y="138" width="70" height="32" rx="16" className="fill-primary-soft" />
        <path d="M48 139 V169 M63 138 V170 M78 139 V169" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
        <circle cx="82" cy="154" r="9" className="fill-card" />
        <path d="M82 154 m-4 0 a4 4 0 1 0 4 -4" className="fill-none" strokeWidth="1.5" />

        {/* Flaska */}
        <rect x="104" y="122" width="18" height="48" rx="6" className="fill-accent" />
        <rect x="108" y="113" width="10" height="10" rx="2" className="fill-foreground" />

        {/* Ryggsäck */}
        <path d="M164 58 C 164 47, 182 47, 182 58" className="fill-none" />
        <path d="M134 170 V98 C 134 72, 150 58, 173 58 C 196 58, 212 72, 212 98 V170 Z" className="fill-primary" />
        <path d="M139 96 C 139 76, 154 66, 173 66 C 192 66, 207 76, 207 96 C 192 103, 154 103, 139 96 Z" className="fill-primary" />
        <path d="M139 96 C 154 103, 192 103, 207 96" className="fill-none stroke-card/60" strokeWidth="1.5" />
        <rect x="168" y="96" width="10" height="9" rx="2" className="fill-accent" />
        <rect x="149" y="120" width="48" height="40" rx="11" className="fill-primary-soft" />
        <path d="M155 131 H191" className="fill-none stroke-foreground/50" strokeWidth="1.5" />
        <path d="M134 116 H146 M200 116 H212" className="fill-none" />
      </g>

      {/* Våg med en packpåse */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M248 146 C 245 122, 252 108, 266 106 C 280 108, 287 122, 284 146 Z" className="fill-sand" />
        <path d="M258 109 L254 100 M274 109 L278 100" className="fill-none" strokeWidth="2" />
        <path d="M256 124 C 262 128, 272 128, 278 124" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
        <rect x="238" y="145" width="56" height="6" rx="3" className="fill-foreground" />
        <rect x="234" y="151" width="64" height="20" rx="6" className="fill-card" />
        <rect x="251" y="156" width="30" height="10" rx="2" className="fill-primary-soft" strokeWidth="1.5" />
      </g>
      <text x="266" y="164" textAnchor="middle" className="fill-foreground font-heading text-[7px] font-bold">
        0,9 kg
      </text>
    </svg>
  )
}
