import type { CSSProperties } from 'react'

type Punkt = [number, number]
type Etapp = [Punkt, Punkt, Punkt, Punkt]

/** Rutten som fyra kubiska bezierkurvor. De tre första slutar vid dag 1, 2 och 3, den sista vid målet. */
const ETAPPER: Etapp[] = [
  [[88, 152], [100, 128], [118, 126], [134, 112]],
  [[134, 112], [150, 98], [160, 84], [176, 92]],
  [[176, 92], [192, 100], [200, 112], [212, 104]],
  [[212, 104], [224, 96], [224, 86], [228, 76]],
]

// Tidslinje i sekunder: varje etapp ritas, sedan en paus vid dagen innan nästa börjar.
const START_S = 0.3
const RITA_S = 0.8
const PAUS_S = 0.6
const etappStart = (k: number) => START_S + k * (RITA_S + PAUS_S)

function punktPa([a, b, c, d]: Etapp, t: number): Punkt {
  const m = 1 - t
  const v = (i: 0 | 1) => m * m * m * a[i] + 3 * m * m * t * b[i] + 3 * m * t * t * c[i] + t * t * t * d[i]
  return [v(0), v(1)]
}

/** Prickar med jämnt avstånd längs en etapp. Luft lämnas vid början och slutet, där markeringarna ligger. */
function prickar(etapp: Etapp, luftStart: number, luftSlut: number) {
  const STEG = 200
  const langd = [0]
  for (let i = 1; i <= STEG; i++) {
    const [x0, y0] = punktPa(etapp, (i - 1) / STEG)
    const [x1, y1] = punktPa(etapp, i / STEG)
    langd.push(langd[i - 1] + Math.hypot(x1 - x0, y1 - y0))
  }
  const total = langd[STEG]
  const antal = Math.round(total / 7)
  const ut: { x: number; y: number; andel: number }[] = []
  for (let n = 1; n < antal; n++) {
    const s = (n * total) / antal
    if (s < luftStart || total - s < luftSlut) continue
    const [x, y] = punktPa(etapp, langd.findIndex((l) => l >= s) / STEG)
    ut.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, andel: s / total })
  }
  return ut
}

const PRICKAR = ETAPPER.flatMap((etapp, k) =>
  prickar(etapp, k === 0 ? 8 : 12.5, k === 3 ? 4 : 12.5).map((p) => ({ ...p, d: etappStart(k) + p.andel * RITA_S })),
)
const DAGAR = ETAPPER.slice(0, 3).map((etapp, k) => ({ x: etapp[3][0], y: etapp[3][1], dag: k + 1, d: etappStart(k) + RITA_S }))
const [MAL_X, MAL_Y] = ETAPPER[3][3]
const MAL_D = etappStart(3) + RITA_S + 0.3

const tid = (d: number) => ({ '--d': `${d.toFixed(2)}s` }) as CSSProperties

/**
 * En vikt karta med prickad rutt, dag 1 till 3 och en flagga vid målet. Dekorativ.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css): rutten prickas fram etapp för etapp,
 * varje dag tänds när rutten når den och flaggan kommer sist. Sedan står allt kvar.
 */
export function KartaIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 60 122, 110 138, 165 120 S 262 108, 320 128 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="160" cy="178" rx="104" ry="7" className="fill-foreground/10" />

      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M70 52 L130 40 V160 L70 172 Z" className="fill-card" />
        <path d="M130 40 L190 52 V172 L130 160 Z" className="fill-muted" />
        <path d="M190 52 L250 40 V160 L190 172 Z" className="fill-card" />
      </g>

      {/* Kartdetaljer, tunt och lugnt: höjdkurvor, två toppar, en kompass och en sjö. */}
      <g className="fill-none stroke-illustration/40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M80 76 C 95 66, 112 70, 122 62" />
        <path d="M80 89 C 98 79, 114 85, 124 75" />
        <path d="M82 116 l7 -11 l7 11 M95 116 l5.5 -8 l5.5 8" />
        <path d="M138 140 C 150 132, 166 138, 182 128" />
        <path d="M140 152 C 154 146, 170 150, 184 142" />
        <circle cx="160" cy="62" r="6.5" />
      </g>
      <path d="M160 57 L162.2 62 L160 67 L157.8 62 Z" className="fill-illustration/45" />
      <path
        d="M203 132 C 210 122, 230 120, 238 128 S 236 148, 222 150 S 198 144, 203 132 Z"
        className="fill-primary-soft stroke-illustration/50"
        strokeWidth="1.5"
      />

      {/* Rutten */}
      {PRICKAR.map(({ x, y, d }) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" className="mv-visa fill-illustration" style={tid(d)} />
      ))}
      <circle cx="88" cy="152" r="5" className="fill-card stroke-illustration" strokeWidth="2.5" />
      {DAGAR.map(({ x, y, dag, d }) => (
        <g key={dag} className="mv-in" style={tid(d)}>
          <circle cx={x} cy={y} r="10" className="fill-illustration stroke-card" strokeWidth="2" />
          <text x={x} y={y + 3.6} textAnchor="middle" className="fill-card font-heading text-[10px] font-bold">
            {dag}
          </text>
        </g>
      ))}

      {/* Flaggan vid målet, innanför kartans kant */}
      <g className="mv-in" style={tid(MAL_D)} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${MAL_X} ${MAL_Y} V${MAL_Y - 26}`} className="stroke-foreground" strokeWidth="2.5" />
        <path
          d={`M${MAL_X} ${MAL_Y - 26} L${MAL_X + 16} ${MAL_Y - 20} L${MAL_X} ${MAL_Y - 14} Z`}
          className="fill-accent stroke-foreground"
          strokeWidth="2"
        />
        <circle cx={MAL_X} cy={MAL_Y} r="2.6" className="fill-foreground" />
      </g>
    </svg>
  )
}
