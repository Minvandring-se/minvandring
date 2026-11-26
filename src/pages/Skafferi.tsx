import { ChevronDown, Minus, Plus, Star } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { BastForeVal } from '@/components/mat/BastForeVal'
import { LaggISkafferi } from '@/components/mat/LaggISkafferi'
import { Matflikar } from '@/components/mat/Matflikar'
import { PasNamn } from '@/components/mat/PasNamn'
import { Pasar } from '@/components/mat/ValjRatt'
import { Button } from '@/components/ui/button'
import { Delval } from '@/components/ui/delval'
import { knappStil } from '@/components/ui/knappStil'
import { Panel } from '@/components/ui/panel'
import { Select } from '@/components/ui/select'
import { useMatkatalog } from '@/hooks/useMatplan'
import { andraSkafferirad, laggISkafferi, sattFavorit, taBortUrSkafferi, useSkafferi } from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { pasnamn } from '@/lib/mat'
import { datumrad, MAX_ANTAL, SKAFFERISORTERINGAR, sorteraSkafferiEfter, tolkaBastFore, valFranDatum, type Skafferisortering } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import type { Matprodukt, Skafferirad } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const KATALOG = '/matplanering/katalog'

/** Länken som öppnar påsen i Matkatalogen. */
const pasadress = (id: string) => `${KATALOG}?pase=${encodeURIComponent(id)}`

type Vy = 'hemma' | 'favoriter'

/**
 * Skafferiet: påsarna man har hemma, med antal och bäst före, och ens favoriter, som två delar. Personligt: bara man
 * själv ser det. Påsar läggs till här med Lägg till, eller från Matkatalogen.
 */
