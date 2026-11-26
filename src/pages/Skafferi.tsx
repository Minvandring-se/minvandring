import { ChevronDown, Minus, PackagePlus, Plus, Star } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { BastForeVal } from '@/components/mat/BastForeVal'
import { LaggISkafferi } from '@/components/mat/LaggISkafferi'
import { LaggRattHemma, type Receptval } from '@/components/mat/LaggRattHemma'
import { Matflikar } from '@/components/mat/Matflikar'
import { PasNamn } from '@/components/mat/PasNamn'
import { Pasar } from '@/components/mat/ValjRatt'
import { Button } from '@/components/ui/button'
import { Delval } from '@/components/ui/delval'
import { knappStil } from '@/components/ui/knappStil'
import { Panel } from '@/components/ui/panel'
import { Select } from '@/components/ui/select'
import { useMatkatalog } from '@/hooks/useMatplan'
import { useRecept } from '@/hooks/useRecept'
import { useReceptkatalognamn } from '@/hooks/useReceptkatalog'
import {
  andraSkafferirad,
  andraSkafferiratt,
  laggISkafferi,
  laggRattISkafferi,
  sattFavorit,
  sattReceptfavorit,
  taBortSkafferiratt,
  taBortUrSkafferi,
  useSkafferi,
  type Skafferi as SkafferiData,
} from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { pasnamn } from '@/lib/mat'
import { receptadress } from '@/lib/receptkatalog'
import { datumrad, MAX_ANTAL, SKAFFERISORTERINGAR, sorteraSkafferiEfter, tolkaBastFore, valFranDatum, type Skafferisortering } from '@/lib/skafferi'
import { arReceptfavorit, kopplingsnyckel, portionertext, sorteraRatter } from '@/lib/skafferiratter'
import { lokaltDatum } from '@/lib/turlista'
import type { Matprodukt, Recept, Receptkoppling, Skafferiratt } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const KATALOG = '/matplanering/katalog'
const RECEPT = '/matplanering/recept'
const lankKlass = cn('inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4', fokus)
const listKlass = 'divide-y divide-border overflow-hidden rounded-lg border border-border bg-card'

/** Länken som öppnar påsen i Matkatalogen. */
const pasadress = (id: string) => `${KATALOG}?pase=${encodeURIComponent(id)}`

type Vy = 'hemma' | 'favoriter' | 'recept'

/** Vad Lägg till öppnar: en påse, en egen rätt, eller en egen rätt från ett recept. */
type LaggTill = { typ: 'pase' } | { typ: 'ratt'; forval?: { namn: string; nyckel: string } } | null

/** Ett recept i skafferiet, eget eller MinVandrings, med adressen det öppnas på. */
interface Receptrad {
  koppling: Receptkoppling
  namn: string
  adress: string
}

type Gor = (handling: () => Promise<boolean>) => Promise<void>

/**
 * Skafferiet: påsarna och de egna rätterna man har hemma, med antal och bäst före, ens favoriter och ens egna recept,
 * som tre delar. Personligt: bara man själv ser det. Påsar läggs till här eller från Matkatalogen, och en egen rätt
 * här eller från ett recept.
 */
