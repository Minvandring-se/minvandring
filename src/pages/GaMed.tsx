import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabase'

/** /ga-med/KOD: loggar in vid behov och lägger till den inloggade som deltagare i turen. */
export function GaMed() {
  const { kod = '' } = useParams()
  const session = useSession()
  const navigate = useNavigate()
  const [fel, setFel] = useState(false)

  useEffect(() => {
    if (!session || !supabase) return
    supabase.rpc('ga_med', { kod }).then(({ data, error }) => {
      if (error || !data) setFel(true)
      else navigate(`/tur/${data}`, { replace: true })
    })
  }, [session, kod, navigate])

  if (session === null) return <Navigate to={`/logga-in?vidare=/ga-med/${kod}`} replace />
  if (fel) return <p>Inbjudan fungerar inte. Be om en ny länk.</p>
  return <p className="text-muted-foreground">Går med i turen …</p>
}
