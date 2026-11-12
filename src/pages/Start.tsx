import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { KartaIllustration } from '@/components/illustrationer/KartaIllustration'
import { VagIllustration } from '@/components/illustrationer/VagIllustration'
import { MatIllustration } from '@/components/illustrationer/MatIllustration'
import { AnteckningIllustration } from '@/components/illustrationer/AnteckningIllustration'
import { TankenIllustration } from '@/components/illustrationer/TankenIllustration'
import { Logotyp } from '@/components/Logotyp'
import { Bildspel } from '@/components/start/Bildspel'
import { Levande } from '@/components/start/Levande'
import { PacklistaSmakprov } from '@/components/start/PacklistaSmakprov'
import { useSession } from '@/hooks/useSession'
import { KONTAKT_LANK } from '@/lib/kontakt'

/** Flödet i tre steg direkt under hero. Korten längre ner visar innehållet. */
const floden = [
  { nr: '01', rubrik: 'Skapa er tur', text: 'Välj datum och antal dagar.' },
  { nr: '02', rubrik: 'Bjud in gruppen', text: 'Dela turen med en länk.' },
  { nr: '03', rubrik: 'Planera tillsammans', text: 'Samla packning och måltider.' },
]

const steg = [
  {
    Illustration: KartaIllustration,
    rubrik: 'Planera dagarna',
    text: 'Sätt datum, antal dagar och reservdagar. Bjud in resten av gänget med en länk.',
  },
  {
    Illustration: VagIllustration,
    rubrik: 'Fördela packningen',
    text: 'Skriv packlistan tillsammans och bestäm vem som bär vad. Vikten räknas ut per ryggsäck.',
  },
  {
    Illustration: MatIllustration,
    rubrik: 'Ordna maten',
    text: 'Planera måltiderna dag för dag och få en gemensam inköpslista.',
  },
]

const fordelar = [
  'Alla ser samma plan och samma packlista, i stället för olika versioner av ett ark.',
  'Vikten räknas ut per ryggsäck, så att ni ser vem som bär vad innan ni går.',
  'Du bjuder in gänget med en länk. Ingen behöver dela ett dokument eller fixa behörigheter.',
]

