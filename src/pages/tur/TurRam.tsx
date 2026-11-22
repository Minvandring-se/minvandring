import { CalendarDays, ChevronLeft, MapPin, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router'
import { useApp } from '@/components/app/appKontext'
import { Laddar, Skelett } from '@/components/app/Laddar'
import type { TurKontext } from '@/components/tur/turKontext'
import { Button } from '@/components/ui/button'
import { useSidtitel } from '@/hooks/useSidtitel'
import { tolkaRad } from '@/lib/hamtning'
import { supabase } from '@/lib/supabase'
import { aktivTurdel, synligaFlikar, turdelAdress, TURDELAR } from '@/lib/turdelar'
import { datumrad } from '@/lib/turlista'
import type { DeltagareRad, Tur } from '@/lib/typer'
import { cn } from '@/lib/utils'

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

/** Det som följer med i historiken när man öppnar en tur från listan, så att Tillbaka leder till samma plats i listan. */
interface Ursprung {
  franLista?: boolean
}

/**
 * Tillbaka till Mina turer. Kom man från listan går den bakåt i historiken, så att man hamnar där man var.
 * Annars (ny tur, en delad adress) är den en vanlig länk.
 */
function Tillbaka() {
  const navigate = useNavigate()
  const franLista = (useLocation().state as Ursprung | null)?.franLista === true
  const klass =
    '-ml-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring'
  const innehall = (
    <>
      <ChevronLeft className="size-4" aria-hidden />
      Tillbaka till Mina turer
    </>
  )
  return (
    <Link
      to="/turer"
      className={klass}
      onClick={(e) => {
        if (!franLista || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(-1)
      }}
    >
      {innehall}
    </Link>
  )
}

/** Ramen för en tur. Varje tur får en egen uppsättning tillstånd, så att förra turen aldrig syns medan nästa hämtas. */
export function TurRam() {
  const { id } = useParams()
  return <Ram key={id} id={id} />
}

/**
 * Hämtar turen och deltagarna en gång och delar dem med delsidorna (Översikt, Packa, Mat, Rutt).
 * Visar turens namn, datum och flikarna, och tar hand om saknad tur och fel vid hämtningen.
 */
function Ram({ id }: { id: string | undefined }) {
  const { pathname, state } = useLocation()
  const { anvandarId: mittUserId } = useApp()
  // undefined medan turen hämtas, 'saknas' när den inte finns (eller man inte är med) och 'fel' när den inte gick att hämta.
  const [tur, setTur] = useState<Tur | 'saknas' | 'fel' | undefined>(undefined)
  const [deltagare, setDeltagare] = useState<DeltagareRad[]>([])
  const aktiv = aktivTurdel(pathname)

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

  const delnamn = TURDELAR.find((d) => d.del === aktiv)!.namn
  const flikar = synligaFlikar()
  useSidtitel(typeof tur === 'object' ? (aktiv === 'oversikt' ? tur.namn : `${delnamn} · ${tur.namn}`) : tur === undefined ? 'Hämtar turen' : 'Tur')

  if (tur === undefined)
    return (
      <Laddar text="Hämtar turen" className="space-y-5 lg:space-y-6">
        <div className="space-y-3">
          <Skelett className="h-5 w-44" />
          <Skelett className="h-8 w-3/4 sm:h-9 lg:h-10" />
          <Skelett className="h-5 w-56 max-w-full" />
        </div>
        <Skelett className="aspect-[5/2] max-h-40 w-full rounded-lg sm:aspect-[21/8] sm:max-h-none lg:aspect-[3/1]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <Skelett className="h-64 rounded-lg" />
          <Skelett className="h-64 rounded-lg" />
        </div>
      </Laddar>
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

  const kontext: TurKontext = {
    tur,
    deltagare,
    minRoll: deltagare.find((d) => d.user_id === mittUserId)?.roll ?? null,
    mittUserId,
    setTur,
    uppdateraDeltagare,
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <header className="space-y-2">
        <Tillbaka />
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
      </header>

      {/*
        Bara byggda delar visas, och ingen flikrad alls när det bara finns en.
        Flikarna byter del utan att lägga till ett steg i historiken, så att bakåt alltid leder ut ur turen.
      */}
      {flikar.length > 0 && (
        <nav aria-label="Turens delar" className="border-b border-border">
          <ul className="-mb-px flex gap-1 sm:gap-2">
            {flikar.map(({ del, namn }) => (
              <li key={del}>
                <Link
                  to={turdelAdress(tur.id, del)}
                  replace
                  state={state}
                  aria-current={aktiv === del ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-4 sm:text-base',
                    aktiv === del ? 'border-primary text-primary' : 'border-transparent text-foreground hover:border-border',
                  )}
                >
                  {namn}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <Outlet context={kontext} />
    </div>
  )
}
