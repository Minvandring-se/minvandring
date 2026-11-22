// ENGÅNGSKÖRNING (2026-11-22): fyllde i kolumnerna granskad_datum, kalla_typ och genomgang i CSV-filerna i
// supabase/katalog och kolumnen genomgang i docs/katalog/genomgangar.csv för de 1058 rader som fanns då.
// Genomgången härleds ur git-historiken: den commit som först lade till raden (märke, modell och version utan
// hänsyn till stora och små bokstäver) avgör. Skriptet är kvar som dokumentation. Nya rader får sina värden direkt
// i CSV:n, se skillen katalog. Kör det inte igen: det vägrar när kolumnerna redan finns.
//
//   node scripts/fyll-genomgang.mjs             visar bara vad som skulle hända
//   node scripts/fyll-genomgang.mjs --skriv     skriver filerna
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'

const rot = path.resolve(import.meta.dirname, '..')
const skriv = process.argv.includes('--skriv')
const git = (...args) => execFileSync('git', args, { cwd: rot, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, MSYS_NO_PATHCONV: '1' } })

const FILER = { 'talt-och-vindskydd': 'talt', sovsackar: 'sov', liggunderlag: 'ligg', ryggsackar: 'ryggsack' }
const KATEGORIER = { talt: 'Tält och vindskydd', sov: 'Sovsäckar och quilts', ligg: 'Liggunderlag', ryggsack: 'Ryggsäckar' }

// Commit (de sju första tecknen) till genomgång (datum och butik). Commitar som inte lägger till nya rader
// (rättelser och stavning) står inte här: deras rader ärver från raden de ersätter, se nedan.
const COMMIT_TILL_BUTIK = {
  '95939bf': '2026-11-19-tillverkare', '87fcd65': '2026-11-19-tillverkare', c7ea7e2: '2026-11-19-tillverkare',
  aa581b4: '2026-11-19-naturkompaniet', '690ac19': '2026-11-19-naturkompaniet', d2c5bfc: '2026-11-19-naturkompaniet', '22cd0d8': '2026-11-19-naturkompaniet',
  '8320c35': '2026-11-22-outnorth', '05e4652': '2026-11-22-outnorth', c53497c: '2026-11-22-outnorth', '01ebdd3': '2026-11-22-outnorth', '63ee80d': '2026-11-22-outnorth',
  a4bb1da: '2026-11-22-xxl',
  '1974e89': '2026-11-22-outdoorexperten', '7251497': '2026-11-22-outdoorexperten', '290f576': '2026-11-22-outdoorexperten',
  c3779dd: '2026-11-22-addnature', a5ba8e8: '2026-11-22-addnature', df058ed: '2026-11-22-addnature', dd73776: '2026-11-22-addnature',
}

// Särfall: 13 Mammut-sovsäckar kom med Outnorth-genomgången i commiten för XXL, och en tältrad kom från en användare.
const MAMMUT_OUTNORTH = [
  'Comfort Down Bag -5C', 'Comfort Fiber Bag -1C', 'Comfort Fiber Bag -5C', 'Perform Down Bag -7C', 'Protect Fiber Bag -18C', 'Relax Fiber Bag 0C',
  "Women's Comfort Down Bag -7C", "Women's Comfort Fiber Bag -7C", "Women's Perform Down Bag -10C", "Women's Perform Fiber Bag -10C",
  "Women's Protect Down Bag -21C", "Women's Protect Fiber Bag -21C",
].map((s) => s.toLowerCase())

