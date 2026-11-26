import { useId } from 'react'
import { Namnbricka } from '@/components/app/Namnbricka'
import { useProfilbilder } from '@/hooks/useProfilbilder'
import type { Van } from '@/lib/vanner'

/** Vänner att bocka i, till exempel de som ska med i en tur. Varje rad är minst 44 px hög och hela raden går att trycka på. */
export function VanVal({ vanner, valda, onAndra, rubrik }: { vanner: readonly Van[]; valda: ReadonlySet<string>; onAndra: (valda: Set<string>) => void; rubrik: string }) {
  const id = useId()
  const bilder = useProfilbilder(vanner.filter((v) => v.bild_uppdaterad).map((v) => v.user_id))

  function vaxla(userId: string) {
    const nya = new Set(valda)
    if (nya.has(userId)) nya.delete(userId)
    else nya.add(userId)
    onAndra(nya)
  }

  return (
    <fieldset className="space-y-1">
      <legend className="mb-1 text-sm font-medium">{rubrik}</legend>
      <ul className="divide-y divide-border rounded-md border border-border bg-card">
        {vanner.map((v) => (
          <li key={v.user_id}>
            <label htmlFor={`${id}-${v.user_id}`} className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2">
              <input
                id={`${id}-${v.user_id}`}
                type="checkbox"
                checked={valda.has(v.user_id)}
                onChange={() => vaxla(v.user_id)}
                className="size-5 shrink-0 accent-primary"
              />
              <Namnbricka namn={v.namn} bild={bilder[v.user_id]} />
              <span className="min-w-0 flex-1 font-medium break-words">{v.namn}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
