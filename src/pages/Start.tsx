import { ArrowRight, Backpack, CookingPot, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { KartaIllustration } from '@/components/illustrationer/KartaIllustration'
import { RyggsackIllustration } from '@/components/illustrationer/RyggsackIllustration'
import { StormkokIllustration } from '@/components/illustrationer/StormkokIllustration'
import { Logotyp } from '@/components/Logotyp'
import { Bildspel } from '@/components/start/Bildspel'
import { PacklistaSmakprov } from '@/components/start/PacklistaSmakprov'
import { useSession } from '@/hooks/useSession'

const punkter = [
  { ikon: Users, text: 'Planera tillsammans' },
  { ikon: Backpack, text: 'Fördela packningen' },
  { ikon: CookingPot, text: 'Få koll på maten' },
]

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

const fokusPaBild = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card'

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
            className={`inline-flex h-11 items-center rounded-md border border-card/70 px-4 text-sm font-semibold text-card transition-colors hover:bg-card/15 ${fokusPaBild}`}
          >
            Logga in
          </Link>
        </nav>
      </header>

      <main>
        {/* Mobil och dator: 80 % av skärmhöjden. Riktigt breda skärmar (bredare än 2:1) får lite högre bildspel så att bilderna beskärs mindre, men nästa rubrik får alltid plats. */}
        <section aria-labelledby="start-rubrik" className="relative isolate flex h-[80svh] min-h-[36rem] flex-col text-card md:h-[80svh] md:max-h-[64rem] md:[@media(min-aspect-ratio:2/1)]:h-[calc(100svh-8rem)]">
          <Bildspel />

          <div className="relative flex flex-1 flex-col items-center justify-center px-4 pt-20 pb-6 text-center [text-shadow:0_1px_14px_rgb(0_0_0/0.35)] sm:pt-24">
            <h1 id="start-rubrik" className="text-[2.6rem] leading-[1.05] font-bold sm:text-6xl lg:text-7xl">
              Planera. Packa. Upplev.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-card/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.55),0_0_12px_rgb(0_0_0/0.35)] sm:text-xl">
              Din nästa vandring börjar här. <span className="sm:block">Samla planen, packningen och maten på ett ställe.</span>
            </p>
            <Link
              to="/logga-in"
              className={`mt-8 inline-flex h-14 items-center gap-3 rounded-lg bg-card px-8 font-heading text-lg font-semibold text-primary shadow-soft transition-colors hover:bg-background ${fokusPaBild}`}
            >
              Planera en vandring
              <ArrowRight className="size-5" aria-hidden />
            </Link>
            <a
              href="#sa-fungerar-det"
              className={`mt-3 inline-flex min-h-11 items-center rounded-md px-2 font-semibold underline decoration-2 underline-offset-4 [text-shadow:0_1px_3px_rgb(0_0_0/0.55),0_0_12px_rgb(0_0_0/0.35)] ${fokusPaBild}`}
            >
              Så fungerar det
            </a>
          </div>

          <ul className="relative mx-auto grid w-full max-w-4xl grid-cols-3 gap-2 px-3 pb-6 [text-shadow:0_1px_8px_rgb(0_0_0/0.4)] sm:flex sm:justify-center sm:divide-x sm:divide-card/40 sm:pb-8">
            {punkter.map(({ ikon: Ikon, text }) => (
              <li
                key={text}
                className="flex flex-col items-center gap-2 text-center text-sm font-semibold sm:flex-row sm:gap-3 sm:px-8 sm:text-base"
              >
                <Ikon className="size-6 shrink-0 sm:size-7" strokeWidth={1.75} aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section id="sa-fungerar-det" aria-labelledby="sa-fungerar-rubrik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="sa-fungerar-rubrik" className="text-3xl font-bold sm:text-4xl">
            Börja med din nästa tur
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">En gemensam plan, från första packlistan till sista dagen.</p>

          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {steg.map(({ Illustration, rubrik, text }) => (
              <li key={rubrik} className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
                <Illustration className="block aspect-[8/5] w-full" />
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
            <div className="space-y-3">
              <h2 id="smakprov-rubrik" className="text-3xl font-bold sm:text-4xl">
                Se direkt vem som bär vad och hur tung packningen blir.
              </h2>
            </div>
            <PacklistaSmakprov />
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 text-center">
        <Logotyp className="justify-center text-xl" />
        <p className="mt-2 text-muted-foreground">För vandringar tillsammans.</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Foton:{' '}
          <a href="https://unsplash.com" className="underline underline-offset-2 hover:text-foreground">
            Unsplash
          </a>
        </p>
      </footer>
    </>
  )
}
