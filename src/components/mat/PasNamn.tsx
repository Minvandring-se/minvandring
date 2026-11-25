import { cn } from '@/lib/utils'

/**
 * Namnet på en påse ur matkatalogen: märket på en egen rad ovanför, mindre och dämpat, och namnet under. Namnet bryts
 * i stället för att klippas, så att det aldrig är bara märket som syns. Skärmläsare läser märket och sedan namnet.
 * Med ettAnnat visas också ett annat namn (till exempel det svenska) under namnet.
 */
export function PasNamn({
  marke,
  namn,
  ettAnnat,
  className,
  namnKlass,
}: {
  marke: string
  namn: string
  /** Ett annat namn som visas under, till exempel "Viltgryta" för Reindeer Stew. */
  ettAnnat?: string | null
  className?: string
  /** Extra klasser för själva namnet, till exempel storleken. */
  namnKlass?: string
}) {
  return (
    <span className={cn('flex min-w-0 flex-col', className)}>
      <span className="text-xs font-normal text-muted-foreground break-words">{marke}</span>
      <span className={cn('break-words hyphens-auto', namnKlass)}>{namn}</span>
      {ettAnnat && <span className="text-sm font-normal text-muted-foreground break-words">{ettAnnat}</span>}
    </span>
  )
}
