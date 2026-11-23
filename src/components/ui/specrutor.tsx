/** Uppgifter som rutor med etiketten över värdet, två i bredd. Används i katalogernas detaljpaneler. */
export function Specrutor({ rader }: { rader: readonly { etikett: string; varde: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {rader.map((rad) => (
        <div key={rad.etikett} className="min-w-0 rounded-md bg-muted px-3 py-2">
          <dt className="text-xs text-muted-foreground">{rad.etikett}</dt>
          <dd className="font-semibold break-words">{rad.varde}</dd>
        </div>
      ))}
    </dl>
  )
}
