// Gör landskapen mellan korten på startsidan (public/landskap/*.webp) av originalen i design/landskap.
// Originalen är genomskinliga PNG på 1200 × 160 px. Kräver sharp, som inte är ett beroende i projektet:
//   npm install --no-save sharp
//   node design/landskap/gor-webp.cjs
const path = require('node:path')
const sharp = require('sharp')

;(async () => {
  for (const n of ['skog', 'sjo', 'hostbjorkar', 'fjall']) {
    const ut = path.join(__dirname, `../../public/landskap/${n}.webp`)
    const info = await sharp(path.join(__dirname, `${n}.png`)).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(ut)
    console.log(`${n}.webp: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} kB`)
  }
})()
