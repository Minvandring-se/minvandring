import { MoreHorizontal, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Menyikon } from '@/components/app/Menyikon'
import { Snart } from '@/components/ui/snart'
import { BLAD, bladIState, FLIKAR, flikAktiv, SIDOR, type Blad, type Sida } from '@/lib/meny'
import { cn } from '@/lib/utils'

const BLADIKON = { minnen: Sparkles, mer: MoreHorizontal }
const BLADRUBRIK: Record<Blad, string> = { minnen: 'Minnen', mer: 'Mer' }

const flikKlass =
  'flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

/**
 * Bottenmenyn i mobil, enligt skissen Sidomeny-mobil: Turer, Mat och Förråd går till sin sida, och Minnen och Mer
 * öppnar ett blad nerifrån. Bladet är en modal dialog: fokus flyttas in och tillbaka till fliken, och det stängs
 * med Esc, med tryck utanför, med krysset och med tillbaka-knappen.
 */
export function Bottenmeny({ aktiv }: { aktiv: Sida | null }) {
  const location = useLocation()
  const navigate = useNavigate()
  const iState = bladIState(location.state)
  const oppet = iState?.blad ?? null
  const adress = location.pathname + location.search + location.hash
  const dialog = useRef<HTMLDialogElement>(null)
  const flikar = useRef<Partial<Record<Blad, HTMLButtonElement | null>>>({})
  const senast = useRef<Blad | null>(null)
  // Spärrar mot två stängningar i rad (två snabba tryck), som annars vore två steg bakåt.
  const stanger = useRef(false)
  // Satt när man valde en sida i bladet. Då går fokus till innehållet i stället för till fliken.
  const gickVidare = useRef(false)
  const [senastVisat, setSenastVisat] = useState<Blad | null>(null)

  function oppna(blad: Blad) {
    // Medan ett blad är öppet når man inte flikarna (dialogen är modal), så här är inget blad öppet.
    setSenastVisat(blad)
    gickVidare.current = false
    navigate(adress, { state: { blad, steg: true } })
  }

  function stang() {
    if (!oppet || stanger.current) return
    stanger.current = true
    // Öppnades bladet i appen är posten före samma sida utan blad. Annars (efter omladdning) tas bladet bort på plats.
    if (iState?.steg) navigate(-1)
    else navigate(adress, { replace: true, state: null })
  }

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    stanger.current = false
    if (oppet) {
      senast.current = oppet
      if (!d.open) d.showModal()
      document.documentElement.style.overflow = 'hidden'
      return
    }
    document.documentElement.style.overflow = ''
    if (d.open) d.close()
    if (gickVidare.current) document.getElementById('innehall')?.focus()
    else if (senast.current) flikar.current[senast.current]?.focus()
    gickVidare.current = false
    senast.current = null
  }, [oppet])

  useEffect(() => () => void (document.documentElement.style.overflow = ''), [])

  // Blir fönstret så brett att sidomenyn visas stängs bladet, annars vore sidan bakom låst.
  const stangRef = useRef(stang)
  useEffect(() => {
    stangRef.current = stang
  })
  useEffect(() => {
    if (!oppet) return
    const dator = window.matchMedia('(min-width: 64rem)')
    const andrad = () => dator.matches && stangRef.current()
    dator.addEventListener('change', andrad)
    return () => dator.removeEventListener('change', andrad)
  }, [oppet])

  // Bladet ligger kvar med sitt innehåll medan dialogen stänger.
  const visat = oppet ?? senastVisat

  return (
    <>
      <nav
        aria-label="Huvudmeny"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {FLIKAR.map((flik) => {
            const markerad = oppet ? flik.typ === 'blad' && flik.blad === oppet : flikAktiv(flik, aktiv)
            const Bladikon = flik.typ === 'blad' ? BLADIKON[flik.blad] : null
            const innehall = (
              <>
                {flik.typ === 'sida' ? (
                  <Menyikon sida={flik.sida} storlek={24} aktiv={markerad} />
                ) : (
                  Bladikon && <Bladikon className="size-6" aria-hidden strokeWidth={markerad ? 2.25 : 1.75} />
                )}
                <span>{flik.namn}</span>
                {/* Markerad flik: fet text, fetare ikon och ett kort rostfärgat streck under. */}
                <span aria-hidden className={cn('h-[3px] w-[18px] rounded-full', markerad ? 'bg-accent' : 'bg-transparent')} />
              </>
            )
            const farg = markerad ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
            return (
              <li key={flik.namn}>
                {flik.typ === 'sida' ? (
                  <Link
                    to={SIDOR[flik.sida].till}
                    aria-current={aktiv === flik.sida ? 'page' : undefined}
                    className={cn(flikKlass, farg)}
                  >
                    {innehall}
                  </Link>
                ) : (
                  <button
                    type="button"
                    ref={(el) => {
                      flikar.current[flik.blad] = el
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={oppet === flik.blad}
                    aria-current={!oppet && markerad ? 'true' : undefined}
                    onClick={() => oppna(flik.blad)}
                    className={cn(flikKlass, farg)}
                  >
                    {innehall}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Dialogen täcker skärmen men är genomskinlig nederst, så att bottenmenyn syns under bladet. */}
      <dialog
        ref={dialog}
        aria-labelledby="blad-rubrik"
        onCancel={(e) => {
          e.preventDefault()
          stang()
        }}
        // Webbläsaren kan stänga dialogen själv (till exempel Esc två gånger i Chrome). Då tas bladet bort ur historiken också.
        onClose={stang}
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-foreground backdrop:bg-transparent lg:hidden"
      >
        <div className="flex h-full flex-col">
          <div aria-hidden className="flex-1 bg-sloja" onClick={stang} />
          {visat && (
            <section className="rounded-t-[1.375rem] bg-card px-5 pt-2.5 pb-2 shadow-soft">
              <div aria-hidden className="mx-auto mb-1 h-1 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between">
                <h2 id="blad-rubrik" className="font-sans text-xs font-semibold text-muted-foreground">
                  {BLADRUBRIK[visat]}
                </h2>
                <button
                  type="button"
                  onClick={stang}
                  className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <X className="size-5" aria-hidden />
                  <span className="sr-only">Stäng</span>
                </button>
              </div>
              <ul>
                {BLAD[visat].map((s) => {
                  const { namn, till, byggd, beskrivning } = SIDOR[s]
                  return (
                    <li key={s} className="border-b border-border last:border-b-0">
                      <Link
                        to={till}
                        replace
                        aria-current={aktiv === s ? 'page' : undefined}
                        onClick={() => {
                          gickVidare.current = true
                        }}
                        className="flex min-h-14 items-center gap-3.5 rounded-md px-1 py-2 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Menyikon sida={s} storlek={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn('block text-[0.9375rem]', aktiv === s ? 'font-bold text-primary' : 'font-semibold')}>{namn}</span>
                          <span className="block text-sm text-muted-foreground">{beskrivning}</span>
                        </span>
                        {!byggd && <Snart />}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
          {/* Lika hög som bottenmenyn. Ett tryck här stänger bladet. */}
          <div aria-hidden className="h-[calc(4rem+1px+env(safe-area-inset-bottom))] shrink-0" onClick={stang} />
        </div>
      </dialog>
    </>
  )
}
