// Gör rävbilderna längs leden på startsidan (public/stig/*.webp) av originalen i design/fjallrav.
// Beskär kring motivet och skalar till tre gånger visningsstorleken, så att de blir skarpa även på
// skärmar med hög upplösning. Kräver sharp, som inte är ett beroende i projektet:
//   npm install --no-save sharp
//   node design/fjallrav/gor-webp.cjs
const path = require('node:path')
const sharp = require('sharp')

// De färgade versionerna, gjorda med farga.py. Bredden är tre gånger visningsbredden.
const bilder = [
  ['fjallrav-gryt-farg', 'gryt', 225],
  ['fjallrav-staende-farg', 'fjallrav-staende', 210],
]

;(async () => {
  for (const [in_, ut, bredd] of bilder) {
    const fil = path.join(__dirname, `${in_}.png`)
    const trimmad = await sharp(fil).trim({ threshold: 1 }).toBuffer()
    const info = await sharp(trimmad)
      .resize({ width: bredd })
      .webp({ quality: 88, alphaQuality: 100, effort: 6 })
      .toFile(path.join(__dirname, `../../public/stig/${ut}.webp`))
    console.log(`${ut}.webp: ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} kB`)
  }
})()
