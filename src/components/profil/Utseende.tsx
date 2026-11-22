import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { useTema } from '@/hooks/useTema'
import type { Temaval } from '@/lib/tema'

const VAL: { val: Temaval; namn: string; ikon: LucideIcon; hjalp: string }[] = [
  { val: 'ljus', namn: 'Ljust', ikon: Sun, hjalp: 'Alltid ljust läge.' },
  { val: 'mork', namn: 'Mörkt', ikon: Moon, hjalp: 'Alltid mörkt läge. Skönt på kvällen och i tältet.' },
  { val: 'system', namn: 'Som enheten', ikon: Monitor, hjalp: 'Följer enhetens inställning.' },
]

/**
 * Valet av ljust, mörkt eller som enheten. Riktiga radioknappar, så att piltangenterna flyttar valet och
 * skärmläsare säger vilket som är valt. Valet gäller på den här enheten.
 */
export function Utseende() {
  const id = useId()
  const { val, valj } = useTema()
  const valt = VAL.find((v) => v.val === val) ?? VAL[2]

  return (
    <fieldset className="space-y-3" aria-describedby={`${id}-hjalp`}>
      <legend className="mb-3 text-sm font-medium">Ljust eller mörkt läge</legend>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
        {VAL.map(({ val: v, namn, ikon: Ikon }) => (
          <label
            key={v}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] px-1 text-center text-sm min-[22.5rem]:whitespace-nowrap font-medium text-muted-foreground transition-colors hover:text-foreground has-checked:bg-card has-checked:font-semibold has-checked:ring-1 has-checked:ring-primary/40 mork:has-checked:bg-background has-checked:text-foreground has-checked:shadow-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring sm:text-base"
          >
            <input type="radio" name={`${id}-tema`} value={v} checked={val === v} onChange={() => valj(v)} className="sr-only" />
            <Ikon className="hidden size-4 shrink-0 sm:block" aria-hidden />
            {namn}
          </label>
        ))}
      </div>
      <p id={`${id}-hjalp`} className="text-sm text-muted-foreground">
        {valt.hjalp} Valet gäller bara på den här enheten.
      </p>
    </fieldset>
  )
}
