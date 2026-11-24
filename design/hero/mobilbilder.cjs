// Gör stående mobilbilder (9:16, 640 och 900 px breda) till bildspelet på startsidan och skriver dem till public/hero.
// Körs från projektets rot. Kräver sharp, som inte är ett beroende i projektet, så installera det tillfälligt:
//   npm install --no-save sharp
//   node design/hero/mobilbilder.cjs                 (alla bilder)
//   node design/hero/mobilbilder.cjs 6-fjallang      (bara de som anges)
// kalla: bilden som beskärs. hero-original/ committas inte, så de bilderna kräver originalen lokalt.
// hojd: hur många pixlar uppifrån som tas med (utelämnad = hela höjden). En lägre höjd skär bort mark nedtill,
//   så att personerna hamnar under knapparna. fx: var utsnittet ligger i sidled, 0 = vänsterkanten, 1 = högerkanten.
const path = require('path')
const sharp = require('sharp')

const bilder = {
  '2-sommarfjall': { kalla: 'public/hero/2-sommarfjall-2560.webp', fx: 0.7 },
  '3-utsikt': { kalla: 'public/hero/3-utsikt-2560.webp', fx: 0.45 },
  '4-kust': { kalla: 'public/hero/4-kust-2560.webp', fx: 0.2 },
  '5-norrsken': { kalla: 'public/hero/5-norrsken-2560.webp', fx: 0.3 },
  '6-fjallang': { kalla: 'hero-original/6-fjallang.jpg', fx: 0.461, hojd: 1550 },
  '7-vinterfjall': { kalla: 'hero-original/7-vinterfjall.jpg', fx: 0, hojd: 1920 },
}

const valda = process.argv.slice(2)
for (const namn of valda) if (!bilder[namn]) throw new Error(`Okänd bild: ${namn}`)

;(async () => {
  for (const [namn, { kalla, fx, hojd }] of Object.entries(bilder)) {
    if (valda.length && !valda.includes(namn)) continue
    const bild = sharp(kalla).rotate()
    const { width: W, height: H } = await bild.metadata()
    const h = hojd ?? H
    const w = Math.round((h * 9) / 16)
    const left = Math.round(fx * (W - w))
    for (const bredd of [640, 900]) {
      const ut = path.join('public', 'hero', `${namn}-mobil-${bredd}.webp`)
      const info = await sharp(kalla).rotate().extract({ left, top: 0, width: w, height: h }).resize({ width: bredd }).webp({ quality: 72, effort: 6 }).toFile(ut)
      console.log(path.basename(ut), `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' kB', `utsnitt ${left},0 ${w}x${h}`)
    }
  }
})()
