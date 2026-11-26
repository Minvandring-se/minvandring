import { ImageIcon } from 'lucide-react'
import { DAGBOK } from '@/lib/exempeldata'

// Exemplen på sidorna i menyn som inte är byggda än. De visas inerta under "Kommer snart" (PlaneradSida).

const kort = 'rounded-lg border border-border bg-card'

/** Dagbok: en tidslinje per tur. */
export function Dagboksexempel() {
  return (
    <section className={`${kort} p-5 sm:p-6`}>
      <h2 className="mb-4 text-xl">{DAGBOK.tur}</h2>
      <ol className="space-y-5 border-l-2 border-border pl-5">
        {DAGBOK.dagar.map((d) => (
          <li key={d.dag} className="relative max-w-prose">
            <span aria-hidden className="absolute top-1.5 -left-[1.6875rem] size-3 rounded-full border-2 border-card bg-accent" />
            <p className="text-xs font-semibold text-muted-foreground">{d.dag}</p>
            <p className="font-semibold">{d.rubrik}</p>
            <p className="text-sm text-muted-foreground">{d.text}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <ImageIcon className="size-4" aria-hidden />
              {d.bilder} bilder
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
