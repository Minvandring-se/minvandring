import { lazy, Suspense, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
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

// Sidorna för inloggade ligger i egna JS-filer och hämtas först när de behövs, liksom ramen med sidomenyn
// (höjdkurvorna och ikonerna är stora). Startsidan, sidorna för konto och inloggning samt integritetssidan ligger kvar
// i huvudfilen.
const AppSkal = lazy(() => import('@/components/app/AppSkal').then((m) => ({ default: m.AppSkal })))
const Hem = lazy(() => import('@/pages/Hem').then((m) => ({ default: m.Hem })))
const HittaVandring = lazy(() => import('@/pages/HittaVandring').then((m) => ({ default: m.HittaVandring })))
const MinaTurer = lazy(() => import('@/pages/MinaTurer').then((m) => ({ default: m.MinaTurer })))
const Forrad = lazy(() => import('@/pages/Forrad').then((m) => ({ default: m.Forrad })))
const Profil = lazy(() => import('@/pages/Profil').then((m) => ({ default: m.Profil })))
const TurRam = lazy(() => import('@/pages/tur/TurRam').then((m) => ({ default: m.TurRam })))
const TurOversikt = lazy(() => import('@/pages/tur/TurOversikt').then((m) => ({ default: m.TurOversikt })))
const TurMat = lazy(() => import('@/pages/tur/TurMat').then((m) => ({ default: m.TurMat })))
const TurEtapper = lazy(() => import('@/pages/tur/TurEtapper').then((m) => ({ default: m.TurEtapper })))
const TurPackning = lazy(() => import('@/pages/tur/TurPackning').then((m) => ({ default: m.TurPackning })))
const TurInkopslista = lazy(() => import('@/pages/tur/TurInkopslista').then((m) => ({ default: m.TurInkopslista })))
const TurAnteckningar = lazy(() => import('@/pages/tur/TurAnteckningar').then((m) => ({ default: m.TurAnteckningar })))
const Packlistor = lazy(() => import('@/pages/Packlistor').then((m) => ({ default: m.Packlistor })))
const KomIhag = lazy(() => import('@/pages/KomIhag').then((m) => ({ default: m.KomIhag })))
const TurKommerSnart = lazy(() => import('@/pages/tur/TurKommerSnart').then((m) => ({ default: m.TurKommerSnart })))
const Installningar = lazy(() => import('@/pages/Installningar').then((m) => ({ default: m.Installningar })))
const Matplanering = lazy(() => import('@/pages/Matplanering').then((m) => ({ default: m.Matplanering })))
const Matkatalog = lazy(() => import('@/pages/Matkatalog').then((m) => ({ default: m.Matkatalog })))
const Skafferi = lazy(() => import('@/pages/Skafferi').then((m) => ({ default: m.Skafferi })))
const Recept = lazy(() => import('@/pages/Recept').then((m) => ({ default: m.Recept })))
const Mattips = lazy(() => import('@/pages/Mattips').then((m) => ({ default: m.Mattips })))
const Receptsida = lazy(() => import('@/pages/Receptsida').then((m) => ({ default: m.Receptsida })))
const Mattipsartikel = lazy(() => import('@/pages/Mattipsartikel').then((m) => ({ default: m.Mattipsartikel })))
const Vanner = lazy(() => import('@/pages/Vanner').then((m) => ({ default: m.Vanner })))
const VanLank = lazy(() => import('@/pages/VanLank').then((m) => ({ default: m.VanLank })))
const PlaneradSida = lazy(() => import('@/pages/PlaneradSida').then((m) => ({ default: m.PlaneradSida })))

/** Sidorna i menyn som inte är byggda än. De visar vad sidan blir, med "Kommer snart". */
const PLANERADE = ['dagbok', 'statistik'] as const
const Utrustningskatalog = lazy(() => import('@/pages/Utrustningskatalog').then((m) => ({ default: m.Utrustningskatalog })))

function Laddar({ text = 'Hämtar …' }: { text?: string }) {
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
      {/* Medan en sidas fil hämtas visas en tom yta, utan text som blinkar förbi. Inne i ramen har sidorna en egen
          laddning med platshållare. */}
      <Suspense fallback={<div aria-busy className="min-h-dvh" />}>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/logga-in" element={<LoggaIn />} />
        <Route path="/skapa-konto" element={<SkapaKonto />} />
        <Route path="/glomt-losenord" element={<GlomtLosenord />} />
        <Route path="/nytt-losenord" element={<NyttLosenord />} />
        <Route path="/integritet" element={<Integritet />} />
        <Route path="/ga-med/:kod" element={<GaMed />} />
        <Route path="/van/:kod" element={<VanLank />} />
        {/* De inloggade sidorna, i ramen med sidomeny och bottennavigation. */}
        <Route element={<Inloggad><AppSkal /></Inloggad>}>
          <Route path="/turer" element={<MinaTurer />} />
          {/* Turen är en ram med delsidor. Ramen hämtar turen och deltagarna en gång. */}
          <Route path="/tur/:id" element={<TurRam />}>
            <Route index element={<TurOversikt />} />
            <Route path="mat" element={<TurMat />} />
            <Route path="etapper" element={<TurEtapper />} />
            <Route path="packning" element={<TurPackning />} />
            <Route path="anteckningar" element={<TurAnteckningar />} />
            <Route path="mat/inkopslista" element={<TurInkopslista />} />
            {/* Flikarna som inte är byggda än. Okända delar visar översikten. */}
            <Route path=":del" element={<TurKommerSnart />} />
            <Route path="*" element={<TurOversikt />} />
          </Route>
          <Route path="/forrad" element={<Forrad />} />
          <Route path="/packlistor" element={<Packlistor />} />
          <Route path="/kom-ihag" element={<KomIhag />} />
          <Route path="/hem" element={<Hem />} />
          <Route path="/hitta-vandring" element={<HittaVandring />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/installningar" element={<Installningar />} />
          <Route path="/utrustning" element={<Utrustningskatalog />} />
          <Route path="/matplanering" element={<Matplanering />} />
          <Route path="/matplanering/katalog" element={<Matkatalog />} />
          <Route path="/matplanering/skafferi" element={<Skafferi />} />
          <Route path="/matplanering/recept" element={<Recept />} />
          <Route path="/matplanering/recept/:id" element={<Receptsida />} />
          <Route path="/matplanering/tips" element={<Mattips />} />
          <Route path="/matplanering/tips/:nyckel" element={<Mattipsartikel />} />
          <Route path="/vanner" element={<Vanner />} />
          {/* Sidan hette Vandringskompisar och låg på /kompisar. */}
          <Route path="/kompisar" element={<Navigate to="/vanner" replace />} />
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
      </Suspense>
      </Felgrans>
    </Layout>
  )
}
