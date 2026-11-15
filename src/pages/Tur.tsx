import { Backpack, CalendarDays, ChevronLeft, CookingPot, MapPin, RefreshCw, Route, Trash2, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Namnbrickor } from '@/components/app/Namnbricka'
import { TurBild } from '@/components/app/TurBild'
import { Deltagarlista } from '@/components/tur/Deltagarlista'
import { TurUppgifter } from '@/components/tur/TurUppgifter'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { tolkaRad } from '@/lib/hamtning'
import { ROLLNAMN, arAgare, kanAndra } from '@/lib/roller'
import { supabase } from '@/lib/supabase'
import { datumrad, deltagareText } from '@/lib/turlista'
import type { DeltagareRad, Tur } from '@/lib/typer'

/** Delarna som byggs härnäst. De visas som kommande, inte som knappar. */
const KOMMANDE: { ikon: LucideIcon; namn: string; text: string }[] = [
  { ikon: Backpack, namn: 'Packa', text: 'Packlista och vikt för gruppen' },
  { ikon: CookingPot, namn: 'Mat', text: 'Måltider och inköpslista' },
  { ikon: Route, namn: 'Rutt', text: 'Dagsetapper längs vägen' },
]

function Tillbaka() {
  return (
    <Link
      to="/turer"
      className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
    >
      <ChevronLeft className="size-4" aria-hidden />
      Tillbaka till Mina turer
    </Link>
  )
}

/** Deltagarna i turen, eller null om de inte gick att hämta. */
async function hamtaDeltagare(id: string | undefined): Promise<DeltagareRad[] | null> {
  if (!supabase || !id) return null
  const { data, error } = await supabase.from('deltagare').select('id, namn, typ, roll, user_id').eq('tur_id', id).order('sortering')
  return error ? null : ((data as DeltagareRad[]) ?? [])
}

/** Turen och deltagarna. Utan deltagarna vet vi inte vilken roll man har, så då räknas hela hämtningen som misslyckad. */
async function hamtaTur(id: string | undefined): Promise<{ tur: Tur | 'saknas' | 'fel'; deltagare: DeltagareRad[] }> {
  if (!supabase || !id) return { tur: 'saknas', deltagare: [] }
  const [svar, deltagare] = await Promise.all([
    supabase.from('turer').select('id, namn, destination, startpunkt, avresa, hemkomst, dagar, reservdagar').eq('id', id).maybeSingle(),
    hamtaDeltagare(id),
  ])
  const rad = tolkaRad<Tur>({ data: svar.data as Tur | null, error: svar.error })
  if (rad.lage !== 'klar') return { tur: rad.lage, deltagare: [] }
  return deltagare ? { tur: rad.data, deltagare } : { tur: 'fel', deltagare: [] }
}

/** Turens översikt. Varje tur får en egen uppsättning tillstånd, så att förra turen aldrig syns medan nästa hämtas. */
export function TurSida() {
  const { id } = useParams()
  return <TurOversikt key={id} id={id} />
}

