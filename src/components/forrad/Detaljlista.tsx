import type { Detaljrad } from '@/lib/forrad'

/** Rader med rubrik och värde. */
export function Detaljlista({ rader }: { rader: Detaljrad[] }) {
  return (
    <dl className="text-sm">
      {rader.map((rad) => (
        <div key={rad.etikett} className="flex justify-between gap-4 border-b border-border py-1.5">
          <dt className="text-muted-foreground">{rad.etikett}</dt>
          <dd className="min-w-0 text-right font-medium break-words">{rad.varde}</dd>
        </div>
      ))}
    </dl>
  )
}
