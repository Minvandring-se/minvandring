import { Sektion } from '@/components/ui/sektion'
import { formateraVikt, kategoriFor } from '@/lib/forrad'
import { sakerText, type Mallvikter } from '@/lib/packmallar'

/** Vikten överst på en mall: din basvikt, det gemensamma, förbrukning och på kroppen, och basvikten per kategori. */
export function Mallvikt({ vikter, saker, utanVikt }: { vikter: Mallvikter; saker: number; utanVikt: number }) {
  const tyngst = vikter.perKategori[0]?.vikt ?? 0
  return (
    <Sektion rubrik="Vikt">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">Din basvikt</span>
        <span className="font-heading text-2xl font-semibold tabular-nums">{formateraVikt(vikter.bas_g)}</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {[
          vikter.gemensamt_g > 0 && `Gemensamt ${formateraVikt(vikter.gemensamt_g)}`,
          vikter.forbrukas_g > 0 && `förbrukning ${formateraVikt(vikter.forbrukas_g)}`,
          vikter.kropp_g > 0 && `på kroppen ${formateraVikt(vikter.kropp_g)}`,
          sakerText(saker),
        ]
          .filter(Boolean)
          .join(', ')
          .replace(/^./, (c) => c.toUpperCase())}
        {utanVikt > 0 && `. ${utanVikt === 1 ? '1 sak saknar' : `${utanVikt} saker saknar`} vikt`}
      </p>
      {vikter.perKategori.length > 0 && (
        <ul className="space-y-2">
          {vikter.perKategori.map((k) => (
            <li key={k.kategori} className="space-y-1 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 break-words">{kategoriFor(k.kategori).etikett}</span>
                <span className="shrink-0 tabular-nums">{formateraVikt(k.vikt)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${tyngst > 0 ? Math.max(2, (k.vikt / tyngst) * 100) : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">Basvikten är det du bär i ryggsäcken: dina egna saker och sådant som alla har var sin av.</p>
    </Sektion>
  )
}
