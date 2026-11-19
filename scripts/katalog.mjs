// Kontrollerar CSV-filerna i supabase/katalog och skapar seed-SQL för produktkatalogen.
//
//   npm run katalog                      visar varje rad med fel och varningar, skriver ingenting
//   npm run katalog -- --skriv <namn>    skriver dessutom supabase/migrations/<tidsstämpel>_<namn>.sql
//
// Logiken ligger i src/lib/katalogimport.ts. Den laddas genom Vite, så att TypeScript går att köra utan extra verktyg.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog')
const filer = fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).sort()

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { importera, godkanda, rapport, seedSql } = await vite.ssrLoadModule('/src/lib/katalogimport.ts')

  // Alla filer läses som en lista, så att dubbletter mellan filer också upptäcks. Rubrikraden måste då vara densamma.
  const produkter = []
  let filfel = false
  for (const fil of filer) {
    const resultat = importera(fs.readFileSync(path.join(mapp, fil), 'utf8'))
    console.log(rapport(fil, resultat))
    console.log('')
    filfel ||= resultat.filfel.length > 0
    produkter.push(...godkanda(resultat))
  }

  const i = process.argv.indexOf('--skriv')
  if (i !== -1) {
    const namn = process.argv[i + 1]
    if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv katalog_talt')
    if (filfel) throw new Error('Rätta felen i filen först. Ingen migrering skrevs.')
    const nu = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const mal = path.join(rot, 'supabase', 'migrations', `${nu}_${namn}.sql`)
    fs.writeFileSync(mal, seedSql(produkter, filer.map((f) => `supabase/katalog/${f}`)))
    console.log(`Skrev ${path.relative(rot, mal)} med ${produkter.length} produkter.`)
  }
} finally {
  await vite.close()
}
