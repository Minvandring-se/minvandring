import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { EgenRattFormular } from '@/components/mat/EgenRattFormular'
import { Matflikar } from '@/components/mat/Matflikar'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { sparaRecept, taBortRecept, useRecept } from '@/hooks/useRecept'
import { useSidtitel } from '@/hooks/useSidtitel'
import { formateraVikt } from '@/lib/forrad'
import { formateraKcal, naringForRader } from '@/lib/mat'
import { receptTillRader } from '@/lib/recept'
import type { Recept as ReceptTyp } from '@/lib/typer'
import { cn } from '@/lib/utils'

type Vy = { typ: 'ny' } | { typ: 'andra'; recept: ReceptTyp } | null

/** Varorna i ens recept, en gång var, som förslag i formuläret med kcal och protein. */
function varorIRecepten(recept: readonly ReceptTyp[]) {
  const varor = new Map<string, { namn: string; kcal_per_100g: number | null; protein_per_100g: number | null }>()
  for (const r of recept)
    for (const x of r.rader)
      if (!varor.has(x.vara.toLowerCase())) varor.set(x.vara.toLowerCase(), { namn: x.vara, kcal_per_100g: x.kcal_per_100g, protein_per_100g: x.protein_per_100g })
  return [...varor.values()].sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))
}

/**
 * Mina recept: rätter med ingredienser som sparas på kontot och kan läggas in i vilken tur som helst från Välj rätt.
 * Bara man själv ser dem. När ett recept läggs i en tur kopieras det, så att en ändring här inte ändrar turen.
 */
export function Recept() {
  useSidtitel('Recept')
  const { recept, laddaOm } = useRecept()
  const [vy, setVy] = useState<Vy>(null)

  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik
        rubrik="Recept"
        text="Dina recept, som du kan lägga in i vilken tur som helst. Bara du ser dem."
        knappar={
          Array.isArray(recept) &&
          recept.length > 0 && (
            <Button onClick={() => setVy({ typ: 'ny' })}>
              <Plus className="size-4" aria-hidden />
              Nytt recept
            </Button>
          )
        }
      />

      {recept === null ? (
        <Laddar text="Hämtar dina recept" className="space-y-3">
          <Skelett className="h-16 rounded-lg" />
          <Skelett className="h-16 rounded-lg" />
        </Laddar>
      ) : recept === 'fel' ? (
        <p role="alert" className="text-destructive">
          Det gick inte att hämta dina recept. Kontrollera uppkopplingen och försök igen.
        </p>
      ) : recept.length === 0 ? (
        <TomtLage
          kompakt
          rubrik="Du har inga recept än"
          text="Skapa ett recept här. Du kan också spara en egen rätt från en tur: öppna Välj rätt, Egna rätter, ändra rätten och tryck på Spara som recept."
          knapp={
            <Button onClick={() => setVy({ typ: 'ny' })}>
              <Plus className="size-4" aria-hidden />
              Nytt recept
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recept.map((r) => {
            const portion = naringForRader(receptTillRader(r))
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => setVy({ typ: 'andra', recept: r })}
                  className={cn(
                    'flex min-h-16 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold break-words">{r.namn}</span>
                    <span className="block text-sm text-muted-foreground tabular-nums">
                      {formateraKcal(portion.kcal)} och {formateraVikt(portion.gram)} per portion, {r.rader.length === 1 ? '1 ingrediens' : `${r.rader.length} ingredienser`}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {vy && Array.isArray(recept) && (
        <Panel
          etikett={vy.typ === 'ny' ? 'Nytt recept' : `Ändra ${vy.recept.namn}`}
          onStang={() => setVy(null)}
          rubrik={<h2 className="text-2xl">{vy.typ === 'ny' ? 'Nytt recept' : 'Ändra receptet'}</h2>}
        >
          <EgenRattFormular
            key={vy.typ === 'ny' ? 'ny' : vy.recept.id}
            typ="recept"
            ny={vy.typ === 'ny'}
            forsta={vy.typ === 'andra' ? { namn: vy.recept.namn, rader: receptTillRader(vy.recept) } : undefined}
            varor={varorIRecepten(recept)}
            onAvbryt={() => setVy(null)}
            onTaBort={
              vy.typ === 'andra'
                ? async () => {
                    const ok = await taBortRecept(vy.recept.id)
                    if (ok) {
                      setVy(null)
                      await laddaOm()
                    }
                    return ok
                  }
                : undefined
            }
            onSpara={async (namn, rader) => {
              const id = await sparaRecept(vy.typ === 'andra' ? vy.recept.id : null, namn, rader)
              if (!id) return false
              setVy(null)
              await laddaOm()
              return true
            }}
          />
        </Panel>
      )}
    </div>
  )
}
