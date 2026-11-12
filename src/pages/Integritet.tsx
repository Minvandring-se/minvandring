import type { ReactNode } from 'react'
import { KONTAKT_MEJL } from '@/lib/kontakt'

function Avsnitt({ rubrik, children }: { rubrik: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl">{rubrik}</h2>
      {children}
    </section>
  )
}

const lank = 'font-medium text-primary underline underline-offset-2 hover:text-primary-hover'

function Mejladresser() {
  return KONTAKT_MEJL.map((mejl, i) => (
    <span key={mejl}>
      {i > 0 && ' eller '}
      <a href={`mailto:${mejl}`} className={lank}>
        {mejl}
      </a>
    </span>
  ))
}

/**
 * Utkast till integritetspolicy. Ska bara beskriva det appen faktiskt gör med data idag.
 * Uppdatera texten när nya funktioner börjar spara mer data.
 */
export function Integritet() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 py-4 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl">Integritetspolicy</h1>
        <p className="text-muted-foreground">Så här hanterar MinVandring dina uppgifter.</p>
      </header>

      <Avsnitt rubrik="Vad vi sparar">
        <ul className="list-disc space-y-1 pl-5">
          <li>Din mejladress, som du loggar in med.</li>
          <li>Ditt namn i profilen, som de andra i dina turer ser.</li>
          <li>
            Det du skriver in i en tur: namn, destination, startpunkt, datum, antal dagar och reservdagar, samt vilka deltagare som är
            med och vilken roll de har.
          </li>
          <li>Namn på deltagare som du själv lägger till, till exempel en kompis utan konto eller en hund.</li>
          <li>Tekniska uppgifter som behövs för inloggningen, till exempel när du senast loggade in.</li>
        </ul>
      </Avsnitt>

      <Avsnitt rubrik="Varför vi sparar det">
        <p>
          Uppgifterna behövs för att du ska kunna logga in och planera vandringar tillsammans med andra. Vi använder dem inte till
          reklam och säljer dem inte vidare.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Vem som ser dina uppgifter">
        <p>
          Bara de som är med i samma tur ser turen, deltagarna och deras namn. Den som har turens inbjudningslänk kan gå med i turen
          efter att ha loggat in, så dela länken bara med dem du vill ha med.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Var uppgifterna finns">
        <p>
          Uppgifterna lagras i en databas hos Supabase, i deras datacenter i Stockholm (eu-north-1). Supabase sköter också
          inloggningen och skickar inloggningslänken till din mejl.
        </p>
        <p>
          Själva webbplatsen levereras av Vercel. När du besöker sidan behandlar Vercel tekniska uppgifter som behövs för att visa
          den, till exempel din IP-adress.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Cookies">
        <p>
          Vi använder inga cookies för spårning eller reklam och ingen webbanalys. För att du ska förbli inloggad sparas inloggningen
          i din webbläsares lokala lagring. Den försvinner när du loggar ut.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Radera dina uppgifter">
        <p>
          Du kan när som helst be oss radera ditt konto och dina uppgifter. Mejla{' '}
          <Mejladresser />{' '}
          så tar vi bort dem. Du kan också själv lämna en tur, och den som äger en tur kan radera den. Då försvinner allt i turen för
          alla.
        </p>
        <p>
          Du har också rätt att få veta vilka uppgifter vi har om dig och att få fel rättade. Om du tycker att vi hanterar dina
          uppgifter fel kan du kontakta oss eller vända dig till Integritetsskyddsmyndigheten (IMY).
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Frågor">
        <p>
          Hör av dig till{' '}
          <Mejladresser />
          .
        </p>
      </Avsnitt>
    </article>
  )
}
