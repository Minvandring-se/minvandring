import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Gruppbehov } from '@/components/packning/Gruppbehov'
import { LaggTillUtrustning } from '@/components/packning/LaggTillUtrustning'
import { Packrad } from '@/components/packning/Packrad'
import { Packsummering } from '@/components/packning/Packsummering'
import { ValjEgenModell } from '@/components/packning/ValjEgenModell'
import { useTur } from '@/components/tur/turKontext'
import { FlikAntal } from '@/components/ui/bricka'
import { Button } from '@/components/ui/button'
import { Sektion } from '@/components/ui/sektion'
import { useMatplan } from '@/hooks/useMatplan'
import {
  dubbletterBehovs,
  laggTillPackrader,
  satPackad,
  sparaEgenModell,
  taBortPackrad,
  taMedGemensam,
  useMittForrad,
  usePacklista,
  type Packlista,
} from '@/hooks/usePacklista'
import { matdagar } from '@/lib/mat'
import { matviktPerDeltagare } from '@/lib/handlingslista'
import {
  dubbletter,
  egenModell,
  filtrera,
  forslagSomSaknas,
  medGas,
  packat,
  packradFranForslag,
  packradFranSak,
  packradFranVarden,
  perKategori,
  statusKarta,
  utanBarare,
  viktrader,
  type Packfilter,
} from '@/lib/packlista'
import { kanAndra as rollKanAndra } from '@/lib/roller'
import type { PackradRad } from '@/lib/typer'
import { cn } from '@/lib/utils'
import { startvikter } from '@/lib/vikt'

const FILTER: readonly { varde: Packfilter; text: string }[] = [
  { varde: 'min', text: 'Min packning' },
  { varde: 'alla', text: 'Alla' },
  { varde: 'gemensamt', text: 'Gemensamt' },
]

const FELTEXT = 'Det gick inte att spara. Kontrollera uppkopplingen och försök igen.'
const TAMED_FEL = 'Det gick inte att ta med saken. Kanske har någon annan redan tagit den. Kontrollera uppkopplingen och försök igen.'

/** Turens packlista: startvikt per person, det gruppen behöver och raderna per kategori med bockar. */
export function TurPackning() {
  const { tur } = useTur()
  const { lage, laddaOm } = usePacklista(tur.id)

  if (lage.lage === 'laddar')
    return (
      <Laddar text="Hämtar packlistan" className="space-y-4">
        <Skelett className="h-32 rounded-lg" />
        <Skelett className="h-72 rounded-lg" />
      </Laddar>
    )
  if (lage.lage === 'fel') return <Laddfel vad="packlistan" onForsokIgen={laddaOm} />
  return <Packvy lista={lage.lista} laddaOm={laddaOm} />
}

