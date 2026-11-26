import { ArrowRight, Check, Copy, Plus, Share2 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Skelett } from '@/components/app/Laddar'
import { NastaTurKort } from '@/components/app/TurKort'
import { Ikon, type IkonNamn } from '@/components/ikoner/Ikon'
import { Button } from '@/components/ui/button'
import { KommerSnartEtikett } from '@/components/ui/kommerSnart'
import { knappStil } from '@/components/ui/knappStil'
import { Hojdkurvor } from '@/components/ui/sokruta'
import type { HemTur } from '@/hooks/useHem'
import { bandNedrakning, datumrubrik, fornamn, type Attgora } from '@/lib/hem'
import { receptadress } from '@/lib/receptkatalog'
import { tipsadress } from '@/lib/tips'
import { vanlankAdress, type Vanlank } from '@/lib/vanner'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const kort = 'rounded-[1.375rem] border border-border bg-card p-5 sm:p-6'
const lankKlass = cn('inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4', fokus)

export interface Inspiration {
  lardom: { text: string } | null
  recept: { id: string; namn: string } | null
  tips: { nyckel: string; rubrik: string; etikett: string } | null
}

/**
 * Sidan Hem: välkomstbandet (sidans enda mörkgröna yta), nästa tur, Att göra, inspirationen, Lägg till vänner, Hitta
 * din nästa vandring och genvägar. Utan turer visas en guide i tre steg i stället för nästa tur och Att göra. Allt
 * kommer in som props, så att sidan går att rita utan databas.
 */
