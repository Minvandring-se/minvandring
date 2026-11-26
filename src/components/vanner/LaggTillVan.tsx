import { Copy, RefreshCw } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Hojdkurvor } from '@/components/ui/sokruta'
import { nyVanlank, skickaVanforfragan } from '@/hooks/useVanner'
import { giltigTillText, kontrolleraVanadress, vanfel, vanlankAdress, type Vanlank } from '@/lib/vanner'

/**
 * Lägg till en vän: sidans enda mörkgröna yta. En förfrågan via mejladress får alltid samma svar, vare sig adressen
 * har ett konto eller inte. Vänlänken kopieras, och Ny länk gör den gamla ogiltig.
 */
export function LaggTillVan({ lank, onAndrad }: { lank: Vanlank | null; onAndrad: () => void }) {
  const id = useId()
  const [epost, setEpost] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [svar, setSvar] = useState<{ ok: boolean; text: string } | null>(null)
  const [minLank, setMinLank] = useState<Vanlank | null>(null)
  const [lankstatus, setLankstatus] = useState('')
  const visadLank = minLank ?? lank

  async function skicka(e: FormEvent) {
    e.preventDefault()
    const fel = kontrolleraVanadress(epost)
    if (fel) return setSvar({ ok: false, text: fel })
    setSkickar(true)
    setSvar(null)
    const { fel: f } = await skickaVanforfragan(epost.trim())
    setSkickar(false)
    if (f) return setSvar({ ok: false, text: vanfel(f) })
    setSvar({ ok: true, text: `Förfrågan är skickad om ${epost.trim()} har ett konto på MinVandring.` })
    setEpost('')
    onAndrad()
  }

  async function kopiera() {
    if (!visadLank) return
    try {
      await navigator.clipboard.writeText(vanlankAdress(visadLank.kod))
      setLankstatus('Länken är kopierad.')
    } catch {
      setLankstatus('Det gick inte att kopiera. Markera länken och kopiera den själv.')
    }
  }

  async function bytLank() {
    if (!window.confirm('Göra en ny vänlänk? Den gamla slutar fungera direkt.')) return
    const ny = await nyVanlank()
    if (!ny) return setLankstatus('Det gick inte att göra en ny länk. Kontrollera uppkopplingen och försök igen.')
    setMinLank(ny)
    setLankstatus('Du har en ny länk. Den gamla fungerar inte längre.')
  }

  return (
    <section aria-labelledby={`${id}-rubrik`} className="relative overflow-hidden rounded-[1.375rem] bg-yta-stark text-yta-stark-foreground">
      <Hojdkurvor />
      <div className="relative space-y-5 px-5 py-6 sm:px-8 sm:py-7">
        <div className="space-y-1.5">
          <h2 id={`${id}-rubrik`} className="text-[1.75rem] leading-tight text-yta-stark-foreground lg:text-[2rem]">
            Lägg till en vän
          </h2>
          <p className="max-w-prose text-yta-stark-muted">Skriv mejladressen som din vän har registrerat sig med, eller skicka din vänlänk.</p>
        </div>

        <form onSubmit={skicka} noValidate className="max-w-2xl space-y-2">
          <label htmlFor={`${id}-epost`} className="block text-sm font-medium">
            Mejladress
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={`${id}-epost`}
              type="email"
              autoComplete="off"
              inputMode="email"
              maxLength={254}
              placeholder="namn@exempel.se"
              value={epost}
              onChange={(e) => setEpost(e.target.value)}
              aria-describedby={`${id}-svar`}
              className="h-12 w-full rounded-knapp border-0 bg-sokfalt px-4 text-base text-sokfalt-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yta-stark-foreground sm:flex-1"
            />
            <Button type="submit" variant="hjortron" size="lg" disabled={skickar}>
              Skicka förfrågan
            </Button>
          </div>
          <p id={`${id}-svar`} role="status" className="min-h-5 text-sm">
            {svar && <span className={svar.ok ? 'text-yta-stark-foreground' : 'font-medium text-yta-stark-foreground underline decoration-hjortron decoration-2 underline-offset-4'}>{svar.text}</span>}
          </p>
        </form>

        {visadLank && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="kant-stark" onClick={() => void kopiera()}>
                <Copy className="size-4" aria-hidden />
                Kopiera min vänlänk
              </Button>
              <Button variant="kant-stark" onClick={() => void bytLank()}>
                <RefreshCw className="size-4" aria-hidden />
                Ny länk
              </Button>
            </div>
            <p className="text-sm text-yta-stark-muted">
              {giltigTillText(visadLank.giltig_till)} Den som öppnar den och trycker Bli vänner blir din vän direkt.
            </p>
            <p role="status" className="min-h-5 text-sm">
              {lankstatus}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
