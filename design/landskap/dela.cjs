// Delar landskapsbilderna i design/landskap till de delar startsidan använder, i public/landskap.
// - De breda landskapen (1200 × 160) delas i en vänster- och en högerdel, beskurna kring motivet.
// - Sidoremsorna (400 × 3000) delas i sina fyra motiv.
// Skriver också src/components/start/landskap/bilder.ts med delarnas mått.
// Kräver sharp, som inte är ett beroende i projektet:
//   npm install --no-save sharp
//   node design/landskap/dela.cjs
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')

const in_ = path.join(__dirname)
const ut = path.join(__dirname, '../../public/landskap')
const ts = path.join(__dirname, '../../src/components/start/landskap/bilder.ts')
const KANT = 2

/** Rutan kring allt som inte är genomskinligt i ett utsnitt av bilden. */
async function motiv(fil, ruta) {
  const { data, info } = await sharp(fil).extract(ruta).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1]
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
      }
  const left = Math.max(0, ruta.left + x0 - KANT)
  const top = Math.max(0, ruta.top + y0 - KANT)
  return { left, top, width: Math.min(ruta.left + ruta.width, ruta.left + x1 + 1 + KANT) - left, height: Math.min(ruta.top + ruta.height, ruta.top + y1 + 1 + KANT) - top }
}

/** Raderna med innehåll i en hög bild, sammanslagna när glappet är litet. */
async function stycken(fil) {
  const { data, info } = await sharp(fil).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const rader = []
  for (let y = 0; y < info.height; y++) {
    let har = false
    for (let x = 0; x < info.width && !har; x++) har = data[(y * info.width + x) * 4 + 3] > 8
    rader.push(har)
  }
  const ut = []
  let start = null
  rader.forEach((har, y) => {
    if (har && start === null) start = y
    if (!har && start !== null) { ut.push([start, y]); start = null }
  })
  if (start !== null) ut.push([start, rader.length])
  const slagna = []
  for (const s of ut) {
    if (slagna.length && s[0] - slagna[slagna.length - 1][1] < 40) slagna[slagna.length - 1][1] = s[1]
    else slagna.push(s)
  }
  return { stycken: slagna, bredd: info.width }
}

async function spara(fil, ruta, namn) {
  await sharp(fil).extract(ruta).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(ut, `${namn}.webp`))
  return { src: `/landskap/${namn}.webp`, bredd: ruta.width, hojd: ruta.height }
}

;(async () => {
  fs.mkdirSync(ut, { recursive: true })
  const band = {}
  for (const n of ['skog', 'sjo', 'hostbjorkar', 'fjall']) {
    const fil = path.join(in_, `minvandring-${n}.png`)
    band[n] = {
      vanster: await spara(fil, await motiv(fil, { left: 0, top: 0, width: 600, height: 160 }), `${n}-vanster`),
      hoger: await spara(fil, await motiv(fil, { left: 600, top: 0, width: 600, height: 160 }), `${n}-hoger`),
    }
  }
  const sidor = { vanster: [], hoger: [] }
  for (const [sida, fil] of [['vanster', 'minvandring-left.png'], ['hoger', 'minvandring-right.png']]) {
    const f = path.join(in_, fil)
    const { stycken: s, bredd } = await stycken(f)
    for (const [i, [y0, y1]] of s.entries()) {
      sidor[sida].push(await spara(f, await motiv(f, { left: 0, top: y0, width: bredd, height: y1 - y0 }), `sida-${sida}-${i + 1}`))
    }
  }
  const text = `// Skapad av design/landskap/dela.cjs. Ändra inte för hand.\n\nexport interface Bild {\n  src: string\n  bredd: number\n  hojd: number\n}\n\n/** De breda landskapen mellan korten, delade i en vänster- och en högerdel. */\nexport const BAND = ${JSON.stringify(band, null, 2)} as const satisfies Record<string, { vanster: Bild; hoger: Bild }>\n\n/** Motiven i sidoremsorna, uppifrån och ner: skog, sjö, höstbjörkar och fjäll. */\nexport const SIDOR = ${JSON.stringify(sidor, null, 2)} as const satisfies Record<'vanster' | 'hoger', readonly Bild[]>\n`
  fs.mkdirSync(path.dirname(ts), { recursive: true })
  fs.writeFileSync(ts, text)
  console.log(text)
})()
