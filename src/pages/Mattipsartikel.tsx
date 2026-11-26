import { ChevronDown, ChevronLeft, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { TomtLage } from '@/components/app/TomtLage'
import { Illustration } from '@/components/illustrationer/Illustration'
import { Matflikar } from '@/components/mat/Matflikar'
import { knappStil } from '@/components/ui/knappStil'
import { useSidtitel } from '@/hooks/useSidtitel'
import { guideFor, lastid, type Avsnitt } from '@/lib/tips'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const TIPS = '/matplanering/tips'

/**
 * En tipsartikel: bild överst, Alla tips, lästid, rubrik och ingress, de viktiga siffrorna i små rutor, brödtexten och
 * delar som fälls ut (till exempel I kyla och Källor). Innehållet står i src/lib/tips.ts.
 */
export function Mattipsartikel() {
  const { nyckel } = useParams()
  const guide = guideFor(nyckel)
  useSidtitel(guide?.rubrik ?? 'Tips')

  if (!guide)
    return (
      <div className="space-y-6">
        <Matflikar />
        <TomtLage
          kompakt
          rubrik="Tipset finns inte"
          text="Adressen kan vara fel, eller så har tipset fått ett nytt namn."
          knapp={
            <Link to={TIPS} className={knappStil({ variant: 'outline' })}>
              Alla tips
            </Link>
          }
        />
      </div>
    )

  const brodtext = guide.avsnitt.filter((a) => !a.fallsUt)
  const utfallbara = guide.avsnitt.filter((a) => a.fallsUt)

  return (
    <div className="space-y-6">
      <Matflikar />
      <article className="mx-auto max-w-3xl space-y-6">
        <Illustration namn={guide.nyckel} className="aspect-[16/9] w-full rounded-yta sm:aspect-[5/2]" />
        <div className="space-y-3">
          <Link to={TIPS} className={cn('-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary', fokus)}>
            <ChevronLeft className="size-4" aria-hidden />
            Alla tips
          </Link>
          <p className="text-sm text-muted-foreground">{lastid(guide)} min läsning</p>
          <h1 className="text-[2rem] leading-tight break-words lg:text-[2.5rem]">{guide.rubrik}</h1>
          <p className="max-w-prose text-lg">{guide.ingress}</p>
        </div>

        <ul aria-label="Viktiga siffror" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {guide.siffror.map((s) => (
            <li key={s.varde} className="rounded-lg bg-primary-soft p-3">
              <span className="block font-heading text-xl font-semibold text-primary tabular-nums">{s.varde}</span>
              <span className="block text-sm">{s.text}</span>
            </li>
          ))}
        </ul>

        <div className="max-w-prose space-y-5">
          {brodtext.map((a) => (
            <section key={a.rubrik} className="space-y-2">
              <h2 className="text-xl">{a.rubrik}</h2>
              <Avsnittstext avsnitt={a} />
            </section>
          ))}
        </div>

        <div className="max-w-prose border-b border-border">
          {utfallbara.map((a) => (
            <Utfallbar key={a.rubrik} rubrik={a.rubrik}>
              <Avsnittstext avsnitt={a} />
            </Utfallbar>
          ))}
          <Utfallbar rubrik="Källor">
            <ul className="space-y-1 text-sm">
              {guide.kallor.map((k) => (
                <li key={k.url}>
                  <a href={k.url} target="_blank" rel="noopener noreferrer" className={cn('inline-flex min-h-11 items-center gap-1.5 py-1 text-primary underline underline-offset-4', fokus)}>
                    <span>{k.namn}</span>
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span className="sr-only">(öppnas i ny flik)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Utfallbar>
        </div>
      </article>
    </div>
  )
}

function Avsnittstext({ avsnitt }: { avsnitt: Avsnitt }) {
  return (
    <>
      {avsnitt.stycken.map((s) => (
        <p key={s}>{s}</p>
      ))}
      {avsnitt.punkter && (
        <ul className="list-disc space-y-1 pl-5">
          {avsnitt.punkter.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </>
  )
}

/** En del som fälls ut, med details och summary så att det fungerar utan skript och med tangentbord. */
function Utfallbar({ rubrik, children }: { rubrik: string; children: ReactNode }) {
  return (
    <details className="group border-t border-border">
      <summary className={cn('flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 font-heading text-lg font-semibold [&::-webkit-details-marker]:hidden', fokus)}>
        {rubrik}
        <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <div className="space-y-2 pb-4">{children}</div>
    </details>
  )
}
