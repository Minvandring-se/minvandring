interface VagvisareProps {
  /** Vägvisarens mittpunkt i det omgivande SVG-elementet. */
  x: number
  /** Överkant. Hela vägvisaren är 48 × 60 CSS-pixlar. */
  y: number
}

/** Liten vägvisare med två skyltar och grästuvor. Ritas inuti stigens SVG, utan egen viewBox. */
export function Vagvisare({ x, y }: VagvisareProps) {
  return (
    <g transform={`translate(${x - 24} ${y})`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 6 H26 V57 H22 Z" className="fill-sand stroke-foreground" />
      <path d="M4 10 H34 L44 17 L34 24 H4 Z" className="fill-accent stroke-foreground" />
      <path d="M44 29 H14 L4 36 L14 43 H44 Z" className="fill-accent stroke-foreground" />
      <path d="M2 58 L3 53 L7 56 L8 49 L11 56 L15 53 L16 58 Z" className="fill-illustration stroke-illustration" />
      <path d="M32 58 L34 53 L37 56 L39 49 L41 56 L45 53 L46 58 Z" className="fill-illustration stroke-illustration" />
    </g>
  )
}