export function Skafferi() {
  useSidtitel('Skafferi')
  const { katalog, forsokIgen } = useMatkatalog()
  const { skafferi, laddaOm } = useSkafferi()
  const { recept, laddaOm: laddaOmRecept } = useRecept()
  const [receptforsok, setReceptforsok] = useState(0)
  const katalogrecept = useReceptkatalognamn(receptforsok)
  const [fel, setFel] = useState(false)
  const [laggTill, setLaggTill] = useState<LaggTill>(null)

  async function gor(handling: () => Promise<boolean>) {
    const ok = await handling()
    if (ok) await laddaOm()
    setFel(!ok)
  }

  const laddar = katalog === null || skafferi === null || recept === null || katalogrecept === null
  const gickInte = katalog === 'fel' || skafferi === 'fel' || recept === 'fel' || katalogrecept === 'fel'

  return (
    <div className="space-y-6">
      <Matflikar />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[2rem] leading-tight lg:text-[clamp(2.25rem,1.6rem+0.9vw,2.75rem)]">Skafferi</h1>
        <Button disabled={laddar || gickInte} onClick={() => setLaggTill({ typ: 'pase' })}>
          <Plus className="size-4" aria-hidden />
          Lägg till
        </Button>
      </div>
      <p className="-mt-3 max-w-prose text-muted-foreground">Påsarna och rätterna du har hemma, dina favoriter och dina recept. Bara du ser ditt skafferi.</p>

      {gickInte ? (
        <Laddfel
          vad="ditt skafferi"
          onForsokIgen={() => {
            if (katalog === 'fel') forsokIgen()
            if (skafferi === 'fel') laddaOm()
            if (recept === 'fel') laddaOmRecept()
            if (katalogrecept === 'fel') setReceptforsok((n) => n + 1)
          }}
        />
      ) : laddar ? (
        <Laddar text="Hämtar ditt skafferi" className="space-y-3">
          <Skelett className="h-12 rounded-lg" />
          <Skelett className="h-40 rounded-lg" />
        </Laddar>
      ) : (
        <>
          <Innehall
            katalog={katalog}
            skafferi={skafferi}
            recept={recept}
            katalogrecept={katalogrecept}
            fel={fel}
            gor={gor}
            onLaggTill={setLaggTill}
          />
          {laggTill && (
            <LaggTillPanel
              laggTill={laggTill}
              skafferi={skafferi}
              egnaRecept={recept.map((r) => ({ nyckel: kopplingsnyckel({ recept_id: r.id, receptkatalog_id: null }), namn: r.namn }))}
              katalogrecept={katalogrecept.map((r) => ({ nyckel: kopplingsnyckel({ recept_id: null, receptkatalog_id: r.id }), namn: r.namn }))}
              onByt={setLaggTill}
              onStang={() => setLaggTill(null)}
              onSparad={laddaOm}
            />
          )}
        </>
      )}
    </div>
  )
}

