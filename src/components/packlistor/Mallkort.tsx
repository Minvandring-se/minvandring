import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { bytMallnamn, taBortPackmall } from '@/hooks/usePackmallar'
import { formateraVikt } from '@/lib/forrad'
import { MALLNAMN_MAX, mallPerKategori, sakerText, sammanfatta, tolkaMallnamn, visadVikt, visatNamn, type Packmall } from '@/lib/packmallar'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** En mall: namn, var den kom ifrån, antal saker och basvikt. Raderna fälls ut, och namnet går att byta. */
export function Mallkort({ mall, onAndrad }: { mall: Packmall; onAndrad: () => Promise<void> }) {
  const id = useId()
  const [oppen, setOppen] = useState(false)
  const [byter, setByter] = useState(false)
  const [namn, setNamn] = useState(mall.namn)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)
  const s = sammanfatta(mall.packmallrader)

  async function sparaNamn(e: FormEvent) {
    e.preventDefault()
    const t = tolkaMallnamn(namn)
    if ('fel' in t) return setFel(t.fel)
    if (t.namn === mall.namn) return setByter(false)
    setFel(null)
    setSparar(true)
    const resultat = await bytMallnamn(mall.id, t.namn)
    setSparar(false)
    if (resultat === 'namnet-finns') return setFel('Du har redan en mall med det namnet.')
    if (resultat) return setFel('Det gick inte att spara. Försök igen.')
    setByter(false)
    await onAndrad()
  }

  async function taBort() {
    if (!window.confirm(`Ta bort mallen ${mall.namn}? Turerna du har lagt den i påverkas inte.`)) return
    setFel(null)
    const ok = await taBortPackmall(mall.id)
    if (!ok) return setFel('Det gick inte att ta bort. Försök igen.')
    await onAndrad()
  }

  const detaljer = [sakerText(s.saker), s.basvikt_g > 0 ? `basvikt ${formateraVikt(s.basvikt_g)}` : null, s.gemensamt_g > 0 ? `gemensamt ${formateraVikt(s.gemensamt_g)}` : null]

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      {byter ? (
        <form onSubmit={sparaNamn} className="space-y-2" noValidate>
          <label htmlFor={`${id}-namn`} className="text-sm font-medium">
            Namn på mallen
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id={`${id}-namn`}
              value={namn}
              maxLength={MALLNAMN_MAX}
              onChange={(e) => setNamn(e.target.value)}
              className="min-w-0 flex-1 basis-48"
              aria-invalid={fel ? true : undefined}
              aria-describedby={fel ? `${id}-fel` : undefined}
              autoFocus
            />
            <Button type="submit" disabled={sparar}>
              {sparar ? 'Sparar …' : 'Spara'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setByter(false)
                setNamn(mall.namn)
                setFel(null)
              }}
            >
              Avbryt
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-semibold break-words">{mall.namn}</h2>
            {mall.fran_tur_namn && <p className="text-sm break-words text-muted-foreground">Från {mall.fran_tur_namn}</p>}
            <p className="mt-1 text-sm">{detaljer.filter(Boolean).join(', ')}</p>
          </div>
          <Button variant="ghost" size="ikon" aria-label={`Byt namn på ${mall.namn}`} onClick={() => setByter(true)}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="ikon" aria-label={`Ta bort ${mall.namn}`} onClick={taBort}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      {fel && (
        <p id={`${id}-fel`} role="alert" className="mt-2 text-sm text-destructive">
          {fel}
        </p>
      )}

      {mall.packmallrader.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={oppen}
            aria-controls={`${id}-rader`}
            onClick={() => setOppen(!oppen)}
            className={`mt-2 -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-knapp px-2 text-sm font-medium text-primary hover:bg-muted ${fokus}`}
          >
            <ChevronDown className={`size-4 transition-transform ${oppen ? 'rotate-180' : ''}`} aria-hidden />
            {oppen ? 'Dölj sakerna' : 'Visa sakerna'}
          </button>
          {oppen && (
            <div id={`${id}-rader`} className="mt-2 space-y-3">
              {mallPerKategori(mall.packmallrader).map((k) => (
                <div key={k.nyckel}>
                  <h3 className="text-sm font-semibold">{k.etikett}</h3>
                  <ul className="divide-y divide-border text-sm">
                    {k.rader.map((r) => {
                      const vikt = visadVikt(r)
                      const vem = r.gemensam ? 'Gemensam' : r.alla ? 'Alla har' : null
                      return (
                        <li key={r.id} className="flex items-baseline justify-between gap-3 py-1.5">
                          <span className="min-w-0 break-words">
                            {r.antal > 1 && `${r.antal} × `}
                            {visatNamn(r)}
                            {vem && <span className="text-muted-foreground"> · {vem}</span>}
                          </span>
                          <span className="shrink-0 text-muted-foreground tabular-nums">{vikt === null ? 'Ingen vikt' : formateraVikt(vikt)}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </li>
  )
}
