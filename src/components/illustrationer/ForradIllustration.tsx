import type { CSSProperties } from 'react'

const tid = (d: string) => ({ '--d': d }) as CSSProperties

/** Prylarna på hyllan och deras etiketter: kategori, namn och vikt. y är etikettens första rad. */
const etiketter = [
  { kategori: 'Sova', namn: 'Sovsäck', vikt: '950 g', y: 54, d: '1.2s' },
  { kategori: 'Kök', namn: 'Kök och gas', vikt: '620 g', y: 100, d: '2.8s' },
  { kategori: 'Kläder', namn: 'Fleecetröja', vikt: '380 g', y: 146, d: '4.4s' },
]

/**
 * En förrådshylla där sovsäck, kök och fleecetröja läggs in en i taget. Dekorativ.
 * Varje pryl faller ner på sin hylla och får en etikett med kategori, namn och vikt.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css). Med "minska rörelse" syns slutbilden.
 *
 * Tider (s): sovsäcken landar 0,9, köket 2,5 och tröjan 4,1. Etiketterna kommer strax efter.
 */
export function ForradIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 60 140, 120 148, 180 140 S 280 134, 320 146 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="118" cy="181" rx="86" ry="6" className="fill-foreground/10" />

      {/* Hyllan: bakstycke och tre hyllplan */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="46" y="22" width="144" height="154" rx="5" className="fill-card" />
        <rect x="40" y="72" width="156" height="7" rx="2" className="fill-sand" />
        <rect x="40" y="120" width="156" height="7" rx="2" className="fill-sand" />
        <rect x="40" y="168" width="156" height="8" rx="2" className="fill-sand" />
      </g>

      {/* Sovsäcken, ihoprullad, på översta hyllan */}
      <g className="mv-falla stroke-foreground" style={tid('0.4s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="62" y="46" width="70" height="26" rx="13" className="fill-illustration" />
        <path d="M80 47 V71 M114 47 V71" className="fill-none stroke-foreground/50" strokeWidth="2" />
        <ellipse cx="132" cy="59" rx="6" ry="12.5" className="fill-primary-soft" />
        <path d="M132 53 C 129 56, 129 62, 132 65" className="fill-none stroke-foreground/50" strokeWidth="1.6" />
      </g>

      {/* Kastrull med lock och en gasolflaska, på mellersta hyllan */}
      <g className="mv-falla stroke-foreground" style={tid('2s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M64 99 H110 V112 C 110 117, 106 120, 101 120 H73 C 68 120, 64 117, 64 112 Z" className="fill-primary" />
        <path d="M62 99 H112" className="fill-none" />
        <path d="M72 99 C 72 94, 102 94, 102 99" className="fill-sand" />
        <path d="M84 93 H90" className="fill-none" strokeWidth="3" />
        <rect x="131" y="94" width="7" height="5" rx="1.5" className="fill-foreground" strokeWidth="2" />
        <path d="M122 103 C 122 100, 126 99, 134.5 99 C 143 99, 147 100, 147 103 V116 C 147 118.5, 143 120, 134.5 120 C 126 120, 122 118.5, 122 116 Z" className="fill-accent" strokeWidth="2" />
        <path d="M122 109 H147" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
      </g>

      {/* Ihopvikt fleecetröja, på nedersta hyllan */}
      <g className="mv-falla stroke-foreground" style={tid('3.6s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="64" y="146" width="76" height="22" rx="5" className="fill-accent" />
        <path d="M64 156 H140" className="fill-none stroke-foreground/45" strokeWidth="2" />
        <path d="M94 146 V152 C 94 155, 110 155, 110 152 V146" className="fill-sand" strokeWidth="2" />
      </g>

      {/* Etiketterna i en kolumn till höger: kategori, namn och vikt */}
      <g className="font-heading">
        {etiketter.map(({ kategori, namn, vikt, y, d }) => (
          <g key={namn} className="mv-in" style={tid(d)}>
            <rect x="206" y={y - 9} width={kategori.length * 6.2 + 12} height="13" rx="6.5" className="fill-primary-soft" />
            <text x="212" y={y + 1} className="fill-illustration text-[9px] font-bold tracking-wide uppercase">
              {kategori}
            </text>
            <text x="206" y={y + 17} className="fill-foreground text-[11.5px] font-bold">
              {namn}
            </text>
            <text x="206" y={y + 30} className="fill-foreground/70 text-[10px] font-semibold">
              {vikt}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
