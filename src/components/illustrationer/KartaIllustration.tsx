import { useId, type CSSProperties } from 'react'

const RUTT = 'M88 152 C 100 128, 118 126, 134 112 S 160 84, 176 92 S 206 116, 220 100 S 234 72, 238 64'

/**
 * En vikt karta med streckad rutt och markeringar för dag 1–3. Dekorativ.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css): rutten ritas fram etapp för etapp,
 * varje dag tänds när linjen når den och flaggan kommer sist. Sedan står allt kvar.
 */
export function KartaIllustration({ className }: { className?: string }) {
  const maskId = `rutt-${useId().replace(/[^\w-]/g, '')}`

  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="320" height="200">
          <path d={RUTT} className="mv-rutt fill-none" stroke="white" strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray="100" />
        </mask>
      </defs>
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 60 122, 110 138, 165 120 S 262 108, 320 128 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="160" cy="178" rx="104" ry="7" className="fill-foreground/10" />

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M70 52 L130 40 V160 L70 172 Z" className="fill-card" />
        <path d="M130 40 L190 52 V172 L130 160 Z" className="fill-muted" />
        <path d="M190 52 L250 40 V160 L190 172 Z" className="fill-card" />
      </g>

      {/* Höjdkurvor och en sjö, tunt och lugnt. */}
      <g className="fill-none stroke-illustration/35" strokeWidth="1.5" strokeLinecap="round">
        <path d="M80 80 C 95 70, 112 74, 122 66" />
        <path d="M80 94 C 98 84, 114 90, 124 80" />
        <path d="M138 140 C 150 132, 166 138, 182 128" />
        <path d="M140 152 C 154 146, 170 150, 184 142" />
      </g>
      <path
        d="M203 128 C 210 118, 230 116, 238 124 S 236 144, 222 146 S 198 140, 203 128 Z"
        className="fill-primary-soft stroke-illustration/50"
        strokeWidth="1.5"
      />

      <path
        d={RUTT}
        mask={`url(#${maskId})`}
        className="fill-none stroke-illustration"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />

      <circle cx="88" cy="152" r="5" className="fill-card stroke-illustration" strokeWidth="2.5" />
      {[
        // Tiderna följer mv-rutt i index.css: linjen når dag 1, 2 och 3 efter 1,1, 2,4 och 3,7 s.
        { x: 134, y: 112, dag: '1', d: '1.15s' },
        { x: 176, y: 92, dag: '2', d: '2.45s' },
        { x: 220, y: 100, dag: '3', d: '3.75s' },
      ].map(({ x, y, dag, d }) => (
        <g key={dag} className="mv-in" style={{ '--d': d } as CSSProperties}>
          <circle cx={x} cy={y} r="10" className="fill-illustration stroke-card" strokeWidth="2" />
          <text x={x} y={y + 3.5} textAnchor="middle" className="fill-card font-heading text-[10px] font-bold">
            {dag}
          </text>
        </g>
      ))}

      <g className="mv-in" style={{ '--d': '4.95s' } as CSSProperties} strokeLinecap="round" strokeLinejoin="round">
        <path d="M238 64 V38" className="stroke-foreground" strokeWidth="2.5" />
        <path d="M238 38 L254 44 L238 50 Z" className="fill-accent stroke-foreground" strokeWidth="2" />
      </g>
    </svg>
  )
}
