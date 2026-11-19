import type { Punkt } from '@/components/start/stig/geometri'

/** Grässtrån som små bågar: x och y är roten, sista talet åt vilket håll de böjer sig. */
const STRAN: [number, number, number][] = [
  [4, 30.5, -1],
  [6, 29.6, 1],
  [10.5, 27.6, -1],
  [12, 27.2, 1],
  [16, 26.4, -1],
  [21, 25, 1],
  [22.5, 24.8, -1],
  [27.5, 25.2, 1],
  [31, 26.6, -1],
  [32.5, 27.4, 1],
  [35.5, 30, -1],
]

/**
 * Fjällrävsgryt med en vit fjällräv som står bredvid, 60 × 36 px.
 * Grytet är en låg, ojämn och frodig kulle med flera ingångar, jordhögar framför dem och stenar runt
 * omkring, som de riktiga gryten på kalfjället. Räven står på alla fyra med huvudet vänt mot besökaren.
 * Samma linjestil som tältet och vägvisaren. punkt är marken mitt under.
 */
export function Fjallrav({ punkt }: { punkt: Punkt }) {
  return (
    <g transform={`translate(${punkt.x - 30} ${punkt.y - 36})`} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      {/* Grytet: låg, frodig kulle. */}
      <path d="M0 35 C2 30.4 6.5 28 12.5 27.2 C17 26.6 20 24.4 25 24.4 C31 24.4 35.5 28 38.5 35 Z" className="fill-gras stroke-illustration/70" />
      {/* Jordhögar framför ingångarna och själva ingångarna. */}
      <path d="M5.5 35 C6.6 32.6 8.8 31.4 11.6 31.4 C14.4 31.4 16.6 32.6 17.7 35 Z M21.6 35 C22.3 33.3 23.8 32.4 25.6 32.4 C27.4 32.4 28.9 33.3 29.6 35 Z" className="fill-sand stroke-foreground/30" strokeWidth={1} />
      <path d="M8.6 33.6 C8.8 31.7 10.2 30.5 11.7 30.5 C13.2 30.5 14.6 31.7 14.8 33.6 Z M23.5 34 C23.7 32.7 24.6 31.9 25.6 31.9 C26.6 31.9 27.5 32.7 27.7 34 Z M18.6 28.2 C18.7 27.3 19.4 26.8 20.1 26.8 C20.8 26.8 21.5 27.3 21.6 28.2 Z" className="fill-foreground/80 stroke-none" />
      {/* Stenar. */}
      <ellipse cx={2.8} cy={34} rx={2.3} ry={1.4} className="fill-muted stroke-foreground/45" strokeWidth={1} />
      <ellipse cx={19.2} cy={33.8} rx={1.9} ry={1.2} className="fill-muted stroke-foreground/45" strokeWidth={1} />
      <ellipse cx={34} cy={33.7} rx={2.5} ry={1.5} className="fill-muted stroke-foreground/45" strokeWidth={1} />
      <ellipse cx={28.5} cy={26.4} rx={1.6} ry={1} className="fill-muted stroke-foreground/45" strokeWidth={1} />
      {/* Grässtrån och några små blommor. */}
      <path d={STRAN.map(([x, y, s]) => `M${x} ${y} q${s * 0.4} -1.6 ${s * 1.4} -2.8`).join(' ')} className="fill-none stroke-illustration" strokeWidth={1} />
      <circle cx={14.2} cy={26.6} r={0.9} className="fill-card stroke-none" />
      <circle cx={25} cy={23.6} r={0.9} className="fill-accent stroke-none" />
      <circle cx={33.8} cy={28.6} r={0.8} className="fill-card stroke-none" />

      {/* Svansen: lång, tjock och buskig, bakom kroppen. */}
      <path d="M52.6 25.4 C57.6 23 61.6 26.4 60.8 31 C60.2 34.6 55.6 35.6 52.2 33.6 C53.8 33.4 54.6 32.6 54.4 32 C56.6 31.6 57.6 30 56.8 28.4 C56 27 53.8 27.2 51.6 28.4 Z" className="fill-card stroke-foreground/70" />
      <path d="M58.2 27.6 C59 29 58.8 30.8 57.6 32" className="fill-none stroke-foreground/20" strokeWidth={0.9} />
      {/* Benen, korta. De bortre är lite mörkare. */}
      <path d="M50.4 29.6 L50.6 34.8 H52.6 L52.8 29.4 Z M44 29.8 L44 34.8 H46 L45.8 29.8 Z" className="fill-muted stroke-foreground/60" strokeWidth={1.1} />
      <path d="M47.6 29.8 L47.4 34.8 H49.6 L50.2 29.6 Z M40.8 29.4 L40.6 34.8 H42.8 L42.8 29.6 Z" className="fill-card stroke-foreground/70" strokeWidth={1.1} />
      {/* Kroppen, kompakt och lurvig. */}
      <path d="M38.6 26.4 C38.8 23.4 42.4 22.2 46.6 22.4 C51 22.6 54 23.8 54.2 26.8 C54.4 29.6 52 31.2 47.6 31.2 C43 31.2 38.4 30 38.6 26.4 Z" className="fill-card stroke-foreground/70" />
      <path d="M41.4 30 C44.6 31 49.4 31.1 52.4 29.9 M50.6 23.6 L51.4 22.8 L51.8 23.8" className="fill-none stroke-foreground/20" strokeWidth={1} />
      {/* Öronen, små och rundade, med grå insida. */}
      <path d="M34.4 15.6 L33.8 11.4 C33.8 10.4 34.7 10 35.4 10.6 L37.6 13.6 Z M39.8 13.6 L42 10.6 C42.7 10 43.6 10.4 43.6 11.4 L43 15.6 Z" className="fill-card stroke-foreground/70" />
      <path d="M35 13.8 L34.8 11.8 L36.4 13.6 Z M41.2 13.6 L42.6 11.8 L42.4 13.8 Z" className="fill-foreground/25 stroke-none" />
      {/* Huvudet, vänt mot besökaren, med lurvig päls på kinderna och bröstet. */}
      <path d="M33.6 18.8 C33.6 15.4 36 13.4 38.7 13.4 C41.4 13.4 43.8 15.4 43.8 18.8 C43.8 19.8 44.6 20.6 44.4 21.2 L43.2 22.2 L42.2 21.8 L41.2 23.4 L39.8 22.8 L38.7 24 L37.6 22.8 L36.2 23.4 L35.2 21.8 L34.2 22.2 L33 21.2 C32.8 20.6 33.6 19.8 33.6 18.8 Z" className="fill-card stroke-foreground/70" />
      <path d="M36.2 23.2 C37 25.8 39.6 27 41.8 26.2" className="fill-none stroke-foreground/25" strokeWidth={0.9} />
      {/* Nospartiet, lite spetsigt. */}
      <path d="M36.6 20.2 C37.2 21.6 38 22.2 38.7 22.2 C39.4 22.2 40.2 21.6 40.8 20.2" className="fill-none stroke-foreground/30" strokeWidth={0.8} />
      {/* Mörka ögon med glimt, nos och mun. */}
      <circle cx={36.8} cy={17.8} r={0.95} className="fill-foreground stroke-none" />
      <circle cx={40.6} cy={17.8} r={0.95} className="fill-foreground stroke-none" />
      <circle cx={37.1} cy={17.5} r={0.3} className="fill-card stroke-none" />
      <circle cx={40.9} cy={17.5} r={0.3} className="fill-card stroke-none" />
      <path d="M38 19.9 C38 19.4 39.4 19.4 39.4 19.9 C39.4 20.5 38.9 20.9 38.7 20.9 C38.5 20.9 38 20.5 38 19.9 Z" className="fill-foreground stroke-none" />
    </g>
  )
}
