import type { CSSProperties } from 'react'

const tid = (d: string, d2?: string) => ({ '--d': d, '--d2': d2 }) as CSSProperties

/**
 * En köksvåg där tält, sovsäck och liggunderlag läggs på ett i taget. Dekorativ.
 * Vikterna är samma som i packlisteexemplet längre ner (1 450 + 950 + 480 g = 2,9 kg).
 * Klasserna mv-* animerar den en gång på startsidan (se index.css): varje föremål faller ner och landar,
 * en etikett visar vad det är och displayen räknar upp. Med "minska rörelse" syns slutbilden.
 *
 * Tider (s): tält landar 0,9, sovsäck 3,1, liggunderlag 5,3. Slutsumman visas 6,4.
 */
export function VagIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 70 136, 120 146, 180 138 S 280 132, 320 144 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="160" cy="178" rx="96" ry="6" className="fill-foreground/10" />

      {/* Vågens fot och display. Den digitala displayen är mörk med ljusgrön text. */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M100 136 H220 L214 174 C 213 177, 211 178, 208 178 H112 C 109 178, 107 177, 106 174 Z" className="fill-card" />
        <rect x="124" y="145" width="72" height="24" rx="4" className="fill-foreground" />
      </g>
      <g className="fill-primary-soft font-heading text-[14px] font-bold" textAnchor="middle">
        <text x="160" y="162" className="mv-mellan mv-dolj" style={tid('0.9s')}>
          0,00 kg
        </text>
        <text x="160" y="162" className="mv-mellan mv-visa-dolj" style={tid('0.9s', '3.1s')}>
          1,45 kg
        </text>
        <text x="160" y="162" className="mv-mellan mv-visa-dolj" style={tid('3.1s', '5.3s')}>
          2,40 kg
        </text>
        <text x="160" y="162" className="mv-mellan mv-visa-dolj" style={tid('5.3s', '6.4s')}>
          2,88 kg
        </text>
        <text x="160" y="162" className="mv-visa" style={tid('6.4s')}>
          2,9 kg
        </text>
      </g>

      {/* Vågskålen och det som ligger på den gungar till när något landar. */}
      <g className="mv-gunga" style={{ '--d1': '0.9s', '--d2': '3.1s', '--d3': '5.3s' } as CSSProperties}>
        <rect x="92" y="128" width="136" height="9" rx="4.5" className="fill-illustration stroke-foreground" strokeWidth="2.5" />

        {/* 1. Tält i packsäck, med en tältsymbol */}
        <g className="mv-falla stroke-foreground" style={tid('0.4s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="112" y="98" width="96" height="30" rx="15" className="fill-illustration" />
          <ellipse cx="200" cy="113" rx="5" ry="13" className="fill-primary-soft" strokeWidth="2" />
          <path d="M146 123 L160 103 L174 123 Z" className="fill-card" strokeWidth="2" />
          <path d="M160 109 V123" className="fill-none" strokeWidth="1.5" />
          <path d="M126 100 V126" className="fill-none stroke-card/60" strokeWidth="1.5" />
        </g>

        {/* 2. Sovsäck i packpåse med kompressionsremmar och snörstopp */}
        <g className="mv-falla stroke-foreground" style={tid('2.6s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="124" y="70" width="72" height="28" rx="13" className="fill-sand" />
          <path d="M142 71 V97 M178 71 V97" className="fill-none stroke-foreground/45" strokeWidth="2" />
          <path d="M124 84 H116" className="fill-none" strokeWidth="2" />
          <rect x="110" y="80" width="7" height="8" rx="2" className="fill-accent" strokeWidth="2" />
        </g>

        {/* 3. Rullat liggunderlag med spiral i änden */}
        <g className="mv-falla stroke-foreground" style={tid('4.8s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <rect x="110" y="48" width="100" height="22" rx="11" className="fill-accent" />
          <path d="M132 49 V69 M154 49 V69 M176 49 V69" className="fill-none stroke-foreground/35" strokeWidth="1.5" />
          <circle cx="199" cy="59" r="10" className="fill-accent" />
          <path d="M199 59 m-4 0 a4 4 0 1 0 4 -4 a7 7 0 1 0 7 7" className="fill-none" strokeWidth="1.5" />
        </g>
      </g>

      {/* Etiketter: namn och vikt bredvid varje föremål när det har landat. */}
      <g className="font-heading">
        <g className="mv-in" style={tid('1.2s')}>
          <text x="234" y="110" className="fill-foreground text-[12px] font-bold">Tält</text>
          <text x="234" y="124" className="fill-foreground/70 text-[11px] font-semibold">1 450 g</text>
        </g>
        <g className="mv-in" style={tid('3.4s')} textAnchor="end">
          <text x="104" y="81" className="fill-foreground text-[12px] font-bold">Sovsäck</text>
          <text x="104" y="95" className="fill-foreground/70 text-[11px] font-semibold">950 g</text>
        </g>
        <g className="mv-in" style={tid('5.6s')}>
          <text x="218" y="57" className="fill-foreground text-[12px] font-bold">Liggunderlag</text>
          <text x="218" y="71" className="fill-foreground/70 text-[11px] font-semibold">480 g</text>
        </g>
      </g>
    </svg>
  )
}
