import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { Gasbehov } from '@/components/mat/Gasbehov'
import { Inkopslista } from '@/components/mat/Inkopslista'
import { Kostbehov } from '@/components/mat/Kostbehov'
import { Matdag } from '@/components/mat/Matdag'
import { Matsummering } from '@/components/mat/Matsummering'
import { NastaAttPlanera } from '@/components/mat/NastaAttPlanera'
import { RadPanel } from '@/components/mat/RadPanel'
import { TurMatHuvud } from '@/components/mat/TurMatHuvud'
import { ValjRatt } from '@/components/mat/ValjRatt'
import { VemTarMedVad } from '@/components/mat/VemTarMedVad'
import { TurFlikar } from '@/components/tur/TurHuvud'
import { useTur } from '@/components/tur/turKontext'
import { knappStil } from '@/components/ui/knappStil'
import { sparaRecept, useRecept } from '@/hooks/useRecept'
import { laggISkafferi, useAndraTurer, useSkafferi } from '@/hooks/useSkafferi'
import { bockaInkop, laggIMaltid, laggTillPase, sattAtare, sattAvdelning, sattBarare, slappRader, sparaEgenRatt, sparaKostbehov, taBortEgenRatt, taBortKostbehov, taBortUrMaltid, taRader, useMatplan, type Matplan } from '@/hooks/useMatplan'
import type { Behov, Kostinfo } from '@/lib/kost'
import { kostinfoForVara } from '@/lib/varukatalog'
import { dagssummor, dubblettText, MALTIDER, maltidsrutaId, matdagar, matstatus, matsummering, atareFor, fordela, platsText, portionerSomBars, rattPerPortion, rattPlatser, ratterSomSaknar, saknadeMaltider, saknasPerPerson, vemBarVad, type Barrad, type Matdag as Dag, type Matstatus } from '@/lib/mat'
import { dagensDatum } from '@/lib/datum'
import { handlingslista, matviktPerBarare } from '@/lib/handlingslista'
import { personfarger } from '@/lib/personfarg'
import { kanAndra as rollKanAndra } from '@/lib/roller'
import { receptbesked, receptMedNamn, receptTillRader, valForRecept } from '@/lib/recept'
import { bokade, garUtFore, hemma, jamforDatum, ledigaHemma, senastAnvanda, taPaseSjalv, turerFore } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import { turdelAdress } from '@/lib/turdelar'
import type { DeltagareRad, Maltid, Maltidsrad } from '@/lib/typer'
import { cn } from '@/lib/utils'
import { matvikter } from '@/lib/vikt'

