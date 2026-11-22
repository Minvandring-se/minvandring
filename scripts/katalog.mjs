// Kontrollerar CSV-filerna i supabase/katalog, skapar seed-SQL för produktkatalogen och sköter granskningsnivåerna.
//
//   npm run katalog                                    visar varje rad med nivå, fel och varningar, skriver ingenting
//   npm run katalog -- --skriv <namn>                  skriver dessutom supabase/migrations/<tidsstämpel>_<namn>.sql
//   npm run katalog -- --granskad <genomgang> --nycklar <fil> [--datum ÅÅÅÅ-MM-DD]
//                                                      sätter granskad_datum på raderna (marke;modell;version, en per rad i filen)
//   npm run katalog -- --stickprov <genomgang> [--frö N]
//                                                      drar ett stickprov och skriver docs/katalog/stickprov/<genomgang>.md
//   npm run katalog -- --godkann <genomgang> [--datum ÅÅÅÅ-MM-DD]
//                                                      sätter kontrollerad_datum på genomgångens granskade rader och godkand i loggen
//
// Logiken ligger i src/lib/katalogimport.ts och src/lib/katalogstickprov.ts. De laddas genom Vite, så att TypeScript går att köra utan extra verktyg.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog')
const logg = path.join(rot, 'docs', 'katalog', 'genomgangar.csv')
const filer = fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).sort()

