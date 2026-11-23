import { lazy, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { AppSkal } from '@/components/app/AppSkal'
import { Felgrans } from '@/components/Felgrans'
import { Layout } from '@/components/Layout'
import { RullaUpp } from '@/components/RullaUpp'
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
const TurRam = lazy(() => import('@/pages/tur/TurRam').then((m) => ({ default: m.TurRam })))
const TurOversikt = lazy(() => import('@/pages/tur/TurOversikt').then((m) => ({ default: m.TurOversikt })))
const TurMat = lazy(() => import('@/pages/tur/TurMat').then((m) => ({ default: m.TurMat })))
const TurKommerSnart = lazy(() => import('@/pages/tur/TurKommerSnart').then((m) => ({ default: m.TurKommerSnart })))
const Installningar = lazy(() => import('@/pages/Installningar').then((m) => ({ default: m.Installningar })))
const Matplanering = lazy(() => import('@/pages/Matplanering').then((m) => ({ default: m.Matplanering })))
const Matkatalog = lazy(() => import('@/pages/Matkatalog').then((m) => ({ default: m.Matkatalog })))
const Skafferi = lazy(() => import('@/pages/Skafferi').then((m) => ({ default: m.Skafferi })))
const PlaneradSida = lazy(() => import('@/pages/PlaneradSida').then((m) => ({ default: m.PlaneradSida })))

/** Sidorna i menyn som inte är byggda än. De visar vad sidan blir, med "Kommer snart". */
const PLANERADE = ['packlistor', 'dagbok', 'kom-ihag', 'statistik', 'kompisar'] as const
const Utrustningskatalog = lazy(() => import('@/pages/Utrustningskatalog').then((m) => ({ default: m.Utrustningskatalog })))

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
  const { pathname, search, hash } = useLocation()
  if (session === undefined) return <Laddar />
  // Hela adressen följer med, så att till exempel filtret i förrådet eller #bjud-in i en tur finns kvar efter inloggningen.
  if (session === null) return <Navigate to={`/logga-in?vidare=${encodeURIComponent(pathname + search + hash)}`} replace />
  return children
}

export default function App() {
  const { pathname } = useLocation()
  return (
    <Layout>
      <RullaUpp />
      {/* Fångar fel på sidorna utan sidomeny. De inloggade sidorna har en egen felgräns inne i ramen. */}
      <Felgrans aterstall={pathname}>
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
          {/* Turen är en ram med delsidor. Ramen hämtar turen och deltagarna en gång. */}
          <Route path="/tur/:id" element={<TurRam />}>
            <Route index element={<TurOversikt />} />
            <Route path="mat" element={<TurMat />} />
            {/* Flikarna som inte är byggda än. Okända delar visar översikten. */}
            <Route path=":del" element={<TurKommerSnart />} />
            <Route path="*" element={<TurOversikt />} />
          </Route>
          <Route path="/forrad" element={<Forrad />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/installningar" element={<Installningar />} />
          <Route path="/utrustning" element={<Utrustningskatalog />} />
          <Route path="/matplanering" element={<Matplanering />} />
          <Route path="/matplanering/katalog" element={<Matkatalog />} />
          <Route path="/matplanering/skafferi" element={<Skafferi />} />
          {PLANERADE.map((sida) => (
            <Route key={sida} path={`/${sida}`} element={<PlaneradSida key={sida} sida={sida} />} />
          ))}
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
      </Felgrans>
    </Layout>
  )
}
