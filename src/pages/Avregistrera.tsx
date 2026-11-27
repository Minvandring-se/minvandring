import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { knappStil } from '@/components/ui/knappStil'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'

/**
 * /avregistrera/KOD: länken längst ner i mejlen från MinVandring. Fungerar utan inloggning. Mejlen stängs av först när
 * man trycker på knappen, så att en mejltjänst som öppnar länkarna i förväg inte avregistrerar någon.
 */
export function Avregistrera() {
  useSidtitel('Avregistrera dig')
  const { kod = '' } = useParams()
  const [lage, setLage] = useState<'fraga' | 'skickar' | 'klar' | 'fel'>('fraga')

  async function avregistrera() {
    if (!supabase) return
    setLage('skickar')
    const { error } = await supabase.rpc('avregistrera', { kod })
    setLage(error ? 'fel' : 'klar')
  }

  if (lage === 'klar')
    return (
      <Card className="mx-auto mt-10 max-w-md space-y-4">
        <h1 className="text-2xl">Du får inga fler mejl</h1>
        <p role="status">MinVandring skickar inga fler mejl till dig. Notiserna i appen finns kvar. Du kan slå på mejlen igen under Inställningar.</p>
        <Link to="/installningar" className={knappStil({ variant: 'outline' })}>
          Inställningar
        </Link>
      </Card>
    )

  return (
    <Card className="mx-auto mt-10 max-w-md space-y-4">
      <h1 className="text-2xl">Sluta få mejl från MinVandring?</h1>
      <p>Du får då inga mejl om att någon har lagt till dig i en tur, om vänförfrågningar eller om påminnelser. Notiserna i appen finns kvar.</p>
      {lage === 'fel' && <p role="alert" className="text-sm text-destructive">Det gick inte just nu. Kontrollera uppkopplingen och försök igen.</p>}
      <Button onClick={avregistrera} disabled={lage === 'skickar'}>
        {lage === 'skickar' ? 'Avregistrerar …' : 'Sluta få mejl'}
      </Button>
    </Card>
  )
}
