import type { Punkt } from '@/components/start/stig/geometri'

/**
 * Fjällrävsgryt med en fjällräv i sommarpäls som sitter bredvid, 60 × 36 px.
 * Grytet är en frodig, grön kulle med två ingångar, som riktiga gryt: växterna runt dem trivs extra bra.
 * Räven har stort huvud, runda öron och ljus nos, och tittar ut mot besökaren.
 * Samma linjestil som tältet och vägvisaren. punkt är marken mitt under.
 */
export function Fjallrav({ punkt }: { punkt: Punkt }) {
  return (
    <g transform={`translate(${punkt.x - 30} ${punkt.y - 36})`} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      {/* Grytet: en grön kulle med ljusare topp, jord vid ingångarna, gräs och några små blommor. */}
      <path d="M0 35 C3 24 14 18 26 19 C35 19.8 41 26 43 35 Z" className="fill-gras stroke-illustration" />
      <path d="M5 28 C10 22 20 19.6 28 20.4 C34 21 38.5 25 40.5 30 C35 25.5 28 23.4 20 23.6 C13 23.8 8 25.6 5 28 Z" className="fill-card/30 stroke-none" />
      <path d="M7.5 35 C8 31.5 10.5 29.5 14.5 29.5 C18.5 29.5 21 31.5 21.5 35 Z M26 35 C26.3 32.5 28 31 30.2 31 C32.4 31 34 32.5 34.3 35 Z" className="fill-sand stroke-foreground/50" />
      <path d="M10.5 35 C10.5 32.5 12.3 31 14.5 31 C16.7 31 18.5 32.5 18.5 35 Z M28 35 C28 33.3 29 32.4 30.2 32.4 C31.4 32.4 32.4 33.3 32.4 35 Z" className="fill-foreground/75 stroke-foreground/75" />
      <path d="M4.5 28.5 Q4 26 5.5 24 M6 28.4 Q6.6 25.4 8.6 24.2 M21.5 22 Q21 19.6 22.2 18 M23 21.8 Q23.8 19.4 25.6 18.6 M36 26.8 Q35.8 24.4 37 22.8 M37.4 27 Q38.4 24.8 40.2 24.4" className="fill-none stroke-illustration" />
      <circle cx={13} cy={23.6} r={1.1} className="fill-accent stroke-none" />
      <circle cx={33.5} cy={24.6} r={1.1} className="fill-card stroke-foreground/40" strokeWidth={0.6} />
      <circle cx={18} cy={21.8} r={0.9} className="fill-card stroke-foreground/40" strokeWidth={0.6} />

      {/* Svansen: tjock och buskig med ljus spets, lindad runt tassarna. */}
      <path d="M49 35 C57.5 36.2 61 30.5 59 25 C57.6 21.2 53.8 21.8 54.4 25 C55 28.4 53.2 31.2 48.6 31.4 Z" className="fill-sand stroke-foreground/80" />
      <path d="M58.9 25.6 C58.2 22.5 55.6 22 54.5 24.3 C55.9 24.4 57.3 24.8 58.9 25.6 Z" className="fill-card stroke-foreground/60" />
      {/* Kroppen och det ljusa bröstet. */}
      <path d="M41.5 35 C40 30 41.2 25.2 44.8 23.4 C48.4 21.6 52 23.4 52.4 27.4 C52.8 30.6 52.3 33.2 51.4 35 Z" className="fill-sand stroke-foreground/80" />
      <path d="M43.4 34.4 C42.6 30.6 43.4 27 46.2 25.6 C47.6 28.6 47.8 31.8 46.8 34.4 Z" className="fill-card stroke-foreground/40" />
      {/* Framtassarna. */}
      <path d="M43.2 35 C43.2 33.6 44.2 33 45.3 33 C46.4 33 47.3 33.6 47.3 35 Z M47.6 35 C47.6 33.6 48.6 33 49.7 33 C50.8 33 51.6 33.6 51.6 35 Z" className="fill-card stroke-foreground/70" />
      {/* Öronen, runda i topparna, med rosa insida. */}
      <path d="M41.2 12.4 L40.3 6.2 C40.2 5 41.3 4.6 42 5.4 L45.6 10 Z M48 9.8 L51.3 5.2 C52 4.4 53.1 4.8 53 6 L52.6 12.2 Z" className="fill-sand stroke-foreground/80" />
      <path d="M42.1 10.6 L41.7 7.4 L43.9 10 Z M50.2 9.8 L51.8 7.2 L51.6 10.4 Z" className="fill-trail-marker/35 stroke-none" />
      {/* Huvudet: stort och runt. */}
      <path d="M39.6 16.6 C39.6 12.2 42.8 9.6 46.6 9.6 C50.4 9.6 53.4 12.2 53.4 16.2 C53.4 19.8 50.4 22.4 46.6 22.4 C42.8 22.4 39.6 20.4 39.6 16.6 Z" className="fill-sand stroke-foreground/80" />
      {/* Ljus nos och kinder. */}
      <path d="M42.4 19 C43.6 17.4 45 16.9 46.6 16.9 C48.2 16.9 49.6 17.4 50.8 19 C50 21 48.4 22 46.6 22 C44.8 22 43.2 21 42.4 19 Z" className="fill-card stroke-none" />
      {/* Ögon med glimt, nos och ett litet leende. */}
      <circle cx={43.8} cy={15.4} r={1.25} className="fill-foreground stroke-none" />
      <circle cx={49.4} cy={15.4} r={1.25} className="fill-foreground stroke-none" />
      <circle cx={44.2} cy={15} r={0.4} className="fill-card stroke-none" />
      <circle cx={49.8} cy={15} r={0.4} className="fill-card stroke-none" />
      <path d="M45.6 18.2 C45.6 17.6 47.6 17.6 47.6 18.2 C47.6 18.9 46.9 19.4 46.6 19.4 C46.3 19.4 45.6 18.9 45.6 18.2 Z" className="fill-foreground stroke-none" />
      <path d="M46.6 19.4 V20 M45.4 20.2 C45.9 20.8 46.4 20.6 46.6 20 C46.8 20.6 47.3 20.8 47.8 20.2" className="fill-none stroke-foreground/70" strokeWidth={0.7} />
      <ellipse cx={41.8} cy={18.4} rx={1.2} ry={0.7} className="fill-trail-marker/25 stroke-none" />
      <ellipse cx={51.4} cy={18.4} rx={1.2} ry={0.7} className="fill-trail-marker/25 stroke-none" />
    </g>
  )
}