/**
 * Turens flik Mat: ett kompakt mörkgrönt huvud med hur många måltider som är planerade, turens flikar, Nästa att
 * planera och Vem bär vad, kostbehoven, en ruta per dag och måltid, och sist summeringen och inköpslistan.
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
  const { skafferi, laddaOm: laddaOmSkafferi } = useSkafferi()
  const egnaRader = useMemo(() => (skafferi && skafferi !== 'fel' ? skafferi.rader : []), [skafferi])
  const mittDeltagareId = deltagare.find((d) => d.user_id === mittUserId)?.id ?? null
  // Påsarna i ens andra turer: det man har hemma och som går till en tur som börjar före den här är bokat.
  const andra = useAndraTurer(tur.id, mittUserId)
  const bokat = useMemo(() => bokade(andra.bokningar, turerFore(andra.turer, tur.id, lokaltDatum())), [andra, tur.id])
  const egetSkafferi = useMemo(() => {
    const denna = plan.ratter.flatMap((r) => (r.matprodukt_id ? [{ turId: tur.id, matproduktId: r.matprodukt_id }] : []))
    return {
      favoriter: skafferi && skafferi !== 'fel' ? skafferi.favoriter : new Set<string>(),
      hemma: ledigaHemma(hemma(egnaRader, lokaltDatum()), bokat),
      // Påsar hemma som går ut före turens första dag går att välja, men märks.
      garUt: new Set(egnaRader.filter((r) => garUtFore(r.bast_fore, jamforDatum(tur.avresa, lokaltDatum()))).map((r) => r.matprodukt_id)),
      bokade: bokat,
      senast: senastAnvanda([...denna, ...andra.pasar], andra.turer, tur.id),
    }
  }, [skafferi, egnaRader, bokat, plan.ratter, andra, tur.id, tur.avresa])

  const personer = plan.matdeltagare.filter((d) => d.typ === 'person').length
  // Personerna i turens ordning, med en färg var. Bara personer bär och äter rätterna.
  const folk = useMemo(() => {
    const lista = deltagare.filter((d) => d.typ === 'person').map((d) => ({ id: d.id, namn: d.namn }))
    return { personer: lista, farger: personfarger(lista.map((p) => p.id)), atare: plan.atare }
  }, [deltagare, plan.atare])
  const personIds = folk.personer.map((p) => p.id)
  const [andrar, setAndrar] = useState<readonly Maltidsrad[] | null>(null)
  const behov = useMemo(() => behovMedNamn(plan, deltagare), [plan, deltagare])

  const perPortion = useMemo(() => new Map(plan.ratter.map((r) => [r.id, rattPerPortion(r, plan)])), [plan])
  const ratter = useMemo(() => {
    const varor = new Map(plan.varor.map((v) => [v.id, v]))
    const ingredienser = new Map<string, string[]>()
    const kost = new Map<string, (Kostinfo | null)[]>()
    for (const i of plan.ingredienser) {
      const vara = varor.get(i.vara_id)
      if (!vara) continue
      ingredienser.set(i.ratt_id, [...(ingredienser.get(i.ratt_id) ?? []), vara.namn])
      // En vara ur varukatalogen har kända allergener. Andra ingredienser är okända.
      const katalog = vara.varukatalog_id ? plan.varukatalog.get(vara.varukatalog_id) : undefined
      kost.set(i.ratt_id, [...(kost.get(i.ratt_id) ?? []), katalog ? kostinfoForVara(katalog) : null])
    }
    return { ratter: new Map(plan.ratter.map((r) => [r.id, r])), perPortion, pasar: plan.pasar, ingredienser, kost }
  }, [plan, perPortion])
  const summor = dagssummor(plan, dagar, personIds)
  // Matvikten räknas som inköpslistan: var och en bär det hen köper, i hela påsar. Hundarna bär sin egen mat.
  const matvikt = matviktPerBarare(plan, dagar, personIds)
  const hundmat = matvikter(0, plan.matdeltagare, dagar.length)
  const perPerson = deltagare
    .map((d) => ({ id: d.id, namn: d.namn, g: (matvikt.perBarare.get(d.id) ?? 0) + (hundmat.get(d.id) ?? 0) }))
    .filter((p) => p.g > 0)

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

  /** Efter en ändring av vem som bär: hämta om även när bara en del gick igenom, så att det som gick syns. */
  async function ochLaddaOm(ok: boolean): Promise<boolean> {
    await laddaOm()
    return ok
  }

  /** Delar ut raderna som ingen bär till personerna, så att vikten blir så jämn som möjligt. */
  async function fordelaRader(): Promise<boolean> {
    const lediga = vemBar
      .filter((r) => r.barsAv === null)
      .flatMap((r) => r.maltidIds.map((id) => ({ id, gram: (perPortion.get(r.rattId)?.gram ?? 0) * atareFor(id, plan.atare, personIds).length })))
    const till = fordela(lediga, personIds, burenVikt)
    const perPerson = new Map<string, string[]>()
    for (const [rad, person] of till) perPerson.set(person, [...(perPerson.get(person) ?? []), rad])
    const svar = await Promise.all([...perPerson].map(([person, rader]) => sattBarare(rader, person)))
    return ochLaddaOm(svar.every(Boolean))
  }

  /** Efter att en rätt har lagts till: stäng väljaren, hämta om och stanna på samma måltid. */
  async function lagdTill(dag: number, maltid: Maltid) {
    setValjer(null)
    await laddaOm()
    fokusera(dag, maltid)
  }

  const vemBar = vemBarVad(plan, dagar)
  const burenVikt = matvikt.perBarare
  // Det som bara vissa personer saknar. Det som saknas för alla står redan i summeringen.
  const forAlla = new Set(saknadeMaltider(dagar, plan.maltider).map((p) => `${p.dag.dag}:${p.maltid}`))
  const saknasPerson = [...saknasPerPerson(plan, dagar, personIds)]
    .map(([id, platser]) => ({ namn: folk.personer.find((p) => p.id === id)!.namn, platser: platser.filter((p) => !forAlla.has(`${p.dag.dag}:${p.maltid}`)) }))
    .filter((x) => x.platser.length > 0)
  const forstaDatum = status.forsta && !status.forsta.dag.reserv ? dagensDatum(tur.avresa, status.forsta.dag.dag) : null

  return (
    <div className="space-y-6 lg:space-y-8">
      {!kanAndra && (
        <p className="text-muted-foreground">
          Du är läsare. Du kan se matplanen, ange dina kostbehov, ta och släppa rätter åt dig själv och bocka av det du köper. Ägare och redigerare ändrar resten.
        </p>
      )}

      {/* När planen är klar är rutan till vänster bara en rad, så då ligger Vem bär vad under i stället för bredvid. */}
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
        <VemTarMedVad
          rader={vemBar}
          personer={folk.personer}
          farger={folk.farger}
          vikter={burenVikt}
          mittDeltagareId={mittDeltagareId}
          kanAndra={kanAndra}
          onTa={async (r: Barrad) => ochLaddaOm(await taRader(r.maltidIds))}
          onSlapp={async (r: Barrad) => ochLaddaOm(await slappRader(r.maltidIds))}
          onFordela={fordelaRader}
          pasFor={(rattId) => {
            const mp = plan.ratter.find((r) => r.id === rattId)?.matprodukt_id
            const p = mp ? plan.pasar.get(mp) : undefined
            return p ? { marke: p.marke, namn: p.namn } : undefined
          }}
        />
      </div>

      <Gasbehov personer={personer} dagar={dagar.length} />

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
            folk={folk}
            behov={behov}
            kanAndra={kanAndra}
            onVem={setAndrar}
            onLaggTill={(maltid) => {
              setBesked(null)
              setValjer({ dag: summa.dag, maltid })
            }}
            onTaBort={taBort}
          />
        ))}
      </div>

      <Matsummering
        summering={matsummering(summor)}
        saknade={ratterSomSaknar(plan, dagar)}
        saknasPerson={saknasPerson}
        totaltG={matvikt.totalt}
        perPerson={perPerson}
        inteFordelat={matvikt.inteFordelat}
        namnFor={(id) => (folk.personer.length > 1 ? folk.personer.find((p) => p.id === id)?.namn : undefined)}
      />

      <div id="inkopslista" tabIndex={-1} className="scroll-mt-6 focus:outline-none">
        <Inkopslista
          rader={handlingslista(plan, dagar, personIds)}
          personer={folk.personer}
          farger={folk.farger}
          kanAndra={kanAndra}
          mittDeltagareId={mittDeltagareId}
          skafferi={egnaRader}
          bokade={bokat}
          avresa={tur.avresa}
          utskrift={`${turdelAdress(tur.id, 'mat')}/inkopslista`}
          onBocka={async (rad, klart) => {
            if (!rad.kopare) return false
            return ochLaddaOm(await bockaInkop(tur.id, rad.kopare, rad.typ, rad.id, klart, rad.mangd))
          }}
          onAvdelning={async (varaId, avdelning) => ochLaddaOm(await sattAvdelning(varaId, avdelning))}
        />
      </div>

      {andrar && andrar.length > 0 && (
        <RadPanel
          rubrik={plan.ratter.find((r) => r.id === andrar[0].ratt_id)?.namn ?? 'Rätten'}
          undertext={(() => {
            const dag = dagar.find((d) => d.dag === andrar[0].dag)
            const plats = dag ? platsText({ dag, maltid: andrar[0].maltid }) : ''
            return andrar.length > 1 ? `${plats}, ${andrar.length} st` : plats
          })()}
          personer={folk.personer}
          farger={folk.farger}
          barsAv={andrar[0].bars_av ?? null}
          atare={plan.atare.filter((a) => a.maltid_id === andrar[0].id).map((a) => a.deltagare_id)}
          onStang={() => setAndrar(null)}
          onSpara={async (barsAv, atare) => {
            const ids = andrar.map((r) => r.id)
            const ok = (await sattBarare(ids, barsAv)) && (await sattAtare(tur.id, ids, atare))
            await laddaOm()
            return ok
          }}
        />
      )}

      {valjer && (
        <ValjRatt
          rubrik={platsText({ dag: valjer.dag, maltid: valjer.maltid })}
          maltid={valjer.maltid}
          ratter={plan.ratter}
          perPortion={perPortion}
          ingredienser={plan.ingredienser}
          varor={plan.varor}
          behov={behov}
          skafferi={egetSkafferi}
          recept={recept}
          finnsRedan={(rattId) => dubblettText(rattPlatser(plan.maltider, dagar, rattId))}
          laggISkafferi={async (pase, antal, bastFore) => {
            const ny = await laggISkafferi(pase.id, egnaRader.find((r) => r.matprodukt_id === pase.id), antal, bastFore)
            if (ny) await laddaOmSkafferi()
            return ny
          }}
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
            // Har man en påse hemma som inte redan går till raderna man bär, bär man raden själv, så att påsen hemma
            // är bokad till turen. Bäst före jämförs med turens första dag, som i inköpslistan.
            const ledigt = ledigaHemma(hemma(egnaRader, jamforDatum(tur.avresa, lokaltDatum())), bokat).get(pase.id) ?? 0
            const redan = mittDeltagareId && befintlig ? portionerSomBars(plan, dagar, personIds, mittDeltagareId, befintlig.id) : 0
            const ansvarig = mittDeltagareId && taPaseSjalv(ledigt, redan, Math.max(1, personIds.length), pase.portioner) ? mittDeltagareId : null
            const ok = await laggTillPase(tur.id, pase, befintlig, valjer.dag.dag, valjer.maltid, sortering(valjer.dag.dag, valjer.maltid), ansvarig)
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
