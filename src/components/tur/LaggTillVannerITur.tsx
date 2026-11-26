import { UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Laddar, Skelett } from '@/components/app/Laddar'
import { Button } from '@/components/ui/button'
import { VanVal } from '@/components/vanner/VanVal'
import { laggTillVannerITur, useMinaVanner } from '@/hooks/useVanner'
import { laddfelText } from '@/lib/texter'
import { tillagdaText, vanfel, vannerUtanfor } from '@/lib/vanner'

/**
 * Lägg till vänner i turen: ens vänner som inte redan är med, att bocka i. De läggs till direkt som redigerare och
 * får en notis. Visas i inbjudan, ovanför länken, för ägare och redigerare.
 */
export function LaggTillVannerITur({ turId, medIturen, onAndrad }: { turId: string; medIturen: readonly (string | null)[]; onAndrad: () => void }) {
  const vanner = useMinaVanner(true)
  const [valda, setValda] = useState<Set<string>>(new Set())
  const [sparar, setSparar] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  if (vanner === null)
    return (
      <Laddar text="Hämtar dina vänner">
        <Skelett className="h-12 bg-card" />
      </Laddar>
    )
  if (vanner === 'fel') return <p className="text-sm text-destructive">{laddfelText('dina vänner')}</p>

  const utanfor = vannerUtanfor(vanner, medIturen)

  async function laggTill() {
    setSparar(true)
    setStatus(null)
    const ids = [...valda]
    const { antal, fel } = await laggTillVannerITur(turId, ids)
    setSparar(false)
    if (fel) return setStatus({ ok: false, text: vanfel(fel) })
    const namn = antal === 1 && Array.isArray(vanner) ? vanner.find((v) => v.user_id === ids[0])?.namn : undefined
    setStatus({ ok: true, text: tillagdaText(antal, namn) })
    setValda(new Set())
    onAndrad()
  }

  return (
    <div className="space-y-3 rounded-md bg-muted p-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="size-4 text-primary" aria-hidden />
        Lägg till vänner
      </p>
      {utanfor.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {vanner.length === 0 ? 'Du har inga vänner i MinVandring än. ' : 'Alla dina vänner är redan med. '}
          <Link to="/vanner" className="font-medium text-primary underline underline-offset-4">
            Till Vänner
          </Link>
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">De läggs till direkt som redigerare och får en notis. De kan alltid lämna turen själva.</p>
          <VanVal rubrik="Vilka ska med?" vanner={utanfor} valda={valda} onAndra={setValda} />
          <Button disabled={valda.size === 0 || sparar} onClick={() => void laggTill()}>
            {valda.size > 1 ? `Lägg till ${valda.size} vänner` : 'Lägg till'}
          </Button>
        </>
      )}
      <p role="status" className={status?.ok === false ? 'text-sm text-destructive' : 'text-sm font-medium text-primary'}>
        {status?.text}
      </p>
    </div>
  )
}
