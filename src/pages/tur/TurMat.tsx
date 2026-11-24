import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { TomtLage } from '@/components/app/TomtLage'
import { Inkopslista } from '@/components/mat/Inkopslista'
import { Kostbehov } from '@/components/mat/Kostbehov'
import { Matdag } from '@/components/mat/Matdag'
import { Matsummering } from '@/components/mat/Matsummering'
import { ValjRatt } from '@/components/mat/ValjRatt'
import { useTur } from '@/components/tur/turKontext'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { sparaRecept, useRecept } from '@/hooks/useRecept'
import { useSkafferi } from '@/hooks/useSkafferi'
import { andraInkopsrad, laggIMaltid, laggTillPase, sparaEgenRatt, sparaKostbehov, taBortEgenRatt, taBortKostbehov, taBortUrMaltid, useMatplan, type Matplan } from '@/hooks/useMatplan'
import type { Behov } from '@/lib/kost'
import { dagssummor, inkopslista, MALTIDER, matdagar, matsummering, matviktTotalt, rattPerPortion, type Matdag as Dag } from '@/lib/mat'
import { kanAndra as rollKanAndra } from '@/lib/roller'
import { receptbesked, receptMedNamn, receptTillRader, valForRecept } from '@/lib/recept'
import { hemma } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import { turdelAdress } from '@/lib/turdelar'
import type { DeltagareRad, Maltid, Maltidsrad } from '@/lib/typer'
import { matvikter } from '@/lib/vikt'

/** Turens flik Mat: summeringen och en sektion per dag med måltiderna. Ägare och redigerare ändrar, läsare ser. */
export function TurMat() {
  const { tur } = useTur()
  const { lage, laddaOm } = useMatplan(tur.id)
  const dagar = matdagar(tur.dagar, tur.reservdagar)

  if (dagar.length === 0)
    return (
      <TomtLage
        rubrik="Hur många dagar är turen?"
        text="Matplanen delas upp dag för dag. Ange antalet vandringsdagar i översikten först."
        knapp={
          <Link to={turdelAdress(tur.id, 'oversikt')} className={knappStil({ variant: 'outline' })}>
            Till översikten
          </Link>
        }
      />
    )

  if (lage.lage === 'laddar')
    return (
      <Laddar text="Hämtar matplanen" className="space-y-4">
        <Skelett className="h-40 rounded-lg" />
        <Skelett className="h-72 rounded-lg" />
      </Laddar>
    )

  if (lage.lage === 'fel')
    return (
      <div role="alert" className="space-y-3">
        <p className="text-destructive">Det gick inte att hämta matplanen. Kontrollera uppkopplingen och försök igen.</p>
        <Button variant="outline" onClick={laddaOm}>
          <RefreshCw className="size-4" aria-hidden />
          Försök igen
        </Button>
      </div>
    )

  return <Matplanvy plan={lage.plan} dagar={dagar} laddaOm={laddaOm} />
}

/** Kostbehoven med deltagarnas namn, för varningarna. Bara personer som finns kvar i turen. */
function behovMedNamn(plan: Matplan, deltagare: readonly DeltagareRad[]): Behov[] {
  return plan.kostbehov.flatMap((k) => {
    const d = deltagare.find((x) => x.id === k.deltagare_id)
    return d ? [{ ...k, namn: d.namn }] : []
  })
}

