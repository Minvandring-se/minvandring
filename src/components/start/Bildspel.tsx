import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// fokus = object-position, så att det viktiga syns när bilden beskärs.
const bilder = [
  { namn: '1-grupp', alt: 'En grupp vandrare på en stig genom en fjälldal på hösten', fokus: '60% 72%' },
  { namn: '2-sommarfjall', alt: 'En vandrare med packning på en stig i sommarfjällen', fokus: '70% 65%' },
  { namn: '3-utsikt', alt: 'En person står på en klippa och blickar ut över en fjälldal med sjö', fokus: '40% 58%' },
  { namn: '4-kust', alt: 'En vandrare på en kuststig längs havet', fokus: '25% 62%' },
  { namn: '5-norrsken', alt: 'Norrsken över fjäll och sjö', fokus: '45% 45%' },
]

/** Hur länge varje bild syns. Övertoningen (0,8 s) ligger i klassen duration-800. */
const VISNING_MS = 7000
const BREDDER = [640, 1280, 1920]

function srcset(namn: string) {
  return BREDDER.map((b) => `/hero/${namn}-${b}.webp ${b}w`).join(', ')
}

function useMinskaRorelse() {
  const [minska, setMinska] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const andra = () => setMinska(mq.matches)
    mq.addEventListener('change', andra)
    return () => mq.removeEventListener('change', andra)
  }, [])
  return minska
}

function useFlikenSyns() {
  const [syns, setSyns] = useState(() => document.visibilityState === 'visible')
  useEffect(() => {
    const andra = () => setSyns(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', andra)
    return () => document.removeEventListener('visibilitychange', andra)
  }, [])
  return syns
}

/**
 * Lugnt bildspel som bakgrund, utan pilar eller prickar.
 * Första bilden laddas direkt. De andra laddas när webbläsaren har tid över efter att sidan visats.
 * Med "minska rörelse" visas bara första bilden. Växlingen pausar när fliken inte syns.
 */
export function Bildspel() {
  const minskaRorelse = useMinskaRorelse()
  const syns = useFlikenSyns()
  const [aktiv, setAktiv] = useState(0)
  const [forra, setForra] = useState<number | null>(null)
  const [laddaResten, setLaddaResten] = useState(false)
  const [laddade, setLaddade] = useState<ReadonlySet<number>>(() => new Set())

  const visade = minskaRorelse || !laddaResten ? bilder.slice(0, 1) : bilder

  function laddad(i: number) {
    setLaddade((s) => new Set(s).add(i))
    if (i !== 0 || minskaRorelse) return
    const starta = () => setLaddaResten(true)
    if ('requestIdleCallback' in window) window.requestIdleCallback(starta, { timeout: 2500 })
    else setTimeout(starta, 1000)
  }

  useEffect(() => {
    if (minskaRorelse || !laddaResten || !syns) return
    // Nästa bild som hunnit laddas. Finns ingen väntar vi tills någon blir klar.
    let nasta = -1
    for (let steg = 1; steg < bilder.length; steg++) {
      const i = (aktiv + steg) % bilder.length
      if (laddade.has(i)) {
        nasta = i
        break
      }
    }
    if (nasta === -1) return
    const id = setTimeout(() => {
      setForra(aktiv)
      setAktiv(nasta)
    }, VISNING_MS)
    return () => clearTimeout(id)
  }, [aktiv, laddade, laddaResten, minskaRorelse, syns])

  return (
    <div className="absolute inset-0 isolate overflow-hidden bg-black">
      {visade.map((bild, i) => {
        const synlig = i === aktiv
        const under = i === forra
        return (
          <img
            key={bild.namn}
            src={`/hero/${bild.namn}-1280.webp`}
            srcSet={srcset(bild.namn)}
            sizes="100vw"
            alt={synlig ? bild.alt : ''}
            aria-hidden={synlig ? undefined : true}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            onLoad={() => laddad(i)}
            style={{ objectPosition: bild.fokus }}
            className={cn(
              'absolute inset-0 size-full object-cover',
              // Den nya bilden tonar in ovanpå. Den gamla ligger kvar helt synlig under tills övergången är klar.
              synlig && 'z-10 opacity-100 transition-opacity duration-800 ease-out',
              under && 'z-0 opacity-100',
              !synlig && !under && 'z-0 opacity-0',
              // Zoomen ligger kvar på bilden under, annars hoppar den tillbaka.
              !minskaRorelse && (synlig || under) && 'animate-zoom-langsam',
            )}
          />
        )
      })}
      {/* Neutral skugga: lätt överst bakom menyn, mörkare bakom texten och i nederkant. Bilderna behåller sina färger. */}
      <div className="absolute inset-0 z-20 bg-linear-to-b from-black/45 via-transparent via-30% to-transparent" />
      <div className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_65%_45%_at_50%_50%,rgb(0_0_0/0.5),transparent)]" />
      <div className="absolute inset-0 z-20 bg-linear-to-t from-black/65 via-black/15 via-25% to-transparent to-45%" />
    </div>
  )
}
