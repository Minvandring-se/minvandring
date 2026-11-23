// Gör delningsbilden public/og-bild.jpg (1200 x 630): logotypen och "Planera. Packa. Upplev." på mörkgrön bakgrund.
// Kräver sharp och puppeteer-core, som inte är beroenden i projektet, och att utvecklingsservern körs:
//   npm install --no-save sharp puppeteer-core
//   npm run dev
//   node design/og/og-bild.cjs public/og-bild.jpg
// Webbläsaren väljs med BROWSER (sökväg till Chrome eller Edge), adressen med DEV_URL.
const puppeteer = require('puppeteer-core')
const sharp = require('sharp')

const ut = process.argv[2] ?? 'public/og-bild.jpg'
const dev = process.env.DEV_URL ?? 'http://localhost:5173'
const browser = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const html = `<!doctype html>
<html lang="sv">
  <style>
    @font-face {
      font-family: 'Fraunces Variable';
      font-weight: 100 900;
      src: url('/node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2') format('woff2-variations');
    }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; background: #1f3d2e; color: #f7f4ec; }
    main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    img { width: 620px; height: auto; }
    h1 { margin-top: 44px; font-family: 'Fraunces Variable', serif; font-size: 76px; line-height: 1.05; font-weight: 600; letter-spacing: -0.01em; }
  </style>
  <main>
    <img src="/brand/minvandring-logotyp-mork.svg" alt="" />
    <h1>Planera. Packa. Upplev.</h1>
  </main>
</html>`

;(async () => {
  const b = await puppeteer.launch({ executablePath: browser, headless: true })
  const p = await b.newPage()
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
  // Mallen serveras från serverns adress så att bilden, logotypen och typsnittet hämtas från samma ursprung.
  const mall = `${dev}/og-bild-mall`
  await p.setRequestInterception(true)
  p.on('request', (r) => (r.url() === mall ? r.respond({ contentType: 'text/html; charset=utf-8', body: html }) : r.continue()))
  await p.goto(mall, { waitUntil: 'networkidle0' })
  await p.evaluate(() => document.fonts.ready)
  const png = await p.screenshot({ type: 'png' })
  await b.close()

  // Sänker kvaliteten tills filen är under 200 kB.
  for (let kvalitet = 84; kvalitet >= 60; kvalitet -= 4) {
    const info = await sharp(png).jpeg({ quality: kvalitet, mozjpeg: true }).toFile(ut)
    console.log(`${ut}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} kB (kvalitet ${kvalitet})`)
    if (info.size < 200 * 1024) break
  }
})()