const vite = await createServer({ root: rot, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false } })
try {
  const { lasCsv } = await vite.ssrLoadModule('/src/lib/katalogimport.ts')
  const nyckel = (f) => [f.marke, f.modell, f.version ?? ''].map((x) => x.toLowerCase()).join('|')

  const perGenomgang = new Map()
  const oplacerade = []
  const nyaTexter = {}

  for (const [fil, kat] of Object.entries(FILER)) {
    const sokvag = `supabase/katalog/${fil}.csv`
    const commits = git('log', '--reverse', '--format=%h', '--', sokvag).split('\n').filter(Boolean).map((h) => h.slice(0, 7))
    const forst = new Map() // nyckel -> genomgång
    let forra = new Map() // nyckel -> rad i föregående version
    for (const c of commits) {
      const text = git('show', `${c}:${sokvag}`)
      const nu = new Map(lasCsv(text).rader.map((r) => [nyckel(r.falt), r.falt]))
      const borta = [...forra].filter(([k]) => !nu.has(k)).map(([, f]) => f)
      for (const [k, f] of nu) {
        if (forst.has(k)) continue
        let g
        const butik = COMMIT_TILL_BUTIK[c]
        if (c === 'a4bb1da' && kat === 'sov' && f.marke.toLowerCase() === 'mammut' && MAMMUT_OUTNORTH.includes(f.modell.toLowerCase())) g = `2026-11-22-outnorth-${kat}`
        else if (c === '690ac19' && kat === 'talt' && f.marke === 'Bergans' && f.modell.startsWith('Romsdal 2')) g = '2026-11-19-anvandare-talt'
        else if (butik) g = `${butik}-${kat}`
        if (!g) {
          // Rättelse: leta efter raden som ersattes (samma ean, eller samma källa och samma första ord i modellen).
          const ers = borta.find((b) => (f.ean && b.ean === f.ean) || (f.kalla && b.kalla === f.kalla && b.modell.split(' ')[0] === f.modell.split(' ')[0]))
          g = ers && forst.get(nyckel(ers))
        }
        if (g) forst.set(k, g)
        else oplacerade.push(`${fil}: ${c} ${f.marke} ${f.modell} ${f.version}`)
      }
      forra = nu
    }

    // Skriv om dagens fil.
    const nuText = fs.readFileSync(path.join(rot, sokvag), 'utf8')
    const { kolumner, rader } = lasCsv(nuText)
    if (kolumner.includes('genomgang')) throw new Error(`${sokvag} har redan kolumnen genomgang. Skriptet är en engångskörning.`)
    const i = kolumner.indexOf('kontrollerad_datum')
    const linjer = nuText.split('\r\n')
    const rubrik = linjer[0].split(';')
    rubrik.splice(i + 1, 0, 'granskad_datum', 'kalla_typ', 'genomgang')
    linjer[0] = rubrik.join(';')
    for (const { rad, falt } of rader) {
      const g = forst.get(nyckel(falt)) ?? ''
      if (!g) oplacerade.push(`${fil}: rad ${rad} ${falt.marke} ${falt.modell} ${falt.version} (ingen genomgång)`)
      const butik = falt.kommentar.startsWith('Vikt och uppgifter från')
      perGenomgang.set(g, (perGenomgang.get(g) ?? 0) + 1)
      // Rå delning på semikolon utanför citattecken, så att citerade fält behålls som de är.
      const delar = []
      let del = ''
      let citat = false
      for (const tecken of linjer[rad - 1]) {
        if (tecken === '"') citat = !citat
        if (tecken === ';' && !citat) {
          delar.push(del)
          del = ''
        } else del += tecken
      }
      delar.push(del)
      delar.splice(i + 1, 0, '', butik ? 'butik' : 'tillverkare', g)
      linjer[rad - 1] = delar.join(';')
    }
    nyaTexter[sokvag] = linjer.join('\r\n')
  }

  // Loggen: en genomgång per rad, med id av datum, butik och kategori.
  const BUTIKER = { 'Tillverkarnas sidor (allmänt urval)': 'tillverkare', Naturkompaniet: 'naturkompaniet', Outnorth: 'outnorth', XXL: 'xxl', Outdoorexperten: 'outdoorexperten', Addnature: 'addnature', Användare: 'anvandare' }
  const KATSLUG = Object.fromEntries(Object.entries(KATEGORIER).map(([s, n]) => [n, s]))
  const loggSokvag = path.join('docs', 'katalog', 'genomgangar.csv')
  const logg = fs.readFileSync(path.join(rot, loggSokvag), 'utf8').split('\r\n')
  if (logg[0].includes('genomgang')) throw new Error('genomgangar.csv har redan kolumnen genomgang.')
  const ut = [`${logg[0]};genomgang;godkand`]
  const loggPer = new Map()
  for (const linje of logg.slice(1)) {
    if (!linje.trim()) {
      ut.push(linje)
      continue
    }
    const d = linje.split(';')
    const id = `${d[0]}-${BUTIKER[d[3]]}-${KATSLUG[d[1]]}`
    loggPer.set(id, (loggPer.get(id) ?? 0) + Number(d[5]))
    ut.push(`${linje};${id};`)
  }
  nyaTexter[loggSokvag] = ut.join('\r\n')

  console.log('Rader per genomgång: csv mot nya i loggen')
  let avvik = 0
  for (const id of [...new Set([...perGenomgang.keys(), ...loggPer.keys()])].sort()) {
    const a = perGenomgang.get(id) ?? 0
    const b = loggPer.get(id) ?? 0
    if (a !== b) avvik++
    console.log(`  ${a === b ? 'ok ' : 'AVV'} ${id || '(tom)'}: csv ${a}, logg ${b}`)
  }
  console.log(`Totalt ${[...perGenomgang.values()].reduce((x, y) => x + y, 0)} rader, ${avvik} avvikelser.`)
  if (oplacerade.length) console.log(`Oplacerade:\n  ${oplacerade.join('\n  ')}`)

  if (skriv) {
    for (const [sokvag, text] of Object.entries(nyaTexter)) fs.writeFileSync(path.join(rot, sokvag), text)
    console.log('Skrev filerna.')
  }
} finally {
  await vite.close()
}