function Packvy({ lista, laddaOm }: { lista: Packlista; laddaOm: () => Promise<void> }) {
  const { tur, deltagare, minRoll, mittUserId } = useTur()
  const kanAndra = rollKanAndra(minRoll)
  const mittId = deltagare.find((d) => d.user_id === mittUserId)?.id ?? null
  const mat = useMatplan(tur.id)
  const forrad = useMittForrad()
  const [filter, setFilter] = useState<Packfilter>(mittId ? 'min' : 'alla')
  const [panel, setPanel] = useState<{ typ: 'lagg-till' } | { typ: 'egen'; rad: PackradRad } | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  const { rader, status } = lista
  const statusMap = useMemo(() => statusKarta(status), [status])
  const namn = useMemo(() => new Map(deltagare.map((d) => [d.id, d.namn])), [deltagare])

  const personvikter = useMemo(() => {
    const dagar = matdagar(tur.dagar, tur.reservdagar)
    const matvikt = mat.lage.lage === 'klar' ? matviktPerDeltagare(mat.lage.plan, mat.lage.plan.matdeltagare, dagar) : new Map<string, number>()
    const vikter = startvikter(
      viktrader(rader, status),
      deltagare.map((d) => ({ id: d.id, typ: d.typ, matandel: null })),
      matvikt,
    )
    // Den egna raden först, sedan gruppen i deltagarlistans ordning.
    return [...deltagare]
      .sort((a, b) => Number(b.id === mittId) - Number(a.id === mittId))
      .filter((d) => d.typ === 'person' || (vikter.get(d.id)?.start ?? 0) > 0)
      .map((d) => ({ id: d.id, namn: d.id === mittId ? `${d.namn} (du)` : d.namn, vikt: vikter.get(d.id)!, packat: packat(rader, statusMap, d) }))
  }, [rader, status, statusMap, deltagare, mat.lage, tur.dagar, tur.reservdagar, mittId])

  async function gor(atgard: () => Promise<boolean>, feltext = FELTEXT): Promise<boolean> {
    setFel(null)
    setSparar(true)
    const ok = await atgard()
    setSparar(false)
    if (ok) await laddaOm()
    else setFel(feltext)
    return ok
  }

  const synliga = filtrera(rader, filter, mittId)
  const antal = (f: Packfilter) => filtrera(rader, f, mittId).length

  return (
    <div className="space-y-5">
      {!kanAndra && (
        <p className="text-muted-foreground">Du är läsare. Du kan bocka av det du packar, välja din egen modell och ta med gemensamma saker. Ägare och redigerare ändrar listan.</p>
      )}

      {rader.length > 0 && <Packsummering personer={personvikter} mat={mat.lage.lage} />}

      <Gruppbehov
        dubbletter={dubbletter(rader)}
        utanBarare={utanBarare(rader)}
        forslag={medGas(forslagSomSaknas(rader), deltagare.filter((d) => d.typ === 'person').length, matdagar(tur.dagar, tur.reservdagar).length)}
        namn={namn}
        kanAndra={kanAndra}
        kanTaMed={mittId !== null}
        sparar={sparar}
        onTaMed={(r) => gor(() => taMedGemensam(r.id, true), TAMED_FEL)}
        onBehovs={(d) => gor(() => dubbletterBehovs(d.rader.map((r) => r.id)))}
        onLaggTillForslag={(valda) => gor(() => laggTillPackrader(valda.map((f) => packradFranForslag(f, tur.id))))}
      />


      <Sektion
        rubrik="Packlistan"
        atgard={
          kanAndra && mittId ? (
            <Button onClick={() => setPanel({ typ: 'lagg-till' })}>
              <Plus className="size-4 text-hjortron-ikon" aria-hidden />
              Lägg till utrustning
            </Button>
          ) : undefined
        }
      >
        {rader.length > 0 && (
          <div role="tablist" aria-label="Visa" className="flex flex-wrap gap-2">
            {FILTER.filter((f) => f.varde !== 'min' || mittId).map((f) => (
              <button
                key={f.varde}
                type="button"
                role="tab"
                aria-selected={filter === f.varde}
                onClick={() => setFilter(f.varde)}
                className={cn(
                  'inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  filter === f.varde ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted',
                )}
              >
                {f.text}
                <FlikAntal antal={antal(f.varde)} />
              </button>
            ))}
          </div>
        )}

        {rader.length === 0 ? (
          <TomtLage
            kompakt
            text={kanAndra && mittId ? 'Packlistan är tom. Lägg till utrustning ur ditt förråd, eller välj det gruppen behöver ovanför.' : 'Packlistan är tom än så länge.'}
          />
        ) : synliga.length === 0 ? (
          <TomtLage kompakt text={filter === 'gemensamt' ? 'Inget gemensamt än.' : 'Du har inget i packlistan än.'} />
        ) : (
          perKategori(synliga).map((k) => (
            <div key={k.nyckel} className="space-y-1">
              <h3 className="text-base font-semibold">{k.etikett}</h3>
              <ul className="divide-y divide-border">
                {k.rader.map((r) => (
                  <Packrad
                    key={r.id}
                    rad={r}
                    mittId={mittId}
                    status={statusMap}
                    deltagare={deltagare}
                    namn={namn}
                    kanAndra={kanAndra}
                    sparar={sparar}
                    onBock={(packad) => mittId && gor(() => satPackad(r, mittId, packad))}
                    onValjEgen={() => setPanel({ typ: 'egen', rad: r })}
                    onTaMed={(ta) => gor(() => taMedGemensam(r.id, ta), ta ? TAMED_FEL : FELTEXT)}
                    onTaBort={() => gor(() => taBortPackrad(r.id), 'Det gick inte att ta bort. Kontrollera uppkopplingen och försök igen.')}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </Sektion>

      {/* Felet syns längst ner på skärmen, nära det man just tryckte på, också långt ner i listan. */}
      {fel && (
        <div role="alert" className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-soft">
          <p className="min-w-0 flex-1 text-sm text-destructive">{fel}</p>
          <Button variant="ghost" size="ikon" aria-label="Stäng" onClick={() => setFel(null)}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      {panel?.typ === 'lagg-till' && mittId && (
        <LaggTillUtrustning
          saker={forrad.saker}
          mittId={mittId}
          onForsokIgen={forrad.forsokIgen}
          onStang={() => setPanel(null)}
          onLaggTill={async (saker, bars) => {
            const ok = await laggTillPackrader(saker.map((s) => packradFranSak(s, tur.id, bars)))
            if (ok) {
              setPanel(null)
              await laddaOm()
            }
            return ok
          }}
          onNySak={async (varden, bars) => {
            const ok = await laggTillPackrader([packradFranVarden(varden, tur.id, bars)])
            if (ok) {
              setPanel(null)
              await laddaOm()
            }
            return ok
          }}
        />
      )}

      {panel?.typ === 'egen' && mittId && (
        <ValjEgenModell
          rad={panel.rad}
          saker={forrad.saker}
          onForsokIgen={forrad.forsokIgen}
          onStang={() => setPanel(null)}
          onValj={async (sak) => {
            const ok = await sparaEgenModell(egenModell(sak, panel.rad, mittId))
            if (ok) {
              setPanel(null)
              await laddaOm()
            }
            return ok
          }}
        />
      )}
    </div>
  )
}
