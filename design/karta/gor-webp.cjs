// Gör kartbakgrunderna mellan korten på startsidan (public/karta/*.webp) av originalen i design/karta.
// Originalen är 1200 × 160 px med ljus bakgrund. Kräver sharp, som inte är ett beroende i projektet:
//   npm install --no-save sharp
//   node design/karta/gor-webp.cjs
const path = require('node:path')
const sharp = require('sharp')

;(async () => {
  for (const n of ['skog', 'sjo', 'hostbjorkar', 'fjall']) {
    const ut = path.join(__dirname, `../../public/karta/${n}.webp`)
    const info = await sharp(path.join(__dirname, `${n}.png`)).webp({ quality: 82, effort: 6 }).toFile(ut)
    console.log(`${n}.webp: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} kB`)
  }
})()
