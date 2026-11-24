import { Minus, Plus, Star, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { TomtLage } from '@/components/app/TomtLage'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Matflikar } from '@/components/mat/Matflikar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { knappStil } from '@/components/ui/knappStil'
import { Sektion } from '@/components/ui/sektion'
import { useMatkatalog } from '@/hooks/useMatplan'
import { andraSkafferirad, sattFavorit, taBortUrSkafferi, useSkafferi } from '@/hooks/useSkafferi'
import { useSidtitel } from '@/hooks/useSidtitel'
import { pasnamn } from '@/lib/mat'
import { bastForeStatus, BASTFORE_TEXT, formateraDatum, MAX_ANTAL, sorteraSkafferi } from '@/lib/skafferi'
import { lokaltDatum } from '@/lib/turlista'
import type { Matprodukt, Skafferirad } from '@/lib/typer'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const KATALOG = '/matplanering/katalog'

/** Länken som öppnar påsen i Matkatalogen. */
const pasadress = (id: string) => `${KATALOG}?pase=${encodeURIComponent(id)}`

/**
 * Skafferiet: påsarna man har hemma, med antal och bäst-före, och ens favoriter. Personligt: bara man själv ser det.
 * Påsar läggs till från Matkatalogen.
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
        <Innehall katalog={katalog} rader={skafferi.rader} favoriter={skafferi.favoriter} fel={fel} gor={gor} />
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
}: {
  katalog: Matprodukt[]
  rader: Skafferirad[]
  favoriter: Set<string>
  fel: boolean
  gor: (handling: () => Promise<boolean>) => Promise<void>
}) {
  const pasar = new Map(katalog.map((p) => [p.id, p]))
  const idag = lokaltDatum()
  const hemma = sorteraSkafferi(
    rader.filter((r) => pasar.has(r.matprodukt_id)),
    (r) => pasnamn(pasar.get(r.matprodukt_id)!),
  )
  const favoritpasar = [...favoriter]
    .flatMap((id) => pasar.get(id) ?? [])
    .sort((a, b) => pasnamn(a).localeCompare(pasnamn(b), 'sv'))
  const tillKatalogen = (
    <Link to={KATALOG} className={knappStil({ variant: 'outline' })}>
      Till Matkatalogen
    </Link>
  )

  return (
    <div className="space-y-5">
      {fel && (
        <p role="alert" className="text-destructive">
          Det gick inte att spara ändringen. Kontrollera uppkopplingen och försök igen.
        </p>
      )}

      <Sektion rubrik="Har hemma" atgard={hemma.length > 0 && tillKatalogen}>
        {hemma.length === 0 ? (
          <TomtLage kompakt text="Du har inga påsar hemma än. Lägg till dem från Matkatalogen." knapp={tillKatalogen} />
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
          <TomtLage kompakt text="Du har inga favoriter än. Tryck på stjärnan på en påse i Matkatalogen." />
        ) : (
          <ul className="divide-y divide-border">
            {favoritpasar.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-1">
                <Link to={pasadress(p.id)} className={cn('min-h-11 min-w-0 flex-1 rounded-md px-2 py-2.5 font-medium break-words hover:bg-muted', fokus)}>
                  {pasnamn(p)}
                </Link>
                <Button variant="ghost" size="ikon" aria-label={`Ta bort ${pasnamn(p)} från favoriterna`} onClick={() => gor(() => sattFavorit(p.id, false))}>
                  <Star className="size-5 fill-primary text-primary" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Sektion>
    </div>
  )
}

/** En påse man har hemma: namnet, märkningen för bäst före, antalet med minus och plus, datumet och Ta bort. */
function Hemmarad({ rad, pase, idag, gor }: { rad: Skafferirad; pase: Matprodukt; idag: string; gor: (handling: () => Promise<boolean>) => Promise<void> }) {
  const id = useId()
  const [datum, setDatum] = useState(rad.bast_fore ?? '')
  const status = bastForeStatus(rad.bast_fore, idag)
  const namn = pasnamn(pase)

  function sparaDatum(varde: string) {
    setDatum(varde)
    // Ett ofullständigt datum sparas inte. Ett tomt fält tar bort datumet.
    if (varde !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(varde)) return
    if ((varde || null) === rad.bast_fore) return
    void gor(() => andraSkafferirad(rad.id, { bast_fore: varde || null }))
  }

  return (
    <li className="space-y-2 py-3">
      <div className="space-y-0.5">
        <Link to={pasadress(pase.id)} className={cn('inline-flex min-h-11 items-center rounded-md font-medium break-words underline-offset-4 hover:underline', fokus)}>
          {namn}
        </Link>
        {rad.bast_fore && <p className="text-sm text-muted-foreground">Bäst före {formateraDatum(rad.bast_fore)}</p>}
        {status === 'passerat' && <p className="text-sm font-medium text-accent-strong">{BASTFORE_TEXT.passerat}. Räknas inte som hemma i inköpslistan.</p>}
        {status === 'snart' && <p className="text-sm font-medium text-accent-strong">{BASTFORE_TEXT.snart}</p>}
      </div>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
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
        <div className="space-y-1">
          <label htmlFor={`${id}-datum`} className="block text-xs text-muted-foreground">
            Bäst före (frivilligt)
          </label>
          <Input id={`${id}-datum`} type="date" className="w-auto" value={datum} onChange={(e) => sparaDatum(e.target.value)} />
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
