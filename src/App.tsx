import { lazy, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { AppSkal } from '@/components/app/AppSkal'
import { Layout } from '@/components/Layout'
import { useSession } from '@/hooks/useSession'
import { GaMed } from '@/pages/GaMed'
import { GlomtLosenord } from '@/pages/GlomtLosenord'
import { Integritet } from '@/pages/Integritet'
import { LoggaIn } from '@/pages/LoggaIn'
import { NyttLosenord } from '@/pages/NyttLosenord'
import { SkapaKonto } from '@/pages/SkapaKonto'
import { Start } from '@/pages/Start'

// Sidorna för inloggade ligger i egna JS-filer och hämtas först när de behövs.
// Startsidan, sidorna för konto och inloggning samt integritetssidan ligger kvar i huvudfilen.
const MinaTurer = lazy(() => import('@/pages/MinaTurer').then((m) => ({ default: m.MinaTurer })))
const Forrad = lazy(() => import('@/pages/Forrad').then((m) => ({ default: m.Forrad })))
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
  return children
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/logga-in" element={<LoggaIn />} />
        <Route path="/skapa-konto" element={<SkapaKonto />} />
        <Route path="/glomt-losenord" element={<GlomtLosenord />} />
        <Route path="/nytt-losenord" element={<NyttLosenord />} />
        <Route path="/integritet" element={<Integritet />} />
        <Route path="/ga-med/:kod" element={<GaMed />} />
        {/* De inloggade sidorna, i ramen med sidomeny och bottennavigation. */}
        <Route element={<Inloggad><AppSkal /></Inloggad>}>
          <Route path="/turer" element={<MinaTurer />} />
          <Route path="/tur/:id" element={<TurSida />} />
          <Route path="/forrad" element={<Forrad />} />
          <Route path="/profil" element={<Profil />} />
        </Route>
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
