import { Minus, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { SidRubrik } from '@/components/app/SidRubrik'
import { BastForeVal } from '@/components/mat/BastForeVal'
import { LaggISkafferi } from '@/components/mat/LaggISkafferi'
import { Matflikar } from '@/components/mat/Matflikar'
import { PasNamn } from '@/components/mat/PasNamn'
import { Pasar } from '@/components/mat/ValjRatt'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { Panel } from '@/components/ui/panel'
import { Sektion } from '@/components/ui/sektion'
import { useMatkatalog } from '@/hooks/useMatplan'
import { andraSkafferirad, laggISkafferi, sattFavorit, taBortUrSkafferi, useSkafferi } from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { pasnamn } from '@/lib/mat'
import { MAX_ANTAL, SKAFFERISTATUS_TEXT, skafferistatus, sorteraSkafferi, tolkaBastFore, valFranDatum } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import type { Matprodukt, Skafferirad } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const KATALOG = '/matplanering/katalog'

/** Länken som öppnar påsen i Matkatalogen. */
const pasadress = (id: string) => `${KATALOG}?pase=${encodeURIComponent(id)}`

/**
 * Skafferiet: påsarna man har hemma, med antal och bäst före, och ens favoriter. Personligt: bara man själv ser det.
 * Påsar läggs till här med Lägg till påse, eller från Matkatalogen.
 */
export function Skafferi() {
  useSidtitel('Skafferi')
  const { katalog, forsokIgen } = useMatkatalog()
  const { skafferi, laddaOm } = useSkafferi()
  const [fel, setFel] = useState(false)

  async function gor(handling: () => Promise<boolean>) {
    const ok = await handling()
    if (ok) await laddaOm()
    setFel(!ok)
  }

  const laddar = katalog === null || skafferi === null
  const gickInte = katalog === 'fel' || skafferi === 'fel'

  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik rubrik="Skafferi" text="Påsarna du har hemma och dina favoriter. Bara du ser ditt skafferi." />

      {gickInte ? (
        <Laddfel
          vad="ditt skafferi"
          onForsokIgen={() => {
            if (katalog === 'fel') forsokIgen()
            if (skafferi === 'fel') laddaOm()
          }}
        />
      ) : laddar ? (
        <Laddar text="Hämtar ditt skafferi" className="space-y-3">
          <Skelett className="h-40 rounded-lg" />
          <Skelett className="h-24 rounded-lg" />
        </Laddar>
      ) : (
        <Innehall katalog={katalog} rader={skafferi.rader} favoriter={skafferi.favoriter} fel={fel} gor={gor} laddaOm={laddaOm} />
      )}
    </div>
  )
}

