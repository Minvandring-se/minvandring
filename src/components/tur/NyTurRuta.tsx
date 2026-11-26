import { X } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import type { TurMedDeltagare } from '@/components/app/TurKort'
import { glomTurlistan, mindTurlista } from '@/components/app/turlistaMinne'
import { Button } from '@/components/ui/button'
import { Delval } from '@/components/ui/delval'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { VanVal } from '@/components/vanner/VanVal'
import { useGrupper } from '@/hooks/useGrupper'
import { laggTillVannerITur, useMinaVanner } from '@/hooks/useVanner'
import { valjGrupp } from '@/lib/grupper'
import { MAX_DAGAR, MAX_TURNAMN, tolkaNyTur, type Nar } from '@/lib/nytur'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { sammaSom, turerMedVanner } from '@/lib/vanner'

/** Ens turer med deltagare, för Fyll i vännerna från. Den sparade listan används direkt om den finns. */
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
 * Ny tur som en ruta mitt på skärmen. På dator är den cirka 50 rem bred och så hög som innehållet, och appen bakom blir
 * suddig och mörkare. I mobil täcker den hela skärmen. Bara det viktigaste: namnet, När (datum eller antal dagar) och
 * vännerna som ska med. Skapa tur skapar turen, lägger till vännerna som redigerare och öppnar turen. Allt annat
 * ställs in i turen efteråt. grupp är en grupp från adressen (?grupp=, Ny tur med gruppen på Vänner).
 */
export function NyTurRuta({ anvandarId, grupp, onStang }: { anvandarId: string | null; grupp: string | null; onStang: () => void }) {
  return (
    <Dialog
      etikett="Ny tur"
      onStang={onStang}
      // Hela skärmen i mobil. På dator en ruta efter innehållet, med suddig bakgrund (bara mörk ton där blur saknas).
      className="h-dvh max-h-none w-full rounded-none backdrop:backdrop-blur-[5px] sm:h-fit sm:max-h-[calc(100dvh-3rem)] sm:w-[min(100%-3rem,50rem)] sm:rounded-yta"
    >
      <NyTurInnehall anvandarId={anvandarId} grupp={grupp} onStang={onStang} />
    </Dialog>
  )
}

type Lage = Nar['lage']
const LAGEN: readonly { nyckel: Lage; namn: string }[] = [
  { nyckel: 'datum', namn: 'Datum' },
  { nyckel: 'dagar', namn: 'Antal dagar' },
]

