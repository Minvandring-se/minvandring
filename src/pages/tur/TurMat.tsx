import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Inkopslista } from '@/components/mat/Inkopslista'
import { Kostbehov } from '@/components/mat/Kostbehov'
import { Matdag } from '@/components/mat/Matdag'
import { Matsummering } from '@/components/mat/Matsummering'
import { NastaAttPlanera } from '@/components/mat/NastaAttPlanera'
import { TurMatHuvud } from '@/components/mat/TurMatHuvud'
import { ValjRatt } from '@/components/mat/ValjRatt'
import { VemTarMedVad } from '@/components/mat/VemTarMedVad'
import { TurFlikar } from '@/components/tur/TurHuvud'
import { useTur } from '@/components/tur/turKontext'
import { knappStil } from '@/components/ui/knappStil'
import { sparaRecept, useRecept } from '@/hooks/useRecept'
import { useSkafferi } from '@/hooks/useSkafferi'
import { andraInkopsrad, laggIMaltid, laggTillPase, sparaEgenRatt, sparaKostbehov, taBortEgenRatt, taBortKostbehov, taBortUrMaltid, useMatplan, type Matplan } from '@/hooks/useMatplan'
import type { Behov } from '@/lib/kost'
import { dagssummor, inkopslista, MALTIDER, maltidsrutaId, matdagar, matstatus, matsummering, matviktTotalt, rattPerPortion, ratterSomSaknar, vemTarMedVad, type Ansvarsratt, type Matdag as Dag, type Matstatus } from '@/lib/mat'
import { dagensDatum } from '@/lib/datum'
import { kanAndra as rollKanAndra } from '@/lib/roller'
import { receptbesked, receptMedNamn, receptTillRader, valForRecept } from '@/lib/recept'
import { hemma } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import { turdelAdress } from '@/lib/turdelar'
import type { DeltagareRad, Maltid, Maltidsrad } from '@/lib/typer'
import { cn } from '@/lib/utils'
import { matvikter } from '@/lib/vikt'

/**
 * Turens flik Mat: ett kompakt mörkgrönt huvud med hur många måltider som är planerade, turens flikar, Nästa att
 * planera och Vem tar med vad, kostbehoven, en ruta per dag och måltid, och sist summeringen och inköpslistan.
 * Ägare och redigerare ändrar, läsare ser.
 */
export function TurMat() {
  const { tur } = useTur()
  const { lage, laddaOm } = useMatplan(tur.id)
  const dagar = matdagar(tur.dagar, tur.reservdagar)
  const status = lage.lage === 'klar' ? matstatus(dagar, lage.plan.maltider.filter((m) => lage.plan.ratter.some((r) => r.id === m.ratt_id))) : null

  return (
    <div className="space-y-5 lg:space-y-6">
      <TurMatHuvud tur={tur} status={dagar.length === 0 ? { totalt: 0, planerade: 0, saknas: 0, forsta: null } : status} />
      <TurFlikar turId={tur.id} />
      {dagar.length === 0 ? (
        <TomtLage
          rubrik="Hur många dagar är turen?"
          text="Matplanen delas upp dag för dag. Ange antalet vandringsdagar i översikten först."
          knapp={
            <Link to={turdelAdress(tur.id, 'oversikt')} className={knappStil({ variant: 'outline' })}>
              Till översikten
            </Link>
          }
        />
      ) : lage.lage === 'laddar' ? (
        <Laddar text="Hämtar matplanen" className="space-y-4">
          <Skelett className="h-48 rounded-yta" />
          <Skelett className="h-72 rounded-ruta" />
        </Laddar>
      ) : lage.lage === 'fel' ? (
        <Laddfel vad="matplanen" onForsokIgen={laddaOm} />
      ) : (
        <Matplanvy plan={lage.plan} dagar={dagar} status={status!} laddaOm={laddaOm} />
      )}
    </div>
  )
}

/** Kostbehoven med deltagarnas namn, för varningarna. Bara personer som finns kvar i turen. */
function behovMedNamn(plan: Matplan, deltagare: readonly DeltagareRad[]): Behov[] {
  return plan.kostbehov.flatMap((k) => {
    const d = deltagare.find((x) => x.id === k.deltagare_id)
    return d ? [{ ...k, namn: d.namn }] : []
  })
}

/** Dag och måltid från adressen (?dag=2&maltid=lunch), om de finns i turen. */
function platsIAdressen(sok: URLSearchParams, dagar: readonly Dag[]): { dag: number; maltid: Maltid } | null {
  const dag = Number(sok.get('dag'))
  const maltid = sok.get('maltid')
  if (!dagar.some((d) => d.dag === dag) || !MALTIDER.some((m) => m.nyckel === maltid)) return null
  return { dag, maltid: maltid as Maltid }
}

