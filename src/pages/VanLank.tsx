import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { knappStil } from '@/components/ui/knappStil'
import { useSession } from '@/hooks/useSession'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'
import { VANNER_I_TURER, vanfel, type Vanlankinfo } from '@/lib/vanner'

const FEL_LANK = 'Vänlänken fungerar inte. Den kan ha gått ut eller bytts ut. Be om en ny länk.'

type Lage = { steg: 'laddar' } | { steg: 'fraga'; info: Vanlankinfo } | { steg: 'klar'; namn: string } | { steg: 'fel'; text: string }

/** /van/KOD: loggar in vid behov, visar vems vänlänk det är och gör er till vänner med ett tryck. */
export function VanLank() {
  const { kod = '' } = useParams()
  const session = useSession()
  const [lage, setLage] = useState<Lage>({ steg: 'laddar' })
  const [gar, setGar] = useState(false)
  const inloggad = !!session
  useSidtitel('Bli vänner')

  useEffect(() => {
    if (!inloggad || !supabase) return
    let aktuell = true
    supabase.rpc('vanlank_info', { kod }).then(({ data, error }) => {
      if (!aktuell) return
      if (error) return setLage({ steg: 'fel', text: vanfel(error.message) })
      const info = data as Vanlankinfo | null
      if (!info) return setLage({ steg: 'fel', text: FEL_LANK })
      setLage(info.redan_van ? { steg: 'klar', namn: info.namn } : { steg: 'fraga', info })
    })
    return () => {
      aktuell = false
    }
  }, [inloggad, kod])

  async function bliVanner(namn: string) {
    if (!supabase) return
    setGar(true)
    const { data, error } = await supabase.rpc('bli_van_via_lank', { kod })
    setGar(false)
    if (error) return setLage({ steg: 'fel', text: vanfel(error.message) })
    if (!data) return setLage({ steg: 'fel', text: FEL_LANK })
    setLage({ steg: 'klar', namn })
  }

  if (session === null) return <Navigate to={`/logga-in?vidare=${encodeURIComponent(`/van/${kod}`)}`} replace />

  if (lage.steg === 'laddar')
    return (
      <Card className="mx-auto mt-10 max-w-md">
        <Laddar text="Hämtar vänlänken">
          <Skelett className="h-8 w-3/4" />
          <Skelett className="h-12" />
        </Laddar>
      </Card>
    )

  if (lage.steg === 'fel')
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-4">
        <h1 className="text-2xl">Det gick inte att bli vänner</h1>
        <p role="alert">{lage.text}</p>
        <Link to="/vanner" className={knappStil({ variant: 'outline' })}>
          Till Vänner
        </Link>
      </Card>
    )

  if (lage.steg === 'klar')
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-4">
        <h1 className="text-2xl break-words">Du och {lage.namn} är vänner</h1>
        <p className="text-muted-foreground">Nu ser ni varandras namn, bild och turer ihop på sidan Vänner.</p>
        <Link to="/vanner" className={knappStil()}>
          Till Vänner
        </Link>
      </Card>
    )

  const { info } = lage
  if (info.egen)
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-4">
        <h1 className="text-2xl">Det här är din vänlänk</h1>
        <p className="text-muted-foreground">Skicka den till dem du vandrar med. Den som öppnar den och trycker Bli vänner blir din vän direkt.</p>
        <Link to="/vanner" className={knappStil({ variant: 'outline' })}>
          Till Vänner
        </Link>
      </Card>
    )

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Vänlänk från</p>
        <h1 className="text-2xl break-words">{info.namn}</h1>
      </div>
      <p className="text-muted-foreground">
        Som vänner ser ni varandras namn och profilbild, och vilka turer ni har haft ihop. Allt annat är fortfarande privat. {VANNER_I_TURER}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={gar} onClick={() => void bliVanner(info.namn)}>
          Bli vänner
        </Button>
        <Link to="/hem" className={knappStil({ variant: 'ghost' })}>
          Inte nu
        </Link>
      </div>
    </Card>
  )
}
