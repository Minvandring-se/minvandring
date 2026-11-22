import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { Card } from '@/components/ui/card'
import { useSession } from '@/hooks/useSession'
import { useSidtitel } from '@/hooks/useSidtitel'
import { nastaSteg, tolkaInbjudan, type Inbjudan } from '@/lib/inbjudan'
import { supabase } from '@/lib/supabase'

const FEL_LANK = 'Inbjudan fungerar inte. Be om en ny länk.'
const FEL_FORSOK = 'Du har provat för många länkar som inte fungerar. Vänta en timme och försök igen.'
const FEL_NAT = 'Det gick inte att gå med just nu. Kontrollera uppkopplingen och försök igen.'

type Lage = { steg: 'laddar' } | { steg: 'fraga'; inbjudan: Inbjudan } | { steg: 'fel'; text: string; forsokIgen: boolean }

/** Felet från databasen som text till användaren. */
function feltext(meddelande: string | undefined): Lage {
  if (meddelande?.includes('Hittar ingen tur')) return { steg: 'fel', text: FEL_LANK, forsokIgen: false }
  if (meddelande?.includes('För många försök')) return { steg: 'fel', text: FEL_FORSOK, forsokIgen: false }
  if (meddelande?.includes('går inte att ta över')) return { steg: 'fel', text: 'Någon annan har redan valt den personen. Öppna länken igen och välj på nytt.', forsokIgen: true }
  return { steg: 'fel', text: FEL_NAT, forsokIgen: true }
}

/**
 * /ga-med/KOD: loggar in vid behov och lägger till den inloggade i turen.
 * Har turen personer utan konto får man först frågan "Är du någon av de här?", så att man kan ta över
 * den personen i stället för att bli en dubblett.
 */
export function GaMed() {
  const { kod = '' } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const [lage, setLage] = useState<Lage>({ steg: 'laddar' })
  const [gar, setGar] = useState(false)
  const [omgang, setOmgang] = useState(0)
  const inloggad = !!session
  useSidtitel('Gå med i en tur')

  useEffect(() => {
    if (!inloggad || !supabase) return
    const klient = supabase
    let aktuell = true
    const visa = (nytt: Lage) => aktuell && setLage(nytt)
    const oppna = (turId: string) => aktuell && navigate(`/tur/${turId}`, { replace: true })

    /** Går med som ny deltagare. Används också när databasen inte har funktionen inbjudan än. */
    const gaMedDirekt = async () => {
      const { data, error } = await klient.rpc('ga_med', { kod })
      if (error) return visa(feltext(error.message))
      if (typeof data !== 'string') return visa({ steg: 'fel', text: FEL_LANK, forsokIgen: false })
      oppna(data)
    }

    klient.rpc('inbjudan', { kod }).then(({ data, error }) => {
      // PGRST202: funktionen finns inte än (migreringen är inte körd). Gå då med som förut.
      if (error?.code === 'PGRST202') return gaMedDirekt()
      if (error) return visa(feltext(error.message))
      const inbjudan = tolkaInbjudan(data)
      if (!inbjudan) return visa({ steg: 'fel', text: FEL_LANK, forsokIgen: false })
      const steg = nastaSteg(inbjudan)
      if (steg === 'oppna') return oppna(inbjudan.turId)
      if (steg === 'ga-med') return gaMedDirekt()
      visa({ steg: 'fraga', inbjudan })
    })
    return () => {
      aktuell = false
    }
  }, [inloggad, kod, navigate, omgang])

  /** Går med, antingen som en av personerna utan konto eller som ny deltagare. */
  async function valj(som: string | null) {
    if (!supabase) return
    setGar(true)
    const { data, error } = await supabase.rpc('ga_med', som ? { kod, som } : { kod })
    setGar(false)
    if (error) return setLage(feltext(error.message))
    if (typeof data !== 'string') return setLage({ steg: 'fel', text: FEL_LANK, forsokIgen: false })
    navigate(`/tur/${data}`, { replace: true })
  }

  if (session === null) return <Navigate to={`/logga-in?vidare=${encodeURIComponent(`/ga-med/${kod}`)}`} replace />

  if (lage.steg === 'fel')
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-4">
        <h1 className="text-2xl">Det gick inte att gå med</h1>
        <p role="alert">{lage.text}</p>
        <div className="flex flex-wrap gap-2">
          {lage.forsokIgen && (
            <Button
              onClick={() => {
                setLage({ steg: 'laddar' })
                setOmgang((n) => n + 1)
              }}
            >
              Försök igen
            </Button>
          )}
          <Link
            to="/turer"
            className={knappStil({ variant: 'outline' })}
          >
            Till Mina turer
          </Link>
        </div>
      </Card>
    )

  if (lage.steg === 'fraga') {
    const { inbjudan } = lage
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Du går med i</p>
          <h1 className="text-2xl break-words">{inbjudan.turnamn}</h1>
        </div>
        <div className="space-y-3">
          <h2 id="vem-rubrik" className="text-lg">
            Är du någon av de här?
          </h2>
          <p className="text-sm text-muted-foreground">
            De är redan tillagda i turen utan konto. Väljer du dig själv tar du över den platsen, så att du inte hamnar med två gånger.
          </p>
          <ul aria-labelledby="vem-rubrik" className="space-y-2">
            {inbjudan.personer.map((p) => (
              <li key={p.id}>
                <Button variant="outline" className="h-auto min-h-12 w-full justify-start py-2 text-left text-base" disabled={gar} onClick={() => valj(p.id)}>
                  <span className="min-w-0 break-words">Jag är {p.namn}</span>
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="w-full" disabled={gar} onClick={() => valj(null)}>
            Ingen av dem
          </Button>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {gar && 'Går med i turen …'}
        </p>
      </Card>
    )
  }

  return (
    <p role="status" className="text-muted-foreground">
      Går med i turen …
    </p>
  )
}
