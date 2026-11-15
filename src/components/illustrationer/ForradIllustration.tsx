import type { CSSProperties } from 'react'

const tid = (d: string) => ({ '--d': d }) as CSSProperties

/** Etiketterna bredvid hyllan: kategori och vikt, mitt för sin hylla. y är kategorilappens mitt. */
const etiketter = [
  { kategori: 'Sova', vikt: '950 g', y: 56, d: '1.2s' },
  { kategori: 'Kök', vikt: '620 g', y: 104, d: '2.8s' },
  { kategori: 'Kläder', vikt: '380 g', y: 152, d: '4.4s' },
]
/** Kategorilapparna är lika stora och ljusa, så att alla etiketter ser likadana ut mot både sand och kulle. */
const LAPP = { x: 208, bredd: 62, hojd: 15 }

/**
 * En förrådshylla där en sovsäck, ett kök med gasolflaska och kläder (en tröja och en mössa) läggs in
 * en i taget, mitt på var sin hylla. Dekorativ. Varje pryl faller ner och får en etikett med kategori och vikt.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css). Med "minska rörelse" syns slutbilden.
 *
 * Tider (s): sovsäcken landar 0,9, köket 2,5, tröjan 4,1 och mössan 4,4. Etiketterna kommer strax efter.
 */
export function ForradIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 60 140, 120 148, 180 140 S 280 134, 320 146 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="118" cy="181" rx="86" ry="6" className="fill-foreground/10" />

      {/* Hyllan: bakstycke och tre hyllplan. Mitten ligger på x = 118. */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="46" y="22" width="144" height="154" rx="5" className="fill-card" />
        <rect x="40" y="72" width="156" height="7" rx="2" className="fill-sand" />
        <rect x="40" y="120" width="156" height="7" rx="2" className="fill-sand" />
        <rect x="40" y="168" width="156" height="8" rx="2" className="fill-sand" />
      </g>

      {/* Sovsäcken, ihoprullad, mitt på översta hyllan */}
      <g className="mv-falla stroke-foreground" style={tid('0.4s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="80" y="46" width="70" height="26" rx="13" className="fill-illustration" />
        <path d="M98 47 V71 M132 47 V71" className="fill-none stroke-foreground/50" strokeWidth="2" />
        <ellipse cx="150" cy="59" rx="6" ry="12.5" className="fill-primary-soft" />
        <path d="M150 53 C 147 56, 147 62, 150 65" className="fill-none stroke-foreground/50" strokeWidth="1.6" />
      </g>

      {/* Kastrull med lock och en gasolflaska som står lite omlott framför, mitt på mellersta hyllan */}
      <g className="mv-falla stroke-foreground" style={tid('2s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M87 99 H133 V112 C 133 117, 129 120, 124 120 H96 C 91 120, 87 117, 87 112 Z" className="fill-primary" />
        <path d="M85 99 H135" className="fill-none" />
        <path d="M95 99 C 95 94, 125 94, 125 99" className="fill-sand" />
        <path d="M107 93 H113" className="fill-none" strokeWidth="3" />
        <rect x="132" y="94" width="7" height="5" rx="1.5" className="fill-foreground" strokeWidth="2" />
        <path d="M123 103 C 123 100, 127 99, 135.5 99 C 144 99, 148 100, 148 103 V116 C 148 118.5, 144 120, 135.5 120 C 127 120, 123 118.5, 123 116 Z" className="fill-accent" strokeWidth="2" />
        <path d="M123 109 H148" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
      </g>

      {/* Kläder på nedersta hyllan: en tröja med ärmar, halsringning och muddar, och en mössa med tofs. Mitt på hyllan tillsammans. */}
      <g className="mv-falla stroke-foreground" style={tid('3.6s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M95 133 Q103 140 111 133 L123 136 L137 152 L129 158 L121 150 V168 H85 V150 L77 158 L69 152 L83 136 Z" className="fill-accent" />
        <path d="M95 133 Q103 141 111 133" className="fill-none" strokeWidth="2" />
        <path d="M95 133 Q103 138.5 111 133" className="fill-sand" strokeWidth="1.6" />
        <path d="M86 164 H120 M71.5 155 L74.5 152.5 M134.5 155 L131.5 152.5" className="fill-none stroke-foreground/45" strokeWidth="2" />
        <path d="M103 141 V160" className="fill-none stroke-foreground/25" strokeWidth="1.6" />
      </g>
      <g className="mv-falla stroke-foreground" style={tid('3.9s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M144 168 V160 Q144 147 156 147 Q168 147 168 160 V168 Z" className="fill-illustration" />
        <rect x="142.5" y="161" width="27" height="7" rx="2" className="fill-sand" strokeWidth="2" />
        <path d="M150 150 V160 M156 148 V160 M162 150 V160" className="fill-none stroke-foreground/30" strokeWidth="1.4" />
        <circle cx="156" cy="144" r="4" className="fill-sand" strokeWidth="2" />
      </g>

      {/* Etiketterna i en kolumn till höger: kategori och vikt, likadana för alla tre */}
      <g className="font-heading">
        {etiketter.map(({ kategori, vikt, y, d }) => (
          <g key={kategori} className="mv-in" style={tid(d)}>
            <rect x={LAPP.x} y={y - LAPP.hojd / 2} width={LAPP.bredd} height={LAPP.hojd} rx={LAPP.hojd / 2} className="fill-card stroke-illustration/40" strokeWidth="1" />
            <text
              x={LAPP.x + LAPP.bredd / 2}
              y={y + 3.5}
              textAnchor="middle"
              className="fill-illustration text-[10px] font-bold tracking-wide uppercase"
            >
              {kategori}
            </text>
            <text x={LAPP.x + LAPP.bredd / 2} y={y + 22} textAnchor="middle" className="fill-foreground text-[11.5px] font-bold">
              {vikt}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}
