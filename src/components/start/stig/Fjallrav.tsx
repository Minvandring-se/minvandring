import type { Punkt } from '@/components/start/stig/geometri'

/** Bilderna i public/stig, gjorda av design/fjallrav med gor-webp.cjs. Mått i px, som de visas. */
const GRYT = { src: '/stig/gryt.webp', bredd: 50, hojd: (50 * 62) / 150 }
const RAV = { src: '/stig/fjallrav-staende.webp', bredd: (32 * 120) / 84, hojd: 32 }

/** Hela figurens storlek: grytet till vänster och räven som står bredvid, lite framför. */
export const FJALLRAV_STORLEK = { bredd: 80, hojd: 32 }

/**
 * Fjällrävsgryt med en stående fjällräv bredvid, i samma mjuka stil som kartorna.
 * punkt är marken mitt under figuren.
 */
export function Fjallrav({ punkt }: { punkt: Punkt }) {
  const x = punkt.x - FJALLRAV_STORLEK.bredd / 2
  const mark = punkt.y
  return (
    <g>
      <image href={GRYT.src} x={x} y={mark - GRYT.hojd} width={GRYT.bredd} height={GRYT.hojd} />
      <image href={RAV.src} x={x + FJALLRAV_STORLEK.bredd - RAV.bredd} y={mark - RAV.hojd} width={RAV.bredd} height={RAV.hojd} />
    </g>
  )
}
