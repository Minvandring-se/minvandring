import { Plus } from 'lucide-react'
import { useId } from 'react'
import { Button } from '@/components/ui/button'
import { maltidsord, platsText, type Matstatus, type Plats } from '@/lib/mat'

/**
 * Den första måltiden som saknas, med sidans enda fyllda knapp. När allt är planerat står det att planen är klar.
 * Läsare ser vad som är nästa men kan inte lägga till.
 */
export function NastaAttPlanera({
  status,
  datum,
  kanAndra,
  onValj,
}: {
  status: Matstatus
  /** Datumet för den första måltiden som saknas, till exempel "fredag 4 december". */
  datum: string | null
  kanAndra: boolean
  onValj: (plats: Plats) => void
}) {
  const id = useId()
  const forsta = status.forsta
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-yta border border-border bg-card p-5 sm:p-7">
      {forsta ? (
        <>
          <p className="text-sm font-semibold text-accent-strong">Nästa att planera</p>
          <h2 id={id} className="text-2xl lg:text-[1.875rem]">
            {platsText(forsta)}
          </h2>
          <p className="text-muted-foreground first-letter:uppercase">
            {forsta.dag.reserv ? 'Om turen drar ut. ' : datum ? `${datum}. ` : ''}
            {status.saknas === 1 ? 'Det är den sista som saknas.' : `${status.saknas} måltider saknas i turen.`}
          </p>
          {kanAndra ? (
            <Button size="lg" className="mt-1 w-full sm:w-auto sm:self-start" onClick={() => onValj(forsta)}>
              <Plus className="size-5 text-hjortron-ikon" aria-hidden />
              Välj {maltidsord(forsta.maltid)}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Ägare och redigerare lägger till rätter.</p>
          )}
        </>
      ) : (
        <>
          <h2 id={id} className="text-2xl lg:text-[1.875rem]">
            Matplanen är klar
          </h2>
          <p className="text-muted-foreground">Alla frukostar, luncher och middagar har minst en rätt. Mellanmål är frivilliga.</p>
        </>
      )}
    </section>
  )
}
