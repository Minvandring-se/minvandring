import { ChevronLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { TomtLage } from '@/components/app/TomtLage'
import { Matflikar } from '@/components/mat/Matflikar'
import { Torktext } from '@/components/mat/TorkaSjalv'
import { Bricka } from '@/components/ui/bricka'
import { knappStil } from '@/components/ui/knappStil'
import { useSidtitel } from '@/hooks/useSidtitel'
import { forstaVersal, GUIDEKATEGORIER, guideForRecept, komIgangAdress, RECEPTKATEGORIER, torkpostFor, torktid, type Kalla, type Torkguide, type Torkrecept } from '@/lib/torkasjalv'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const TORKA = '/matplanering/katalog?del=torka'

/**
 * Ett recept eller en råvara i Torka själv: rubrik, säkerhetsrutan med länk till Kom igång, texten och källorna.
 * Äpple och banan har en gemensam sida: receptet med råvaruguiden som fördjupning. Allt syns utan att något
 * fälls ut, så att sidan går att skriva ut med recept, råd och källor.
 */
export function Torkapost() {
  const { slug } = useParams()
  const post = torkpostFor(slug)
  useSidtitel(post?.post.titel ?? 'Torka själv')

  if (!post)
    return (
      <div className="space-y-6">
        <Matflikar />
        <TomtLage
          kompakt
          rubrik="Sidan finns inte"
          text="Adressen kan vara fel, eller så har receptet fått ett nytt namn."
          knapp={
            <Link to={TORKA} className={knappStil({ variant: 'outline' })}>
              Torka själv
            </Link>
          }
        />
      </div>
    )

  const recept = post.typ === 'recept' ? post.post : null
  const guide = post.typ === 'guide' ? post.post : recept && guideForRecept(recept.id)
  const tillbaka = post.typ === 'guide' ? `${TORKA}&flik=ravaror` : TORKA
  const kallor = [...(recept?.kallor ?? []), ...(guide?.kallor ?? [])].filter((k, i, alla) => alla.findIndex((x) => x.url === k.url) === i)

  return (
    <div className="space-y-6">
      <Matflikar />
      <article className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <Link to={tillbaka} className={cn('-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary print:hidden', fokus)}>
            <ChevronLeft className="size-4" aria-hidden />
            {post.typ === 'guide' ? 'Råvaror och snacks' : 'Torka själv'}
          </Link>
          <p className="text-sm text-muted-foreground">
            {recept ? RECEPTKATEGORIER.find((k) => k.nyckel === recept.kategori)!.namn : GUIDEKATEGORIER.find((k) => k.nyckel === guide!.kategori)!.namn}
          </p>
          <h1 className="text-[2rem] leading-tight break-words lg:text-[2.5rem]">{post.post.titel}</h1>
          {recept && <Receptbrickor recept={recept} />}
        </div>

        <Sakerhet />

        {recept && (
          <div className="max-w-prose space-y-5">
            {recept.avsnitt.map((a) => (
              <section key={a.rubrik} className="space-y-1.5">
                <h2 className="text-xl">{a.rubrik}</h2>
                <p>
                  <Torktext text={forstaVersal(a.text)} />
                </p>
              </section>
            ))}
          </div>
        )}

        {guide && <Guide guide={guide} fordjupning={!!recept} />}

        <Kallor kallor={kallor} />
      </article>
    </div>
  )
}

function Receptbrickor({ recept }: { recept: Torkrecept }) {
  return (
    <p className="flex flex-wrap gap-1.5">
      <Bricka stor>{recept.svarighet}</Bricka>
      <Bricka stor>{forstaVersal(recept.anvandning)}</Bricka>
      {recept.brickor.map((b) => (
        <Bricka key={b} stor>
          {forstaVersal(b)}
        </Bricka>
      ))}
      {recept.borjaHar && (
        <Bricka stor ton="hjortron">
          Bra att börja med
        </Bricka>
      )}
    </p>
  )
}

/** Rutan med länken till säkerhetsguiden, på varje sida. */
function Sakerhet() {
  return (
    <aside aria-label="Säkerhet" className="flex max-w-prose gap-3 rounded-lg border border-border bg-primary-soft p-4">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <p className="text-sm">
        Kyl tillagad mat snabbt om den ska vänta, torka i temperaturreglerad mattork och kontrollera avsvalnade bitar. Läs{' '}
        <Link to={komIgangAdress('sakerhet')} className={cn('font-medium text-primary underline underline-offset-4', fokus)}>
          säkerhetsguiden i Kom igång
        </Link>{' '}
        innan du börjar.
      </p>
    </aside>
  )
}

/** Råvaruguidens delar. På receptets sida är den en fördjupning med egen rubrik. */
function Guide({ guide, fordjupning }: { guide: Torkguide; fordjupning: boolean }) {
  const Rubrik = fordjupning ? 'h3' : 'h2'
  const delar = [
    { rubrik: 'Förbered', text: guide.forbered },
    { rubrik: 'Torka', text: `I mattork: ${torktid(guide)}.` },
    { rubrik: 'Så vet du att det är klart', text: guide.torrhet },
    { rubrik: 'På tur', text: guide.paTur },
    ...(guide.notis ? [{ rubrik: 'Bra att veta', text: guide.notis }] : []),
  ]
  return (
    <section aria-labelledby={fordjupning ? `guide-${guide.id}` : undefined} aria-label={fordjupning ? undefined : 'Så torkar du'} className={cn('max-w-prose space-y-5', fordjupning && 'rounded-lg border border-border p-4 sm:p-5')}>
      {fordjupning && (
        <h2 id={`guide-${guide.id}`} className="text-xl">
          Fördjupning: {guide.titel.toLocaleLowerCase('sv-SE')} som råvara
        </h2>
      )}
      {delar.map((d) => (
        <div key={d.rubrik} className="space-y-1.5">
          <Rubrik className={fordjupning ? 'font-sans text-base font-semibold' : 'text-xl'}>{d.rubrik}</Rubrik>
          <p>
            <Torktext text={d.text} />
          </p>
        </div>
      ))}
    </section>
  )
}

function Kallor({ kallor }: { kallor: Kalla[] }) {
  return (
    <section aria-labelledby="kallor" className="max-w-prose space-y-2 border-t border-border pt-4">
      <h2 id="kallor" className="text-xl">
        {kallor.length === 1 ? 'Källa' : 'Källor'}
      </h2>
      <ul className="space-y-1 text-sm">
        {kallor.map((k) => (
          <li key={k.url}>
            <a href={k.url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex min-h-11 items-center gap-1.5 py-1 text-primary underline underline-offset-4 break-all', fokus)}>
              <span>{k.namn}</span>
              <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">(öppnas i ny flik)</span>
            </a>
            <span className="hidden text-muted-foreground print:block">{k.url}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
