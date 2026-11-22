import { Link, useLocation, useParams } from 'react-router'
import { useTur } from '@/components/tur/turKontext'
import { KommerSnart } from '@/components/ui/kommerSnart'
import { Sektion } from '@/components/ui/sektion'
import { delFranSokvag, turdel, turdelAdress } from '@/lib/turdelar'
import { TurOversikt } from '@/pages/tur/TurOversikt'

/**
 * En flik i turen som inte är byggd än. Säger rakt ut vad den blir och leder tillbaka till översikten.
 * En okänd del i adressen visar översikten.
 */
export function TurKommerSnart() {
  const { tur } = useTur()
  const { state } = useLocation()
  const del = delFranSokvag(useParams().del)
  if (del === 'oversikt') return <TurOversikt />
  const { namn, blir } = turdel(del)
  return (
    <Sektion rubrik={namn} kommerSnart>
      <KommerSnart text={blir} />
      <Link
        to={turdelAdress(tur.id, 'oversikt')}
        replace
        state={state}
        className="inline-flex min-h-11 items-center self-start rounded-md font-medium text-primary underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Till översikten
      </Link>
    </Sektion>
  )
}
