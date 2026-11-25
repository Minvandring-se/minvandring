import { ArrowLeft, Printer } from 'lucide-react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { PasNamn } from '@/components/mat/PasNamn'
import { useTur } from '@/components/tur/turKontext'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { useMatplan } from '@/hooks/useMatplan'
import { AVDELNINGAR } from '@/lib/handla'
import { handlagrupper, handlingslista } from '@/lib/handlingslista'
import { matdagar } from '@/lib/mat'
import { turdelAdress } from '@/lib/turdelar'
import { cn } from '@/lib/utils'

/**
 * Inköpslistan för utskrift eller PDF: "Inköpslista: turens namn", grupperad per person och butiksavdelning, med en
 * ruta att bocka i på papper. Det som redan är avbockat står med en bock. Appens ram och knapparna skrivs inte ut.
 */
export function TurInkopslista() {
  const { tur, deltagare } = useTur()
  const { lage, laddaOm } = useMatplan(tur.id)
  const tillbaka = turdelAdress(tur.id, 'mat')

  return (
    <div className="mx-auto max-w-2xl space-y-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to={tillbaka} className={knappStil({ variant: 'ghost' })}>
          <ArrowLeft className="size-4" aria-hidden />
          Till maten
        </Link>
        {lage.lage === 'klar' && (
          <Button onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Skriv ut eller spara som PDF
          </Button>
        )}
      </div>

      <h1 className="text-3xl break-words print:text-2xl">Inköpslista: {tur.namn}</h1>

      {lage.lage === 'laddar' ? (
        <Laddar text="Hämtar inköpslistan" className="space-y-3">
          <Skelett className="h-6 w-40" />
          <Skelett className="h-40 rounded-ruta" />
        </Laddar>
      ) : lage.lage === 'fel' ? (
        <Laddfel vad="inköpslistan" onForsokIgen={laddaOm} />
      ) : (
        (() => {
          const personer = deltagare.filter((d) => d.typ === 'person')
          const rader = handlingslista(
            lage.plan,
            matdagar(tur.dagar, tur.reservdagar),
            personer.map((p) => p.id),
          )
          const grupper = handlagrupper(
            rader,
            personer.map((p) => p.id),
          )
          if (grupper.length === 0) return <p className="text-muted-foreground">Listan fylls på när ni lägger rätter i matplanen.</p>
          return grupper.map((g) => (
            <section key={g.kopare ?? 'ingen'} className="space-y-3 break-inside-avoid-page">
              <h2 className="border-b border-border pb-1 text-xl">
                {g.kopare === null ? 'Ingen köper än' : (personer.find((p) => p.id === g.kopare)?.namn ?? 'Inte längre med i turen')}
              </h2>
              {g.avdelningar.map((a) => (
                <div key={a.avdelning} className="space-y-1 break-inside-avoid">
                  <h3 className="font-sans text-sm font-semibold text-muted-foreground">{AVDELNINGAR.find((x) => x.nyckel === a.avdelning)!.etikett}</h3>
                  <ul>
                    {a.rader.map((r) => (
                      <li key={r.nyckel} className="flex items-baseline gap-3 py-1">
                        <span
                          aria-hidden
                          className={cn('flex size-4 shrink-0 translate-y-0.5 items-center justify-center rounded-sm border border-foreground text-xs leading-none', r.klart && 'font-bold')}
                        >
                          {r.klart ? '✓' : ''}
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          <span className="sr-only">{r.klart ? 'Köpt: ' : ''}</span>
                          {r.pase ? <PasNamn marke={r.pase.marke} namn={r.pase.namn} /> : r.namn}
                          {r.hemifran && <span className="text-muted-foreground"> (hemifrån)</span>}
                        </span>
                        {r.mangd && <span className="shrink-0 tabular-nums">{r.mangd}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))
        })()
      )}
    </div>
  )
}
