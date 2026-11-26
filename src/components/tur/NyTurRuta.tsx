import { X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { TurMedDeltagare } from '@/components/app/TurKort'
import { glomTurlistan, mindTurlista } from '@/components/app/turlistaMinne'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VanVal } from '@/components/vanner/VanVal'
import { laggTillVannerITur, useMinaVanner } from '@/hooks/useVanner'
import { MAX_TURNAMN, tolkaNyTur } from '@/lib/nytur'
import { supabase } from '@/lib/supabase'
import { sammaSom, turerMedVanner } from '@/lib/vanner'

/** Ens turer med deltagare, för Samma vänner som i. Den sparade listan används direkt om den finns. */
function useTurerMedDeltagare(anvandarId: string | null): TurMedDeltagare[] {
  const [turer, setTurer] = useState<TurMedDeltagare[]>(() => (anvandarId ? mindTurlista(anvandarId) : null) ?? [])
  useEffect(() => {
    if (!supabase) return
    let aktuell = true
    supabase
      .from('turer')
      .select('id, namn, destination, avresa, hemkomst, dagar, skapad, deltagare(namn, typ, sortering, user_id)')
      .then(({ data, error }) => {
        if (aktuell && !error) setTurer((data as TurMedDeltagare[] | null) ?? [])
      })
    return () => {
      aktuell = false
    }
  }, [anvandarId])
  return turer
}

/**
 * Ny tur som en stor ruta: hela skärmen i mobil och nästan hela skärmen på dator. Bara det viktigaste: namnet, datum
 * från och till och vännerna som ska med. Skapa tur skapar turen, lägger till vännerna som redigerare och öppnar
 * turen. Allt annat ställs in i turen efteråt.
 */
export function NyTurRuta({ anvandarId, onStang }: { anvandarId: string | null; onStang: () => void }) {
  return (
    <Dialog
      etikett="Ny tur"
      onStang={onStang}
      // Hela skärmen i mobil, nästan hela på dator.
      className="h-dvh max-h-none w-full rounded-none sm:h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:rounded-yta"
    >
      <NyTurInnehall anvandarId={anvandarId} onStang={onStang} />
    </Dialog>
  )
}

