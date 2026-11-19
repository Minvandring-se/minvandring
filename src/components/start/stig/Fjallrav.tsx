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
 * Fjällrävsgryt med en fjällräv i sommarpäls som står bredvid, 60 × 36 px.
 * Grytet är en låg, ojämn och frodig kulle med flera ingångar, jordhögar framför dem och stenar runt
 * omkring, som de riktiga gryten på kalfjället. Räven står på alla fyra, med huvudet åt höger vänt mot besökaren.
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

      {/* Räven, i sommarpäls: gråbrun rygg, ljus mage och svans, grått ansikte med vita kinder.
          Den står med huvudet åt höger och tittar mot besökaren. */}
      <g transform="translate(-1 0)">
        {/* Svansen, ljus och buskig, hänger bakåt. */}
        <path d="M43 23.8 C37.4 23.6 34.2 28 34.2 32.4 C34.2 35.4 37.4 35.8 38.8 33.8 C39.8 31 41.6 28.8 44.2 27.8 Z" className="fill-sand stroke-foreground/70" />
        <path d="M36.6 32 C37.2 29.6 38.6 27.8 40.6 26.6" className="fill-none stroke-foreground/20" strokeWidth={0.9} />
        {/* De bortre benen, mörkare. */}
        <path d="M45.2 28.8 L44.8 34.8 H46.8 L47.4 29 Z M54 28.6 L54.2 34.8 H56.2 L56.2 28.4 Z" className="fill-rav/70 stroke-foreground/60" strokeWidth={1.1} />
        {/* Kroppen med gråbrun rygg och ljus mage. */}
        <path d="M42 25.6 C42.4 22.4 46.4 21.2 50.4 21.4 C54 21.6 57 22.6 57.2 25.8 C57.4 28.6 55 30 50.8 30 C46.4 30 41.6 29 42 25.6 Z" className="fill-rav stroke-foreground/70" />
        <path d="M43.8 28.4 C47 29.8 51.8 29.8 56 28.2 C57 26.6 57 25.2 56.6 24.4 C55 26.6 50.8 27.6 46.4 27.2 C45.2 27.4 44.2 27.8 43.8 28.4 Z" className="fill-sand stroke-none" />
        {/* De närmre benen. */}
        <path d="M43.2 28.4 L43 34.8 H45.2 L45.6 28.8 Z M52 28.8 L51.8 34.8 H54 L54.2 29 Z" className="fill-rav stroke-foreground/70" strokeWidth={1.1} />
        {/* Ljus hals och bröst. */}
        <path d="M53.4 21.6 C53.6 24.2 55 26 57.4 26.4 C57.6 25 57.4 23.4 57 22 Z" className="fill-sand stroke-none" />
        {/* Öronen, små och rundade, med ljus insida. */}
        <path d="M51.8 14.8 L51.4 10.6 C51.4 9.6 52.2 9.2 52.8 9.8 L54.8 12.8 Z M57 12.8 L59 9.8 C59.6 9.2 60.4 9.6 60.4 10.6 L60 14.8 Z" className="fill-rav stroke-foreground/70" />
        <path d="M52.4 13 L52.2 11 L53.6 12.8 Z M58.4 12.8 L59.6 11 L59.4 13 Z" className="fill-card stroke-none" />
        {/* Huvudet, grått med lurviga kinder. */}
        <path d="M50.8 18 C50.8 14.6 53.2 12.6 55.9 12.6 C58.6 12.6 61 14.6 61 18 C61 19 61.6 19.8 61.4 20.4 L60.2 21.4 L59.2 21 L58.2 22.6 L56.8 22 L55.9 23.2 L55 22 L53.6 22.6 L52.6 21 L51.6 21.4 L50.4 20.4 C50.2 19.8 50.8 19 50.8 18 Z" className="fill-muted stroke-foreground/70" />
        {/* Vita kinder och nos. */}
        <path d="M51.6 19.4 C52.6 21.4 54.2 22.2 55.9 22.2 C57.6 22.2 59.2 21.4 60.2 19.4 C59 18.4 57.6 18 55.9 18 C54.2 18 52.8 18.4 51.6 19.4 Z" className="fill-card stroke-none" />
        {/* Mörka ögon med glimt, nos och mun. */}
        <circle cx={54} cy={16.9} r={0.95} className="fill-foreground stroke-none" />
        <circle cx={57.8} cy={16.9} r={0.95} className="fill-foreground stroke-none" />
        <circle cx={54.3} cy={16.6} r={0.3} className="fill-card stroke-none" />
        <circle cx={58.1} cy={16.6} r={0.3} className="fill-card stroke-none" />
        <path d="M55.2 19 C55.2 18.5 56.6 18.5 56.6 19 C56.6 19.6 56.1 20 55.9 20 C55.7 20 55.2 19.6 55.2 19 Z" className="fill-foreground stroke-none" />
        <path d="M55.9 20 V20.5 M55.1 20.8 C55.5 21.1 55.8 21 55.9 20.5 C56 21 56.3 21.1 56.7 20.8" className="fill-none stroke-foreground/60" strokeWidth={0.6} />
      </g>
    </g>
  )
}
