import { ExternalLink } from 'lucide-react'
import { useId, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TomtLage } from '@/components/app/TomtLage'
import { Bricka } from '@/components/ui/bricka'
import { Delval } from '@/components/ui/delval'
import {
  forstaVersal,
  GUIDEKATEGORIER,
  KOM_IGANG,
  RECEPTKATEGORIER,
  sokTork,
  textdelar,
  torkadress,
  torkflikFranAdress,
  TORKFLIKAR,
  TORKGUIDER,
  TORKRECEPT,
  torktid,
  type Torkavsnitt,
  type Torkflik,
  type Torkguide,
  type Torkrecept,
} from '@/lib/torkasjalv'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Knapparna för kategorierna, samma som kostfiltret. */
const valknapp = (vald: boolean) =>
  cn(
    'inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors',
    fokus,
    vald ? 'border-primary bg-primary-soft font-semibold text-primary' : 'border-border bg-card hover:bg-muted',
  )

/** En länk som täcker hela kortet, med fokusringen runt kortet. */
const tackande = 'after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring'

/**
 * Torka själv i Matkatalogen: recept och råvaror att torka hemma, och Kom igång med grundmetod och säkerhet. Sökfältet
 * överst på sidan söker här också. Fliken och kategorin står i adressen (?del=torka&flik=ravaror&kategori=frukt).
 */
export function TorkaSjalv({ sok }: { sok: string }) {
  const [parametrar, setParametrar] = useSearchParams()
  const flik = torkflikFranAdress(parametrar)
  const kategori = parametrar.get('kategori') ?? ''

  function andra(andring: { flik?: Torkflik; kategori?: string }) {
    const p = new URLSearchParams(parametrar)
    if (andring.flik !== undefined) {
      p.delete('kategori')
      if (andring.flik === 'recept') p.delete('flik')
      else p.set('flik', andring.flik)
    }
    if (andring.kategori !== undefined) {
      if (andring.kategori) p.set('kategori', andring.kategori)
      else p.delete('kategori')
    }
    setParametrar(p, { replace: true })
  }

  return (
    <div className="space-y-5">
      <div className="max-w-prose space-y-2">
        <h2 className="text-2xl">Torka egen mat till turen</h2>
        <p>Förbered hemma och packa för turen. Här hittar du recept, goda snacks och råvaror att torka själv, med instruktioner för både mattorken och maten ute.</p>
      </div>
      <Delval etikett="Torka själv" delar={TORKFLIKAR} vald={flik} onValj={(f) => andra({ flik: f })} className="max-w-xl" />
      {flik === 'recept' && <Receptlista sok={sok} kategori={kategori} onKategori={(k) => andra({ kategori: k })} />}
      {flik === 'ravaror' && <Guidelista sok={sok} kategori={kategori} onKategori={(k) => andra({ kategori: k })} />}
      {flik === 'kom-igang' && <KomIgang />}
    </div>
  )
}

function Kategorival({ etikett, kategorier, vald, onValj }: { etikett: string; kategorier: readonly { nyckel: string; namn: string }[]; vald: string; onValj: (k: string) => void }) {
  return (
    <div role="group" aria-label={etikett} className="flex flex-wrap gap-2">
      <button type="button" aria-pressed={vald === ''} onClick={() => onValj('')} className={valknapp(vald === '')}>
        Alla
      </button>
      {kategorier.map((k) => (
        <button key={k.nyckel} type="button" aria-pressed={vald === k.nyckel} onClick={() => onValj(vald === k.nyckel ? '' : k.nyckel)} className={valknapp(vald === k.nyckel)}>
          {k.namn}
        </button>
      ))}
    </div>
  )
}

function Antal({ id, antal, en, flera }: { id: string; antal: number; en: string; flera: string }) {
  return (
    <h3 id={id} aria-live="polite" className="font-sans text-base font-medium">
      {antal === 0 ? `Inga ${flera}` : antal === 1 ? `1 ${en}` : `${antal} ${flera}`}
    </h3>
  )
}

