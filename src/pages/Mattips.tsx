import { ExternalLink } from 'lucide-react'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Matflikar } from '@/components/mat/Matflikar'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { GUIDER, type Guide } from '@/lib/tips'
import { cn } from '@/lib/utils'

const fokus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** Tips om mat på tur: korta guider med källor. Innehållet står i src/lib/tips.ts. */
export function Mattips() {
  useSidtitel('Tips')
  return (
    <div className="space-y-6">
      <Matflikar />
      <SidRubrik rubrik="Tips" text="Korta guider om energi, vatten, bränsle och packning. Råden är allmänna, och varje guide visar vilka källor siffrorna bygger på." />
      <nav aria-label="Guiderna" className="flex flex-wrap gap-2">
        {GUIDER.map((g) => (
          <a
            key={g.nyckel}
            href={`#${g.nyckel}`}
            className={cn('inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm transition-colors hover:bg-muted', fokus)}
          >
            {g.rubrik}
          </a>
        ))}
      </nav>
      <div className="grid gap-5 xl:grid-cols-2">
        {GUIDER.map((g) => (
          <GuideSektion key={g.nyckel} guide={g} />
        ))}
      </div>
    </div>
  )
}

function GuideSektion({ guide }: { guide: Guide }) {
  return (
    <div id={guide.nyckel} className="scroll-mt-6">
      <Sektion rubrik={guide.rubrik} className="h-full">
        <div className="max-w-prose space-y-4">
          <p className="text-lg">{guide.ingress}</p>
          {guide.avsnitt.map((a) => (
            <div key={a.rubrik} className="space-y-2">
              <h3 className="text-base">{a.rubrik}</h3>
              {a.stycken.map((s) => (
                <p key={s}>{s}</p>
              ))}
              {a.punkter && (
                <ul className="list-disc space-y-1 pl-5">
                  {a.punkter.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="space-y-1 border-t border-border pt-3">
            <h3 className="font-sans text-sm font-semibold text-muted-foreground">Källor</h3>
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
          </div>
        </div>
      </Sektion>
    </div>
  )
}