function Innehall({
  katalog,
  skafferi,
  recept,
  katalogrecept,
  fel,
  gor,
  onLaggTill,
}: {
  katalog: Matprodukt[]
  skafferi: SkafferiData
  recept: Recept[]
  katalogrecept: { id: string; namn: string }[]
  fel: boolean
  gor: Gor
  onLaggTill: (l: LaggTill) => void
}) {
  const id = useId()
  const [vy, setVy] = useState<Vy>('hemma')
  const [sortering, setSortering] = useState<Skafferisortering>('datum')
  const [oppen, setOppen] = useState<string | null>(null)
  const { rader, favoriter, ratter, receptfavoriter } = skafferi
  const pasar = new Map(katalog.map((p) => [p.id, p]))
  const idag = lokaltDatum()
  const hemma = sorteraSkafferiEfter(
    rader.filter((r) => pasar.has(r.matprodukt_id)),
    sortering,
    (r) => pasar.get(r.matprodukt_id)!,
  )
  const ratterHemma = sorteraRatter(ratter)
  const favoritpasar = [...favoriter]
    .flatMap((id) => pasar.get(id) ?? [])
    .sort((a, b) => pasnamn(a).localeCompare(pasnamn(b), 'sv'))

  const egna: Receptrad[] = recept.map((r) => ({ koppling: { recept_id: r.id }, namn: r.namn, adress: RECEPT }))
  const katalogens: Receptrad[] = katalogrecept.map((r) => ({ koppling: { receptkatalog_id: r.id }, namn: r.namn, adress: receptadress(r.id) }))
  const favoritrecept = [...egna, ...katalogens].filter((r) => arReceptfavorit(receptfavoriter, r.koppling)).sort((a, b) => a.namn.localeCompare(b.namn, 'sv'))

  /** Adressen till receptet en rätt hemma kommer från, om det finns kvar. */
  function receptFor(r: Skafferiratt): Receptrad | undefined {
    if (r.recept_id) return egna.find((x) => 'recept_id' in x.koppling && x.koppling.recept_id === r.recept_id)
    if (r.receptkatalog_id) return katalogens.find((x) => 'receptkatalog_id' in x.koppling && x.koppling.receptkatalog_id === r.receptkatalog_id)
  }

  const receptStjarna = (r: Receptrad) => (
    <Stjarna favorit={arReceptfavorit(receptfavoriter, r.koppling)} namn={r.namn} onVaxla={() => gor(() => sattReceptfavorit(r.koppling, !arReceptfavorit(receptfavoriter, r.koppling)))} />
  )

  return (
    <div className="space-y-4">
      {fel && (
        <p role="alert" className="text-destructive">
          Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
        </p>
      )}

      <Delval<Vy>
        etikett="Visa"
        delar={[
          { nyckel: 'hemma', namn: `Hemma (${hemma.length + ratterHemma.length})` },
          { nyckel: 'favoriter', namn: `Favoriter (${favoritpasar.length + favoritrecept.length})` },
          { nyckel: 'recept', namn: `Recept (${recept.length})` },
        ]}
        vald={vy}
        onValj={setVy}
      />

      {vy === 'hemma' && (
        <section aria-label="Hemma" className="space-y-6">
          {hemma.length === 0 && ratterHemma.length === 0 ? (
            <TomtLage
              kompakt
              text="Du har inga påsar eller egna rätter hemma än. Lägg till dem här, eller påsar från Matkatalogen."
              knapp={
                <Button variant="outline" onClick={() => onLaggTill({ typ: 'pase' })}>
                  <Plus className="size-4" aria-hidden />
                  Lägg till
                </Button>
              }
            />
          ) : (
            <>
              {hemma.length > 0 && (
                <Del rubrik="Påsar" visaRubrik={ratterHemma.length > 0}>
                  {hemma.length > 1 && (
                    <div className="flex items-center gap-3">
                      <label htmlFor={`${id}-sortera`} className="text-sm text-muted-foreground">
                        Sortera
                      </label>
                      <Select id={`${id}-sortera`} value={sortering} onChange={(e) => setSortering(e.target.value as Skafferisortering)} className="w-auto">
                        {SKAFFERISORTERINGAR.map((s) => (
                          <option key={s.nyckel} value={s.nyckel}>
                            {s.etikett}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <ul className={listKlass}>
                    {hemma.map((r) => {
                      const pase = pasar.get(r.matprodukt_id)!
                      const favorit = favoriter.has(pase.id)
                      return (
                        <Hemmarad
                          key={`${r.id}:${r.bast_fore ?? ''}`}
                          overtext={pase.marke}
                          namn={pase.namn}
                          etikett={pasnamn(pase)}
                          antal={r.antal}
                          antalText={`${r.antal} st`}
                          antalRubrik="Antal"
                          bastFore={r.bast_fore}
                          idag={idag}
                          oppen={oppen === r.id}
                          onVaxla={() => setOppen((o) => (o === r.id ? null : r.id))}
                          stjarna={<Stjarna favorit={favorit} namn={pasnamn(pase)} onVaxla={() => gor(() => sattFavorit(pase.id, !favorit))} />}
                          lank={{ till: pasadress(pase.id), text: 'Visa i Matkatalogen' }}
                          gor={gor}
                          onAntal={(antal) => andraSkafferirad(r.id, { antal })}
                          onDatum={(bast_fore) => andraSkafferirad(r.id, { bast_fore })}
                          onTaBort={() => taBortUrSkafferi(r.id)}
                        />
                      )
                    })}
                  </ul>
                </Del>
              )}
              {ratterHemma.length > 0 && (
                <Del rubrik="Egna rätter" visaRubrik={hemma.length > 0}>
                  <ul className={listKlass}>
                    {ratterHemma.map((r) => {
                      const fran = receptFor(r)
                      return (
                        <Hemmarad
                          key={`${r.id}:${r.bast_fore ?? ''}`}
                          namn={r.namn}
                          etikett={r.namn}
                          antal={r.portioner}
                          antalText={portionertext(r.portioner)}
                          antalRubrik="Portioner"
                          bastFore={r.bast_fore}
                          idag={idag}
                          oppen={oppen === r.id}
                          onVaxla={() => setOppen((o) => (o === r.id ? null : r.id))}
                          lank={fran && { till: fran.adress, text: 'Visa receptet' }}
                          gor={gor}
                          onAntal={(portioner) => andraSkafferiratt(r.id, { portioner })}
                          onDatum={(bast_fore) => andraSkafferiratt(r.id, { bast_fore })}
                          onTaBort={() => taBortSkafferiratt(r.id)}
                        />
                      )
                    })}
                  </ul>
                </Del>
              )}
            </>
          )}
        </section>
      )}

      {vy === 'favoriter' && (
        <section aria-label="Favoriter" className="space-y-6">
          {favoritpasar.length === 0 && favoritrecept.length === 0 ? (
            <TomtLage
              kompakt
              text="Du har inga favoriter än. Tryck på stjärnan på en påse här eller i Matkatalogen, eller på ett recept."
              knapp={
                <Link to={KATALOG} className={knappStil({ variant: 'outline' })}>
                  Till Matkatalogen
                </Link>
              }
            />
          ) : (
            <>
              {favoritpasar.length > 0 && (
                <Del rubrik="Påsar" visaRubrik={favoritrecept.length > 0}>
                  <ul className={listKlass}>
                    {favoritpasar.map((p) => (
                      <li key={p.id} className="flex items-center gap-1 pr-1">
                        <Link to={pasadress(p.id)} className={cn('min-h-14 min-w-0 flex-1 px-4 py-2.5 hover:bg-muted', fokus)}>
                          <PasNamn marke={p.marke} namn={p.namn} namnKlass="font-medium" />
                        </Link>
                        <Stjarna favorit namn={pasnamn(p)} onVaxla={() => gor(() => sattFavorit(p.id, false))} />
                      </li>
                    ))}
                  </ul>
                </Del>
              )}
              {favoritrecept.length > 0 && (
                <Del rubrik="Recept" visaRubrik={favoritpasar.length > 0}>
                  <ul className={listKlass}>
                    {favoritrecept.map((r) => (
                      <Receptlistrad key={kopplingsnyckel(radKoppling(r.koppling))} recept={r} stjarna={receptStjarna(r)} onLaggTill={onLaggTill} />
                    ))}
                  </ul>
                </Del>
              )}
            </>
          )}
        </section>
      )}

      {vy === 'recept' && (
        <section aria-label="Dina recept" className="space-y-3">
          {egna.length === 0 ? (
            <TomtLage
              kompakt
              text="Du har inga egna recept än. Skapa dem under Recept, där du också hittar MinVandrings recept."
              knapp={
                <Link to={RECEPT} className={knappStil({ variant: 'outline' })}>
                  Till Recept
                </Link>
              }
            />
          ) : (
            <ul className={listKlass}>
              {egna.map((r) => (
                <Receptlistrad key={kopplingsnyckel(radKoppling(r.koppling))} recept={r} stjarna={receptStjarna(r)} onLaggTill={onLaggTill} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

/** Kopplingen med båda fälten, som på en rad i databasen. */
function radKoppling(k: Receptkoppling): Pick<Skafferiratt, 'recept_id' | 'receptkatalog_id'> {
  return { recept_id: null, receptkatalog_id: null, ...k }
}

/** En del av en flik med en liten rubrik. Rubriken visas bara när fliken har fler än en del. */
function Del({ rubrik, visaRubrik, children }: { rubrik: string; visaRubrik: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={visaRubrik ? id : undefined} aria-label={visaRubrik ? undefined : rubrik} className="space-y-3">
      {visaRubrik && (
        <h2 id={id} className="text-lg">
          {rubrik}
        </h2>
      )}
      {children}
    </div>
  )
}

/** Ett recept i en lista: namnet öppnar receptet, och till höger Lägg i skafferiet och stjärnan. */
function Receptlistrad({ recept, stjarna, onLaggTill }: { recept: Receptrad; stjarna: ReactNode; onLaggTill: (l: LaggTill) => void }) {
  return (
    <li className="flex items-center gap-1 pr-1">
      <Link to={recept.adress} className={cn('flex min-h-14 min-w-0 flex-1 flex-col justify-center px-4 py-2.5 hover:bg-muted', fokus)}>
        <span className="block font-medium break-words">{recept.namn}</span>
        <span className="block text-xs text-muted-foreground">{'recept_id' in recept.koppling ? 'Ditt recept' : 'MinVandrings recept'}</span>
      </Link>
      <button
        type="button"
        aria-label={`Lägg ${recept.namn} i skafferiet`}
        title="Lägg i skafferiet"
        onClick={() => onLaggTill({ typ: 'ratt', forval: { namn: recept.namn, nyckel: kopplingsnyckel(radKoppling(recept.koppling)) } })}
        className={cn('flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground', fokus)}
      >
        <PackagePlus className="size-5" aria-hidden />
      </button>
      {stjarna}
    </li>
  )
}

/** Stjärnan för en favorit: fylld i hjortron när påsen eller receptet är favorit. Går att trycka på. */
function Stjarna({ favorit, namn, onVaxla }: { favorit: boolean; namn: string; onVaxla: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={favorit}
      aria-label={`Favorit: ${namn}`}
      onClick={onVaxla}
      className={cn('flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted', fokus)}
    >
      <Star className={cn('size-5', favorit ? 'fill-hjortron text-hjortron-ikon' : 'text-muted-foreground')} aria-hidden />
    </button>
  )
}

/**
 * Lägg till: en påse eller en egen rätt, som två delar överst. En påse väljs med samma sökning som i Välj rätt, och när
 * den är vald visas antal och bäst före. Mitt på skärmen på dator och som ett blad nerifrån i mobil.
 */
function LaggTillPanel({
  laggTill,
  skafferi,
  egnaRecept,
  katalogrecept,
  onByt,
  onStang,
  onSparad,
}: {
  laggTill: NonNullable<LaggTill>
  skafferi: SkafferiData
  egnaRecept: Receptval[]
  katalogrecept: Receptval[]
  onByt: (l: LaggTill) => void
  onStang: () => void
  onSparad: () => Promise<void>
}) {
  const [vald, setVald] = useState<Matprodukt | null>(null)
  const { rader, favoriter, ratter } = skafferi
  const hemma = new Map(rader.map((r) => [r.matprodukt_id, r.antal]))
  const befintlig = vald ? rader.find((r) => r.matprodukt_id === vald.id) : undefined
  const rubrik = laggTill.typ === 'pase' ? 'Lägg till påse' : 'Lägg till egen rätt'
  return (
    <Panel
      mitten
      etikett={`${rubrik} i skafferiet`}
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          <h2 className="text-2xl">{rubrik}</h2>
          {vald && <PasNamn marke={vald.marke} namn={vald.namn} className="text-sm" />}
        </div>
      }
    >
      <div className="space-y-4">
        {!vald && !(laggTill.typ === 'ratt' && laggTill.forval) && (
          <Delval<'pase' | 'ratt'>
            etikett="Lägg till"
            delar={[
              { nyckel: 'pase', namn: 'Påse' },
              { nyckel: 'ratt', namn: 'Egen rätt' },
            ]}
            vald={laggTill.typ}
            onValj={(typ) => onByt({ typ })}
          />
        )}
        {laggTill.typ === 'ratt' ? (
          <LaggRattHemma
            ratter={ratter}
            egnaRecept={egnaRecept}
            katalogrecept={katalogrecept}
            forval={laggTill.forval}
            onSpara={async (namn, befintligRatt, portioner, bastFore, koppling) => {
              const ok = await laggRattISkafferi(namn, befintligRatt, portioner, bastFore, koppling)
              if (ok) await onSparad()
              return ok
            }}
            onKlar={onStang}
          />
        ) : vald ? (
          <LaggISkafferi
            namn={pasnamn(vald)}
            hemma={befintlig?.antal ?? 0}
            onSpara={async (antal, bastFore) => {
              const ny = await laggISkafferi(vald.id, befintlig, antal, bastFore)
              if (ny) await onSparad()
              return ny
            }}
            onKlar={onStang}
          />
        ) : (
          <Pasar behov={[]} skafferi={{ favoriter, hemma, bokade: new Map(), senast: [] }} valjer={false} onValj={setVald} />
        )}
      </div>
    </Panel>
  )
}

/**
 * En påse eller en egen rätt man har hemma som en kompakt rad: märket litet, namnet och datumraden, och till höger
 * antalet och stjärnan. Ett tryck fäller ut raden med antal, bäst före och Ta bort. Bara en rad är utfälld åt gången.
 */
function Hemmarad({
  overtext,
  namn,
  etikett,
  antal,
  antalText,
  antalRubrik,
  bastFore,
  idag,
  oppen,
  onVaxla,
  stjarna,
  lank,
  gor,
  onAntal,
  onDatum,
  onTaBort,
}: {
  /** Märket på en påse. */
  overtext?: string
  namn: string
  /** Hela namnet, för skärmläsare. */
  etikett: string
  antal: number
  antalText: string
  antalRubrik: 'Antal' | 'Portioner'
  bastFore: string | null
  idag: string
  oppen: boolean
  onVaxla: () => void
  stjarna?: ReactNode
  lank?: { till: string; text: string }
  gor: Gor
  onAntal: (antal: number) => Promise<boolean>
  onDatum: (bastFore: string | null) => Promise<boolean>
  onTaBort: () => Promise<boolean>
}) {
  const id = useId()
  const sparat = valFranDatum(bastFore)
  const [manad, setManad] = useState(sparat.manad)
  const [ar, setAr] = useState(sparat.ar)
  const [datumfel, setDatumfel] = useState<string | null>(null)
  const datum = datumrad(bastFore, idag)
  const ord = antalRubrik === 'Antal' ? 'antal' : 'portioner'

  function andraDatum(m: string, a: string) {
    setManad(m)
    setAr(a)
    // Halva val sparas inte. Felet står vid fältet tills båda är valda eller båda är tomma.
    const tolkat = tolkaBastFore(m, a, idag)
    if (!tolkat.ok) {
      setDatumfel(tolkat.fel)
      return
    }
    setDatumfel(null)
    if (tolkat.datum === bastFore) return
    void gor(() => onDatum(tolkat.datum))
  }

  return (
    <li className={cn(oppen && 'bg-muted/40')}>
      <div className={cn('flex items-center gap-1', stjarna && 'pr-1')}>
        <button
          type="button"
          aria-expanded={oppen}
          aria-controls={`${id}-detaljer`}
          onClick={onVaxla}
          className={cn('flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left hover:bg-muted', fokus)}
        >
          <span className="min-w-0 flex-1">
            {overtext && <span className="block text-xs text-muted-foreground">{overtext}</span>}
            <span className="block font-medium break-words">{namn}</span>
            {datum && <span className={cn('block text-sm', datum.gattUt ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>{datum.text}</span>}
          </span>
          <span className="shrink-0 text-sm tabular-nums">{antalText}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', oppen && 'rotate-180')} aria-hidden />
        </button>
        {stjarna}
      </div>

      <div id={`${id}-detaljer`} hidden={!oppen} className="space-y-4 px-4 pt-1 pb-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{antalRubrik}</p>
            <div role="group" aria-label={`${antalRubrik} ${etikett}`} className="flex items-center gap-1">
              <Button variant="outline" size="ikon" aria-label={`Minska ${ord} för ${etikett}`} disabled={antal <= 1} onClick={() => gor(() => onAntal(antal - 1))}>
                <Minus className="size-4" aria-hidden />
              </Button>
              <span aria-live="polite" className="min-w-10 text-center font-semibold tabular-nums">
                {antal}
                <span className="sr-only"> hemma</span>
              </span>
              <Button variant="outline" size="ikon" aria-label={`Öka ${ord} för ${etikett}`} disabled={antal >= MAX_ANTAL} onClick={() => gor(() => onAntal(antal + 1))}>
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="max-w-sm min-w-56 flex-1">
            <BastForeVal manad={manad} ar={ar} idag={idag} fel={datumfel} onAndra={andraDatum} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {lank && (
            <Link to={lank.till} className={lankKlass}>
              {lank.text}
            </Link>
          )}
          <Button variant="ghost" className="text-accent-strong" onClick={() => gor(onTaBort)}>
            Ta bort
            <span className="sr-only"> {etikett}</span>
          </Button>
        </div>
      </div>
    </li>
  )
}