export function HemVy({
  namn,
  idag,
  turer,
  nasta,
  attgora,
  inspiration,
  vanlank,
}: {
  namn: string
  idag: string
  turer: HemTur[] | null | 'fel'
  nasta: HemTur | null
  attgora: Attgora[] | null | 'fel'
  inspiration: Inspiration
  /** Ens vänlänk, eller null medan den hämtas eller om den inte gick att hämta. Då visas bara länken till Vänner. */
  vanlank: Vanlank | null
}) {
  const utanTurer = Array.isArray(turer) && turer.length === 0
  return (
    <div className="space-y-6">
      <Valkomstband namn={namn} idag={idag} nasta={nasta} />

      {turer === null && <Skelett className="h-64 rounded-[1.375rem]" />}
      {turer === 'fel' && <p className="text-destructive">Det gick inte att hämta dina turer. Kontrollera uppkopplingen och ladda om sidan.</p>}
      {utanTurer && <KomIgang />}
      {nasta && <NastaTurKort tur={nasta} idag={idag} />}

      {(nasta || harInspiration(inspiration)) && (
        // Bredvid varandra på dator när båda finns, annars får den som finns hela bredden.
        // items-start: korten får sin egen höjd, så att ett kort med en rad inte får en stor tom yta.
        <div className={cn('grid items-start gap-6', nasta && harInspiration(inspiration) && 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')}>
          {nasta && <AttGora tur={nasta} rader={attgora} />}
          {harInspiration(inspiration) && <InspirationKort inspiration={inspiration} />}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <LaggTillVanner vanlank={vanlank} />
        <HittaVandring />
      </div>

      <Genvagar />
    </div>
  )
}

const harInspiration = (i: Inspiration) => !!(i.lardom || i.recept || i.tips)

/** Välkomstbandet: datum, hälsningen, Ny tur och Lägg till vänner, och nedräkningen till nästa tur när det finns en. */
function Valkomstband({ namn, idag, nasta }: { namn: string; idag: string; nasta: HemTur | null }) {
  const nedrakning = nasta ? bandNedrakning(nasta, idag) : null
  const hej = fornamn(namn)
  return (
    <section aria-labelledby="hem-rubrik" className="@container relative overflow-hidden rounded-[1.375rem] bg-yta-stark text-yta-stark-foreground">
      <Hojdkurvor variant="band" />
      {/* Nedräkningen står bredvid först när bandet är brett nog, så att hälsningen och knapparna aldrig bryts under den. */}
      <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-8 sm:py-8 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div className="space-y-3 @3xl:shrink-0">
          <p className="text-sm text-yta-stark-muted">{datumrubrik(idag)}</p>
          <div className="space-y-1">
            <h1 id="hem-rubrik" className="text-[2rem] leading-tight text-yta-stark-foreground lg:text-[2.75rem]">
              {hej ? `Hej ${hej}!` : 'Hej!'}
            </h1>
            <p className="text-yta-stark-muted lg:text-lg">Planera ditt nästa äventyr.</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link to="?ny=1" className={knappStil({ variant: 'hjortron' })}>
              <Plus className="size-4" aria-hidden />
              Ny tur
            </Link>
            <Link to="/vanner" className={knappStil({ variant: 'kant-stark' })}>
              Lägg till vänner
            </Link>
          </div>
        </div>
        {nasta && nedrakning && (
          <div className="min-w-0 @3xl:max-w-sm @3xl:text-right">
            <p className="text-sm text-yta-stark-muted">Nästa tur</p>
            <p className="font-heading text-xl leading-snug font-semibold break-words text-yta-stark-foreground lg:text-2xl">{nasta.namn}</p>
            <p className="mt-1 font-heading text-[3rem] leading-none font-semibold text-hjortron tabular-nums lg:text-[4.5rem]">{nedrakning.varde}</p>
            <p className="text-sm text-yta-stark-muted">{nedrakning.text}</p>
          </div>
        )}
      </div>
    </section>
  )
}

const ATTGORA_IKON: Record<Attgora['nyckel'], IkonNamn> = { uppgifter: 'deltagare', maltider: 'matpase', gemensamt: 'mitt-forrad', packat: 'packlistor' }

/** Att göra inför nästa tur: högst fyra rader som länkar dit det görs. */
function AttGora({ tur, rader }: { tur: HemTur; rader: Attgora[] | null | 'fel' }) {
  return (
    <section aria-labelledby="att-gora" className={cn(kort, 'space-y-3')}>
      <h2 id="att-gora" className="text-xl">
        Att göra
      </h2>
      {rader === null && (
        <div className="space-y-2" aria-hidden>
          <Skelett className="h-14 rounded-lg" />
          <Skelett className="h-14 rounded-lg" />
        </div>
      )}
      {rader === 'fel' && <p className="text-sm text-destructive">Det gick inte att räkna ut vad som är kvar. Ladda om sidan.</p>}
      {Array.isArray(rader) && rader.length === 0 && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Check className="size-5 shrink-0 text-primary" aria-hidden />
          Allt ser klart ut inför {tur.namn}.
        </p>
      )}
      {Array.isArray(rader) && rader.length > 0 && (
        <ul className="space-y-2">
          {rader.map((r) => (
            <li key={r.nyckel}>
              <Link to={r.till} className={cn('lyft flex min-h-14 items-center gap-3 rounded-lg bg-primary-soft px-3 py-2.5 hover:bg-muted', fokus)}>
                <Ikon namn={ATTGORA_IKON[r.nyckel]} storlek={28} className="text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{r.text}</span>
                  <span className="block text-sm text-muted-foreground">{r.under}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Inspiration: den senaste egna lärdomen, veckans recept och ett tips för årstiden. Delar utan data visas inte. */
function InspirationKort({ inspiration }: { inspiration: Inspiration }) {
  const { lardom, recept, tips } = inspiration
  return (
    <section aria-labelledby="inspiration" className={cn(kort, 'space-y-4')}>
      <h2 id="inspiration" className="text-xl">
        Inspiration
      </h2>
      <ul className="space-y-4">
        {lardom && (
          <Inspirationsrad ikon="dagbok" etikett="Kom ihåg från förra turen">
            <p className="font-medium break-words">”{lardom.text}”</p>
            <Link to="/kom-ihag" className={lankKlass}>
              Alla lärdomar
            </Link>
          </Inspirationsrad>
        )}
        {recept && (
          <Inspirationsrad ikon="middag" etikett="Veckans recept">
            <p className="font-medium break-words">{recept.namn}</p>
            <Link to={receptadress(recept.id)} className={lankKlass}>
              Visa receptet
            </Link>
          </Inspirationsrad>
        )}
        {tips && (
          <Inspirationsrad ikon="kok" etikett={tips.etikett}>
            <p className="font-medium break-words">{tips.rubrik}</p>
            <Link to={tipsadress(tips.nyckel)} className={lankKlass}>
              Läs tipset
            </Link>
          </Inspirationsrad>
        )}
      </ul>
    </section>
  )
}

function Inspirationsrad({ ikon, etikett, children }: { ikon: IkonNamn; etikett: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Ikon namn={ikon} storlek={28} className="text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground">{etikett}</p>
        {children}
      </div>
    </li>
  )
}

/**
 * Lägg till vänner: din vänlänk att kopiera eller dela, och en länk till sidan Vänner, där man också kan skicka en
 * förfrågan till en mejladress. Till en tur bjuder man in inne i turen.
 */
function LaggTillVanner({ vanlank }: { vanlank: Vanlank | null }) {
  const id = useId()
  const [status, setStatus] = useState('')
  const kanDela = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const adress = vanlank ? vanlankAdress(vanlank.kod) : null

  async function kopiera() {
    if (!adress) return
    try {
      await navigator.clipboard.writeText(adress)
      setStatus('Länken är kopierad.')
    } catch {
      setStatus('Det gick inte att kopiera. Öppna Vänner och kopiera länken där.')
    }
  }

  return (
    <section aria-labelledby={`${id}-rubrik`} className={cn(kort, 'space-y-4')}>
      <div className="flex items-center gap-3">
        <Ikon namn="inbjudan" storlek={28} className="text-primary" />
        <h2 id={`${id}-rubrik`} className="text-xl">
          Lägg till vänner
        </h2>
      </div>
      <p className="max-w-prose text-muted-foreground">
        Skicka din vänlänk till dem du vandrar med. Den som öppnar den och trycker Bli vänner blir din vän direkt.
      </p>
      {adress && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void kopiera()}>
            <Copy className="size-4" aria-hidden />
            Kopiera min vänlänk
          </Button>
          {kanDela && (
            <Button
              variant="outline"
              onClick={() =>
                void navigator
                  .share({ title: 'MinVandring', text: 'Bli min vän på MinVandring, så kan vi planera vandringar ihop.', url: adress })
                  .catch(() => undefined)
              }
            >
              <Share2 className="size-4" aria-hidden />
              Dela
            </Button>
          )}
        </div>
      )}
      <p role="status" className="text-sm font-medium text-primary empty:hidden">
        {status}
      </p>
      <Link to="/vanner" className={lankKlass}>
        Till Vänner
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}

/** Den planerade kartan, med etiketten Kommer snart och en länk till sidan som beskriver den. */
function HittaVandring() {
  return (
    <section aria-labelledby="hitta-vandring" className={cn(kort, 'space-y-3')}>
      <div className="flex items-start justify-between gap-3">
        <Ikon namn="fjall" storlek={28} className="text-primary" />
        <KommerSnartEtikett />
      </div>
      <h2 id="hitta-vandring" className="text-xl">
        Hitta din nästa vandring
      </h2>
      <p className="max-w-prose text-muted-foreground">Leder, stugor och etapper på en karta över Sverige, så att ni kan välja tur och lägga in den direkt.</p>
      <Link to="/hitta-vandring" className={lankKlass}>
        Läs mer om kartan
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  )
}

const GENVAGAR: readonly { namn: string; till: string; ikon: IkonNamn }[] = [
  { namn: 'Matplanering', till: '/matplanering', ikon: 'matplanering' },
  { namn: 'Mitt förråd', till: '/forrad', ikon: 'mitt-forrad' },
  { namn: 'Utrustningskatalog', till: '/utrustning', ikon: 'utrustningskatalog' },
  { namn: 'Skafferi', till: '/matplanering/skafferi', ikon: 'skafferi' },
]

/** Genvägar: fyra i rad på dator och två i rad i mobil, med ikonerna i 36 px. */
function Genvagar() {
  return (
    <section aria-labelledby="genvagar" className="space-y-3">
      <h2 id="genvagar" className="text-xl">
        Genvägar
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {GENVAGAR.map((g) => (
          <li key={g.till}>
            <Link to={g.till} className={cn('lyft flex h-full min-h-24 flex-col justify-between gap-3 rounded-lg border border-border bg-card p-4', fokus)}>
              <Ikon namn={g.ikon} storlek={36} className="text-primary" />
              <span className="font-semibold break-words">{g.namn}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** För den som inte har några turer än: tre steg, med en knapp i varje. */
function KomIgang() {
  const steg: readonly { rubrik: string; text: string; knapp: ReactNode }[] = [
    {
      rubrik: 'Skapa en tur',
      text: 'Ge turen ett namn. Datum, plats och dagar kan ni fylla i sedan.',
      knapp: (
        <Link to="?ny=1" className={knappStil()}>
          Skapa en tur
        </Link>
      ),
    },
    {
      rubrik: 'Lägg till vänner',
      text: 'Skicka din vänlänk till dem du vandrar med. Till en tur bjuder du in från turens sida.',
      knapp: (
        <Link to="/vanner" className={knappStil({ variant: 'outline' })}>
          Till Vänner
        </Link>
      ),
    },
    {
      rubrik: 'Packa och planera maten',
      text: 'Lägg in din utrustning i förrådet och planera maten dag för dag.',
      knapp: (
        <Link to="/forrad" className={knappStil({ variant: 'outline' })}>
          Till Mitt förråd
        </Link>
      ),
    },
  ]
  return (
    <section aria-labelledby="kom-igang" className={cn(kort, 'space-y-4')}>
      <h2 id="kom-igang" className="text-xl">
        Kom igång
      </h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steg.map((s, i) => (
          <li key={s.rubrik} className="flex flex-col gap-3 rounded-lg bg-primary-soft p-4">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <h3 className="font-sans text-base font-semibold">{s.rubrik}</h3>
            <p className="flex-1 text-sm text-muted-foreground">{s.text}</p>
            <div>{s.knapp}</div>
          </li>
        ))}
      </ol>
    </section>
  )
}
