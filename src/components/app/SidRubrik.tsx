import type { ReactNode } from 'react'

/** Sidans rubrik med en valfri etikett bredvid (till exempel "Kommer snart"), en kort text under och knappar till höger. */
export function SidRubrik({ rubrik, etikett, text, knappar }: { rubrik: string; etikett?: ReactNode; text?: ReactNode; knappar?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-3xl break-words lg:text-4xl">{rubrik}</h1>
          {etikett}
        </div>
        {text && <p className="max-w-prose text-muted-foreground lg:text-lg">{text}</p>}
      </div>
      {knappar && <div className="flex shrink-0 gap-2">{knappar}</div>}
    </div>
  )
}
