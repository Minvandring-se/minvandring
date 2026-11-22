import { cva } from 'class-variance-authority'

/**
 * Knappens utseende. Används av Button och av länkar som ska se ut som knappar:
 * `<Link className={knappStil({ variant: 'outline' })}>`. Alla storlekar är minst 44 px höga.
 */
export const knappStil = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        outline: 'border border-border bg-card hover:bg-muted',
        ghost: 'hover:bg-muted',
      },
      size: {
        default: 'h-11 px-5 text-sm',
        lg: 'h-13 px-7 text-base',
        /** Kvadratisk knapp med bara en ikon. Kräver aria-label. */
        ikon: 'size-11 shrink-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)