const args = process.argv.slice(2)
function varde(namn, ...alias) {
  const i = args.findIndex((a) => [namn, ...alias].includes(a))
  if (i === -1) return undefined
  const v = args[i + 1]
  if (!v || v.startsWith('--')) throw new Error(`Ange ett värde efter ${namn}.`)
  return v
}
const idag = new Date().toISOString().slice(0, 10)

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { arDatum, importera, godkanda, lasCsv, rapport, seedSql } = await vite.ssrLoadModule('/src/lib/katalogimport.ts')
  const stickprov = await vite.ssrLoadModule('/src/lib/katalogstickprov.ts')

  // Alla filer läses som en lista, så att dubbletter mellan filer också upptäcks. Rubrikraden måste då vara densamma.
  const texter = Object.fromEntries(filer.map((f) => [f, fs.readFileSync(path.join(mapp, f), 'utf8')]))
  const resultat = filer.map((f) => importera(texter[f]))
  const produkter = resultat.flatMap(godkanda)
  const filfel = resultat.some((r) => r.filfel.length > 0)

  const genomgang = varde('--granskad') ?? varde('--stickprov') ?? varde('--godkann')
  if (genomgang) {
    const lage = ['--granskad', '--stickprov', '--godkann'].filter((a) => args.includes(a))
    if (lage.length !== 1) throw new Error('Använd bara en av --granskad, --stickprov och --godkann.')
    if (filfel) throw new Error('Rätta felen i filerna först (kör npm run katalog).')
    // Raderna som tillhör genomgången, rad för rad ur CSV-texten.
    const iGenomgangen = filer.flatMap((f) => lasCsv(texter[f]).rader.filter((r) => r.falt.genomgang === genomgang).map((r) => ({ fil: f, falt: r.falt })))
    if (iGenomgangen.length === 0) throw new Error(`Inga rader har genomgang ${genomgang}.`)
    const datum = varde('--datum') ?? idag
    if (!arDatum(datum)) throw new Error('--datum ska vara ett datum, till exempel 2026-11-22.')

    if (lage[0] === '--stickprov') {
      const kandidater = stickprov.stickprovskandidater(produkter, genomgang)
      if (kandidater.length === 0) throw new Error(`Inga rader i ${genomgang} har granskad_datum och källa från tillverkaren. Kör --granskad först.`)
      const froText = varde('--frö', '--fro')
      const fro = froText === undefined ? Math.floor(Math.random() * 2 ** 31) : Number(froText)
      if (!Number.isInteger(fro) || fro < 0) throw new Error('--frö ska vara ett heltal.')
      const urval = stickprov.dragStickprov(kandidater, fro)
      const mal = path.join(rot, 'docs', 'katalog', 'stickprov', `${genomgang}.md`)
      fs.mkdirSync(path.dirname(mal), { recursive: true })
      fs.writeFileSync(mal, stickprov.checklista(genomgang, fro, urval, kandidater.length, idag).replaceAll('\n', '\r\n'))
      console.log(`Frö ${fro}. Stickprov på ${urval.length} av ${kandidater.length} rader, ${new Set(urval.map((p) => p.marke)).size} märken.`)
      console.log(`Skrev ${path.relative(rot, mal)}. Gå igenom raderna mot tillverkarnas sidor.`)
    } else if (lage[0] === '--granskad') {
      const nyckelfil = varde('--nycklar')
      if (!nyckelfil) throw new Error('Ange filen med nycklar: --nycklar <fil>.')
      const nycklar = stickprov.lasNycklar(fs.readFileSync(path.resolve(nyckelfil), 'utf8'))
      if (nycklar.length === 0) throw new Error('Nyckelfilen är tom.')
      const radnyckel = (f) => stickprov.radnyckel(f.marke, f.modell, f.version || null)
      const iG = new Map(iGenomgangen.map((r) => [radnyckel(r.falt), r.falt]))
      const problem = []
      for (const n of nycklar) {
        const f = iG.get(n.nyckel)
        if (!f) problem.push(`Finns inte i ${genomgang}: ${n.text}`)
        else if (f.kalla_typ === 'butik') problem.push(`Butiksrad, kan inte granskas mot tillverkaren: ${n.text}`)
      }
      if (problem.length) throw new Error(`${problem.join('\n')}\nIngenting skrevs.`)
      const valda = new Set(nycklar.map((n) => n.nyckel))
      let antal = 0
      for (const f of filer) {
        const r = stickprov.andraKolumn(texter[f], 'granskad_datum', (falt) => (falt.genomgang === genomgang && valda.has(radnyckel(falt)) ? datum : null))
        if (r.antal) fs.writeFileSync(path.join(mapp, f), r.text)
        antal += r.antal
      }
      console.log(`Satte granskad_datum ${datum} på ${antal} av ${valda.size} rader i ${genomgang} (resten hade redan datumet).`)
      console.log('Skapa en ny seed: npm run katalog -- --skriv katalog_<namn>')
    } else {
      const andras = (falt) => falt.genomgang === genomgang && falt.granskad_datum && falt.kalla_typ !== 'butik'
      const underlag = iGenomgangen.filter((r) => andras(r.falt)).length
      if (underlag === 0) throw new Error(`Inga rader i ${genomgang} har granskad_datum och källa från tillverkaren. Ingenting godkändes.`)
      let antal = 0
      for (const f of filer) {
        const r = stickprov.andraKolumn(texter[f], 'kontrollerad_datum', (falt) => (andras(falt) ? datum : null))
        if (r.antal) fs.writeFileSync(path.join(mapp, f), r.text)
        antal += r.antal
      }
      const l = stickprov.godkandILogg(fs.readFileSync(logg, 'utf8'), genomgang, datum)
      if (l.antal === 0) console.log(`Varning: ${genomgang} finns inte i genomgangar.csv, så godkand skrevs inte.`)
      else fs.writeFileSync(logg, l.text)
      console.log(`Satte kontrollerad_datum ${datum} på ${underlag} rader i ${genomgang} (${antal} ändrades) och godkand i loggen.`)
      console.log('Skapa en ny seed: npm run katalog -- --skriv katalog_<namn>')
    }
  } else {
    for (const [n, fil] of filer.entries()) {
      console.log(rapport(fil, resultat[n]))
      console.log('')
    }
    const nivaer = ['stickprovskontrollerad', 'granskad', 'butik', 'inte granskad']
    const { nivaText } = await vite.ssrLoadModule('/src/lib/katalogimport.ts')
    console.log(`Totalt ${produkter.length} rader: ${nivaer.map((n) => `${produkter.filter((p) => nivaText(p) === n).length} ${n}`).join(', ')}.`)

    const i = args.indexOf('--skriv')
    if (i !== -1) {
      const namn = args[i + 1]
      if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv katalog_talt')
      if (filfel) throw new Error('Rätta felen i filen först. Ingen migrering skrevs.')
      // Tidsstämpeln måste vara senare än den senaste migreringen, annars vägrar db push köra filen.
      const migreringar = path.join(rot, 'supabase', 'migrations')
      const senaste = fs.readdirSync(migreringar).map((f) => f.slice(0, 14)).filter((t) => /^\d{14}$/.test(t)).sort().at(-1) ?? ''
      const klockan = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
      const nu = klockan > senaste ? klockan : String(BigInt(senaste) + 1n)
      const mal = path.join(migreringar, `${nu}_${namn}.sql`)
      fs.writeFileSync(mal, seedSql(produkter, filer.map((f) => `supabase/katalog/${f}`)))
      console.log(`Skrev ${path.relative(rot, mal)} med ${produkter.length} produkter.`)
    }
  }
} finally {
  await vite.close()
}
