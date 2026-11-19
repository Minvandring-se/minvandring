import type { Punkt } from '@/components/start/stig/geometri'

/**
 * Fjällrävsgryt med en fjällräv i sommarpäls som sitter bredvid och tittar mot leden, 60 × 36 px.
 * Samma linjestil som tältet och vägvisaren. punkt är marken mitt under.
 */
export function Fjallrav({ punkt }: { punkt: Punkt }) {
  return (
    <g transform={`translate(${punkt.x - 30} ${punkt.y - 36})`} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      {/* Grytet: en låg kulle med ingång och några stenar. */}
      <path d="M1 35 C6 24 18 19 29 22 C35 24 39 29 41 35 Z" className="fill-sand stroke-foreground/60" />
      <path d="M8 27 L9 23 L11 26 L13 22 L14 25 M29 23 L31 19 L32 23 L34 21 L35 25" className="fill-none stroke-illustration" />
      <path d="M14 35 C14 29 18 26 22 26 C26 26 29 29 29 35 Z" className="fill-foreground/70 stroke-foreground/70" />
      <path d="M4 35 C4 32 7 31 9 33 C10 34 10 35 10 35 Z M33 35 C33 33 35 32 37 33 C38 34 38 35 38 35 Z" className="fill-muted stroke-foreground/50" />
      {/* Svansen, buskig med ljus spets, runt framtassarna. */}
      <path d="M54 35 C60 35 62 29 59 25 C58 29 55 31 51 31 Z" className="fill-sand stroke-foreground/80" />
      <path d="M57.5 27 C59.5 28 60 31 58.8 33" className="fill-none stroke-foreground/40" />
      {/* Kroppen, sittande. */}
      <path d="M44 35 C42 30 43 23 47 20 C50 18 54 19 55 23 C57 27 57 32 56 35 Z" className="fill-sand stroke-foreground/80" />
      {/* Ljust bröst. */}
      <path d="M45 34 C44 30 45 25 48 23 C49 27 49 31 48 34 Z" className="fill-card stroke-foreground/40" />
      {/* Huvudet med nos mot grytet och spetsiga öron. */}
      <path d="M45 13 L46 7 L49 11.5 Z M50 11 L52 5.5 L53.5 11 Z" className="fill-sand stroke-foreground/80" />
      <path d="M44 15 C44 11.5 47 10 50 10.5 C53 11 54.5 13.5 53.8 16.5 C53 19.5 49 20.5 46.5 19.5 L41 18 C40.2 17.6 40.4 16.7 41.2 16.6 Z" className="fill-sand stroke-foreground/80" />
      <circle cx={40.8} cy={17.2} r={0.9} className="fill-foreground stroke-none" />
      <circle cx={47.5} cy={14.6} r={0.8} className="fill-foreground stroke-none" />
      {/* Framtassarna. */}
      <path d="M47 35 V31 M50 35 V31" className="fill-none stroke-foreground/70" />
    </g>
  )
}
