// Gör breda datorbilder till bildspelet på startsidan, för bilder där motivet är för högt för bildspelets format (2:1).
// Ett utsnitt kring motivet tas ur originalet, och sidorna förlängs genom att kanterna speglas, så att både toppen och
// personen får plats. Speglingen fungerar bara när kanterna är enkla ytor, som snö och himmel, och inget av motivet
// ligger närmare kanten än förlängningen. Skriver <namn>-bred-<bredd>.webp till public/hero.
// Körs från projektets rot. Kräver sharp, som inte är ett beroende i projektet, så installera det tillfälligt:
//   npm install --no-save sharp
//   node design/hero/bredbilder.cjs
// kalla: originalet. hero-original/ committas inte, så originalen krävs lokalt.
// mitt: var utsnittet har sin mitt i höjdled, 0 = överkanten, 1 = nederkanten.
// sida: hur mycket som läggs till på varje sida, i andel av originalets bredd.
// bortHoger: andel av bredden som skärs bort till höger först, när något nära kanten annars speglas till ett mönster.
// format: utsnittets bredd delat med höjd efter förlängningen.
const path = require('path')
const sharp = require('sharp')

const bilder = {
  '7-vinterfjall': { kalla: 'hero-original/7-vinterfjall.jpg', mitt: 0.554, sida: 0.09, bortHoger: 0.06, format: 1.75 },
}

;(async () => {
  for (const [namn, { kalla, mitt, sida, bortHoger = 0, format }] of Object.entries(bilder)) {
    const rak = await sharp(kalla).rotate().toBuffer()
    const { width: hel, height: H } = await sharp(rak).metadata()
    const W = Math.round(hel * (1 - bortHoger))
    const tillagg = Math.round(hel * sida)
    const h = Math.round((W + 2 * tillagg) / format)
    const top = Math.max(0, Math.min(H - h, Math.round(mitt * H - h / 2)))
    const utsnitt = await sharp(rak).extract({ left: 0, top, width: W, height: h }).toBuffer()
    const bred = await sharp(utsnitt).extend({ left: tillagg, right: tillagg, extendWith: 'mirror' }).toBuffer()
    for (const bredd of [1280, 1920, 2560]) {
      const ut = path.join('public', 'hero', `${namn}-bred-${bredd}.webp`)
      const info = await sharp(bred).resize({ width: bredd }).webp({ quality: 72, effort: 6 }).toFile(ut)
      console.log(path.basename(ut), `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' kB', `utsnitt 0,${top} ${W}x${h}, ${tillagg} px på varje sida`)
    }
  }
})()
