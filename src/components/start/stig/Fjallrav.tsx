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
 * omkring, som de riktiga gryten på kalfjället. Räven står på alla fyra med huvudet åt höger.
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

      {/* Räven i sommarpäls, naturtroget tecknad: smal kropp, långa tunna ben, spetsig nos i
          trekvartsprofil och buskig svans. Tunnare linjer än grytet, så att pälsen bär formen. */}
      <g transform="translate(-1 0)" strokeWidth={0.9}>
        {/* Svansen, ljus och buskig, hänger bakåt. */}
        <path d="M41.8 23.2 C37.6 22.6 34.2 25.4 33.4 29.4 C33 31.8 34.2 33 35.6 32 C36.8 29.2 38.8 27 42.2 26.2 Z" className="fill-sand stroke-foreground/45" />
        <path d="M35.2 30.4 C35.8 28.4 37.2 26.6 39.4 25.4" className="fill-none stroke-rav/50" />
        {/* De bortre benen, i skugga. */}
        <path d="M44.6 27.2 L44.2 35 H45.6 L46.2 27.4 Z M53.2 27 L53.8 35 H55.2 L54.8 26.8 Z" className="fill-rav/60 stroke-foreground/35" />
        {/* Kroppen: gråbrun rygg, ljusare sida och mage. */}
        <path d="M41 24.4 C41.6 22 45 21.2 48.6 21.4 C51.8 21.6 54.2 22.4 54.8 24.6 C55.2 26.4 53.8 27.6 51 27.8 C47.6 28.1 44.2 27.8 42.4 27 C41.4 26.4 40.8 25.6 41 24.4 Z" className="fill-rav stroke-foreground/45" />
        <path d="M42.8 26.6 C45.6 27.7 50 27.9 53.6 27 C54.4 26.2 54.8 25.4 54.7 24.7 C52.4 25.8 48 26.2 44.6 25.8 C43.8 26 43.2 26.2 42.8 26.6 Z" className="fill-sand stroke-none" />
        {/* De närmre benen. */}
        <path d="M42.6 26.8 L42.2 35 H43.8 L44.4 27.2 Z M51.6 27.4 L51.2 35 H52.8 L53.2 27.4 Z" className="fill-rav stroke-foreground/45" />
        {/* Ljus hals och bröst. */}
        <path d="M52.2 22.6 C52.8 20.2 54 18.8 55.4 18.4 L57.6 21.4 C56.6 23.2 55.4 24.4 54.8 24.8 C53.6 24.4 52.6 23.6 52.2 22.6 Z" className="fill-sand stroke-foreground/30" />
        {/* Huvudet sänkt lite, i nivå med ryggen. */}
        <g transform="translate(-0.4 1.4)">
          {/* Öronen, små och rundade. */}
          <path d="M54.6 14.6 L54.2 11.4 C54.2 10.8 54.8 10.6 55.2 11 L56.6 13.6 Z M57.6 13.8 L58.8 11.2 C59.2 10.8 59.8 11 59.8 11.6 L59.4 14.8 Z" className="fill-rav stroke-foreground/45" />
          {/* Huvudet i trekvartsprofil med spetsig nos. */}
          <path d="M53.6 16.4 C53.8 14.6 55.2 13.6 56.8 13.8 C58.4 14 59.4 15 59.7 16.4 L61 18.4 C61.2 19 60.8 19.4 60.2 19.4 L58.6 19.6 C57.6 20.4 56 20.4 55 19.6 C54 18.9 53.5 17.8 53.6 16.4 Z" className="fill-muted stroke-foreground/45" />
          {/* Ljus kind och nos. */}
          <path d="M56 18.2 C57 17.5 58.6 17.7 60.2 18.5 C60.5 19 60.2 19.4 59.6 19.4 L58.4 19.6 C57.6 20.2 56.6 20.1 56.1 19.5 Z" className="fill-card stroke-none" />
          {/* Mandelformade ögon och nos. */}
          <ellipse cx={57.6} cy={16.2} rx={0.75} ry={0.45} className="fill-foreground stroke-none" transform="rotate(-12 57.6 16.2)" />
          <ellipse cx={55.4} cy={16.3} rx={0.55} ry={0.4} className="fill-foreground stroke-none" transform="rotate(-8 55.4 16.3)" />
          <circle cx={60.7} cy={18.8} r={0.55} className="fill-foreground stroke-none" />
        </g>
      </g>
    </g>
  )
}
