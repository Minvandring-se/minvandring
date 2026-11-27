import { ArrowLeft, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Laddfel } from '@/components/app/Laddfel'
import { SidRubrik } from '@/components/app/SidRubrik'
import { TomtLage } from '@/components/app/TomtLage'
import { LaggTillUtrustning } from '@/components/packning/LaggTillUtrustning'
import { Mallrad, type Mallandring } from '@/components/packlistor/Mallrad'
import { Mallvikt } from '@/components/packlistor/Mallvikt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sektion } from '@/components/ui/sektion'
import { useMittForrad } from '@/hooks/usePacklista'
import {
  andraMallrad,
  bytMallnamn,
  kopieraStartmall,
  laggTillMallrader,
  taBortMallrad,
  taBortPackmall,
  usePackmall,
  usePackmallar,
} from '@/hooks/usePackmallar'
import { useSidtitel } from '@/hooks/useSidtitel'
import { forvaldTyp } from '@/lib/forrad'
import {
  MALLNAMN_MAX,
  ledigtMallnamn,
  mallPerKategori,
  mallvikter,
  nastaSortering,
  nyMallrad,
  sakerText,
  sammanfatta,
  tolkaMallnamn,
  vemKolumner,
  type Packmall,
  type Packmallrad,
} from '@/lib/packmallar'
import { STARTMALLAR, type Startmall } from '@/lib/startmallar'

const lank =
  'inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const FEL = 'Det gick inte att spara. Kontrollera uppkopplingen och försök igen.'

function Tillbaka() {
  return (
    <Link to="/packlistor" className={lank}>
      <ArrowLeft className="size-4" aria-hidden />
      Packlistor
    </Link>
  )
}

/** Raderna per kategori, som i turens packlista. */
function Rader({
  rader,
  redigerbar,
  sparar,
  onAndra,
  onTaBort,
}: {
  rader: readonly Packmallrad[]
  redigerbar: boolean
  sparar: boolean
  onAndra?: (rad: Packmallrad, andring: Mallandring) => Promise<boolean>
  onTaBort?: (rad: Packmallrad) => void
}) {
  return mallPerKategori(rader).map((k) => (
    <div key={k.nyckel} className="space-y-1">
      <h3 className="text-base font-semibold">{k.etikett}</h3>
      <ul className="divide-y divide-border">
        {k.rader.map((r) => (
          <Mallrad
            key={r.id}
            rad={r}
            redigerbar={redigerbar}
            sparar={sparar}
            onAndra={onAndra && ((a) => onAndra(r, a))}
            onTaBort={onTaBort && (() => onTaBort(r))}
          />
        ))}
      </ul>
    </div>
  ))
}

/** En egen mall: vikten överst och raderna per kategori, att ändra som en packlista. Bara ägaren ser den. */
export function Packlista() {
  const { id = '' } = useParams()
  const { lage, laddaOm } = usePackmall(id)
  useSidtitel(lage.lage === 'klar' ? lage.mall.namn : 'Packlista')

  if (lage.lage === 'laddar')
    return (
      <Laddar text="Hämtar packlistan" className="space-y-4">
        <Skelett className="h-24 rounded-lg" />
        <Skelett className="h-72 rounded-lg" />
      </Laddar>
    )
  if (lage.lage === 'fel') return <Laddfel vad="packlistan" onForsokIgen={laddaOm} />
  if (lage.lage === 'saknas')
    return (
      <div className="space-y-4">
        <Tillbaka />
        <TomtLage rubrik="Packlistan finns inte" text="Den kan ha tagits bort. Dina packlistor finns under Packlistor." />
      </div>
    )
  return <Mallvy mall={lage.mall} laddaOm={laddaOm} />
}

