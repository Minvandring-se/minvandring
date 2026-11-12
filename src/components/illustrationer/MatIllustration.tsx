import { useId, type CSSProperties } from 'react'

const tid = (d: string, d2?: string, t?: string) => ({ '--d': d, '--d2': d2, '--t': t }) as CSSProperties

/** En pastafjäril (farfalle). */
function Farfalle({ x, y, v }: { x: number; y: number; v: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${v})`} className="stroke-foreground" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-11 -7.5 L-1.8 -2.6 H1.8 L11 -7.5 V7.5 L1.8 2.6 H-1.8 L-11 7.5 Z" className="fill-sand" strokeWidth="1.8" />
      <path d="M0 -2.4 V2.4 M-7 -2 V2 M7 -2 V2" className="fill-none stroke-foreground/45" strokeWidth="1.2" />
    </g>
  )
}

/** En skiva champinjon. */
function Svampskiva({ x, y, v }: { x: number; y: number; v: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${v})`} className="stroke-foreground" strokeLinejoin="round" strokeLinecap="round">
      <path d="M-7.5 0 C -7.5 -9, 7.5 -9, 7.5 0 H3 V6 C 3 7.5, -3 7.5, -3 6 V0 Z" className="fill-card" strokeWidth="1.8" />
      <path d="M-3 0 H3" className="fill-none stroke-foreground/40" strokeWidth="1.2" />
    </g>
  )
}

/**
 * Matlagning i tre delar, alla sedda lite uppifrån: en kastrull på ett gasolkök där pasta, morot och svamp läggs i,
 * en stekpanna där ett ägg landar, och en frystorkad måltidspåse som fylls med vatten. Dekorativ.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css), en sak i taget. Med "minska rörelse" syns slutbilden.
 *
 * Tider (s): pasta 0,3, morot 1,5, svamp 2,7, ångan 3,5, ägg 4,0, flaskan 5,0, vattnet 5,4 till 6,8.
 */
