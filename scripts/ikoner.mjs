// Gör om MinVandrings egna ikoner (src/components/ikoner/svg/omgang-*/*.svg) till typad data för komponenten Ikon.
//
//   npm run ikoner      skriver src/components/ikoner/ikondata.ts
//
// SVG:erna är källan. Ändra eller lägg till en ikon där och kör skriptet igen. Metadata i filerna tas inte med.
// Bara elementen mask, rect, path, circle, ellipse och g och deras attribut läses, eftersom ikonerna bara använder dem.
// Ikonerna är i linosnitt: en fylld form i currentColor med urtag som görs med en mask. Maskens id byts mot
// platshållaren MASK, som komponenten Ikon ersätter med ett id som är unikt på sidan.
import fs from 'node:fs'
import path from 'node:path'

const rot = path.resolve(import.meta.dirname, '..')
const mapp = path.join(rot, 'src', 'components', 'ikoner', 'svg')
const TAGGAR = new Set(['mask', 'rect', 'path', 'circle', 'ellipse', 'g'])
const MASK = 'MASK'
const camel = (a) => a.replace(/-([a-z])/g, (_, b) => b.toUpperCase())

/** Elementen i en SVG som [tagg, attribut, barn], utan svg-elementet och metadata. */
function lasElement(text) {
  const kropp = text.replace(/<metadata>[\s\S]*?<\/metadata>/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const rotlista = []
  const stack = [rotlista]
  const re = /<(\/?)([a-z]+)([^>]*?)(\/?)>/g
  let m
  while ((m = re.exec(kropp))) {
    const [, stang, tagg, attrText, sjalv] = m
    if (!TAGGAR.has(tagg)) throw new Error(`Okänt element ${tagg}`)
    if (stang) {
      stack.pop()
      continue
    }
    const attr = {}
    for (const [, n, v] of attrText.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) attr[camel(n)] = v
    const el = [tagg, attr, []]
    stack.at(-1).push(el)
    if (!sjalv) stack.push(el[2])
  }
  return rotlista
}

const ikoner = {}
const omgangar = {}
for (const omgang of fs.readdirSync(mapp).sort()) {
  for (const fil of fs.readdirSync(path.join(mapp, omgang)).filter((f) => f.endsWith('.svg')).sort()) {
    const namn = fil.replace(/\.svg$/, '')
    if (ikoner[namn]) throw new Error(`Ikonen ${namn} finns två gånger`)
    const text = fs.readFileSync(path.join(mapp, omgang, fil), 'utf8')
    const id = text.match(/<mask id="([^"]+)"/)?.[1]
    if (!id) throw new Error(`Ikonen ${namn} saknar mask`)
    ikoner[namn] = lasElement(text.replaceAll(`id="${id}"`, `id="${MASK}"`).replaceAll(`url(#${id})`, `url(#${MASK})`))
    omgangar[namn] = omgang === 'extra' ? 0 : Number(omgang.replace('omgang-', ''))
  }
}

const ut = [
  '// Skapad med "npm run ikoner" från src/components/ikoner/svg/. Ändra inte filen för hand.',
  '',
  'export type Ikonelement = readonly [tagg: "mask" | "rect" | "path" | "circle" | "ellipse" | "g", attribut: Readonly<Record<string, string>>, barn: readonly Ikonelement[]]',
  '',
  '/** Platshållaren för maskens id. Komponenten Ikon byter den mot ett id som är unikt på sidan. */',
  `export const MASK = '${MASK}'`,
  '',
  `export const IKONER = ${JSON.stringify(ikoner, null, 2)} as const satisfies Record<string, readonly Ikonelement[]>`,
  '',
  '/** Omgången varje ikon kom i: 1 meny, 2 tur, 3 mat, 4 utrustning, 5 natur och folk, 0 extra (sovsäck och hygien). */',
  `export const IKONOMGANG = ${JSON.stringify(omgangar, null, 2)} as const`,
  '',
].join('\n')
fs.writeFileSync(path.join(rot, 'src', 'components', 'ikoner', 'ikondata.ts'), ut)
console.log(`Skrev ${Object.keys(ikoner).length} ikoner till src/components/ikoner/ikondata.ts.`)