function Innehall({
  katalog,
  rader,
  favoriter,
  fel,
  gor,
  laddaOm,
}: {
  katalog: Matprodukt[]
  rader: Skafferirad[]
  favoriter: Set<string>
  fel: boolean
  gor: (handling: () => Promise<boolean>) => Promise<void>
  laddaOm: () => Promise<void>
}) {
  const [laggTill, setLaggTill] = useState(false)
  const pasar = new Map(katalog.map((p) => [p.id, p]))
  const idag = lokaltDatum()
  // Det som går ut först överst, påsar utan datum sist.
  const hemma = sorteraSkafferi(
    rader.filter((r) => pasar.has(r.matprodukt_id)),
    (r) => pasnamn(pasar.get(r.matprodukt_id)!),
  )
  const favoritpasar = [...favoriter]
    .flatMap((id) => pasar.get(id) ?? [])
    .sort((a, b) => pasnamn(a).localeCompare(pasnamn(b), 'sv'))
  const laggTillKnapp = (
    <Button variant="outline" onClick={() => setLaggTill(true)}>
      <Plus className="size-4" aria-hidden />
      Lägg till påse
    </Button>
  )

  return (
    <div className="space-y-5">
      {fel && (
        <p role="alert" className="text-destructive">
          Det gick inte att spara. Kontrollera uppkopplingen och försök igen.
        </p>
      )}

      <Sektion rubrik="Har hemma" atgard={hemma.length > 0 && laggTillKnapp}>
        {hemma.length === 0 ? (
          <TomtLage kompakt text="Du har inga påsar hemma än. Lägg till dem här eller från Matkatalogen." knapp={laggTillKnapp} />
        ) : (
          <ul className="divide-y divide-border">
            {hemma.map((r) => (
              <Hemmarad key={r.id} rad={r} pase={pasar.get(r.matprodukt_id)!} idag={idag} gor={gor} />
            ))}
          </ul>
        )}
      </Sektion>

      <Sektion rubrik="Favoriter">
        {favoritpasar.length === 0 ? (
          <TomtLage
            kompakt
            text="Du har inga favoriter än. Tryck på stjärnan på en påse i Matkatalogen."
            knapp={
              <Link to={KATALOG} className={knappStil({ variant: 'outline' })}>
                Till Matkatalogen
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {favoritpasar.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-1">
                <Link to={pasadress(p.id)} className={cn('min-h-11 min-w-0 flex-1 rounded-md px-2 py-2 hover:bg-muted', fokus)}>
                  <PasNamn marke={p.marke} namn={p.namn} namnKlass="font-medium" />
                </Link>
                <Button variant="ghost" size="ikon" aria-label={`Ta bort ${pasnamn(p)} från favoriterna`} onClick={() => gor(() => sattFavorit(p.id, false))}>
                  <Star className="size-5 fill-primary text-primary" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Sektion>

      {laggTill && (
        <LaggTillPase
          rader={rader}
          favoriter={favoriter}
          onStang={() => setLaggTill(false)}
          onSparad={laddaOm}
        />
      )}
    </div>
  )
}

/**
 * Lägg till påse: samma sökning som i Välj rätt, med sökfältet först. När en påse är vald visas antal och bäst före.
 * Mitt på skärmen på dator och som ett blad nerifrån i mobil. Bara påsar ur matkatalogen.
 */
function LaggTillPase({
  rader,
  favoriter,
  onStang,
  onSparad,
}: {
  rader: readonly Skafferirad[]
  favoriter: ReadonlySet<string>
  onStang: () => void
  onSparad: () => Promise<void>
}) {
  const [vald, setVald] = useState<Matprodukt | null>(null)
  const hemma = new Map(rader.map((r) => [r.matprodukt_id, r.antal]))
  const befintlig = vald ? rader.find((r) => r.matprodukt_id === vald.id) : undefined
  return (
    <Panel
      mitten
      etikett="Lägg till påse i skafferiet"
      onStang={onStang}
      rubrik={
        <div className="space-y-1">
          <h2 className="text-2xl">Lägg till påse</h2>
          {vald && <PasNamn marke={vald.marke} namn={vald.namn} className="text-sm" />}
        </div>
      }
    >
      {vald ? (
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
        <Pasar
          behov={[]}
          skafferi={{ favoriter, hemma, bokade: new Map(), senast: [] }}
          valjer={false}
          onValj={setVald}
        />
      )}
    </Panel>
  )
}

/** En påse man har hemma: namnet, bäst före och om det har gått ut, antalet med minus och plus, och Ta bort. */
function Hemmarad({ rad, pase, idag, gor }: { rad: Skafferirad; pase: Matprodukt; idag: string; gor: (handling: () => Promise<boolean>) => Promise<void> }) {
  const sparat = valFranDatum(rad.bast_fore)
  const [manad, setManad] = useState(sparat.manad)
  const [ar, setAr] = useState(sparat.ar)
  const [datumfel, setDatumfel] = useState<string | null>(null)
  const status = skafferistatus(rad.bast_fore, idag)
  const namn = pasnamn(pase)

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
    if (tolkat.datum === rad.bast_fore) return
    void gor(() => andraSkafferirad(rad.id, { bast_fore: tolkat.datum }))
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <Link to={pasadress(pase.id)} className={cn('min-h-11 min-w-0 flex-1 rounded-md py-1 underline-offset-4 hover:underline', fokus)}>
          <PasNamn marke={pase.marke} namn={pase.namn} namnKlass="font-medium" />
        </Link>
        {status && (
          <span className={cn('pt-1 text-sm', status === 'gatt_ut' ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>{SKAFFERISTATUS_TEXT[status]}</span>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Antal</p>
          <div role="group" aria-label={`Antal ${namn}`} className="flex items-center gap-1">
            <Button variant="outline" size="ikon" aria-label={`Minska antalet ${namn}`} disabled={rad.antal <= 1} onClick={() => gor(() => andraSkafferirad(rad.id, { antal: rad.antal - 1 }))}>
              <Minus className="size-4" aria-hidden />
            </Button>
            <span aria-live="polite" className="min-w-10 text-center font-semibold tabular-nums">
              {rad.antal}
              <span className="sr-only"> hemma</span>
            </span>
            <Button variant="outline" size="ikon" aria-label={`Öka antalet ${namn}`} disabled={rad.antal >= MAX_ANTAL} onClick={() => gor(() => andraSkafferirad(rad.id, { antal: rad.antal + 1 }))}>
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <div className="min-w-56 max-w-sm flex-1">
          <BastForeVal manad={manad} ar={ar} idag={idag} fel={datumfel} onAndra={andraDatum} />
        </div>
        <Button variant="ghost" onClick={() => gor(() => taBortUrSkafferi(rad.id))}>
          <Trash2 className="size-4" aria-hidden />
          Ta bort
          <span className="sr-only"> {namn}</span>
        </Button>
      </div>
    </li>
  )
}
