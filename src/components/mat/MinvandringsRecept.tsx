import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { TomtLage } from '@/components/app/TomtLage'
import { Illustration } from '@/components/illustrationer/Illustration'
import { Kostfilterval } from '@/components/mat/Kostfilterval'
import { Bricka } from '@/components/ui/bricka'
import { useReceptkatalog } from '@/hooks/useReceptkatalog'
import { passarFilter, TOMT_FILTER, type Kostfilter } from '@/lib/kost'
import { kostdelar, kostForRecept, RECEPTMALTID_ETIKETT, receptadress, receptbrickor, type Katalogrecept } from '@/lib/receptkatalog'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Brickorna för ett recept: kök, torkning, provlagat och det som är känt om kosten. */
export function Receptbrickor({ recept }: { recept: Katalogrecept }) {
  const kost = kostForRecept(kostdelar(recept))
  return (
    <span className="flex flex-wrap gap-1.5">
      <Bricka>{recept.kok_kravs ? 'Kök krävs' : 'Inget kök'}</Bricka>
      {recept.torkning_hemma && <Bricka>Kräver torkning hemma</Bricka>}
      {receptbrickor(kost).map((b) => (
        <Bricka key={b}>{b}</Bricka>
      ))}
      {kost.allergener === null && <Bricka>Allergener okända</Bricka>}
      {recept.status === 'otestat' && <Bricka ton="rost">Inte provlagat av oss än</Bricka>}
    </span>
  )
}

/** MinVandrings recept som kort, med kostfilter. Ett tryck öppnar receptet på en egen sida. */
export function MinvandringsRecept() {
  const recept = useReceptkatalog()
  const [filter, setFilter] = useState<Kostfilter>(TOMT_FILTER)
  const filtrerar = filter.val.length > 0 || filter.utan.length > 0
  const visade = useMemo(() => (Array.isArray(recept) ? recept.filter((r) => passarFilter(kostForRecept(kostdelar(r)), filter)) : []), [recept, filter])

  if (recept === null)
    return (
      <Laddar text="Hämtar recepten" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Skelett className="h-48 rounded-lg" />
        <Skelett className="h-48 rounded-lg" />
      </Laddar>
    )
  if (recept === 'fel') return <p className="text-destructive">Det gick inte att hämta MinVandrings recept. Kontrollera uppkopplingen och ladda om sidan.</p>

  return (
    <div className="space-y-4">
      <Kostfilterval filter={filter} onAndra={setFilter} />
      {filtrerar && <p className="text-sm text-muted-foreground">Recept där någon ingrediens är okänd visas inte när du filtrerar.</p>}
      {visade.length === 0 ? (
        <TomtLage kompakt text="Inga recept passar filtret." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visade.map((r) => (
            <li key={r.id}>
              <Link to={receptadress(r.id)} className={cn('lyft flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card', fokus)}>
                <Illustration namn={r.id} className="aspect-[16/7] w-full" />
                <span className="flex flex-1 flex-col gap-2 p-4">
                  <span className="text-sm text-muted-foreground">{RECEPTMALTID_ETIKETT[r.maltid]}</span>
                  <span className="font-heading text-lg font-semibold break-words text-primary">{r.namn}</span>
                  <Receptbrickor recept={r} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
