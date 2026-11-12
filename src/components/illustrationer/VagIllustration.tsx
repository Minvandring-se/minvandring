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
      <ellipse cx="126" cy="179" rx="84" ry="6" className="fill-foreground/10" />

      {/* Vågen står till vänster och etiketterna i en kolumn till höger. Allt är ritat kring x = 130 och flyttat 4 åt vänster. */}
      <g transform="translate(-4 0)">
        {/* Fot med fötter, display och knapp */}
        <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M86 174 V178 H98 V174 M162 174 V178 H174 V174" className="fill-foreground" strokeWidth="2" />
          <rect x="118" y="134" width="24" height="9" className="fill-foreground" />
          <rect x="74" y="141" width="112" height="34" rx="10" className="fill-card" />
          <rect x="94" y="148" width="64" height="20" rx="4" className="fill-foreground" />
          <circle cx="171" cy="158" r="4" className="fill-accent" strokeWidth="2" />
        </g>
        <g className="fill-primary-soft font-heading text-[13px] font-bold" textAnchor="middle">
          <text x="126" y="162.5" className="mv-mellan mv-dolj" style={tid('0.9s')}>
            0,00 kg
          </text>
          <text x="126" y="162.5" className="mv-mellan mv-visa-dolj" style={tid('0.9s', '3.1s')}>
            1,45 kg
          </text>
          <text x="126" y="162.5" className="mv-mellan mv-visa-dolj" style={tid('3.1s', '5.3s')}>
            2,40 kg
          </text>
          <text x="126" y="162.5" className="mv-mellan mv-visa-dolj" style={tid('5.3s', '6.4s')}>
            2,88 kg
          </text>
          <text x="126" y="162.5" className="mv-visa" style={tid('6.4s')}>
            2,9 kg
          </text>
        </g>

        {/* Vågplattan och det som ligger på den gungar till när något landar. */}
        <g className="mv-gunga" style={{ '--d1': '0.9s', '--d2': '3.1s', '--d3': '5.3s' } as CSSProperties}>
          <rect x="62" y="126" width="136" height="9" rx="4.5" className="fill-illustration stroke-foreground" strokeWidth="2.5" />

          {/* 1. Tält i packsäck, med ett tältmärke */}
          <g className="mv-falla stroke-foreground" style={tid('0.4s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            <rect x="78" y="96" width="104" height="30" rx="15" className="fill-illustration" />
            <path d="M94 97.5 C 89 105, 89 117, 94 124.5 M166 97.5 C 171 105, 171 117, 166 124.5" className="fill-none stroke-card/55" strokeWidth="1.5" />
            <rect x="112" y="101" width="36" height="20" rx="4" className="fill-card" strokeWidth="1.5" />
            <path d="M121 117 L130 104.5 L139 117 Z" className="fill-illustration" strokeWidth="1.5" />
            <path d="M130 111 V117" className="fill-none stroke-card" strokeWidth="1.5" />
          </g>

          {/* 2. Sovsäck i kompressionspåse med två remmar och spännen */}
          <g className="mv-falla stroke-foreground" style={tid('2.6s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            <rect x="88" y="68" width="84" height="28" rx="14" className="fill-sand" />
            <path d="M112 69 V95 M148 69 V95" className="fill-none" strokeWidth="2" />
            <rect x="108.5" y="78" width="7" height="8" rx="1.5" className="fill-accent" strokeWidth="1.5" />
            <rect x="144.5" y="78" width="7" height="8" rx="1.5" className="fill-accent" strokeWidth="1.5" />
          </g>

          {/* 3. Rullat liggunderlag med spiral i änden */}
          <g className="mv-falla stroke-foreground" style={tid('4.8s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            <rect x="92" y="46" width="76" height="22" rx="11" className="fill-accent" />
            <path d="M108 47 V67 M128 47 V67" className="fill-none" strokeWidth="2" />
            <circle cx="157" cy="57" r="11" className="fill-accent" />
            <path d="M157 57 m-3.5 0 a3.5 3.5 0 1 0 3.5 -3.5 a6.5 6.5 0 1 0 6.5 6.5" className="fill-none" strokeWidth="1.5" />
          </g>
        </g>

        {/* Etiketter: namn och vikt i höjd med varje föremål när det har landat. */}
        <g className="font-heading">
          <g className="mv-in" style={tid('1.2s')}>
            <text x="200" y="109" className="fill-foreground text-[11.5px] font-bold">Tält</text>
            <text x="200" y="122" className="fill-foreground/70 text-[10px] font-semibold">1 450 g</text>
          </g>
          <g className="mv-in" style={tid('3.4s')}>
            <text x="200" y="80" className="fill-foreground text-[11.5px] font-bold">Sovsäck</text>
            <text x="200" y="93" className="fill-foreground/70 text-[10px] font-semibold">950 g</text>
          </g>
          <g className="mv-in" style={tid('5.6s')}>
            <text x="200" y="51" className="fill-foreground text-[11.5px] font-bold">Liggunderlag</text>
            <text x="200" y="64" className="fill-foreground/70 text-[10px] font-semibold">480 g</text>
          </g>
        </g>
      </g>
    </svg>
  )
}