function Matplanvy({ plan, dagar, laddaOm }: { plan: Matplan; dagar: Dag[]; laddaOm: () => Promise<void> }) {
  const { tur, deltagare, minRoll, mittUserId } = useTur()
  const kanAndra = rollKanAndra(minRoll)
  const [valjer, setValjer] = useState<{ dag: Dag; maltid: Maltid } | null>(null)
  const [fel, setFel] = useState<string | null>(null)
  // En kort text om vad som hände när ett recept lades i turen och namnet redan fanns.
  const [besked, setBesked] = useState<string | null>(null)
  const { recept, laddaOm: laddaOmRecept } = useRecept()
  // Ens eget skafferi. Om det inte går att hämta visas matplanen ändå, utan uppgifterna om vad man har hemma.
  const { skafferi } = useSkafferi()
  const egnaRader = useMemo(() => (skafferi && skafferi !== 'fel' ? skafferi.rader : []), [skafferi])
  const egetSkafferi = useMemo(
    () => ({ favoriter: skafferi && skafferi !== 'fel' ? skafferi.favoriter : new Set<string>(), hemma: hemma(egnaRader, lokaltDatum()) }),
    [skafferi, egnaRader],
  )
  const mittDeltagareId = deltagare.find((d) => d.user_id === mittUserId)?.id ?? null

  const personer = plan.matdeltagare.filter((d) => d.typ === 'person').length
  const behov = useMemo(() => behovMedNamn(plan, deltagare), [plan, deltagare])

  const perPortion = useMemo(() => new Map(plan.ratter.map((r) => [r.id, rattPerPortion(r, plan)])), [plan])
  const ratter = useMemo(() => ({ ratter: new Map(plan.ratter.map((r) => [r.id, r])), perPortion, pasar: plan.pasar }), [plan, perPortion])
  const summor = dagssummor(plan, dagar)
  const inkop = inkopslista(plan, dagar, personer)
  const totaltG = matviktTotalt(inkop)
  const vikter = matvikter(totaltG, plan.matdeltagare, dagar.length)
  const perPerson = deltagare.filter((d) => (vikter.get(d.id) ?? 0) > 0).map((d) => ({ id: d.id, namn: d.namn, g: vikter.get(d.id)! }))

  /** Nästa plats i måltiden, så att en ny rätt hamnar sist. */
  function sortering(dag: number, maltid: Maltid): number {
    const rader = plan.maltider.filter((m) => m.dag === dag && m.maltid === maltid)
    return rader.reduce((s, m) => Math.max(s, m.sortering + 1), 0)
  }

  async function efter(ok: boolean, felText: string): Promise<boolean> {
    if (ok) {
      setFel(null)
      await laddaOm()
    } else setFel(felText)
    return ok
  }

  async function taBort(rad: Maltidsrad) {
    await efter(await taBortUrMaltid(rad.id), 'Det gick inte att ta bort rätten ur måltiden. Kontrollera uppkopplingen och försök igen.')
  }

  const maltidsnamn = (m: Maltid) => MALTIDER.find((x) => x.nyckel === m)!.etikett

  return (
    <div className="space-y-5">
      {!kanAndra && <p className="text-muted-foreground">Du är läsare. Du kan se matplanen och ange dina egna kostbehov. Ägare och redigerare ändrar resten.</p>}

      <Matsummering summering={matsummering(summor)} totaltG={totaltG} perPerson={perPerson} />

      <Kostbehov
        deltagare={deltagare}
        kostbehov={plan.kostbehov}
        mittUserId={mittUserId}
        // Panelen visar själv felet om det inte gick att spara.
        onSpara={async (b) => {
          const ok = await sparaKostbehov(b)
          if (ok) await laddaOm()
          return ok
        }}
        onTaBort={async (id) => {
          const ok = await taBortKostbehov(id)
          if (ok) await laddaOm()
          return ok
        }}
      />

      {fel && (
        <p role="alert" className="text-destructive">
          {fel}
        </p>
      )}
      <p role="status" className={besked ? 'rounded-md bg-primary-soft px-4 py-3 text-sm' : 'sr-only'}>
        {besked}
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {summor.map((summa) => (
          <Matdag
            key={summa.dag.dag}
            summa={summa}
            maltider={plan.maltider.filter((m) => m.dag === summa.dag.dag)}
            ratter={ratter}
            behov={behov}
            kanAndra={kanAndra}
            onLaggTill={(maltid) => {
              setBesked(null)
              setValjer({ dag: summa.dag, maltid })
            }}
            onTaBort={taBort}
          />
        ))}
      </div>

      <Inkopslista
        rader={inkop}
        deltagare={deltagare}
        kanAndra={kanAndra}
        mittDeltagareId={mittDeltagareId}
        skafferi={egnaRader}
        onAndra={async (rad, andring) => {
          const ok = await andraInkopsrad(rad.typ, rad.id, andring)
          if (ok) await laddaOm()
          return ok
        }}
      />

      {valjer && (
        <ValjRatt
          rubrik={`${maltidsnamn(valjer.maltid)}, ${valjer.dag.namn.toLowerCase()}`}
          maltid={valjer.maltid}
          ratter={plan.ratter}
          perPortion={perPortion}
          ingredienser={plan.ingredienser}
          varor={plan.varor}
          behov={behov}
          skafferi={egetSkafferi}
          recept={recept}
          onValjRecept={async (r) => {
            const rader = receptTillRader(r)
            const val = valForRecept(r.namn, rader, plan.ratter, plan.ingredienser, plan.varor)
            const plats = sortering(valjer.dag.dag, valjer.maltid)
            let ok: boolean
            if (val.typ === 'befintlig') ok = await laggIMaltid(tur.id, val.rattId, valjer.dag.dag, valjer.maltid, plats)
            // Kopian och måltiden sparas tillsammans, så att ingen kopia blir kvar i turen om måltiden inte går att spara.
            else ok = !!(await sparaEgenRatt(tur.id, null, val.namn, rader, { dag: valjer.dag.dag, maltid: valjer.maltid, sortering: plats }))
            if (ok) {
              setBesked(receptbesked(val, r.namn))
              setValjer(null)
              await laddaOm()
            }
            return ok
          }}
          onSparaSomRecept={async (namn, rader) => {
            const finns = Array.isArray(recept) ? receptMedNamn(recept, namn) : undefined
            const id = await sparaRecept(finns?.id ?? null, finns?.namn ?? namn, rader)
            if (id) await laddaOmRecept()
            return !!id
          }}
          onStang={() => setValjer(null)}
          onValjPase={async (pase) => {
            const befintlig = plan.ratter.find((r) => r.matprodukt_id === pase.id)
            const ok = await laggTillPase(tur.id, pase, befintlig, valjer.dag.dag, valjer.maltid, sortering(valjer.dag.dag, valjer.maltid))
            if (ok) {
              setValjer(null)
              await laddaOm()
            }
            return ok
          }}
          onValjRatt={async (rattId) => {
            const ok = await laggIMaltid(tur.id, rattId, valjer.dag.dag, valjer.maltid, sortering(valjer.dag.dag, valjer.maltid))
            if (ok) {
              setValjer(null)
              await laddaOm()
            }
            return ok
          }}
          onTaBortRatt={async (rattId) => {
            const ok = await taBortEgenRatt(rattId)
            if (ok) await laddaOm()
            return ok
          }}
          onSparaRatt={async (rattId, namn, rader) => {
            // En ny rätt läggs i måltiden i samma transaktion. En ändrad rätt ligger redan där den ligger.
            const maltid = rattId ? undefined : { dag: valjer.dag.dag, maltid: valjer.maltid, sortering: sortering(valjer.dag.dag, valjer.maltid) }
            const id = await sparaEgenRatt(tur.id, rattId, namn, rader, maltid)
            if (!id) return false
            if (!rattId) setValjer(null)
            await laddaOm()
            return true
          }}
        />
      )}
    </div>
  )
}
