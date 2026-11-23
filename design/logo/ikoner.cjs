// Gör favicon och appikonerna av den förenklade symbolen (minvandring-symbol-liten.svg) på grön bakgrund.
// Den stora PWA-ikonen (512 px) görs av minvandring-app-ikon.svg med hela symbolen.
// Formerna ändras inte, symbolen skalas bara om och centreras.
// Kräver sharp och png-to-ico, som inte är beroenden i projektet:
//   npm install --no-save sharp png-to-ico
//   node design/logo/ikoner.cjs
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const pngToIcoModul = require('png-to-ico')
const pngToIco = pngToIcoModul.default ?? pngToIcoModul

const rot = path.join(__dirname, '..', '..')
const ut = (fil) => path.join(rot, 'public', fil)
const gron = '#1F3D2E'

const utanMetadata = (svg) => svg.replace(/<metadata>[\s\S]*?<\/metadata>/, '')
const liten = utanMetadata(fs.readFileSync(path.join(__dirname, 'minvandring-symbol-liten.svg'), 'utf8'))
const litenGrupp = liten.match(/<g[\s\S]*<\/g>/)[0]
const appIkon = fs.readFileSync(path.join(__dirname, 'minvandring-app-ikon.svg'), 'utf8')

// Symbolen fyller bredden vid skala 1. Mindre skala ger mer luft runt den.
function ikon(skala, hornradie = 0) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><title>MinVandring</title><rect width="512" height="512" rx="${hornradie}" fill="${gron}"/><g transform="translate(256 256) scale(${skala}) translate(-256 -256)">${litenGrupp}</g></svg>`
}

const png = (svg, storlek) => sharp(Buffer.from(svg), { density: 300 }).resize(storlek, storlek).png().toBuffer()

;(async () => {
  const favicon = ikon(0.86, 96)
  fs.writeFileSync(ut('favicon.svg'), favicon + '\n')
  fs.writeFileSync(ut('favicon.ico'), await pngToIco(await Promise.all([16, 32, 48].map((s) => png(favicon, s)))))
  fs.writeFileSync(ut('apple-touch-icon.png'), await png(ikon(0.76), 180))
  fs.writeFileSync(ut('icon-192.png'), await png(ikon(0.76), 192))
  fs.writeFileSync(ut('icon-512.png'), await png(appIkon, 512))
  // Maskable: allt viktigt inom cirkeln med 40 % radie i mitten.
  fs.writeFileSync(ut('icon-maskable-512.png'), await png(ikon(0.6), 512))
  console.log('Klart: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png')
})()
