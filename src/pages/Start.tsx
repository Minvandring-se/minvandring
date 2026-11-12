import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { KartaIllustration } from '@/components/illustrationer/KartaIllustration'
import { RyggsackIllustration } from '@/components/illustrationer/RyggsackIllustration'
import { StormkokIllustration } from '@/components/illustrationer/StormkokIllustration'
import { Logotyp } from '@/components/Logotyp'
import { Bildspel } from '@/components/start/Bildspel'
import { Levande } from '@/components/start/Levande'
import { PacklistaSmakprov } from '@/components/start/PacklistaSmakprov'
import { useSession } from '@/hooks/useSession'
import { KONTAKT_LANK } from '@/lib/kontakt'

const steg = [
  {
    Illustration: KartaIllustration,
    rubrik: 'Planera dagarna',
    text: 'Sätt datum, antal dagar och reservdagar. Bjud in resten av gänget med en länk.',
  },
  {
    Illustration: RyggsackIllustration,
    rubrik: 'Fördela packningen',
    text: 'Skriv packlistan tillsammans och bestäm vem som bär vad. Vikten räknas ut per ryggsäck.',
  },
  {
    Illustration: StormkokIllustration,
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
          <div className="flex items-center gap-2">
            <Link to="/" className={`flex min-h-11 items-center rounded-md text-card ${fokusPaBild}`}>
              <Logotyp yta="mork" className="text-xl" />
            </Link>
            <span className="rounded-full border border-card/70 bg-black/25 px-2 py-0.5 text-xs font-semibold tracking-wide text-card">
              Beta
            </span>
          </div>
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

        <section id="sa-fungerar-det" aria-labelledby="sa-fungerar-rubrik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="sa-fungerar-rubrik" className="text-3xl font-bold sm:text-4xl">
            Börja med din nästa tur
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">En gemensam plan, från första packlistan till sista dagen.</p>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {steg.map(({ Illustration, rubrik, text }) => (
              <li
                key={rubrik}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-soft transition-[translate,box-shadow] duration-300 ease-out hover:shadow-[0_2px_4px_rgb(31_42_36/0.06),0_14px_32px_rgb(31_42_36/0.12)] motion-safe:hover:-translate-y-1"
              >
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
        </section>

        <section aria-labelledby="smakprov-rubrik" className="bg-muted/60">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12">
            <div className="space-y-5">
              <h2 id="smakprov-rubrik" className="text-3xl font-bold sm:text-4xl">
                Se direkt vem som bär vad och hur tung packningen blir.
              </h2>
              <p className="text-lg text-muted-foreground">
                Lägg in utrustningen, välj vem som bär vad och markera det som alla har med sig. MinVandring räknar ut vikten för varje
                ryggsäck, så att ni kan fördela lasten jämnt redan hemma.
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

        <section aria-labelledby="ark-rubrik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-3">
              <h2 id="ark-rubrik" className="text-3xl font-bold sm:text-4xl">
                Enklare än ett delat ark
              </h2>
              <p className="text-lg text-muted-foreground">
                Många planerar i Excel eller ett Google-dokument. Det fungerar, men MinVandring är gjort för just vandringar.
              </p>
            </div>
            <ul className="space-y-4">
              {fordelar.map((text) => (
                <li key={text} className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-lg">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <section aria-labelledby="lardomar-rubrik" className="mt-12 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
            <h2 id="lardomar-rubrik" className="text-2xl font-bold sm:text-3xl">
              Kom ihåg till nästa vandring
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Skriv ner vad som fungerade och vad ni saknade. Lärdomarna finns kvar när ni planerar nästa tur.
            </p>
          </section>
        </section>

        <section aria-labelledby="qa-rubrik" className="bg-muted/60">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 id="qa-rubrik" className="text-3xl font-bold sm:text-4xl">
              Q&amp;A
            </h2>
            <p className="mt-4 rounded-md bg-accent-soft p-4">
              <strong className="font-semibold">MinVandring är en beta.</strong> Saker kan ändras och vi uppskattar dina{' '}
              <a href={KONTAKT_LANK} className={`font-medium text-primary ${textlank}`}>
                synpunkter
              </a>
              .
            </p>
            <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-card">
              {fragor.map(({ fraga, svar }) => (
                <details key={fraga} className="group">
                  <summary
                    className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-5 py-3 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden ${fokus} focus-visible:-outline-offset-2`}
                  >
                    {fraga}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="px-5 pb-5 text-muted-foreground">{svar}</p>
                </details>
              ))}
            </div>
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
          MinVandring är en beta som vi bygger tillsammans med vandrare.{' '}
          <a href={KONTAKT_LANK} className={textlank}>
            Hör gärna av dig med synpunkter
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
          <li className="inline-flex items-center">
            Foton:&nbsp;
            <a href="https://unsplash.com" className={`inline-flex min-h-11 items-center ${textlank}`}>
              Unsplash
            </a>
          </li>
        </ul>
      </footer>
    </>
  )
}
