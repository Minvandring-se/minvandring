import { lazy, Suspense, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { Layout } from '@/components/Layout'
import { useSession } from '@/hooks/useSession'
import { GaMed } from '@/pages/GaMed'
import { Integritet } from '@/pages/Integritet'
import { LoggaIn } from '@/pages/LoggaIn'
import { Start } from '@/pages/Start'

// Sidorna för inloggade ligger i egna JS-filer och hämtas först när de behövs.
// Startsidan, inloggningen och integritetssidan ligger kvar i huvudfilen.
const MinaTurer = lazy(() => import('@/pages/MinaTurer').then((m) => ({ default: m.MinaTurer })))
const Profil = lazy(() => import('@/pages/Profil').then((m) => ({ default: m.Profil })))
const TurSida = lazy(() => import('@/pages/Tur').then((m) => ({ default: m.TurSida })))

function Laddar({ text = 'Laddar …' }: { text?: string }) {
  return (
    <p role="status" className="text-muted-foreground">
      {text}
    </p>
  )
}

/** Sidor som kräver inloggning. Skickar till inloggningen och tillbaka efteråt. */
function Inloggad({ children }: { children: ReactNode }) {
  const session = useSession()
  const { pathname } = useLocation()
  if (session === undefined) return <Laddar />
  if (session === null) return <Navigate to={`/logga-in?vidare=${encodeURIComponent(pathname)}`} replace />
  return <Suspense fallback={<Laddar text="Hämtar sidan …" />}>{children}</Suspense>
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/logga-in" element={<LoggaIn />} />
        <Route path="/integritet" element={<Integritet />} />
        <Route path="/ga-med/:kod" element={<GaMed />} />
        <Route path="/turer" element={<Inloggad><MinaTurer /></Inloggad>} />
        <Route path="/profil" element={<Inloggad><Profil /></Inloggad>} />
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
