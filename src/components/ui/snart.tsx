import { cn } from '@/lib/utils'

/** Den lilla etiketten "Snart" i menyn, för sidor som inte är byggda. Streckad kant, som "Kommer snart". */
export function Snart({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-dashed border-muted-foreground/50 px-1.5 text-xs leading-4 font-semibold text-muted-foreground',
        className,
      )}
    >
      Snart
    </span>
  )
}