/** Formuläret i rutan: namn, datum och vänner, och Skapa tur längst ner. */
export function NyTurInnehall({ anvandarId, onStang }: { anvandarId: string | null; onStang: () => void }) {
  const navigate = useNavigate()
  const id = useId()
  const [namn, setNamn] = useState('')
  const [avresa, setAvresa] = useState('')
  const [hemkomst, setHemkomst] = useState('')
  const [falt, setFalt] = useState<{ falt: 'namn' | 'datum'; fel: string } | null>(null)
  const [fel, setFel] = useState('')
  const [skapar, setSkapar] = useState(false)
  const vanner = useMinaVanner(true)
  const turer = useTurerMedDeltagare(anvandarId)
  const [valda, setValda] = useState<Set<string>>(new Set())
  const [sammaSomTur, setSammaSomTur] = useState('')
  const harVanner = Array.isArray(vanner) && vanner.length > 0
  const tidigare = Array.isArray(vanner) ? turerMedVanner(turer, vanner).slice(0, 10) : []

  async function skapa(e: FormEvent) {
    e.preventDefault()
    const tolkad = tolkaNyTur(namn, avresa, hemkomst)
    if (!tolkad.ok) return setFalt({ falt: tolkad.falt, fel: tolkad.fel })
    setFalt(null)
    if (!supabase) return
    setSkapar(true)
    setFel('')
    // Id:t väljs här och raden läses inte tillbaka. Man blir deltagare först när raden finns,
    // och innan dess släpper databasen inte fram turen till någon.
    const turId = crypto.randomUUID()
    const { error } = await supabase.from('turer').insert({ id: turId, ...tolkad.rad })
    if (error) {
      setSkapar(false)
      setFel('Det gick inte att skapa turen. Kontrollera uppkopplingen och försök igen.')
      return
    }
    // Gick det inte att lägga till vännerna öppnas inbjudan i turen, så att man kan försöka igen där.
    const tillagda = valda.size > 0 ? await laggTillVannerITur(turId, [...valda]) : null
    setSkapar(false)
    glomTurlistan()
    navigate(tillagda?.fel ? `/tur/${turId}#bjud-in` : `/tur/${turId}`, { replace: true })
  }

  function valjTur(turId: string) {
    setSammaSomTur(turId)
    const tur = turer.find((t) => t.id === turId)
    if (tur && Array.isArray(vanner)) setValda(sammaSom(vanner, tur.deltagare))
  }

  return (
      <form onSubmit={skapa} noValidate className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 sm:px-8 sm:py-4">
          <h2 className="text-2xl lg:text-3xl">Ny tur</h2>
          <Button type="button" variant="ghost" className="-mr-2 size-11 px-0" aria-label="Stäng" onClick={onStang}>
            <X className="size-5" aria-hidden />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-1">
              <label htmlFor={`${id}-namn`} className="block font-medium">
                Vad heter turen?
              </label>
              <Input
                id={`${id}-namn`}
                data-autofokus
                placeholder="Till exempel Sarek 2027"
                maxLength={MAX_TURNAMN}
                value={namn}
                aria-invalid={falt?.falt === 'namn'}
                aria-describedby={falt?.falt === 'namn' ? `${id}-namnfel` : undefined}
                onChange={(e) => {
                  setNamn(e.target.value)
                  if (falt?.falt === 'namn') setFalt(null)
                }}
                className="h-12 text-lg"
              />
              {falt?.falt === 'namn' && (
                <p id={`${id}-namnfel`} className="text-sm text-destructive">
                  {falt.fel}
                </p>
              )}
            </div>

            <fieldset className="space-y-2" aria-describedby={falt?.falt === 'datum' ? `${id}-datumfel` : `${id}-datumhjalp`}>
              <legend className="font-medium">När? (frivilligt)</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor={`${id}-fran`} className="block text-sm text-muted-foreground">
                    Från
                  </label>
                  <Input
                    id={`${id}-fran`}
                    type="date"
                    value={avresa}
                    aria-invalid={falt?.falt === 'datum'}
                    onChange={(e) => {
                      setAvresa(e.target.value)
                      if (falt?.falt === 'datum') setFalt(null)
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`${id}-till`} className="block text-sm text-muted-foreground">
                    Till
                  </label>
                  <Input
                    id={`${id}-till`}
                    type="date"
                    value={hemkomst}
                    min={avresa || undefined}
                    aria-invalid={falt?.falt === 'datum'}
                    onChange={(e) => {
                      setHemkomst(e.target.value)
                      if (falt?.falt === 'datum') setFalt(null)
                    }}
                  />
                </div>
              </div>
              {falt?.falt === 'datum' ? (
                <p id={`${id}-datumfel`} className="text-sm text-destructive">
                  {falt.fel}
                </p>
              ) : (
                <p id={`${id}-datumhjalp`} className="text-sm text-muted-foreground">
                  Vandringsdagarna räknas från datumen. Du kan också sätta dem senare.
                </p>
              )}
            </fieldset>

            {harVanner && (
              <div className="space-y-3">
                {tidigare.length > 0 && (
                  <div className="space-y-1">
                    <label htmlFor={`${id}-samma`} className="block font-medium">
                      Samma vänner som i
                    </label>
                    <Select id={`${id}-samma`} value={sammaSomTur} onChange={(e) => valjTur(e.target.value)}>
                      <option value="">Välj en tidigare tur</option>
                      {tidigare.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.namn}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <VanVal rubrik="Vänner som ska med" vanner={vanner} valda={valda} onAndra={setValda} />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {harVanner
                ? 'Vännerna läggs till som redigerare och får en notis. Startpunkt, etapper och fler deltagare lägger du till inne i turen.'
                : 'Startpunkt, etapper och deltagare lägger du till inne i turen.'}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 sm:px-8 sm:py-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {fel && (
              <p role="alert" className="text-sm text-destructive sm:mr-auto">
                {fel}
              </p>
            )}
            <Button type="submit" size="lg" disabled={skapar} className="w-full sm:w-auto">
              {skapar ? 'Skapar …' : 'Skapa tur'}
            </Button>
          </div>
        </div>
      </form>
  )
}
