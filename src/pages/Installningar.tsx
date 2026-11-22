import { LogOut, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { SidRubrik } from '@/components/app/SidRubrik'
import { Utseende } from '@/components/profil/Utseende'
import { Button } from '@/components/ui/button'
import { knappStil } from '@/components/ui/knappStil'
import { Sektion } from '@/components/ui/sektion'
import { useSidtitel } from '@/hooks/useSidtitel'
import { supabase } from '@/lib/supabase'

/** Inställningar: utseendet (ljust, mörkt eller som enheten) och kontot. Namn och bild ändras på Profil. */
export function Installningar() {
  const navigate = useNavigate()
  useSidtitel('Inställningar')

  async function loggaUt() {
    await supabase?.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="space-y-6">
      <SidRubrik rubrik="Inställningar" text="Hur appen ser ut, och ditt konto." />
      <div className="grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <Sektion rubrik="Utseende">
          <Utseende />
        </Sektion>
        <Sektion rubrik="Konto">
          <p className="text-sm text-muted-foreground">Ändra ditt namn och din bild på Profil. Logga ut från MinVandring på den här enheten.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/profil" className={knappStil({ variant: 'outline' })}>
              <UserRound className="size-4" aria-hidden />
              Profil
            </Link>
            <Button variant="outline" onClick={loggaUt}>
              <LogOut className="size-4" aria-hidden />
              Logga ut
            </Button>
          </div>
        </Sektion>
      </div>
    </div>
  )
}
