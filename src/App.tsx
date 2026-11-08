import type { ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { Layout } from '@/components/Layout'
import { useSession } from '@/hooks/useSession'
import { GaMed } from '@/pages/GaMed'
import { LoggaIn } from '@/pages/LoggaIn'
import { MinaTurer } from '@/pages/MinaTurer'
import { Start } from '@/pages/Start'
import { TurSida } from '@/pages/Tur'

/** Sidor som kräver inloggning. Skickar till inloggningen och tillbaka efteråt. */
function Inloggad({ children }: { children: ReactNode }) {
  const session = useSession()
  const { pathname } = useLocation()
  if (session === undefined) return <p className="text-muted-foreground">Laddar …</p>
  if (session === null) return <Navigate to={`/logga-in?vidare=${encodeURIComponent(pathname)}`} replace />
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/logga-in" element={<LoggaIn />} />
        <Route path="/ga-med/:kod" element={<GaMed />} />
        <Route path="/turer" element={<Inloggad><MinaTurer /></Inloggad>} />
        <Route path="/tur/:id" element={<Inloggad><TurSida /></Inloggad>} />
        <Route
          path="*"
          element={
            <p>
              Sidan finns inte. <Link to="/" className="underline">Till startsidan</Link>
            </p>
          }
        />
      </Routes>
    </Layout>
  )
}
