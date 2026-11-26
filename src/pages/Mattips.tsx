import { Link } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Illustration } from '@/components/illustrationer/Illustration'
import { Matflikar } from '@/components/mat/Matflikar'
import { useSidtitel } from '@/hooks/useSidtitel'
import { GUIDER, lastid, tipsadress, type Guide } from '@/lib/tips'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Tips om mat på tur som artiklar: den första som ett stort kort, de två nästa bredvid varandra och resten som rader
 * med liten bild. Innehållet står i src/lib/tips.ts.
 */
export function Mattips() {
  useSidtitel('Tips')
  const [forsta, ...ovriga] = GUIDER
  const mellan = ovriga.slice(0, 2)
  const rader = ovriga.slice(2)
  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik rubrik="Tips" text="Korta guider om energi, vatten, bränsle och packning. Råden är allmänna, och varje guide visar vilka källor siffrorna bygger på." />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4">
        <li className="col-span-2">
          <Artikelkort guide={forsta} stor />
        </li>
        {mellan.map((g) => (
          <li key={g.nyckel}>
            <Artikelkort guide={g} />
          </li>
        ))}
      </ul>

      {rader.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {rader.map((g) => (
            <li key={g.nyckel}>
              <Link to={tipsadress(g.nyckel)} className={cn('flex items-center gap-4 p-3 hover:bg-muted', fokus)}>
                <Illustration namn={g.nyckel} className="size-16 shrink-0 rounded-md" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold break-words">{g.rubrik}</span>
                  <span className="block text-sm text-muted-foreground">{lastid(g)} min läsning</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Ett kort för en artikel: bild, lästid, rubrik och, på det stora kortet, ingressen. Hela kortet är en länk. */
function Artikelkort({ guide, stor = false }: { guide: Guide; stor?: boolean }) {
  return (
    <Link
      to={tipsadress(guide.nyckel)}
      className={cn('lyft flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card', fokus)}
    >
      <Illustration namn={guide.nyckel} className={cn('w-full', stor ? 'aspect-[16/9] lg:aspect-[3/1]' : 'aspect-[4/3] sm:aspect-[16/7]')} />
      <span className={cn('flex flex-1 flex-col gap-1.5', stor ? 'p-5' : 'p-4')}>
        <span className="text-sm text-muted-foreground">{lastid(guide)} min läsning</span>
        <span className={cn('font-heading font-semibold break-words text-primary', stor ? 'text-2xl' : 'text-lg')}>{guide.rubrik}</span>
        {stor && <span className="text-muted-foreground">{guide.ingress}</span>}
      </span>
    </Link>
  )
}
