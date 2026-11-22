import { STATISTIK } from '@/lib/exempeldata'
import { cn } from '@/lib/utils'

/**
 * Exemplet på Statistik, enligt skissen Sidomeny-dator: val av år, fyra nyckeltal, kilometer per månad som staplar
 * (den största i rost), den mest använda utrustningen och det som aldrig har använts.
 */
export function Statistikexempel() {
  const max = Math.max(...STATISTIK.kmPerManad)
  return (
    <div className="space-y-5">
      <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
        {STATISTIK.ar.map((ar) => (
          <span
            key={ar}
            className={cn(
              'flex min-h-10 items-center rounded-lg px-3.5 text-sm',
              ar === STATISTIK.valtAr ? 'bg-card font-semibold text-foreground shadow-soft' : 'text-muted-foreground',
            )}
          >
            {ar}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-4">
        {STATISTIK.nyckeltal.map(({ etikett, varde }, i) => (
          <div key={etikett} className={cn('border-border px-5 py-4', i % 2 === 1 && 'border-l', i >= 2 && 'border-t sm:border-t-0', i === 2 && 'sm:border-l')}>
            <dt className="text-sm text-muted-foreground">{etikett}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold tabular-nums sm:text-3xl">{varde}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-4 rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="text-xl">Kilometer per månad</h2>
        <div className="flex gap-1.5 sm:gap-2.5">
          {STATISTIK.kmPerManad.map((km, i) => (
            <div key={STATISTIK.manader[i]} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex h-40 w-full items-end">
                <span
                  className={cn('block w-full rounded-t-md rounded-b-sm', km === 0 ? 'bg-primary/15' : km === max ? 'bg-accent' : 'bg-primary')}
                  style={{ height: `${Math.max(2, (km / max) * 100)}%` }}
                />
              </div>
              {/* I smal bredd bara första bokstaven, så att etiketterna inte krockar. */}
              <span className="text-xs text-muted-foreground">
                <span className="sm:hidden">{STATISTIK.manader[i][0]}</span>
                <span className="hidden sm:inline">{STATISTIK.manader[i]}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-2 text-xl">Mest använd utrustning</h2>
          <ul className="divide-y divide-border text-sm">
            {STATISTIK.mestAnvand.map((r) => (
              <li key={r.namn} className="flex justify-between gap-4 py-2.5">
                <span>{r.namn}</span>
                <span className="shrink-0 text-muted-foreground">{r.varde}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-accent/25 bg-accent-soft p-5 sm:p-6">
          <h2 className="mb-2 text-xl">Har aldrig använts</h2>
          <p className="mb-2 text-sm text-muted-foreground">Packat men aldrig använt. Kanske kan de stanna hemma?</p>
          <ul className="divide-y divide-accent/20 text-sm">
            {STATISTIK.aldrigAnvand.map((r) => (
              <li key={r.namn} className="flex justify-between gap-4 py-2.5">
                <span>{r.namn}</span>
                <span className="shrink-0 font-semibold text-accent-strong">{r.varde}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