export function MatIllustration({ className }: { className?: string }) {
  const paseId = `pase-${useId().replace(/[^\w-]/g, '')}`
  const pase = 'M246 66 H302 L304 164 C 304 169, 301 172, 296 172 H252 C 247 172, 244 169, 244 164 Z'

  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <defs>
        <clipPath id={paseId}>
          <path d={pase} />
        </clipPath>
      </defs>
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 80 134, 140 144, 200 136 S 290 132, 320 142 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="164" cy="176" rx="146" ry="6" className="fill-foreground/10" />

      {/* Stillastående ånga över kastrullen. Tonas in en gång när råvarorna ligger i och står sedan kvar. */}
      <g className="mv-visa fill-none stroke-foreground/25" style={tid('3.5s')} strokeWidth="2.2" strokeLinecap="round">
        <path d="M48 70 C 42 61, 54 54, 48 43" />
        <path d="M64 62 C 58 52, 70 44, 64 31" />
        <path d="M80 66 C 74 57, 86 50, 80 39" />
      </g>

      {/* Gasolkök: gasolflaska, brännare och kastrullstöd */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M52 150 H88 C 92 150, 94 153, 94 156 V167 C 94 170, 92 172, 89 172 H51 C 48 172, 46 170, 46 167 V156 C 46 153, 48 150, 52 150 Z" className="fill-accent" />
        <path d="M46 161 H94" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
        <rect x="63" y="143" width="14" height="7" rx="1.5" className="fill-foreground" />
        <path d="M40 142.5 H100" className="fill-none" strokeWidth="3.5" />
      </g>

      {/* Kastrullen: handtag, kropp och öppningen med buljong */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="16" y="104" width="14" height="7" rx="3.5" className="fill-foreground" />
        <rect x="110" y="104" width="14" height="7" rx="3.5" className="fill-foreground" />
        <path d="M28 96 V131 C 28 137, 32 140, 38 140 H102 C 108 140, 112 137, 112 131 V96 Z" className="fill-illustration" />
        <ellipse cx="70" cy="96" rx="44" ry="12" className="fill-illustration" />
        <ellipse cx="70" cy="96" rx="38" ry="9" className="fill-primary-soft" strokeWidth="2" />
      </g>

      {/* Råvarorna faller ner i kastrullen, en sort i taget */}
      <g className="mv-falla" style={tid('0.3s')}>
        <Farfalle x={46} y={92} v={-14} />
        <Farfalle x={65} y={96} v={10} />
      </g>
      <g className="mv-falla" style={tid('1.5s')}>
        <g transform="translate(88 98) rotate(24)" className="stroke-foreground" strokeLinejoin="round" strokeLinecap="round">
          <path d="M0 -26 C -4 -33, -8 -35, -12 -35 M0 -26 C 0 -34, 2 -37, 6 -39 M0 -26 C 5 -31, 9 -32, 13 -31" className="fill-none stroke-illustration" strokeWidth="2.8" />
          <path d="M-5.5 -22 C -5.5 -27, 5.5 -27, 5.5 -22 L2.8 1 C 1.8 4, -1.8 4, -2.8 1 Z" className="fill-accent" strokeWidth="2" />
          <path d="M-4.5 -15 h4.5 M-0.5 -8 h3.5" className="fill-none" strokeWidth="1.3" />
        </g>
      </g>
      <g className="mv-falla" style={tid('2.7s')}>
        <Svampskiva x={80} y={99} v={-10} />
        <Svampskiva x={103} y={94} v={14} />
      </g>

      {/* Kastrullens främre kant ligger framför råvarorna */}
      <path
        d="M26 96 A 44 12 0 0 0 114 96 L108 96 A 38 9 0 0 1 32 96 Z"
        className="fill-illustration stroke-foreground"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Stekpanna med ägg */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M206 156 L228 148" className="fill-none" strokeWidth="6" />
        <path d="M148 160 C 149 170, 164 173.5, 179 173.5 C 194 173.5, 209 170, 210 160 Z" className="fill-foreground" />
        <ellipse cx="179" cy="160" rx="31" ry="10" className="fill-foreground" />
        <ellipse cx="179" cy="160" rx="26.5" ry="7.5" className="fill-muted-foreground" strokeWidth="0" />
      </g>
      <g className="mv-splat stroke-foreground" style={tid('4.0s')} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M163 160 C 161 155, 169 153, 176 154 C 183 152, 194 155, 195 160 C 196 165, 187 167, 180 166 C 172 168, 164 166, 163 160 Z" className="fill-card" />
        <ellipse cx="180" cy="159.5" rx="5.5" ry="3.6" className="fill-accent" />
      </g>

      {/* Frystorkad måltidspåse. Vattnet stiger till den streckade fyllnadslinjen. */}
      <path d={pase} className="fill-card" />
      <g clipPath={`url(#${paseId})`}>
        <rect x="244" y="66" width="60" height="9" className="fill-sand" />
        <rect x="244" y="86" width="60" height="86" className="mv-fyll fill-illustration/30" style={tid('5.4s', undefined, '1.4s')} />
        <rect x="244" y="104" width="60" height="30" className="fill-illustration" />
      </g>
      <g className="fill-none stroke-foreground" strokeLinejoin="round" strokeLinecap="round">
        <path d="M245.8 75 H302.2" strokeWidth="1.5" />
        <path d="M252 86 H296" className="stroke-foreground/40" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M245.2 104 H302.8 M244.6 134 H303.4" strokeWidth="1.5" />
        <path d="M245 161 C 258 167, 290 167, 303 161" className="stroke-foreground/35" strokeWidth="1.5" />
        <path d={pase} strokeWidth="2.5" />
      </g>
      <ellipse cx="274" cy="66.5" rx="23" ry="2.8" className="fill-foreground" />
      <g className="font-heading font-bold" textAnchor="middle">
        <text x="274" y="117.5" className="fill-card text-[8px]">Frystorkad</text>
        <text x="274" y="128.5" className="fill-primary-soft text-[7.5px]">Pasta</text>
      </g>

      {/* Flaskan häller vatten i påsen och försvinner sedan. Bara när animationen spelar. */}
      <g className="mv-mellan mv-visa-dolj" style={tid('5.0s', '7.0s')}>
        <g transform="translate(264 50) rotate(140)" className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
          <rect x="-9" y="8" width="18" height="40" rx="6" className="fill-primary-soft" />
          <rect x="-4" y="0" width="8" height="9" rx="1.5" className="fill-card" />
        </g>
      </g>
      <path
        d="M265 52 C 267 55, 269 59, 270 66"
        className="mv-mellan mv-visa-dolj fill-none stroke-illustration/60"
        style={tid('5.3s', '6.8s')}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
