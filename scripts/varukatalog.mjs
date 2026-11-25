// Kontrollerar CSV-filerna i supabase/katalog/varor och skapar seed-SQL för varukatalogen.
//
//   npm run varukatalog                      visar varje rad med fel och varningar, skriver ingenting
//   npm run varukatalog -- --skriv <namn>    skriver dessutom supabase/migrations/<tidsstämpel>_<namn>.sql
//
// Formatet beskrivs i docs/katalog/varukatalog.md. Logiken ligger i src/lib/varukatalogimport.ts och laddas
// genom Vite, så att TypeScript går att köra utan extra verktyg.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog', 'varor')
const filer = fs.existsSync(mapp) ? fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).sort() : []
const args = process.argv.slice(2)
const antalVaror = (n) => (n === 1 ? '1 vara' : `${n} varor`)

if (filer.length === 0) {
  console.log('Det finns inga CSV-filer i supabase/katalog/varor än.')
  process.exit(0)
}

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { importeraVarukatalog, godkandaVaror, varurapport, varuSeedSql } = await vite.ssrLoadModule('/src/lib/varukatalogimport.ts')

  const resultat = filer.map((f) => importeraVarukatalog(fs.readFileSync(path.join(mapp, f), 'utf8')))
  for (const [n, fil] of filer.entries()) {
    console.log(varurapport(fil, resultat[n]))
    console.log('')
  }

  // Samma vara i två filer stoppar seeden, eftersom den annars skulle skrivas över av den sista filen.
  // Samma EAN i två filer är samma vara under två namn, och stoppar också seeden.
  const sedda = new Map()
  const seddaEan = new Map()
  const dubbletter = []
  const varor = []
  for (const [n, r] of resultat.entries()) {
    for (const p of godkandaVaror(r)) {
      const nyckel = `${p.marke.toLowerCase()}|${p.namn.toLowerCase()}`
      if (sedda.has(nyckel)) dubbletter.push(`${p.marke} ${p.namn} finns i både ${sedda.get(nyckel)} och ${filer[n]}`)
      else if (p.ean && seddaEan.has(p.ean)) dubbletter.push(`${p.marke} ${p.namn} i ${filer[n]} har samma EAN (${p.ean}) som ${seddaEan.get(p.ean)}`)
      else {
        sedda.set(nyckel, filer[n])
        if (p.ean) seddaEan.set(p.ean, `${p.marke} ${p.namn} i ${filer[n]}`)
        varor.push(p)
      }
    }
  }
  for (const d of dubbletter) console.log(`FEL: ${d}`)
  console.log(`Totalt ${antalVaror(varor.length)}.`)

  const i = args.indexOf('--skriv')
  if (i !== -1) {
    const namn = args[i + 1]
    if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv varukatalog_brod')
    const filfel = resultat.some((r) => r.filfel.length > 0)
    if (filfel || dubbletter.length) throw new Error('Rätta felen först. Ingen migrering skrevs.')
    // Tidsstämpeln måste vara senare än den senaste migreringen, annars vägrar db push köra filen.
    const migreringar = path.join(rot, 'supabase', 'migrations')
    const senaste = fs.readdirSync(migreringar).map((f) => f.slice(0, 14)).filter((t) => /^\d{14}$/.test(t)).sort().at(-1) ?? ''
    const klockan = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const nu = klockan > senaste ? klockan : String(BigInt(senaste) + 1n)
    const mal = path.join(migreringar, `${nu}_${namn}.sql`)
    fs.writeFileSync(mal, varuSeedSql(varor, filer.map((f) => `supabase/katalog/varor/${f}`)))
    console.log(`Skrev ${path.relative(rot, mal)} med ${antalVaror(varor.length)}.`)
  }
} finally {
  await vite.close()
}
