interface Props {
  /** Mittpunkt vid marken. */
  x: number
  y: number
}

/** Vägvisare vid ledens slut, 48 × 60 px. */
export function Vagvisare({ x, y }: Props) {
  return (
    <g transform={`translate(${x - 24} ${y - 60})`} strokeWidth={1.5} strokeLinejoin="round">
      <path d="M22 5 H26 V59 H22 Z" className="fill-sand stroke-foreground" />
      <path d="M4 10 H34 L44 17 L34 24 H4 Z" className="fill-accent stroke-foreground" />
      <path d="M44 29 H14 L4 36 L14 43 H44 Z" className="fill-accent stroke-foreground" />
      <path
        d="M3 59 L4 54 L7 57 L9 51 L12 57 L15 54 L17 59 Z M32 59 L34 54 L37 57 L40 51 L42 57 L45 54 L46 59 Z"
        className="fill-illustration stroke-illustration"
      />
    </g>
  )
}

/** Litet, stilla ledkryss i dov roströd ton vid ledens början. */
export function Ledkryss({ x, y }: Props) {
  return (
    <g transform={`translate(${x - 16} ${y - 44})`} strokeWidth={1.3} strokeLinejoin="round">
      <path d="M15 12 H18 V43 H15 Z" className="fill-sand stroke-foreground/60" />
      <path d="M4 3 L29 17 L27 21 L2 7 Z M28 3 L3 17 L5 21 L30 7 Z" className="fill-trail-marker stroke-foreground/60" />
      <path d="M8 43 L9 39 L12 42 L14 37 L16 43 M21 43 L24 38 L25 43" className="fill-none stroke-illustration" />
    </g>
  )
}
