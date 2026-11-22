import { ClipboardList, ImageIcon, UserPlus } from 'lucide-react'
import { Namnbricka } from '@/components/app/Namnbricka'
import { DAGBOK, KOMPISAR, LARDOMAR, MALLAR, RATTER } from '@/lib/exempeldata'

// Exemplen på sidorna i menyn som inte är byggda än. De visas inerta under "Kommer snart" (PlaneradSida).

const kort = 'rounded-lg border border-border bg-card'

/** Matplanering: era rätter med energi och vikt per portion. */
export function Matexempel() {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
      {RATTER.map((r) => (
        <li key={r.namn} className={`${kort} flex flex-col gap-3 p-4`}>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">{r.maltid}</p>
            <p className="font-heading text-lg font-semibold">{r.namn}</p>
          </div>
          <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Per portion</dt>
              <dd className="font-semibold tabular-nums">{r.kcal} kcal</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vikt</dt>
              <dd className="font-semibold tabular-nums">{r.gram} g</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Per 100 g</dt>
              <dd className="font-semibold tabular-nums">{r.kcalPer100g} kcal</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

/** Packlistor och mallar: några mallar att starta en tur från. */
export function Mallexempel() {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
      {MALLAR.map((m) => (
        <li key={m.namn} className={`${kort} flex items-start gap-3.5 p-4`}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ClipboardList className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-semibold">{m.namn}</p>
            <p className="text-sm text-muted-foreground">{m.fran}</p>
            <p className="mt-2 text-sm">
              {m.saker} saker, basvikt {m.basvikt}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

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

/** Kom ihåg till nästa: lärdomarna grupperade efter ämne. */
export function Lardomsexempel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
      {LARDOMAR.map((g) => (
        <section key={g.amne} className={`${kort} p-5`}>
          <h2 className="mb-2 text-lg">{g.amne}</h2>
          <ul className="divide-y divide-border">
            {g.rader.map((r) => (
              <li key={r.text} className="py-2.5">
                <p>{r.text}</p>
                <p className="text-sm text-muted-foreground">Från {r.tur}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Vandringskompisar: personer ni har vandrat med. */
export function Kompisexempel() {
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
      {KOMPISAR.map((k) => (
        <li key={k.namn} className={`${kort} flex items-center gap-3.5 p-4`}>
          <Namnbricka namn={k.namn} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{k.namn}</p>
            <p className="text-sm text-muted-foreground">
              {k.turer} turer, senast {k.senast}
            </p>
          </div>
          <span className="flex size-11 items-center justify-center rounded-full border border-border text-muted-foreground">
            <UserPlus className="size-5" aria-hidden />
          </span>
        </li>
      ))}
    </ul>
  )
}