export function Skafferi() {
  useSidtitel('Skafferi')
  const { katalog, forsokIgen } = useMatkatalog()
  const { skafferi, laddaOm } = useSkafferi()
  const [fel, setFel] = useState(false)
  const [laggTill, setLaggTill] = useState(false)

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[2rem] leading-tight lg:text-[clamp(2.25rem,1.6rem+0.9vw,2.75rem)]">Skafferi</h1>
        <Button disabled={laddar || gickInte} onClick={() => setLaggTill(true)}>
          <Plus className="size-4" aria-hidden />
          Lägg till
        </Button>
      </div>
      <p className="-mt-3 max-w-prose text-muted-foreground">Påsarna du har hemma och dina favoriter. Bara du ser ditt skafferi.</p>

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
          <Skelett className="h-12 rounded-lg" />
          <Skelett className="h-40 rounded-lg" />
        </Laddar>
      ) : (
        <>
          <Innehall katalog={katalog} rader={skafferi.rader} favoriter={skafferi.favoriter} fel={fel} gor={gor} onLaggTill={() => setLaggTill(true)} />
          {laggTill && <LaggTillPase rader={skafferi.rader} favoriter={skafferi.favoriter} onStang={() => setLaggTill(false)} onSparad={laddaOm} />}
        </>
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
  onLaggTill,
}: {
  katalog: Matprodukt[]
  rader: Skafferirad[]
  favoriter: Set<string>
  fel: boolean
  gor: (handling: () => Promise<boolean>) => Promise<void>
  onLaggTill: () => void
}) {
  const id = useId()
  const [vy, setVy] = useState<Vy>('hemma')
  const [sortering, setSortering] = useState<Skafferisortering>('datum')
  const [oppen, setOppen] = useState<string | null>(null)
  const pasar = new Map(katalog.map((p) => [p.id, p]))
  const idag = lokaltDatum()
  const hemma = sorteraSkafferiEfter(
    rader.filter((r) => pasar.has(r.matprodukt_id)),
    sortering,
    (r) => pasar.get(r.matprodukt_id)!,
  )
  const favoritpasar = [...favoriter]
    .flatMap((id) => pasar.get(id) ?? [])
    .sort((a, b) => pasnamn(a).localeCompare(pasnamn(b), 'sv'))

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
          { nyckel: 'hemma', namn: `Hemma (${hemma.length})` },
          { nyckel: 'favoriter', namn: `Favoriter (${favoritpasar.length})` },
        ]}
        vald={vy}
        onValj={setVy}
      />

      {vy === 'hemma' && (
        <section aria-label="Hemma" className="space-y-3">
          {hemma.length === 0 ? (
            <TomtLage
              kompakt
              text="Du har inga påsar hemma än. Lägg till dem här eller från Matkatalogen."
              knapp={
                <Button variant="outline" onClick={onLaggTill}>
                  <Plus className="size-4" aria-hidden />
                  Lägg till
                </Button>
              }
            />
          ) : (
            <>
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
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                {hemma.map((r) => (
                  <Hemmarad
                    key={`${r.id}:${r.bast_fore ?? ''}`}
                    rad={r}
                    pase={pasar.get(r.matprodukt_id)!}
                    favorit={favoriter.has(r.matprodukt_id)}
                    idag={idag}
                    oppen={oppen === r.id}
                    onVaxla={() => setOppen((o) => (o === r.id ? null : r.id))}
                    gor={gor}
                  />
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {vy === 'favoriter' && (
        <section aria-label="Favoriter">
          {favoritpasar.length === 0 ? (
            <TomtLage
              kompakt
              text="Du har inga favoriter än. Tryck på stjärnan på en påse här eller i Matkatalogen."
              knapp={
                <Link to={KATALOG} className={knappStil({ variant: 'outline' })}>
                  Till Matkatalogen
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {favoritpasar.map((p) => (
                <li key={p.id} className="flex items-center gap-1 pr-1">
                  <Link to={pasadress(p.id)} className={cn('min-h-14 min-w-0 flex-1 px-4 py-2.5 hover:bg-muted', fokus)}>
                    <PasNamn marke={p.marke} namn={p.namn} namnKlass="font-medium" />
                  </Link>
                  <Stjarna favorit namn={pasnamn(p)} onVaxla={() => gor(() => sattFavorit(p.id, false))} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

/** Stjärnan för en favorit: fylld i hjortron när påsen är favorit. Går att trycka på. */
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
        <Pasar behov={[]} skafferi={{ favoriter, hemma, bokade: new Map(), senast: [] }} valjer={false} onValj={setVald} />
      )}
    </Panel>
  )
}

/**
 * En påse man har hemma som en kompakt rad: märket litet, namnet och datumraden, och till höger antalet och stjärnan.
 * Ett tryck fäller ut raden med antal, bäst före och Ta bort. Bara en rad är utfälld åt gången.
 */
function Hemmarad({
  rad,
  pase,
  favorit,
  idag,
  oppen,
  onVaxla,
  gor,
}: {
  rad: Skafferirad
  pase: Matprodukt
  favorit: boolean
  idag: string
  oppen: boolean
  onVaxla: () => void
  gor: (handling: () => Promise<boolean>) => Promise<void>
}) {
  const id = useId()
  const sparat = valFranDatum(rad.bast_fore)
  const [manad, setManad] = useState(sparat.manad)
  const [ar, setAr] = useState(sparat.ar)
  const [datumfel, setDatumfel] = useState<string | null>(null)
  const datum = datumrad(rad.bast_fore, idag)
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
    <li className={cn(oppen && 'bg-muted/40')}>
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          aria-expanded={oppen}
          aria-controls={`${id}-detaljer`}
          onClick={onVaxla}
          className={cn('flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left hover:bg-muted', fokus)}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">{pase.marke}</span>
            <span className="block font-medium break-words">{pase.namn}</span>
            {datum && <span className={cn('block text-sm', datum.gattUt ? 'font-medium text-accent-strong' : 'text-muted-foreground')}>{datum.text}</span>}
          </span>
          <span className="shrink-0 text-sm tabular-nums">{rad.antal} st</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', oppen && 'rotate-180')} aria-hidden />
        </button>
        <Stjarna favorit={favorit} namn={namn} onVaxla={() => gor(() => sattFavorit(pase.id, !favorit))} />
      </div>

      <div id={`${id}-detaljer`} hidden={!oppen} className="space-y-4 px-4 pt-1 pb-4">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
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
          <div className="max-w-sm min-w-56 flex-1">
            <BastForeVal manad={manad} ar={ar} idag={idag} fel={datumfel} onAndra={andraDatum} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link to={pasadress(pase.id)} className={cn('inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4', fokus)}>
            Visa i Matkatalogen
          </Link>
          <Button variant="ghost" className="text-accent-strong" onClick={() => gor(() => taBortUrSkafferi(rad.id))}>
            Ta bort
            <span className="sr-only"> {namn}</span>
          </Button>
        </div>
      </div>
    </li>
  )
}
