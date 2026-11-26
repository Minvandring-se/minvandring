import { Link } from 'react-router'
import { Sektion } from '@/components/ui/sektion'
import { useLardomar } from '@/hooks/useLardomar'
import { delaUpp, franText } from '@/lib/lardomar'
import { turdelAdress } from '@/lib/turdelar'

const VISAS = 3

/** Dina lärdomar från tidigare turer, högst tre, med en länk till resten under Anteckningar. Visas inte när du saknar lärdomar. */
export function KomIhagIOversikten({ turId, className }: { turId: string; className?: string }) {
  const { lage } = useLardomar()
  if (lage.lage !== 'klar') return null
  const { tidigare } = delaUpp(lage.lardomar, turId)
  if (tidigare.length === 0) return null
  return (
    <Sektion rubrik="Kom ihåg till den här turen" variant="accent" className={className}>
      <ul className="space-y-2">
        {tidigare.slice(0, VISAS).map((l) => (
          <li key={l.id}>
            <p className="break-words">{l.text}</p>
            {franText(l) && <p className="text-sm break-words text-muted-foreground">{franText(l)}</p>}
          </li>
        ))}
      </ul>
      <Link
        to={turdelAdress(turId, 'anteckningar')}
        className="inline-flex min-h-11 items-center self-start rounded-md font-medium text-accent-strong underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {tidigare.length > VISAS ? `Alla ${tidigare.length} lärdomar` : 'Till anteckningarna'}
      </Link>
    </Sektion>
  )
}
