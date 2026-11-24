import { cn } from '@/lib/utils'

/** En deltagares initial i en rund bricka i deltagarens färg (personfarger). Dekoration: namnet står bredvid eller i en etikett. */
export function Initial({ namn, farg, className }: { namn: string; farg: string | undefined; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-full font-sans font-semibold text-person-foreground', !farg && 'bg-primary-soft text-primary', className)}
      style={farg ? { backgroundColor: farg } : undefined}
    >
      {namn.charAt(0).toUpperCase()}
    </span>
  )
}
