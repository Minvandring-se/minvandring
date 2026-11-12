// Gör stående mobilbilder (9:16) ur 2560-versionerna i public/hero. Beskärningen följer fokusMobil i Bildspel.tsx.
// Kräver sharp, som inte är ett beroende i projektet: npm install --no-save sharp && node design/hero/mobilbilder.cjs public/hero
const sharp = require('sharp')
const path = require('path')
const dir = process.argv[2]
const bilder = { '1-grupp': 0.6, '2-sommarfjall': 0.7, '4-kust': 0.2, '5-norrsken': 0.3, '3-utsikt': 0.45 }
;(async () => {
  for (const [namn, fx] of Object.entries(bilder)) {
    const src = path.join(dir, `${namn}-2560.webp`)
    const { width: W, height: H } = await sharp(src).metadata()
    const w = Math.round((H * 9) / 16)
    const left = Math.round(fx * (W - w))
    for (const bredd of [640, 900]) {
      const ut = path.join(dir, `${namn}-mobil-${bredd}.webp`)
      const info = await sharp(src).extract({ left, top: 0, width: w, height: H }).resize({ width: bredd, withoutEnlargement: true }).webp({ quality: 72, effort: 6 }).toFile(ut)
      console.log(path.basename(ut), `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' kB')
    }
  }
})()
