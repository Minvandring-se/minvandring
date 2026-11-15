# Att göra för Andreas

Hej Andreas! Det här behöver göras från ditt håll, eftersom det gäller Vercel och migreringar, som körs från din dator. Be din Claude Code läsa filen och hjälpa dig. Följ CLAUDE.md. Det som kräver dina inloggningar gör du själv.

Bocka av punkterna här när de är klara och committa filen.

## 1. Rätta Supabase-adressen i Vercel (brådskande)

Det går inte att skapa konto på www.minvandring.se just nu. `VITE_SUPABASE_URL` i Vercel slutar med `/rest/v1`, så anropen till inloggningen går till en adress som inte finns (404 i Supabase API Gateway-loggar).

- [ ] Vercel → projektet → Settings → Environment Variables → `VITE_SUPABASE_URL`
- [ ] Ändra värdet till exakt `https://psvuzkkauiqhimnhtjep.supabase.co` (utan `/rest/v1` och utan snedstreck på slutet), för Production och Preview
- [ ] Deployments → senaste → Redeploy (adressen byggs in vid publicering)
- [ ] Kontrollera att det går att skapa konto på www.minvandring.se/skapa-konto och att bekräftelsemejlet kommer

## 2. Kör migreringen som stänger databasfunktionerna

Supabase Security Advisor visar 22 varningar om att SECURITY DEFINER-funktionerna kan anropas via API:t. Oscar har en PR med en migrering som stänger det. Bara en av oss kör migreringar åt gången, så meddela Oscar när du kör.

- [ ] Hämta PR:en med migreringen och läs SQL:en
- [ ] Kör `npx supabase db push --remote` (projektet behöver vara länkat: `npx supabase link --project-ref psvuzkkauiqhimnhtjep`)
- [ ] Kör Security Advisor i Supabase igen. Förväntat: ungefär 5 varningar kvar (4 avsiktliga för ar_medlem, kan_andra, ar_agare och ga_med, och en om search_path på Supabases egen rls_auto_enable, som vi inte rör)
- [ ] Prova att skapa en tur, gå med via inbjudningslänk och se sina turer
- [ ] Merga PR:en

## 3. Vercels förhandsversioner i Supabase

Vi tog bort `https://*.vercel.app/**` från Redirect URLs i Supabase, eftersom den släppte igenom alla Vercel-sajter.

- [ ] Öppna en förhandsversion (Preview) i Vercel och kolla adressen
- [ ] Supabase → Authentication → URL Configuration → Redirect URLs: lägg till en smal variant, ungefär `https://minvandring-*-<ditt-team>.vercel.app/**`
- [ ] Valfritt: Settings → Deployment Protection i Vercel, så att Oscar kan öppna förhandsversionerna utan ditt konto

## 4. Säkerhet för konton

- [ ] Tvåstegsverifiering på GitHub, Vercel och Supabase (Oscar gör samma sak på sina konton, Resend, one.com och Gmail)
- [ ] Kontrollera att Vercel har ett personuppgiftsbiträdesavtal (DPA) och skriv upp det i vårt delade dokument

## 5. Kör migreringen för säkrare inbjudningar

Migreringen `20261115120000_inbjudningar.sql` ger långa slumpkoder, låter ägaren skapa en ny länk, döljer länken för läsare och begränsar felaktiga försök i `ga_med`. Alla gamla inbjudningslänkar slutar fungera. Kör punkt 2 först, och meddela Oscar när du kör.

Här är ordningen viktig: den gamla appen läser `turer.inbjudningskod`, som migreringen tar bort. Merga därför PR:en först och kör migreringen direkt efter att Vercel har publicerat. Fram till dess visar turen "Det gick inte att hämta länken", men allt annat fungerar.

- [ ] Läs SQL:en i PR:en "Säkrare inbjudningskoder"
- [ ] Merga PR:en och vänta tills Vercel har publicerat
- [ ] Kör `npx supabase db push --remote`
- [ ] Prova: som ägare syns länken och "Skapa ny länk", den gamla länken slutar fungera efter en ny, och en läsare ser ingen länk

## 6. Kör migreringen för skaparens åtkomst och vandringsdagar

Migreringen `20261115180000_skaparen_och_dagar.sql` gör två saker:
- Den som skapat en tur ser den inte längre efter att ha lämnat den eller tagits bort.
- Antal vandringsdagar är tomt tills någon anger det, i stället för 3. Befintliga turer behåller sina värden.

Kör punkt 2 och 5 först, och meddela Oscar när du kör. `npx supabase db push --remote` kör alla migreringar som inte är körda, i rätt ordning, så det räcker med en körning om allt är mergat.

Ordningen är viktig här också: den gamla appen läser tillbaka turen när den skapas, och det tillåter databasen inte efter migreringen. Merga därför PR:en först och kör migreringen direkt efter att Vercel har publicerat.

- [ ] Läs SQL:en i PR:en "Skaparen förlorar åtkomsten och tomma vandringsdagar"
- [ ] Merga PR:en och vänta tills Vercel har publicerat
- [ ] Kör `npx supabase db push --remote`
- [ ] Prova direkt att skapa en ny tur. Den ska öppnas, och Vandringsdagar ska visa "Inte angett"
- [ ] Prova att en tur du skapat försvinner ur Mina turer när du gjort någon annan till ägare och lämnat den
