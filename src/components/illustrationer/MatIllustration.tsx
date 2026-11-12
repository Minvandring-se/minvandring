import { useId, type CSSProperties } from 'react'

const tid = (d: string, d2?: string, t?: string) => ({ '--d': d, '--d2': d2, '--t': t }) as CSSProperties

/** Ett spaghettistrå med mörk kontur: först en bred mörk linje, sedan en smalare ljus ovanpå. */
function Stra({ d }: { d: string }) {
  return (
    <>
      <path d={d} className="fill-none stroke-foreground" strokeWidth="5.5" strokeLinecap="round" />
      <path d={d} className="fill-none stroke-sand" strokeWidth="2.5" strokeLinecap="round" />
    </>
  )
}

/**
 * Matlagning i tre delar: en kastrull på stormkök där spaghetti, lök och morot läggs i,
 * en liten stekpanna där ett ägg landar, och en frystorkad måltidspåse som fylls med vatten. Dekorativ.
 * Klasserna mv-* animerar den en gång på startsidan (se index.css), en sak i taget. Med "minska rörelse" syns slutbilden.
 *
 * Tider (s): spaghetti 0,3, lök 1,5, morot 2,7, ägg 4,0, flaskan 5,0, vattnet 5,4 till 6,8.
 */
export function MatIllustration({ className }: { className?: string }) {
  const pase = `pase-${useId().replace(/[^\w-]/g, '')}`
  const pasePath = 'M237 82 H301 L303 160 C 303 168, 299 172, 291 172 H249 C 241 172, 237 168, 237 160 Z'

  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden focusable="false">
      <defs>
        <clipPath id={pase}>
          <path d={pasePath} />
        </clipPath>
      </defs>
      <rect width="320" height="200" className="fill-sand/50" />
      <path d="M0 150 C 80 134, 140 144, 200 136 S 290 132, 320 142 V200 H0 Z" className="fill-primary-soft" />
      <ellipse cx="164" cy="176" rx="140" ry="6" className="fill-foreground/10" />

      {/* Råvarorna ligger bakom kastrullen så att de ser ut att ligga i den. */}
      <g className="mv-falla" style={tid('0.3s')}>
        <Stra d="M50 114 L42 60" />
        <Stra d="M56 114 L50 56" />
        <Stra d="M62 114 L60 54" />
        <Stra d="M68 114 L70 58" />
      </g>
      <g className="mv-falla stroke-foreground" style={tid('1.5s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M84 72 C 68 74, 63 92, 69 106 H99 C 105 92, 100 74, 84 72 Z" className="fill-sand" />
        <path d="M84 72 C 83 66, 85 61, 90 59" className="fill-none" strokeWidth="2" />
        <path d="M77 78 C 72 87, 72 98, 74 106 M91 78 C 96 87, 96 98, 94 106 M84 74 V106" className="fill-none stroke-foreground/40" strokeWidth="1.5" />
      </g>
      <g className="mv-falla stroke-foreground" style={tid('2.7s')} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M100 112 L104 70 C 105 64, 115 64, 116 70 L110 112 Z" className="fill-accent" />
        <path d="M104 80 L108 79 M105 92 L109 91" className="fill-none" strokeWidth="1.5" />
        <path d="M108 66 C 104 58, 100 56, 96 56 M110 66 C 110 58, 112 54, 116 52 M111 66 C 116 60, 120 60, 124 61" className="fill-none stroke-illustration" strokeWidth="3" />
      </g>

      {/* Stormkök och kastrull */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="28" y="150" width="100" height="22" rx="6" className="fill-card" />
        <circle cx="52" cy="161" r="3" className="fill-foreground" strokeWidth="0" />
        <circle cx="78" cy="161" r="3" className="fill-foreground" strokeWidth="0" />
        <circle cx="104" cy="161" r="3" className="fill-foreground" strokeWidth="0" />
        <path d="M24 112 H32 M124 112 H132" className="fill-none" strokeWidth="4" />
        <rect x="34" y="104" width="88" height="46" rx="7" className="fill-illustration" />
        <rect x="28" y="99" width="100" height="9" rx="4.5" className="fill-illustration" />
      </g>

      {/* Stekpanna med ägg, mindre än kastrullen */}
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M204 158 L230 149" className="fill-none" strokeWidth="5" />
        <ellipse cx="174" cy="162" rx="33" ry="11.5" className="fill-foreground" />
        <ellipse cx="174" cy="161" rx="27" ry="8" className="fill-illustration" strokeWidth="0" />
      </g>
      <g className="mv-splat" style={tid('4.0s')}>
        <g transform="translate(174 161) scale(1.4) translate(-172 -160.5)">
        <path d="M160 161 C 158 156, 166 154, 172 155 C 180 154, 186 157, 184 161 C 184 165, 176 167, 170 166 C 163 167, 160 165, 160 161 Z" className="fill-card stroke-foreground" strokeWidth="1.5" />
        <ellipse cx="172" cy="160" rx="5" ry="3.5" className="fill-accent stroke-foreground" strokeWidth="1.5" />
        </g>
      </g>

      {/* Frystorkad måltidspåse med fyllnadslinje. Vattnet stiger inuti. */}
      <path d={pasePath} className="fill-muted" />
      <rect
        x="235"
        y="104"
        width="70"
        height="70"
        clipPath={`url(#${pase})`}
        className="mv-fyll fill-illustration/40"
        style={tid('5.4s', undefined, '1.4s')}
      />
      <g className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <path d={pasePath} className="fill-none" />
        <path d="M237 90 H301" className="fill-none stroke-foreground/50" strokeWidth="1.5" />
        <path d="M244 104 H296" className="fill-none stroke-foreground/50" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="242" y="116" width="56" height="34" rx="3" className="fill-card" strokeWidth="1.5" />
      </g>
      <g className="font-heading font-bold" textAnchor="middle">
        <text x="270" y="130" className="fill-foreground text-[8px]">Frystorkad</text>
        <text x="270" y="143" className="fill-illustration text-[8px]">Pasta</text>
      </g>

      {/* Flaskan häller vatten i påsen och försvinner sedan. Bara när animationen spelar. */}
      <g className="mv-mellan mv-visa-dolj" style={tid('5.0s', '7.0s')}>
        <g transform="translate(264 70) rotate(-140)" className="stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
          <rect x="-8" y="8" width="16" height="40" rx="5" className="fill-accent" />
          <rect x="-4" y="0" width="8" height="9" rx="2" className="fill-foreground" />
        </g>
      </g>
      <path
        d="M264 72 C 264 78, 268 84, 270 96"
        className="mv-mellan mv-visa-dolj fill-none stroke-illustration/60"
        style={tid('5.3s', '6.8s')}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
