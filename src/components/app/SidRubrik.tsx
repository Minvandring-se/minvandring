import type { ReactNode } from 'react'

/** Sidans rubrik med en kort text under och eventuella knappar till höger. */
export function SidRubrik({ rubrik, text, knappar }: { rubrik: string; text?: ReactNode; knappar?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 space-y-1">
        <h1 className="text-3xl break-words lg:text-4xl">{rubrik}</h1>
        {text && <p className="text-muted-foreground lg:text-lg">{text}</p>}
      </div>
      {knappar && <div className="flex shrink-0 gap-2">{knappar}</div>}
    </div>
  )
}