const fragor = [
  {
    fraga: 'Kostar det något?',
    svar: <>Nej, det kostar ingenting att använda MinVandring idag.</>,
  },
  {
    fraga: 'Varför inte bara ett delat ark?',
    svar: (
      <>
        <p>Ett Excel-ark eller Google-dokument fungerar, men MinVandring är gjort för just vandringar:</p>
        <ul className="mt-3 space-y-2">
          {fordelar.map((text) => (
            <li key={text} className="flex gap-2.5">
              <Check className="mt-1 size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    fraga: 'Behöver alla ha konto?',
    svar: (
      <>
        Den som vill öppna turen loggar in med sin mejladress. Du får en inloggningslänk i mejlet, så inget lösenord behövs. Du kan
        också lägga till deltagare utan konto, till exempel en kompis eller hunden, men de kan inte själva öppna turen.
      </>
    ),
  },
  {
    fraga: 'Kan jag bara titta på listan utan att ändra?',
    svar: (
      <>
        Ja. Ägaren av turen kan ge dig rollen läsare. Då ser du hela planen och bockar bara av din egen packning. Den som går med
        via inbjudningslänken blir redigerare och kan ändra turen, packningen och maten.
      </>
    ),
  },
  {
    fraga: 'Var lagras min data?',
    svar: (
      <>
        Hos Supabase i Stockholm. Du kan läsa mer i vår{' '}
        <Link to="/integritet" className="font-medium text-primary underline underline-offset-2 hover:text-primary-hover">
          integritetspolicy
        </Link>
        .
      </>
    ),
  },
  {
    fraga: 'Vad är en beta?',
    svar: (
      <>
        Det betyder att MinVandring fortfarande utvecklas. Funktioner kan ändras och ibland kan något krångla. Vi bygger tjänsten
        tillsammans med vandrare, så dina synpunkter gör stor skillnad.
      </>
    ),
  },
]

const fokusPaBild = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card'
const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const textlank = `rounded-sm underline underline-offset-2 hover:text-foreground ${fokus}`
/** Korten med illustrationer. De är inte klickbara men lyfts lite vid hover. */
const kortKlass =
  'rounded-lg border border-border bg-card shadow-soft transition-[translate,box-shadow] duration-300 ease-out hover:shadow-[0_2px_4px_rgb(31_42_36/0.06),0_14px_32px_rgb(31_42_36/0.12)] motion-safe:hover:-translate-y-1'

/** Huvudknappen i hero och i sista sektionen. Ljus knapp, för mörka ytor. */
function PlaneraKnapp({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/logga-in"
      className={`inline-flex h-14 items-center gap-3 rounded-lg bg-card px-8 font-heading text-lg font-semibold text-primary shadow-soft transition-colors hover:bg-background ${fokusPaBild} ${className}`}
    >
      Planera en vandring
      <ArrowRight className="size-5" aria-hidden />
    </Link>
  )
}

/** Startsidan för den som inte är inloggad. Inloggade skickas direkt till sina turer. */
export function Start() {
  const session = useSession()
  if (session) return <Navigate to="/turer" replace />

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20">
        <nav aria-label="Huvudmeny" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className={`flex min-h-11 items-center rounded-md text-card ${fokusPaBild}`}>
            <Logotyp yta="mork" className="text-xl" />
          </Link>
          <Link
            to="/logga-in"
            className={`inline-flex h-11 items-center rounded-md border border-card/70 bg-black/20 px-4 text-sm font-semibold text-card transition-colors hover:bg-card/15 ${fokusPaBild}`}
          >
            Logga in
          </Link>
        </nav>
      </header>

      <main>
        {/* Mobil och dator: 80 % av skärmhöjden. Riktigt breda skärmar (bredare än 2:1) får lite högre bildspel så att bilderna beskärs mindre, men nästa rubrik får alltid plats. */}
        <section aria-labelledby="start-rubrik" className="relative isolate flex h-[80svh] min-h-[36rem] flex-col text-card md:h-[80svh] md:max-h-[64rem] md:[@media(min-aspect-ratio:2/1)]:h-[calc(100svh-8rem)]">
          <Bildspel />

          <div className="relative flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-10 text-center [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] sm:pt-24">
            <h1 id="start-rubrik" className="text-[2.6rem] leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
              Planera. Packa. Upplev.
            </h1>
            <p className="mt-5 max-w-xl text-lg font-medium text-card [text-shadow:0_1px_2px_rgb(0_0_0/0.7),0_0_14px_rgb(0_0_0/0.45)] sm:text-xl">
              Din nästa vandring börjar här. <span className="sm:block">Samla planen, packningen och maten på ett ställe.</span>
            </p>
            <PlaneraKnapp className="mt-8" />
            <a
              href="#sa-fungerar-det"
              className={`mt-3 inline-flex min-h-11 items-center rounded-md px-2 font-semibold underline decoration-2 underline-offset-4 [text-shadow:0_1px_3px_rgb(0_0_0/0.6),0_0_12px_rgb(0_0_0/0.4)] ${fokusPaBild}`}
            >
              Så fungerar det
            </a>
          </div>
        </section>

        <section id="sa-fungerar-det" aria-labelledby="floden-rubrik" className="scroll-mt-4 border-b border-border">
          <h2 id="floden-rubrik" className="sr-only">
            Så fungerar det
          </h2>
          <ol className="mx-auto grid max-w-6xl divide-y divide-border px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {floden.map(({ nr, rubrik, text }) => (
              <li key={nr} className="flex items-baseline gap-4 py-6 md:block md:px-8 md:py-10 md:first:pl-0 md:last:pr-0">
                <span aria-hidden className="w-12 shrink-0 font-heading text-4xl font-semibold text-primary tabular-nums md:block md:text-5xl">
                  {nr}
                </span>
                <div className="md:mt-3">
                  <h3 className="text-lg">{rubrik}</h3>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="sa-fungerar-rubrik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="sa-fungerar-rubrik" className="text-3xl font-bold sm:text-4xl">
            Börja med din nästa tur
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">En gemensam plan, från första packlistan till sista dagen.</p>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {steg.map(({ Illustration, rubrik, text }) => (
              <li key={rubrik} className={`overflow-hidden ${kortKlass}`}>
                <Levande>
                  <Illustration className="block aspect-[8/5] w-full" />
                </Levande>
                <div className="space-y-2 p-5">
                  <h3 className="text-xl">{rubrik}</h3>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className={`mt-5 grid overflow-hidden md:grid-cols-[2fr_3fr] md:items-center ${kortKlass}`}>
            <Levande>
              <AnteckningIllustration className="block aspect-[8/5] w-full" />
            </Levande>
            <div className="space-y-2 p-5 md:p-8">
              <h3 className="text-xl">Kom ihåg till nästa vandring</h3>
              <p className="text-muted-foreground">
                Skriv ner vad som fungerade och vad ni saknade. Lärdomarna finns kvar när ni planerar nästa tur.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="smakprov-rubrik" className="bg-muted/60">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-widest text-primary uppercase">Packning med koll</p>
                <h2 id="smakprov-rubrik" className="text-3xl font-bold sm:text-4xl">
                  Vem tar tältet?
                </h2>
              </div>
              <p className="text-lg text-muted-foreground">
                Fördela utrustningen och se vad var och en bär. Alla har samma lista inför avfärd.
              </p>
              <Link
                to="/logga-in"
                className={`inline-flex h-12 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover ${fokus}`}
              >
                Gör er packlista
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <PacklistaSmakprov />
          </div>
        </section>

        <section aria-labelledby="tanken-rubrik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-8 overflow-hidden rounded-lg bg-sand/50 p-6 sm:p-10 md:grid-cols-2 md:gap-12">
            <TankenIllustration className="mx-auto block aspect-[8/5] w-full max-w-md" />
            <div className="space-y-4">
              <h2 id="tanken-rubrik" className="text-3xl font-bold sm:text-4xl">
                Tanken bakom MinVandring
              </h2>
              <p className="text-lg">
                Vi är Andreas och Oscar. På vår senaste vandring i fjällen i Jämtland glömde vi gasen i bilen. Vi trodde båda att den andre
                hade tagit den. Som tur var hade vi också med T-sprit.
              </p>
              <p className="text-lg">
                Vi bygger MinVandring för alla vandrare som oss, så att det är tydligt vem som tar vad och så att mer tid går till naturen
                och mindre till planerandet.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="qa-rubrik" className="bg-muted/60">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 id="qa-rubrik" className="text-3xl font-bold sm:text-4xl">
              Q&amp;A
            </h2>
            <div className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
              {fragor.map(({ fraga, svar }) => (
                <details key={fraga} className="group">
                  <summary
                    className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-3 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden ${fokus} focus-visible:-outline-offset-2`}
                  >
                    {fraga}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="px-5 pb-5 text-muted-foreground">{svar}</div>
                </details>
              ))}
            </div>
            <p className="mt-5 text-muted-foreground">
              MinVandring är en beta. Lämna gärna{' '}
              <a href={KONTAKT_LANK} className={textlank}>
                synpunkter
              </a>
              .
            </p>
          </div>
        </section>

        <section aria-labelledby="cta-rubrik" className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 id="cta-rubrik" className="text-3xl font-bold sm:text-4xl">
              Redo för nästa tur?
            </h2>
            <p className="mt-3 max-w-xl text-lg text-primary-foreground/90">Skapa vandringen och bjud in resten av gänget med en länk.</p>
            <PlaneraKnapp className="mt-8" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 text-center">
        <Logotyp className="justify-center text-xl" />
        <p className="mt-2 text-muted-foreground">För vandringar tillsammans.</p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Det här är en beta. Lämna gärna{' '}
          <a href={KONTAKT_LANK} className={textlank}>
            synpunkter
          </a>
          .
        </p>
        <ul className="mt-4 flex flex-wrap justify-center gap-x-6 text-sm text-muted-foreground">
          <li>
            <a href={KONTAKT_LANK} className={`inline-flex min-h-11 items-center ${textlank}`}>
              Kontakt och feedback
            </a>
          </li>
          <li>
            <Link to="/integritet" className={`inline-flex min-h-11 items-center ${textlank}`}>
              Integritetspolicy
            </Link>
          </li>
        </ul>
      </footer>
    </>
  )
}
