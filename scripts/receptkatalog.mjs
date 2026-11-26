// Kontrollerar CSV-filerna i supabase/katalog/recept och skapar seed-SQL för MinVandrings recept.
//
//   npm run receptkatalog                       visar fel och en sammanfattning, skriver ingenting
//   npm run receptkatalog -- --skriv <namn>     skriver dessutom supabase/migrations/<tidsstämpel>_<namn>.sql
//
// Formatet beskrivs i docs/katalog/recept.md. Logiken ligger i src/lib/receptkatalogimport.ts och laddas genom Vite,
// så att TypeScript går att köra utan extra verktyg. Kopplingarna kontrolleras mot livsmedlen och märkesvarorna i
// supabase/katalog/livsmedel och supabase/katalog/varor.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog', 'recept')
const las = (fil) => fs.readFileSync(path.join(mapp, fil), 'utf8')
const args = process.argv.slice(2)

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { importeraReceptkatalog, receptSeedSql, varunyckel } = await vite.ssrLoadModule('/src/lib/receptkatalogimport.ts')
  const { importeraLivsmedel, godkandaLivsmedel } = await vite.ssrLoadModule('/src/lib/livsmedelimport.ts')

  // Bara livsmedel som importen godkänner finns i databasen.
  const livsmedel = new Set(godkandaLivsmedel(importeraLivsmedel(fs.readFileSync(path.join(rot, 'supabase', 'katalog', 'livsmedel', 'livsmedel.csv'), 'utf8'))).map((r) => r.nummer))
  const { importeraVarukatalog, godkandaVaror } = await vite.ssrLoadModule('/src/lib/varukatalogimport.ts')
  // Bara märkesvaror som varukatalogens import godkänner finns i databasen.
  const varumapp = path.join(rot, 'supabase', 'katalog', 'varor')
  const varor = new Set(
    fs
      .readdirSync(varumapp)
      .filter((f) => f.endsWith('.csv'))
      .flatMap((f) => godkandaVaror(importeraVarukatalog(fs.readFileSync(path.join(varumapp, f), 'utf8'))).map((v) => varunyckel(v.marke, v.namn))),
  )

  const imp = importeraReceptkatalog({ recept: las('recept.csv'), ingredienser: las('ingredienser.csv'), steg: las('steg.csv') }, { livsmedel, varor })
  for (const f of imp.fel) console.log(`FEL: ${f}`)
  const kopplade = imp.ingredienser.filter((i) => i.livsmedel_nummer !== null || i.varukatalog !== null).length
  const vatten = imp.ingredienser.filter((i) => i.packas === 'pa_plats').length
  console.log(`${imp.recept.length} recept, ${imp.ingredienser.length} ingredienser (${kopplade} kopplade, ${vatten} på plats) och ${imp.steg.length} steg.`)

  const i = args.indexOf('--skriv')
  if (i !== -1) {
    const namn = args[i + 1]
    if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv receptkatalog_forsta')
    if (imp.fel.length) throw new Error('Rätta felen först. Ingen migrering skrevs.')
    // Tidsstämpeln måste vara senare än den senaste migreringen, annars vägrar db push köra filen.
    const migreringar = path.join(rot, 'supabase', 'migrations')
    const senaste = fs.readdirSync(migreringar).map((f) => f.slice(0, 14)).filter((t) => /^\d{14}$/.test(t)).sort().at(-1) ?? ''
    const klockan = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const nu = klockan > senaste ? klockan : String(BigInt(senaste) + 1n)
    const mal = path.join(migreringar, `${nu}_${namn}.sql`)
    fs.writeFileSync(mal, receptSeedSql(imp))
    console.log(`Skrev ${path.relative(rot, mal)}.`)
  }
} finally {
  await vite.close()
}