function TurOversikt({ id }: { id: string | undefined }) {
  const navigate = useNavigate()
  const { anvandarId: mittUserId } = useApp()
  // undefined medan turen hämtas, 'saknas' när den inte finns (eller man inte är med) och 'fel' när den inte gick att hämta.
  const [tur, setTur] = useState<Tur | 'saknas' | 'fel' | undefined>(undefined)
  const [deltagare, setDeltagare] = useState<DeltagareRad[]>([])
  const [raderfel, setRaderfel] = useState(false)

  const uppdateraDeltagare = useCallback(async () => {
    const rader = await hamtaDeltagare(id)
    if (rader) setDeltagare(rader)
  }, [id])

  const visa = useCallback((svar: Awaited<ReturnType<typeof hamtaTur>>) => {
    setDeltagare(svar.deltagare)
    setTur(svar.tur)
  }, [])

  useEffect(() => {
    hamtaTur(id).then(visa)
  }, [id, visa])

  useSidtitel(typeof tur === 'object' ? tur.namn : tur === undefined ? 'Hämtar turen' : 'Tur')

  if (tur === undefined)
    return (
      <p role="status" className="text-muted-foreground">
        Hämtar turen …
      </p>
    )
  if (tur === 'saknas')
    return (
      <div className="space-y-4">
        <Tillbaka />
        <p>Turen finns inte, eller så är du inte med i den.</p>
      </div>
    )
  if (tur === 'fel')
    return (
      <div className="space-y-4">
        <Tillbaka />
        <div role="alert" className="space-y-3">
          <p className="text-destructive">Det gick inte att hämta turen. Kontrollera uppkopplingen och försök igen.</p>
          <Button
            variant="outline"
            onClick={() => {
              setTur(undefined)
              hamtaTur(id).then(visa)
            }}
          >
            <RefreshCw className="size-4" aria-hidden />
            Försök igen
          </Button>
        </div>
      </div>
    )

  const minRoll = deltagare.find((d) => d.user_id === mittUserId)?.roll ?? null
  const personer = deltagare.filter((d) => d.typ === 'person').map((d) => d.namn)

  async function radera() {
    if (!supabase || typeof tur !== 'object') return
    if (!window.confirm(`Radera ${tur.namn}? Allt i turen försvinner för alla och går inte att få tillbaka.`)) return
    setRaderfel(false)
    const { error } = await supabase.from('turer').delete().eq('id', tur.id)
    if (error) setRaderfel(true)
    else navigate('/turer', { replace: true, state: { besked: `${tur.namn} är raderad.` } })
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="space-y-3">
        <Tillbaka />
        <TurBild
          turId={tur.id}
          sizes="(min-width: 1024px) 960px, 100vw"
          prioritet
          className="aspect-[16/9] w-full rounded-lg shadow-soft sm:aspect-[21/8] lg:aspect-[3/1]"
        />
      </div>

      <header className="space-y-3">
        <h1 className="text-2xl break-words sm:text-3xl lg:text-4xl">{tur.namn}</h1>
        <div className="flex flex-col gap-1.5 text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-5">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            {datumrad(tur)}
          </p>
          {tur.destination && (
            <p className="flex min-w-0 items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 break-words">{tur.destination}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {personer.length > 0 && (
            <a
              href="#deltagare"
              className="inline-flex min-h-11 items-center gap-3 rounded-md font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-ring"
            >
              <Namnbrickor namn={personer} />
              Gruppen · {deltagareText(deltagare)}
            </a>
          )}
          {minRoll && <span className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">Du är {ROLLNAMN[minRoll].toLowerCase()}</span>}
        </div>
      </header>

      {/* I mobil: uppgifterna, gruppen och sist det som kommer. På dator står gruppen i en egen kolumn till höger. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <TurUppgifter key={tur.id} tur={tur} kanAndra={kanAndra(minRoll)} onSparad={setTur} />
        </div>

        <div id="deltagare" className="scroll-mt-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Deltagarlista
            tur={tur}
            deltagare={deltagare}
            minRoll={minRoll}
            mittUserId={mittUserId}
            onAndrad={uppdateraDeltagare}
            onLamnat={() => navigate('/turer', { replace: true })}
          />
        </div>

          <section aria-labelledby="kommer-snart" className="space-y-3 lg:col-start-1 lg:row-start-2">
          <h2 id="kommer-snart" className="text-lg">
            Kommer snart
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {KOMMANDE.map(({ ikon: Ikon, namn, text }) => (
              <li key={namn} className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-3 sm:flex-col sm:items-start">
                <Ikon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-muted-foreground">{namn}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Kommer snart</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {arAgare(minRoll) && (
        <div className="space-y-2 border-t border-border pt-4">
          <Button variant="ghost" className="text-destructive" onClick={radera}>
            <Trash2 className="size-4" aria-hidden />
            Radera turen
          </Button>
          {raderfel && (
            <p role="alert" className="text-sm text-destructive">
              Det gick inte att radera turen. Kontrollera uppkopplingen och försök igen.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