function Matplanvy({ plan, dagar, status, laddaOm }: { plan: Matplan; dagar: Dag[]; status: Matstatus; laddaOm: () => Promise<void> }) {
  const { tur, deltagare, minRoll, mittUserId } = useTur()
  const kanAndra = rollKanAndra(minRoll)
  const [sok] = useSearchParams()
  // Måltiden som ska ha fokus: den i adressen när sidan öppnas, och sedan den man nyss ändrade, så att man stannar
  // på samma dag. n gör att samma måltid kan få fokus igen.
  const [fokus, setFokus] = useState<{ dag: number; maltid: Maltid; n: number } | null>(() => {
    const plats = platsIAdressen(sok, dagar)
    return plats && { ...plats, n: 0 }
  })
  useEffect(() => {
    if (!fokus) return
    const ruta = document.getElementById(maltidsrutaId(fokus.dag, fokus.maltid))
    ruta?.focus({ preventScroll: true })
    ruta?.scrollIntoView({ block: fokus.n === 0 ? 'center' : 'nearest' })
  }, [fokus])
  const fokusera = (dag: number, maltid: Maltid) => setFokus((f) => ({ dag, maltid, n: (f?.n ?? 0) + 1 }))
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
  const ratter = useMemo(() => {
    const varunamn = new Map(plan.varor.map((v) => [v.id, v.namn]))
    const ingredienser = new Map<string, string[]>()
    for (const i of plan.ingredienser) {
      const namn = varunamn.get(i.vara_id)
      if (namn) ingredienser.set(i.ratt_id, [...(ingredienser.get(i.ratt_id) ?? []), namn])
    }
    return { ratter: new Map(plan.ratter.map((r) => [r.id, r])), perPortion, pasar: plan.pasar, ingredienser }
  }, [plan, perPortion])
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
    const ok = await efter(await taBortUrMaltid(rad.id), 'Det gick inte att ta bort rätten ur måltiden. Kontrollera uppkopplingen och försök igen.')
    if (ok) fokusera(rad.dag, rad.maltid)
  }

  /** Jag tar den: påsen, eller den egna rättens varor som saknar ansvarig. Samma fält som inköpslistan. */
  async function taAnsvar(r: Ansvarsratt): Promise<boolean> {
    if (!mittDeltagareId) return false
    const svar =
      r.typ === 'pase'
        ? [await andraInkopsrad('pase', r.rattId, { ansvarig: mittDeltagareId })]
        : await Promise.all(r.varorUtanAnsvarig.map((v) => andraInkopsrad('vara', v, { ansvarig: mittDeltagareId })))
    // Gick bara en del igenom syns det som gick, och resten står kvar under Saknar ansvarig.
    await laddaOm()
    return svar.every(Boolean)
  }

  /** Efter att en rätt har lagts till: stäng väljaren, hämta om och stanna på samma måltid. */
  async function lagdTill(dag: number, maltid: Maltid) {
    setValjer(null)
    await laddaOm()
    fokusera(dag, maltid)
  }

  const maltidsnamn = (m: Maltid) => MALTIDER.find((x) => x.nyckel === m)!.etikett
  const vemTar = vemTarMedVad(plan, dagar)
  const forstaDatum = status.forsta && !status.forsta.dag.reserv ? dagensDatum(tur.avresa, status.forsta.dag.dag) : null

  return (
    <div className="space-y-6 lg:space-y-8">
      {!kanAndra && <p className="text-muted-foreground">Du är läsare. Du kan se matplanen och ange dina egna kostbehov. Ägare och redigerare ändrar resten.</p>}

      {/* När planen är klar är rutan till vänster bara en rad, så då ligger Vem tar med vad under i stället för bredvid. */}
      <div className={cn('grid grid-cols-1 items-start gap-6 lg:gap-8', status.forsta && 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')}>
        <NastaAttPlanera
          status={status}
          datum={forstaDatum}
          kanAndra={kanAndra}
          onValj={(plats) => {
            setBesked(null)
            setValjer({ dag: plats.dag, maltid: plats.maltid })
          }}
        />
        <VemTarMedVad rader={vemTar} deltagare={deltagare} mittDeltagareId={mittDeltagareId} kanAndra={kanAndra} onTa={taAnsvar} />
      </div>

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

      <div className="space-y-8">
        {summor.map((summa) => (
          <Matdag
            key={summa.dag.dag}
            summa={summa}
            datum={summa.dag.reserv ? null : dagensDatum(tur.avresa, summa.dag.dag)}
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

      <Matsummering summering={matsummering(summor)} saknade={ratterSomSaknar(plan, dagar)} totaltG={totaltG} perPerson={perPerson} />

      <div id="inkopslista" tabIndex={-1} className="scroll-mt-6 focus:outline-none">
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
      </div>

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
              await lagdTill(valjer.dag.dag, valjer.maltid)
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
            if (ok) await lagdTill(valjer.dag.dag, valjer.maltid)
            return ok
          }}
          onValjRatt={async (rattId) => {
            const ok = await laggIMaltid(tur.id, rattId, valjer.dag.dag, valjer.maltid, sortering(valjer.dag.dag, valjer.maltid))
            if (ok) await lagdTill(valjer.dag.dag, valjer.maltid)
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
            if (rattId) await laddaOm()
            else await lagdTill(valjer.dag.dag, valjer.maltid)
            return true
          }}
        />
      )}
    </div>
  )
}
