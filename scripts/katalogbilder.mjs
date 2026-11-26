// Gör om Astras bilder till Matkatalogens rutor till WebP i public/katalog/.
//
//   npm run katalogbilder                      läser "Claude outputs/bilder-saknas/katalog"
//   npm run katalogbilder -- <mapp>            läser en annan mapp
//
// Mappen har undermapparna Påsar, Märkesvaror och Livsmedel med en SVG per ruta, där filnamnet är rutans namn på
// svenska. Bilderna är 5:2 med en enfärgad bakgrund. Rutan är 5:3 i mobil och 5:2 på dator, så bakgrunden förlängs
// uppåt och nedåt med samma färg till 5:3. Då klipps inget motiv i mobil, och på dator syns bilden som den ritades.
// Ut kommer <namn>-480.webp (480 × 288) och <namn>-960.webp (960 × 576). Se Claude outputs/bilder-saknas/lista.md.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const rot = path.resolve(import.meta.dirname, '..')
const kalla = path.resolve(rot, process.argv[2] ?? path.join('Claude outputs', 'bilder-saknas', 'katalog'))
const mal = path.join(rot, 'public', 'katalog')

/** Mapp och filnamn hos Astra, och namnet i koden (katalogbild i src/lib/matkatalog.ts). */
const BILDER = {
  Påsar: { Frukost: 'maltid-frukost', 'Lunch och middag': 'maltid-lunch-middag', Mellanmål: 'maltid-mellanmal', Efterrätt: 'maltid-dessert' },
  Märkesvaror: {
    Bröd: 'varor-brod',
    Frukost: 'varor-frukost',
    'Ost och mejeri': 'varor-ost-mejeri',
    'Korv och chark': 'varor-korv-chark',
    Snabbmat: 'varor-snabbmat',
    'Tuber och smaksättning': 'varor-tuber-smaksattning',
    Mellanmål: 'varor-mellanmal',
    Dryck: 'varor-drycker',
  },
  Livsmedel: {
    'Kött och fågel': 'livsmedel-kott',
    'Fisk och skaldjur': 'livsmedel-fisk',
    'Mejeri och ägg': 'livsmedel-mejeri',
    'Gryn, pasta och bröd': 'livsmedel-spannmal',
    'Grönsaker och potatis': 'livsmedel-gronsaker',
    'Frukt och bär': 'livsmedel-frukt',
    'Baljväxter, nötter och frön': 'livsmedel-baljvaxter',
    'Fett och smaksättning': 'livsmedel-smak',
    'Sött och snacks': 'livsmedel-sott',
    Dryck: 'livsmedel-dryck',
    'Färdiga rätter': 'livsmedel-ratter',
  },
}

const BREDDER = [480, 960]
const MAX_BYTE = 60 * 1024

/** Bilden som 5:3, med bakgrunden förlängd uppåt och nedåt. Bakgrunden är färgen i övre vänstra hörnet. */
async function femTre(fil, bredd) {
  const bild = await sharp(fil, { density: 300 }).resize({ width: bredd }).png().toBuffer()
  const { height } = await sharp(bild).metadata()
  const { data } = await sharp(bild).extract({ left: 0, top: 0, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true })
  const hojd = Math.round((bredd * 3) / 5)
  const over = Math.floor((hojd - height) / 2)
  return sharp(bild).extend({ top: over, bottom: hojd - height - over, background: { r: data[0], g: data[1], b: data[2] } })
}

async function webp(fil, bredd, till) {
  for (let kvalitet = 82; kvalitet >= 40; kvalitet -= 6) {
    const data = await (await femTre(fil, bredd)).webp({ quality: kvalitet, effort: 6 }).toBuffer()
    if (data.length <= MAX_BYTE || kvalitet - 6 < 40) {
      fs.writeFileSync(till, data)
      return { kvalitet, kb: Math.round(data.length / 1024) }
    }
  }
}

fs.mkdirSync(mal, { recursive: true })
let antal = 0
for (const [mapp, filer] of Object.entries(BILDER)) {
  for (const [namn, ut] of Object.entries(filer)) {
    const fil = path.join(kalla, mapp, `${namn}.svg`)
    if (!fs.existsSync(fil)) throw new Error(`${mapp}/${namn}.svg saknas.`)
    for (const bredd of BREDDER) {
      const r = await webp(fil, bredd, path.join(mal, `${ut}-${bredd}.webp`))
      console.log(`${ut}-${bredd}.webp  ${r.kb} kB  (kvalitet ${r.kvalitet})`)
    }
    antal++
  }
}
const okanda = Object.entries(BILDER).flatMap(([mapp, filer]) =>
  fs
    .readdirSync(path.join(kalla, mapp))
    .filter((f) => f.endsWith('.svg') && !(f.slice(0, -4) in filer))
    .map((f) => `${mapp}/${f}`),
)
console.log(`\n${antal} rutor har bild.`)
if (okanda.length) console.log(`Bilder som inte används: ${okanda.join(', ')}`)
