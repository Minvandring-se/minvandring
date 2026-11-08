# Att ta senare

## JS-filen är över 500 kB

`npm run build` varnar för att `assets/index-*.js` är större än 500 kB (cirka 545 kB, 159 kB gzip). Det gäller när nycklarna i `.env.local` finns med, för då kommer Supabase-klienten med i bygget. Utan nycklar är filen cirka 326 kB.

Inget är trasigt. Startsidan blir bara lite långsammare att ladda i mobilen.

Möjliga åtgärder när vi tar det:
- Ladda sidorna bakom inloggning (Mina turer, Tur, Profil) med `React.lazy`, så att startsidan inte behöver dem.
- Se om Supabase-klienten kan laddas först när den behövs.