function Receptlista({ sok, kategori, onKategori }: { sok: string; kategori: string; onKategori: (k: string) => void }) {
  const id = useId()
  const giltig = RECEPTKATEGORIER.some((k) => k.nyckel === kategori) ? kategori : ''
  const traffar = useMemo(() => sokTork(TORKRECEPT, sok).filter((r) => !giltig || r.kategori === giltig), [sok, giltig])
  return (
    <section aria-labelledby={id} className="space-y-4">
      <Kategorival etikett="Sorts rätt" kategorier={RECEPTKATEGORIER} vald={giltig} onValj={onKategori} />
      <Antal id={id} antal={traffar.length} en="recept" flera="recept" />
      {traffar.length === 0 ? (
        <TomtLage kompakt text="Inga recept passar sökningen och valet. Pröva ett annat ord eller välj Alla." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {traffar.map((r) => (
            <Receptkort key={r.id} recept={r} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Receptkort({ recept }: { recept: Torkrecept }) {
  return (
    <li className="lyft relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <Link to={torkadress(recept)} className={cn(tackande, 'flex min-h-11 items-center font-heading text-lg font-semibold break-words text-primary')}>
        {recept.titel}
      </Link>
      <span className="flex flex-wrap gap-1.5">
        <Bricka>{recept.svarighet}</Bricka>
        {/* Användningen som i källan, till exempel Lunch/huvudrätt eller Snacks/frukosttopping. */}
        <Bricka>{forstaVersal(recept.anvandning)}</Bricka>
        {recept.borjaHar && <Bricka ton="hjortron">Bra att börja med</Bricka>}
      </span>
    </li>
  )
}

function Guidelista({ sok, kategori, onKategori }: { sok: string; kategori: string; onKategori: (k: string) => void }) {
  const id = useId()
  const giltig = GUIDEKATEGORIER.some((k) => k.nyckel === kategori) ? kategori : ''
  const traffar = useMemo(() => sokTork(TORKGUIDER, sok).filter((g) => !giltig || g.kategori === giltig), [sok, giltig])
  return (
    <section aria-labelledby={id} className="space-y-4">
      <Kategorival etikett="Sorts råvara" kategorier={GUIDEKATEGORIER} vald={giltig} onValj={onKategori} />
      <Antal id={id} antal={traffar.length} en="råvara" flera="råvaror" />
      {traffar.length === 0 ? (
        <TomtLage kompakt text="Inga råvaror passar sökningen och valet. Pröva ett annat ord eller välj Alla." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {traffar.map((g) => (
            <Guidekort key={g.id} guide={g} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Guidekort({ guide }: { guide: Torkguide }) {
  const kategori = GUIDEKATEGORIER.find((k) => k.nyckel === guide.kategori)!.namn
  return (
    <li className="lyft relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <span className="text-sm text-muted-foreground">{kategori}</span>
      <Link to={torkadress(guide)} className={cn(tackande, 'flex min-h-11 items-center font-heading text-lg font-semibold break-words text-primary')}>
        {guide.titel}
      </Link>
      <span className="text-sm">I mattork: {torktid(guide)}</span>
      {guide.recept && <span className="text-sm text-muted-foreground">Finns också som recept</span>}
    </li>
  )
}

/** Kom igång: grundmetod, utrustning, säkerhet, torrhet och förvaring, återfuktning, mått och basingredienser. */
export function KomIgang() {
  return (
    <div className="max-w-prose space-y-6">
      {KOM_IGANG.map((a) => (
        <Avsnitt key={a.id} avsnitt={a} />
      ))}
    </div>
  )
}

function Avsnitt({ avsnitt }: { avsnitt: Torkavsnitt }) {
  return (
    <section id={avsnitt.id} aria-labelledby={`${avsnitt.id}-rubrik`} className="scroll-mt-6 space-y-2">
      <h3 id={`${avsnitt.id}-rubrik`} className="text-xl">
        {avsnitt.rubrik}
      </h3>
      {avsnitt.stycken?.map((s) => (
        <p key={s}>
          <Torktext text={s} />
        </p>
      ))}
      {avsnitt.punkter && (
        <ul className="list-disc space-y-1 pl-5">
          {avsnitt.punkter.map((p) => (
            <li key={p}>
              <Torktext text={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Text med fetstil och länkar. Länkarna går till källorna och öppnas i en ny flik. */
export function Torktext({ text }: { text: string }) {
  return (
    <>
      {textdelar(text).map((d, i) =>
        d.typ === 'fet' ? (
          <strong key={i}>{d.text}</strong>
        ) : d.typ === 'lank' ? (
          <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className={cn('text-primary underline underline-offset-4', fokus)}>
            {d.text}
            <ExternalLink className="ml-0.5 inline size-3.5 align-[-0.125em]" aria-hidden />
            <span className="sr-only"> (öppnas i ny flik)</span>
          </a>
        ) : (
          <span key={i}>{d.text}</span>
        ),
      )}
    </>
  )
}