function Mallvy({ mall, laddaOm }: { mall: Packmall; laddaOm: () => Promise<void> }) {
  const navigate = useNavigate()
  const forrad = useMittForrad()
  const [panel, setPanel] = useState(false)
  const [byter, setByter] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const rader = mall.packmallrader
  const s = sammanfatta(rader)

  async function gor(atgard: () => Promise<boolean>): Promise<boolean> {
    setFel(null)
    setSparar(true)
    const ok = await atgard()
    setSparar(false)
    if (ok) await laddaOm()
    else setFel(FEL)
    return ok
  }

  async function taBort() {
    if (!window.confirm(`Ta bort packlistan ”${mall.namn}”? Turerna du har lagt den i påverkas inte.`)) return
    if (await taBortPackmall(mall.id)) navigate('/packlistor', { replace: true })
    else setFel('Det gick inte att ta bort. Kontrollera uppkopplingen och försök igen.')
  }

  return (
    <div className="space-y-6">
      <Tillbaka />
      {byter ? (
        <BytNamn
          mall={mall}
          onKlar={async () => {
            setByter(false)
            await laddaOm()
          }}
          onAvbryt={() => setByter(false)}
        />
      ) : (
        <SidRubrik
          rubrik={mall.namn}
          text={mall.fran_tur_namn ? `Från ${mall.fran_tur_namn}. Bara du ser den.` : 'Bara du ser den.'}
          knappar={
            <>
              <Button variant="ghost" size="ikon" aria-label="Byt namn" onClick={() => setByter(true)}>
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="ikon" aria-label="Ta bort packlistan" onClick={taBort}>
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Sektion
          rubrik="Packlistan"
          className="lg:order-1"
          atgard={
            <Button onClick={() => setPanel(true)}>
              <Plus className="size-4 text-hjortron-ikon" aria-hidden />
              Lägg till utrustning
            </Button>
          }
        >
          {rader.length === 0 ? (
            <TomtLage kompakt text="Packlistan är tom. Lägg till utrustning ur ditt förråd, eller skriv in en ny sak." />
          ) : (
            <Rader
              rader={rader}
              redigerbar
              sparar={sparar}
              onAndra={(r, a) =>
                gor(() =>
                  andraMallrad(r.id, {
                    namn: a.namn,
                    antal: a.antal,
                    vikt_g: a.vikt_g,
                    ...vemKolumner(a.vem),
                  }),
                )
              }
              onTaBort={(r) => void gor(() => taBortMallrad(r.id))}
            />
          )}
          <p className="text-sm text-muted-foreground">Lägg packlistan i en tur med Från packlista under Packning.</p>
        </Sektion>
        <div className="lg:order-2 lg:sticky lg:top-6">
          <Mallvikt vikter={mallvikter(rader)} saker={s.saker} utanVikt={s.utanVikt} />
        </div>
      </div>

      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}

      {panel && (
        <LaggTillUtrustning
          saker={forrad.saker}
          mittId="mall"
          onForsokIgen={forrad.forsokIgen}
          onStang={() => setPanel(false)}
          onLaggTill={async (saker, bars) => {
            const start = nastaSortering(rader)
            const ok = await gor(() => laggTillMallrader(saker.map((sak, i) => nyMallrad(mall.id, sak, bars.som, start + i))))
            if (ok) setPanel(false)
            return ok
          }}
          onNySak={async (varden, bars) => {
            const ok = await gor(() => laggTillMallrader([nyMallrad(mall.id, varden, bars.som, nastaSortering(rader))]))
            if (ok) setPanel(false)
            return ok
          }}
        />
      )}
    </div>
  )
}

function BytNamn({ mall, onKlar, onAvbryt }: { mall: Packmall; onKlar: () => void; onAvbryt: () => void }) {
  const id = useId()
  const [namn, setNamn] = useState(mall.namn)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  async function spara(e: FormEvent) {
    e.preventDefault()
    const t = tolkaMallnamn(namn)
    if ('fel' in t) return setFel(t.fel)
    if (t.namn === mall.namn) return onAvbryt()
    setSparar(true)
    const r = await bytMallnamn(mall.id, t.namn)
    setSparar(false)
    if (r === 'namnet-finns') return setFel('Du har redan en packlista med det namnet.')
    if (r) return setFel(FEL)
    onKlar()
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        Namn på packlistan
      </label>
      <div className="flex flex-wrap gap-2">
        <Input id={id} value={namn} maxLength={MALLNAMN_MAX} onChange={(e) => setNamn(e.target.value)} className="min-w-0 flex-1 basis-56" autoFocus />
        <Button type="submit" disabled={sparar}>
          {sparar ? 'Sparar …' : 'Spara'}
        </Button>
        <Button type="button" variant="ghost" onClick={onAvbryt}>
          Avbryt
        </Button>
      </div>
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </form>
  )
}

/** Startmallens rader i samma form som en egen mall, för att visas med samma delar. */
function somMallrader(mall: Startmall): Packmallrad[] {
  return mall.rader.map((r, i) => ({
    id: `${mall.id}-${i}`,
    namn: r.namn,
    kategori: r.kategori,
    underkategori: r.underkategori,
    antal: r.antal ?? 1,
    vikt_g: null,
    typ: forvaldTyp(r.kategori, r.underkategori),
    alla: r.vem === 'alla',
    gemensam: r.vem === 'gemensam',
    egen_namn: null,
    egen_vikt_g: null,
    sortering: i + 1,
  }))
}

/** En av MinVandrings startmallar. Den går inte att ändra, men går att göra till en egen packlista. */
export function Startmallsida() {
  const { id = '' } = useParams()
  const mall = STARTMALLAR.find((m) => m.id === id)
  const navigate = useNavigate()
  const egna = usePackmallar()
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  useSidtitel(mall?.namn ?? 'Packlista')
  if (!mall) return <Navigate to="/packlistor" replace />
  const rader = somMallrader(mall)
  const s = sammanfatta(rader)

  async function gorTillEgen() {
    if (!mall) return
    setFel(null)
    setSparar(true)
    const finns = egna.lage.lage === 'klar' ? egna.lage.mallar.map((m) => m.namn) : []
    const r = await kopieraStartmall(mall, ledigtMallnamn(mall.namn, finns))
    setSparar(false)
    if ('fel' in r) return setFel('Det gick inte att skapa packlistan. Kontrollera uppkopplingen och försök igen.')
    navigate(`/packlistor/${r.id}`)
  }

  return (
    <div className="space-y-6">
      <Tillbaka />
      <SidRubrik
        rubrik={mall.namn}
        text={`${mall.beskrivning} En färdig lista från MinVandring, utan vikter. Gör den till din egen för att ändra den och fylla i vikterna.`}
        knappar={
          <Button disabled={sparar} onClick={gorTillEgen}>
            <Copy className="size-4" aria-hidden />
            {sparar ? 'Skapar …' : 'Gör till min egen'}
          </Button>
        }
      />
      {fel && (
        <p role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <Sektion rubrik="Packlistan" atgard={<span className="text-sm text-muted-foreground">{sakerText(s.saker)}</span>}>
        <Rader rader={rader} redigerbar={false} sparar={false} />
        <p className="text-sm text-muted-foreground">Lägg den i en tur med Från packlista under Packning.</p>
      </Sektion>
    </div>
  )
}
