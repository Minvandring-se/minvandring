// Gör om Astras bilder till MinVandrings recept till WebP i public/recept/.
//
//   npm run receptbilder                      läser "Claude outputs/receptbilder"
//   npm run receptbilder -- <mapp>            läser en annan mapp
//
// Varje mapp har <mapp>-kort och <mapp>-receptvy, som PNG och SVG eller bara SVG. PNG används när den finns.
// Ut kommer <id>-kort-600.webp, <id>-kort-1200.webp, <id>-vy-900.webp och <id>-vy-1800.webp, där id är receptets
// id i supabase/katalog/recept/recept.csv. Kvaliteten sänks tills en bild är under 60 kB. Se docs/katalog/recept.md.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const rot = path.resolve(import.meta.dirname, '..')
const kalla = path.resolve(rot, process.argv[2] ?? path.join('Claude outputs', 'receptbilder'))
const mal = path.join(rot, 'public', 'recept')
const MAX_BYTE = 60 * 1024

// Mappar vars namn inte är receptets namn. Övriga kopplas på namnet i recept.csv, gjort till små bokstäver utan å, ä, ö.
const UNDANTAG = {
  'tortillabrod-med-jordnotssmor-och-sylt': 'jordnotstortilla',
  'havregryn-med-svamp-parmesan-och-bacon': 'havregryta',
  'makaroner-med-kikarter-och-gronsaker': 'pastasallad',
}

const STORLEKAR = [
  { fil: 'kort', namn: 'kort', bredder: [600, 1200] },
  { fil: 'receptvy', namn: 'vy', bredder: [900, 1800] },
]

/** "Bönsallad med majs och lime" blir "bonsallad-med-majs-och-lime". */
function slug(text) {
  return text
    .toLowerCase()
    .replaceAll('å', 'a')
    .replaceAll('ä', 'a')
    .replaceAll('ö', 'o')
    .replaceAll('ü', 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function recept() {
  const [rubrik, ...rader] = fs.readFileSync(path.join(rot, 'supabase', 'katalog', 'recept', 'recept.csv'), 'utf8').trim().split(/\r?\n/)
  const kolumner = rubrik.split(',')
  const id = kolumner.indexOf('id')
  const namn = kolumner.indexOf('namn')
  // id och namn står före första fältet med citattecken, så en enkel delning räcker här.
  return rader.map((r) => r.split(',')).map((f) => ({ id: f[id], namn: f[namn] }))
}

async function webp(fran, bredd, till) {
  for (let kvalitet = 82; kvalitet >= 40; kvalitet -= 6) {
    const data = await sharp(fran, { density: 300 }).resize({ width: bredd }).webp({ quality: kvalitet, effort: 6 }).toBuffer()
    if (data.length <= MAX_BYTE || kvalitet - 6 < 40) {
      fs.writeFileSync(till, data)
      return { kvalitet, kb: Math.round(data.length / 1024) }
    }
  }
}

const alla = recept()
const efterSlug = new Map(alla.map((r) => [slug(r.namn), r.id]))
const mappar = fs.readdirSync(kalla, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
fs.mkdirSync(mal, { recursive: true })

const kopplade = new Set()
const utanRecept = []
for (const mapp of mappar.sort()) {
  const id = UNDANTAG[mapp] ?? efterSlug.get(mapp)
  if (!id) {
    utanRecept.push(mapp)
    continue
  }
  for (const s of STORLEKAR) {
    const bas = path.join(kalla, mapp, `${mapp}-${s.fil}`)
    const fran = fs.existsSync(`${bas}.png`) ? `${bas}.png` : fs.existsSync(`${bas}.svg`) ? `${bas}.svg` : null
    if (!fran) throw new Error(`${mapp}: ${mapp}-${s.fil}.png eller .svg saknas.`)
    for (const bredd of s.bredder) {
      const ut = await webp(fran, bredd, path.join(mal, `${id}-${s.namn}-${bredd}.webp`))
      console.log(`${id}-${s.namn}-${bredd}.webp  ${ut.kb} kB  (kvalitet ${ut.kvalitet}, från ${path.extname(fran).slice(1)})${ut.kb > 60 ? '  ÖVER 60 kB' : ''}`)
    }
  }
  kopplade.add(id)
}

console.log(`\n${kopplade.size} recept har bild.`)
if (utanRecept.length) console.log(`Bilder utan recept: ${utanRecept.join(', ')}`)
const utanBild = alla.filter((r) => !kopplade.has(r.id)).map((r) => r.id)
if (utanBild.length) console.log(`Recept utan bild: ${utanBild.join(', ')}`)
