import { Plus } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { laggTillLardom } from '@/hooks/useLardomar'
import { AMNEN, arAmne, MAX_LARDOM, tolkaLardom, type Amne } from '@/lib/lardomar'

/** Skriver en ny lärdom, i en tur eller utan tur. */
export function LardomFormular({ turId, onSparad }: { turId: string | null; onSparad: () => Promise<void> }) {
  const id = useId()
  const [text, setText] = useState('')
  const [amne, setAmne] = useState<Amne>('packning')
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  async function spara(e: FormEvent) {
    e.preventDefault()
    const tolkad = tolkaLardom(text)
    if ('fel' in tolkad) return setFel(tolkad.fel)
    setSparar(true)
    const ok = await laggTillLardom(turId, amne, tolkad.text)
    setSparar(false)
    if (!ok) return setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
    setText('')
    setFel(null)
    await onSparad()
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-text`} className="text-sm font-medium">
          Vad vill du komma ihåg?
        </label>
        <Input
          id={`${id}-text`}
          value={text}
          maxLength={MAX_LARDOM}
          placeholder="Till exempel: en extra gaspatron till fyra dagar"
          aria-invalid={fel ? true : undefined}
          aria-describedby={fel ? `${id}-fel` : undefined}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5 sm:w-56">
          <label htmlFor={`${id}-amne`} className="text-sm font-medium">
            Ämne
          </label>
          <Select id={`${id}-amne`} value={amne} onChange={(e) => arAmne(e.target.value) && setAmne(e.target.value)}>
            {AMNEN.map((a) => (
              <option key={a.nyckel} value={a.nyckel}>
                {a.etikett}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={sparar}>
          <Plus className="size-4" aria-hidden />
          Lägg till
        </Button>
      </div>
      {fel && (
        <p id={`${id}-fel`} role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
    </form>
  )
}
