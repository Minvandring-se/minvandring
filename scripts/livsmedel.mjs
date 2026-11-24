// Hämtar baslivsmedlen från Livsmedelsverkets livsmedelsdatabas (CC BY 4.0) och skapar seed-SQL för tabellen livsmedel.
//
//   npm run livsmedel                      hämtar alla livsmedel och skriver supabase/katalog/livsmedel/livsmedel.csv
//   npm run livsmedel -- --ny              som ovan, men hämtar om allt i stället för att använda sparade svar
//   npm run livsmedel -- --skriv <namn>    läser CSV:n och skriver supabase/migrations/<tidsstämpel>_<namn>.sql
//
// API:t anropas bara härifrån, aldrig från appen. Svaren sparas i supabase/katalog/livsmedel/.api-svar/, som inte
// committas, så att en ny körning inte behöver hämta allt igen. Bara CSV:n committas.
// Formatet beskrivs i docs/katalog/livsmedel.md. Logiken ligger i src/lib/livsmedelimport.ts och laddas genom Vite.
import fs from 'node:fs'
import path from 'node:path'
import { createServer } from 'vite'

const API = 'https://dataportal.livsmedelsverket.se/livsmedel/api/v1'
const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'supabase', 'katalog', 'livsmedel')
const csvFil = path.join(mapp, 'livsmedel.csv')
const cache = path.join(mapp, '.api-svar')
const args = process.argv.slice(2)

// Var snäll mot API:t: fyra anrop åt gången, en kort paus efter varje och nya försök med längre väntan vid fel.
const SAMTIDIGA = 4
const PAUS_MS = 150
const FORSOK = 4
const vanta = (ms) => new Promise((r) => setTimeout(r, ms))

async function hamta(url) {
  for (let forsok = 1; ; forsok++) {
    try {
      const svar = await fetch(url, { headers: { Accept: 'application/json' } })
      if (svar.ok) {
        const data = await svar.json()
        await vanta(PAUS_MS)
        return data
      }
      if (forsok >= FORSOK || (svar.status < 500 && svar.status !== 429)) throw new Error(`${svar.status} för ${url}`)
    } catch (e) {
      if (forsok >= FORSOK) throw e
    }
    await vanta(1000 * 2 ** forsok)
  }
}

/** Hämtar och sparar, eller läser det sparade svaret. */
async function hamtaSparad(fil, url, ny) {
  const plats = path.join(cache, fil)
  if (!ny && fs.existsSync(plats)) return JSON.parse(fs.readFileSync(plats, 'utf8'))
  const data = await hamta(url)
  fs.writeFileSync(plats, JSON.stringify(data))
  return data
}

async function hamtaAlla(ny) {
  fs.mkdirSync(cache, { recursive: true })
  const lista = []
  for (let offset = 0; ; offset += 500) {
    const sida = await hamtaSparad(`lista-${offset}.json`, `${API}/livsmedel?offset=${offset}&limit=500&sprak=1`, ny)
    lista.push(...sida.livsmedel)
    if (offset + 500 >= sida._meta.totalRecords) break
  }
  console.log(`${lista.length} livsmedel i listan. Hämtar näringsvärden och klassificeringar …`)
  const resultat = new Array(lista.length)
  let nasta = 0
  let klara = 0
  async function arbetare() {
    while (nasta < lista.length) {
      const i = nasta++
      const l = lista[i]
      const naring = await hamtaSparad(`${l.nummer}-naringsvarden.json`, `${API}/livsmedel/${l.nummer}/naringsvarden?sprak=1`, ny)
      const klass = await hamtaSparad(`${l.nummer}-klassificeringar.json`, `${API}/livsmedel/${l.nummer}/klassificeringar?sprak=1`, ny)
      resultat[i] = { livsmedel: l, naring, klass }
      if (++klara % 250 === 0) console.log(`  ${klara} av ${lista.length}`)
    }
  }
  await Promise.all(Array.from({ length: SAMTIDIGA }, arbetare))
  return resultat
}

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { radFranApi, livsmedelCsv, importeraLivsmedel, godkandaLivsmedel, livsmedelSeedSql, livsmedelRapport } = await vite.ssrLoadModule('/src/lib/livsmedelimport.ts')
  const i = args.indexOf('--skriv')

  if (i === -1) {
    const alla = await hamtaAlla(args.includes('--ny'))
    const rader = alla.map((a) => radFranApi(a.livsmedel, a.naring, a.klass))
    fs.mkdirSync(mapp, { recursive: true })
    fs.writeFileSync(csvFil, livsmedelCsv(rader))
    console.log(`Skrev ${path.relative(rot, csvFil)}.`)
  }

  if (!fs.existsSync(csvFil)) throw new Error('CSV:n finns inte. Kör npm run livsmedel först.')
  const resultat = importeraLivsmedel(fs.readFileSync(csvFil, 'utf8'))
  console.log(livsmedelRapport(resultat))

  if (i !== -1) {
    const namn = args[i + 1]
    if (!namn || !/^[a-z0-9_]+$/.test(namn)) throw new Error('Ange ett namn utan å, ä, ö och mellanslag, till exempel: --skriv livsmedel_2026')
    // Fel i filen stoppar. En rad med fel kommer inte med, som i matkatalogen, och syns i rapporten ovan.
    if (resultat.filfel.length) throw new Error('Rätta felen i filen först. Ingen migrering skrevs.')
    // Tidsstämpeln måste vara senare än den senaste migreringen, annars vägrar db push köra filen.
    const migreringar = path.join(rot, 'supabase', 'migrations')
    const senaste = fs.readdirSync(migreringar).map((f) => f.slice(0, 14)).filter((t) => /^\d{14}$/.test(t)).sort().at(-1) ?? ''
    const klockan = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
    const nu = klockan > senaste ? klockan : String(BigInt(senaste) + 1n)
    const mal = path.join(migreringar, `${nu}_${namn}.sql`)
    const rader = godkandaLivsmedel(resultat)
    fs.writeFileSync(mal, livsmedelSeedSql(rader, 'supabase/katalog/livsmedel/livsmedel.csv'))
    console.log(`Skrev ${path.relative(rot, mal)} med ${rader.length} livsmedel.`)
  }
} finally {
  await vite.close()
}