/** Formuläret i rutan: namn och När till vänster, vännerna till höger, och Avbryt och Skapa tur längst ner. */
export function NyTurInnehall({ anvandarId, grupp = null, onStang }: { anvandarId: string | null; grupp?: string | null; onStang: () => void }) {
  const navigate = useNavigate()
  const id = useId()
  const [namn, setNamn] = useState('')
  const [lage, setLage] = useState<Lage>('datum')
  const [avresa, setAvresa] = useState('')
  const [hemkomst, setHemkomst] = useState('')
  const [dagar, setDagar] = useState('')
  const [falt, setFalt] = useState<{ falt: 'namn' | 'datum' | 'dagar'; fel: string } | null>(null)
  const [fel, setFel] = useState('')
  const [skapar, setSkapar] = useState(false)
  const vanner = useMinaVanner(true)
  const { grupper } = useGrupper()
  const turer = useTurerMedDeltagare(anvandarId)
  const [valda, setValda] = useState<Set<string>>(new Set())
  // Det valda i Fyll i vännerna från: g:<grupp> eller t:<tur>.
  const [fran, setFran] = useState(grupp ? `g:${grupp}` : '')
  const [forifyllt, setForifyllt] = useState(!grupp)
  const harVanner = Array.isArray(vanner) && vanner.length > 0
  const tidigare = Array.isArray(vanner) ? turerMedVanner(turer, vanner).slice(0, 10) : []
  const minaGrupper = Array.isArray(grupper) ? grupper.filter((g) => g.medlemmar.length > 0) : []
  // Gruppen från adressen fylls i när vännerna och grupperna har hämtats, en gång.
  if (!forifyllt && Array.isArray(vanner) && Array.isArray(grupper)) {
    setForifyllt(true)
    const g = grupper.find((x) => x.id === grupp)
    if (g) setValda(valjGrupp(g, vanner))
    else setFran('')
  }

  async function skapa(e: FormEvent) {
    e.preventDefault()
    const tolkad = tolkaNyTur(namn, lage === 'datum' ? { lage, avresa, hemkomst } : { lage, dagar })
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

  function fyllI(varde: string) {
    setFran(varde)
    if (!Array.isArray(vanner)) return
    const [sort, nyckel] = [varde.slice(0, 2), varde.slice(2)]
    const g = sort === 'g:' && Array.isArray(grupper) ? grupper.find((x) => x.id === nyckel) : undefined
    const t = sort === 't:' ? turer.find((x) => x.id === nyckel) : undefined
    if (g) setValda(valjGrupp(g, vanner))
    if (t) setValda(sammaSom(vanner, t.deltagare))
  }

  const narFel = falt?.falt === 'datum' || falt?.falt === 'dagar' ? falt.fel : null
  const andraNar = () => {
    if (narFel) setFalt(null)
  }

  return (
    <form onSubmit={skapa} noValidate className="flex h-full flex-col bg-card sm:h-auto">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 sm:px-8 sm:py-4">
        <h2 className="text-2xl lg:text-3xl">Ny tur</h2>
        <Button type="button" variant="ghost" className="-mr-2 size-11 px-0" aria-label="Stäng" onClick={onStang}>
          <X className="size-5" aria-hidden />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className={cn('grid gap-8', harVanner && 'md:grid-cols-2')}>
          <div className="space-y-8">
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

            <fieldset className="space-y-3" aria-describedby={narFel ? `${id}-narfel` : `${id}-narhjalp`}>
              <legend className="mb-2 font-medium">När? (frivilligt)</legend>
              <Delval
                etikett="När"
                delar={LAGEN}
                vald={lage}
                onValj={(l) => {
                  setLage(l)
                  setFalt(null)
                }}
              />
              {lage === 'datum' ? (
                <div className="grid grid-cols-2 gap-3">
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
                        andraNar()
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
                        andraNar()
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label htmlFor={`${id}-dagar`} className="block text-sm text-muted-foreground">
                    Vandringsdagar
                  </label>
                  <Input
                    id={`${id}-dagar`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={MAX_DAGAR}
                    step={1}
                    value={dagar}
                    aria-invalid={falt?.falt === 'dagar'}
                    onChange={(e) => {
                      setDagar(e.target.value)
                      andraNar()
                    }}
                    className="w-32"
                  />
                </div>
              )}
              {narFel ? (
                <p id={`${id}-narfel`} className="text-sm text-destructive">
                  {narFel}
                </p>
              ) : (
                <p id={`${id}-narhjalp`} className="text-sm text-muted-foreground">
                  {lage === 'datum'
                    ? 'Vandringsdagarna räknas från datumen. Du kan också fylla i det senare i turen.'
                    : `Högst ${MAX_DAGAR} dagar. Datumen kan du fylla i senare i turen.`}
                </p>
              )}
            </fieldset>
          </div>

          {harVanner && (
            <div className="space-y-6">
              {(minaGrupper.length > 0 || tidigare.length > 0) && (
                <div className="space-y-1">
                  <label htmlFor={`${id}-franval`} className="block font-medium">
                    Fyll i vännerna från
                  </label>
                  <Select id={`${id}-franval`} value={fran} onChange={(e) => fyllI(e.target.value)}>
                    <option value="">Välj en grupp eller en tidigare tur</option>
                    {minaGrupper.length > 0 && (
                      <optgroup label="Grupper">
                        {minaGrupper.map((g) => (
                          <option key={g.id} value={`g:${g.id}`}>
                            {g.namn}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {tidigare.length > 0 && (
                      <optgroup label="Samma som i">
                        {tidigare.map((t) => (
                          <option key={t.id} value={`t:${t.id}`}>
                            {t.namn}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                </div>
              )}
              <VanVal rubrik="Vänner som ska med" vanner={vanner} valda={valda} onAndra={setValda} />
            </div>
          )}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          {harVanner
            ? 'Vännerna läggs till som redigerare och får en notis. Startpunkt, etapper och fler deltagare lägger du till inne i turen.'
            : 'Startpunkt, etapper och deltagare lägger du till inne i turen.'}
        </p>
      </div>

      <div className="border-t border-border px-5 py-3 sm:px-8 sm:py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {fel && (
            <p role="alert" className="text-sm text-destructive sm:mr-auto">
              {fel}
            </p>
          )}
          <Button type="button" variant="outline" size="lg" onClick={onStang} className="w-full sm:w-auto">
            Avbryt
          </Button>
          <Button type="submit" size="lg" disabled={skapar} className="w-full sm:w-auto">
            {skapar ? 'Skapar …' : 'Skapa tur'}
          </Button>
        </div>
      </div>
    </form>
  )
}
