// Kontrollerar CSV-filerna i supabase/katalog/mat och skapar seed-SQL för matkatalogen.
//
//   npm run matkatalog                       visar varje rad med fel och varningar, skriver ingenting
//   npm run matkatalog -- --skriv <namn>     skriver dessutom supabase/migrations/<tidsstämpel>_<namn>.sql
//
// Formatet beskrivs i docs/katalog/matkatalog.md. Logiken ligger i src/lib/matkatalogimport.ts och laddas
// genom Vite, så att TypeScript går att köra utan extra verktyg.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog', 'mat')
const filer = fs.existsSync(mapp) ? fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).sort() : []
const args = process.argv.slice(2)
const antalPasar = (n) => (n === 1 ? '1 påse' : `${n} påsar`)

if (filer.length === 0) {
  console.log('Det finns inga CSV-filer i supabase/katalog/mat än.')
  process.exit(0)
}

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { importeraMatkatalog, godkandaPasar, matrapport, matSeedSql } = await vite.ssrLoadModule('/src/lib/matkatalogimport.ts')

  const resultat = filer.map((f) => importeraMatkatalog(fs.readFileSync(path.join(mapp, f), 'utf8')))
  for (const [n, fil] of filer.entries()) {
    console.log(matrapport(fil, resultat[n]))
    console.log('')
  }

  // Samma påse i två filer stoppar seeden, eftersom den annars skulle skrivas över av den sista filen.
  const sedda = new Map()
  const dubbletter = []
  const pasar = []
  for (const [n, r] of resultat.entries()) {
    for (const p of godkandaPasar(r)) {
      const nyckel = `${p.marke.toLowerCase()}|${p.namn.toLowerCase()}`
      if (sedda.has(nyckel)) dubbletter.push(`${p.marke} ${p.namn} finns i både ${sedda.get(nyckel)} och ${filer[n]}`)
      else {
        sedda.set(nyckel, filer[n])
        pasar.push(p)
      }
    }
  }
  for (const d of dubbletter) console.log(`FEL: ${d}`)
  console.log(`Totalt ${antalPasar(pasar.length)}.`)

  const i = args.indexOf('--skriv')
  if (i !== -1) {
    const namn = args[i + 1]
    if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv matkatalog_frystorkat')
    const filfel = resultat.some((r) => r.filfel.length > 0)
    if (filfel || dubbletter.length) throw new Error('Rätta felen först. Ingen migrering skrevs.')
    // Tidsstämpeln måste vara senare än den senaste migreringen, annars vägrar db push köra filen.
    const migreringar = path.join(rot, 'supabase', 'migrations')
    const senaste = fs.readdirSync(migreringar).map((f) => f.slice(0, 14)).filter((t) => /^\d{14}$/.test(t)).sort().at(-1) ?? ''
    const klockan = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const nu = klockan > senaste ? klockan : String(BigInt(senaste) + 1n)
    const mal = path.join(migreringar, `${nu}_${namn}.sql`)
    fs.writeFileSync(mal, matSeedSql(pasar, filer.map((f) => `supabase/katalog/mat/${f}`)))
    console.log(`Skrev ${path.relative(rot, mal)} med ${antalPasar(pasar.length)}.`)
  }
} finally {
  await vite.close()
}
