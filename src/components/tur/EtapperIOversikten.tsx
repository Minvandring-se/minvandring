import { Link } from 'react-router'
import { Laddfel } from '@/components/app/Laddfel'
import { knappStil } from '@/components/ui/knappStil'
import { Sektion } from '@/components/ui/sektion'
import { useEtapper } from '@/hooks/useEtapper'
import { dagensDatum } from '@/lib/datum'
import { arPlanerad, etappdagar, etapprubrik, etappsumma, kanBokas, kmFran, kmText, nattText } from '@/lib/etapper'
import { turdelAdress } from '@/lib/turdelar'
import type { Tur } from '@/lib/typer'
import { cn } from '@/lib/utils'

const LANK = 'inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Dagsetapperna i översikten: de planerade dagarna i korthet och länken till fliken Etapper. */
export function EtapperIOversikten({ tur, kanAndra, className }: { tur: Tur; kanAndra: boolean; className?: string }) {
  const { lage, laddaOm } = useEtapper(tur.id)
  const adress = turdelAdress(tur.id, 'etapper')
  const dagar = lage.lage === 'klar' ? etappdagar(tur.dagar, lage.etapper).filter((d) => !d.efterTuren) : []
  const planerade = dagar.filter((d) => arPlanerad(d.etapp))
  const summa = etappsumma(dagar)

  return (
    <Sektion
      rubrik="Etapper"
      atgard={
        planerade.length > 0 && (
          <Link to={adress} className={LANK}>
            Alla etapper
          </Link>
        )
      }
      className={className}
    >
      {lage.lage === 'fel' ? (
        <Laddfel vad="etapperna" onForsokIgen={laddaOm} />
      ) : lage.lage === 'laddar' ? null : planerade.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {tur.dagar ? 'Inga etapper än. Skriv var ni går varje dag, hur långt och var ni sover.' : 'Ange antalet vandringsdagar först, så kan ni planera etapperna dag för dag.'}
          </p>
          {kanAndra && tur.dagar && (
            <Link to={adress} className={knappStil({ variant: 'outline' })}>
              Planera etapperna
            </Link>
          )}
        </div>
      ) : (
        <>
          {summa.km > 0 && <p className="text-sm text-muted-foreground">{kmText(summa.km)} på {summa.planerade} av {dagar.length} dagar.</p>}
          <ol>
            {dagar.map((d, i) => {
              const km = kmFran(d.etapp?.km)
              const natt = nattText(d.etapp)
              const datum = dagensDatum(tur.avresa, d.dag)
              return (
                <li key={d.dag} className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-3 py-2.5">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                        i === 0 ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary',
                      )}
                    >
                      {d.dag}
                    </span>
                    {i < dagar.length - 1 && <span className="mt-1.5 min-h-7 w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{etapprubrik(d.etapp) ?? (arPlanerad(d.etapp) ? 'Utan plats' : 'Inte planerad')}</p>
                    <p className="mt-0.5 text-sm break-words text-muted-foreground">
                      {[datum, natt].filter(Boolean).join('. ')}
                      {d.etapp && kanBokas(d.etapp.boende) && (d.etapp.bokad ? '. Bokad' : <span className="font-semibold text-accent-strong">. Inte bokad</span>)}
                    </p>
                  </div>
                  {km !== null ? <span className="shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums">{kmText(km)}</span> : <span />}
                </li>
              )
            })}
          </ol>
        </>
      )}
    </Sektion>
  )
}
