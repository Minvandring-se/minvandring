import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

// Bildfokus (object-position) så att det viktiga syns när bilden beskärs.
// fokusMobil: i stående format beskärs bilden från sidorna, så den första siffran styr.
// fokus (dator): bildspelet är aldrig bredare än 2:1 (se Start.tsx), så bilden beskärs uppifrån och nerifrån och den
//   andra siffran styr. Texten ligger i övre halvan, och personerna ska stå under den, inte bakom rubriken eller knappen.
// Fjällängen är första bilden. Utsiktsbilden är mörkast och ligger därför sist.
// ljus: dämpar ljusa bilder lite. Det mesta av skuggan ligger bakom texten (Start.tsx). Den vita texten klarar
//   WCAG AA mot bilden bakom rubrik, undertext, knapp och meny.
// bred: datorbilden är ett eget bredare utsnitt (design/hero/bredbilder.cjs), eftersom motivet annars inte får plats i 2:1.
// zoom (dator): punkten som den långsamma zoomen utgår från, vid personerna, så att de inte skärs bort.
const bilder = [
  { namn: '6-fjallang', alt: 'Två vandrare går över en fjällhed mot ett fjäll', fokusMobil: '50% 50%', fokus: '50% 12%', zoom: '50% 80%', ljus: 0.9 },
  { namn: '7-vinterfjall', alt: 'En person vilar på ett renskinn i snön framför ett snötäckt fjäll', fokusMobil: '50% 50%', fokus: '50% 50%', zoom: '40% 50%', ljus: 0.9, bred: true },
  { namn: '5-norrsken', alt: 'Norrsken över fjäll och sjö', fokusMobil: '30% 50%', fokus: '50% 85%', zoom: '50% 70%', ljus: 1 },
  { namn: '4-kust', alt: 'En vandrare på en kuststig längs havet', fokusMobil: '20% 50%', fokus: '25% 78%', zoom: '20% 70%', ljus: 0.8 },
  { namn: '3-utsikt', alt: 'En person står på en klippa och blickar ut över en fjälldal med sjö', fokusMobil: '45% 50%', fokus: '40% 12%', zoom: '38% 70%', ljus: 1 },
]

/** Hur länge varje bild syns. Övertoningen (0,8 s) ligger i klassen duration-800. */
const VISNING_MS = 7000
const BREDDER = [640, 1280, 1920, 2560]
/** De breda datorbilderna finns inte i 640 px. */
const BREDA_BREDDER = [1280, 1920, 2560]
/** Stående mobilbilder (9:16), redan beskurna kring fokusMobil. Görs om med design/hero/mobilbilder.cjs. */
const MOBILBREDDER = [640, 900]

/** Stående skärm smalare än md. Samma villkor och storlekar står i förladdningen i index.html. */
const MOBIL_MEDIA = '(max-width: 767px) and (orientation: portrait)'
/** Bilden täcker hela bredden. På stående surfplattor blir den egentligen bredare, men där räcker 100vw-versionen gott. */
const SIZES = '100vw'

function srcset(namn: string, bredder: number[], tillagg = '') {
  return bredder.map((b) => `/hero/${namn}${tillagg}-${b}.webp ${b}w`).join(', ')
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
          <picture key={bild.namn} className="contents">
            <source media={MOBIL_MEDIA} srcSet={srcset(bild.namn, MOBILBREDDER, '-mobil')} sizes="100vw" />
            <img
              src={`/hero/${bild.namn}${bild.bred ? '-bred' : ''}-1280.webp`}
              srcSet={bild.bred ? srcset(bild.namn, BREDA_BREDDER, '-bred') : srcset(bild.namn, BREDDER)}
              sizes={SIZES}
              alt={synlig ? bild.alt : ''}
              aria-hidden={synlig ? undefined : true}
              fetchPriority={i === 0 ? 'high' : 'low'}
              decoding="async"
              onLoad={() => laddad(i)}
              style={{ '--fokus-mobil': bild.fokusMobil, '--fokus': bild.fokus, '--zoom': bild.zoom, filter: bild.ljus < 1 ? `brightness(${bild.ljus})` : undefined } as CSSProperties}
              className={cn(
                'absolute inset-0 size-full object-cover [object-position:var(--fokus-mobil)] md:[object-position:var(--fokus)]',
                'md:[transform-origin:var(--zoom)]',
                // Mobilbilderna är redan beskurna kring fokus.
                '[@media(max-width:767px)_and_(orientation:portrait)]:[object-position:50%_50%]',
                // Den nya bilden tonar in ovanpå. Den gamla ligger kvar helt synlig under tills övergången är klar.
                synlig && 'z-10 opacity-100 transition-opacity duration-800 ease-out',
                under && 'z-0 opacity-100',
                !synlig && !under && 'z-0 opacity-0',
                // Zoomen ligger kvar på bilden under, annars hoppar den tillbaka.
                !minskaRorelse && (synlig || under) && 'animate-zoom-langsam',
              )}
            />
          </picture>
        )
      })}
      {/* Lätt skugga överst bakom menyn. Skuggan bakom rubrik, undertext och knapp ligger i Start.tsx, så att resten av bilden behåller sitt ljus. */}
      <div className="absolute inset-x-0 top-0 z-20 h-40 bg-linear-to-b from-black/55 to-transparent" />
    </div>
  )
}
