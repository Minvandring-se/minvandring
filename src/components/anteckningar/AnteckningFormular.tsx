import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MAX_ANTECKNING, tolkaAnteckning } from '@/lib/anteckningar'

/** Skriver en ny anteckning eller ändrar en egen. onSpara ger true när det gick att spara. */
export function AnteckningFormular({
  start = { text: '', privat: false },
  knapptext,
  onSpara,
  onAvbryt,
  autoFocus = false,
}: {
  start?: { text: string; privat: boolean }
  knapptext: string
  onSpara: (text: string, privat: boolean) => Promise<boolean>
  onAvbryt?: () => void
  /** Flyttar fokus till textfältet, när man börjar ändra en anteckning. */
  autoFocus?: boolean
}) {
  const id = useId()
  const [text, setText] = useState(start.text)
  const [privat, setPrivat] = useState(start.privat)
  const [fel, setFel] = useState<string | null>(null)
  const [sparar, setSparar] = useState(false)

  async function spara(e: FormEvent) {
    e.preventDefault()
    const tolkad = tolkaAnteckning(text)
    if ('fel' in tolkad) return setFel(tolkad.fel)
    setSparar(true)
    const ok = await onSpara(tolkad.text, privat)
    setSparar(false)
    if (!ok) return setFel('Det gick inte att spara. Kontrollera uppkopplingen och försök igen.')
    setFel(null)
    if (!onAvbryt) {
      setText('')
      setPrivat(false)
    }
  }

  return (
    <form onSubmit={spara} noValidate className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${id}-text`} className="text-sm font-medium">
          Anteckning
        </label>
        <Textarea
          id={`${id}-text`}
          value={text}
          rows={3}
          autoFocus={autoFocus}
          maxLength={MAX_ANTECKNING}
          aria-invalid={fel ? true : undefined}
          aria-describedby={fel ? `${id}-fel` : undefined}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" className="size-5 shrink-0 accent-primary" checked={privat} onChange={(e) => setPrivat(e.target.checked)} />
        <span>Bara jag ser den</span>
      </label>
      {fel && (
        <p id={`${id}-fel`} role="alert" className="text-sm text-destructive">
          {fel}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={sparar}>
          {knapptext}
        </Button>
        {onAvbryt && (
          <Button type="button" variant="outline" onClick={onAvbryt}>
            Avbryt
          </Button>
        )}
      </div>
    </form>
  )
}
