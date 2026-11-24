import { cva } from 'class-variance-authority'

/**
 * Knappens utseende. Används av Button och av länkar som ska se ut som knappar:
 * `<Link className={knappStil({ variant: 'outline' })}>`. Alla storlekar är minst 44 px höga.
 * En fylld knapp per vy (default, eller ljus på den mörkgröna ytan). Övriga åtgärder har kant.
 */
export const knappStil = cva(
  'inline-flex items-center justify-center gap-2 rounded-knapp font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline: 'border border-border bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
        /** Den fyllda knappen på den mörkgröna ytan (yta-stark). */
        ljus: 'bg-yta-stark-foreground font-semibold text-yta-stark hover:bg-yta-stark-muted focus-visible:outline-yta-stark-foreground',
        /** Knapp med kant på den mörkgröna ytan. */
        'kant-stark': 'border border-yta-stark-linje text-yta-stark-muted hover:bg-yta-stark-linje/40 hover:text-yta-stark-foreground focus-visible:outline-yta-stark-foreground',
      },
      size: {
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        /** Kvadratisk knapp med bara en ikon. Kräver aria-label. */
        ikon: 'size-11 shrink-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
