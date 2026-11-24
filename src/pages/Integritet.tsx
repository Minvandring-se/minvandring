import type { ReactNode } from 'react'
import { useSidtitel } from '@/hooks/useSidtitel'
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

/** Kontaktadressen som länk. Saknas den (se src/lib/kontakt.ts) visas "..." utan länk. */
function Kontaktadress() {
  if (!KONTAKT_MEJL) return <>...</>
  return (
    <a href={`mailto:${KONTAKT_MEJL}`} className={lank}>
      {KONTAKT_MEJL}
    </a>
  )
}

/**
 * Integritetspolicy för betan. Ska bara beskriva det appen faktiskt gör med data i dag.
 * Uppdatera texten när nya funktioner börjar spara mer data eller nya tjänster kopplas in.
 */
export function Integritet() {
  useSidtitel('Integritetspolicy')
  return (
    <article className="mx-auto max-w-2xl space-y-8 py-4 leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-3xl">Integritetspolicy</h1>
        <p className="text-muted-foreground">Så här hanterar MinVandring dina uppgifter under betan.</p>
      </header>

      <Avsnitt rubrik="Vem som ansvarar">
        <p>
          MinVandring drivs privat av Andreas och Oscar. Vi är personuppgiftsansvariga för de uppgifter du lämnar här. Du når oss på{' '}
          <Kontaktadress />
          {KONTAKT_MEJL && '.'}
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Vad vi sparar">
        <ul className="list-disc space-y-1 pl-5">
          <li>Ditt namn och din mejladress.</li>
          <li>
            Din profilbild, om du har lagt in en. Den syns bara för dig och dem du delar en tur med, och du kan ta bort den när som helst
            i Profil.
          </li>
          <li>Ditt lösenord. Det sparas krypterat hos Supabase, så varken vi eller någon annan kan se det.</li>
          <li>Dina turer och det ni lägger in i dem: deltagare, packning och mat.</li>
          <li>Namn på deltagare utan konto, som någon annan i turen har lagt till, till exempel en kompis eller en hund.</li>
          <li>
            Dina kostbehov och allergier, om du själv anger dem under Mat i en tur. Det är frivilligt, och bara du kan ange dina. De
            sparas för en tur i taget, tillsammans med när du samtyckte.
          </li>
        </ul>
      </Avsnitt>

      <Avsnitt rubrik="Varför vi sparar det">
        <p>
          Vi sparar uppgifterna för att tjänsten ska fungera: så att du kan logga in och planera vandringar tillsammans med andra. Det
          är den rättsliga grunden, ett avtal mellan dig och oss när du skapar ett konto. Vi använder inte uppgifterna till reklam och
          säljer dem inte vidare.
        </p>
        <p>
          Kostbehov och allergier är uppgifter om hälsa. Dem sparar vi bara med ditt samtycke, som du ger med en kryssruta när du
          sparar dem i en tur. Samtycket gäller den turen. Du återkallar det genom att ta bort dina kostbehov: tryck på Ta bort mina
          kostbehov. Då raderas uppgifterna direkt. De raderas också när du lämnar turen eller turen
          raderas.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Vem som ser dina uppgifter">
        <p>
          Bara de som är med i samma tur ser turen, deltagarna och deras namn. Den som har turens inbjudningslänk kan gå med i turen
          efter att ha loggat in, så dela länken bara med dem du vill ha med. Det gäller också kostbehov och allergier: de syns för
          alla i samma tur, så att ni kan välja mat som passar, men inte för någon annan. Ingen annan kan ange eller ändra dina.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Tjänster som hanterar uppgifterna åt oss">
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase sköter databasen och inloggningen. Uppgifterna ligger i deras datacenter i Stockholm.</li>
          <li>Resend skickar mejlen, till exempel när du skapar konto eller väljer nytt lösenord. Mejlen skickas från Irland.</li>
          <li>Vercel driver webbplatsen. När du besöker den behandlar Vercel tekniska uppgifter som behövs för att visa sidan, till exempel din IP-adress.</li>
        </ul>
      </Avsnitt>

      <Avsnitt rubrik="Hur länge vi sparar uppgifterna">
        <p>
          Vi sparar dina uppgifter så länge du har ett konto.{' '}
          {KONTAKT_MEJL ? (
            <>
              Mejla oss på <Kontaktadress /> om du vill att vi raderar ditt konto.
            </>
          ) : (
            'Hör av dig till oss om du vill att vi raderar ditt konto.'
          )}{' '}
          Då raderar vi kontot och alla turer som du äger. Den som äger en tur kan också själv radera den, och då försvinner allt i
          turen för alla.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Kakor">
        <p>
          Vi använder inga kakor för spårning eller statistik. Det enda vi sparar i din webbläsare är det som behövs för att du ska
          vara inloggad. Det försvinner när du loggar ut.
        </p>
      </Avsnitt>

      <Avsnitt rubrik="Dina rättigheter">
        <ul className="list-disc space-y-1 pl-5">
          <li>Du har rätt att få ut de uppgifter vi har om dig.</li>
          <li>Du har rätt att få fel rättade.</li>
          <li>Du har rätt att få dina uppgifter raderade.</li>
          <li>Tycker du att vi hanterar dina uppgifter fel kan du klaga hos Integritetsskyddsmyndigheten (IMY).</li>
        </ul>
      </Avsnitt>

      <Avsnitt rubrik="Källor">
        <p>
          Näringsvärdena i förslagen när du skriver ingredienser kommer från{' '}
          <a href="https://www.livsmedelsverket.se/om-oss/psidata/livsmedelsdatabasen" className={lank}>
            Livsmedelsverkets livsmedelsdatabas
          </a>{' '}
          och används enligt licensen{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/deed.sv" className={lank}>
            CC BY 4.0
          </a>
          . Vi har avrundat värdena och läst ut ur namnet om livsmedlet är torrt, rått eller tillagat. Värdena är kopierade till
          MinVandring, så appen hämtar ingenting från Livsmedelsverket när du använder den, och inga uppgifter om dig skickas dit.
          Du kan ändra värdena när du har valt ett förslag.
        </p>
      </Avsnitt>
    </article>
  )
}
