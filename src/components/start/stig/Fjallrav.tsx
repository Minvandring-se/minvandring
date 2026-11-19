import { FIGUR, type Punkt } from '@/components/start/stig/geometri'

/** Bilderna i public/stig, gjorda av design/fjallrav med gor-webp.cjs. Mått i px, som de visas. */
const GRYT = { src: '/stig/gryt.webp', bredd: 75, hojd: (75 * 93) / 225 }
const RAV = { src: '/stig/fjallrav-staende.webp', bredd: (48 * 210) / 148, hojd: 48 }

/**
 * Fjällrävsgryt med en stående fjällräv bredvid, i samma mjuka stil som kartorna. Grytet står till
 * vänster och räven till höger, lite framför. Storleken är FIGUR.gryt. punkt är marken mitt under.
 */
export function Fjallrav({ punkt }: { punkt: Punkt }) {
  const x = punkt.x - FIGUR.gryt.bredd / 2
  const mark = punkt.y
  return (
    <g>
      <image href={GRYT.src} x={x} y={mark - GRYT.hojd} width={GRYT.bredd} height={GRYT.hojd} />
      <image href={RAV.src} x={x + FIGUR.gryt.bredd - RAV.bredd} y={mark - RAV.hojd} width={RAV.bredd} height={RAV.hojd} />
    </g>
  )
}
