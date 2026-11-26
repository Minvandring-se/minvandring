// Torka själv i Matkatalogen: recept och råvaruguider för mat man torkar hemma, och grunderna i Kom igång.
// Innehållet står i src/lib/torkasjalvdata.ts, inte i databasen. Rena funktioner för sökning, filter och text.
import { KOM_IGANG, TORKGUIDER, TORKRECEPT } from './torkasjalvdata'

export type Receptkategori = 'huvudratt' | 'frukost' | 'soppa' | 'tillbehor' | 'snacks'
export type Guidekategori = 'frukt' | 'gronsak' | 'bas' | 'protein'

/** Ett stycke i ett recept, till exempel Sats, Hemma/torka eller På tur. Texten kan ha fetstil och länkar. */
export interface Receptavsnitt {
  rubrik: string
  text: string
}

export interface Kalla {
  namn: string
  url: string
}

export interface Torkrecept {
  id: string
  nummer: number
  slug: string
  titel: string
  kategori: Receptkategori
  svarighet: string
  /** Hur rätten används, som i källan, till exempel "lunch/huvudrätt" eller "snacks/frukosttopping". */
  anvandning: string
  /** Ett bra recept att börja med. */
  borjaHar: boolean
  brickor: string[]
  avsnitt: Receptavsnitt[]
  kallor: Kalla[]
}

export interface Torkguide {
  id: string
  slug: string
  titel: string
  kategori: Guidekategori
  /** Torkens lufttemperatur i °C, inte kärntemperatur. */
  temperatur: number
  /** Ungefärlig tid i mattork. null när källan saknar tid. */
  timmarMin: number | null
  timmarMax: number | null
  forbered: string
  torrhet: string
  paTur: string
  notis: string | null
  kallor: Kalla[]
  /** Receptet som råvaran redan har, till exempel äppelringarna. Då är receptets sida också guidens sida. */
  recept: string | null
}

/** Ett avsnitt i Kom igång, med stycken eller punkter. */
export interface Torkavsnitt {
  id: string
  rubrik: string
  stycken?: string[]
  punkter?: string[]
}

export { KOM_IGANG, TORKGUIDER, TORKRECEPT }

export const RECEPTKATEGORIER: readonly { nyckel: Receptkategori; namn: string }[] = [
  { nyckel: 'huvudratt', namn: 'Huvudrätt' },
  { nyckel: 'frukost', namn: 'Frukost' },
  { nyckel: 'soppa', namn: 'Soppa och lätt lunch' },
  { nyckel: 'tillbehor', namn: 'Pålägg och tillbehör' },
  { nyckel: 'snacks', namn: 'Snacks och sött' },
]

export const GUIDEKATEGORIER: readonly { nyckel: Guidekategori; namn: string }[] = [
  { nyckel: 'frukt', namn: 'Frukt' },
  { nyckel: 'gronsak', namn: 'Grönsaker' },
  { nyckel: 'bas', namn: 'Matbaser' },
  { nyckel: 'protein', namn: 'Protein' },
]

export type Torkflik = 'recept' | 'ravaror' | 'kom-igang'

export const TORKFLIKAR: readonly { nyckel: Torkflik; namn: string }[] = [
  { nyckel: 'recept', namn: 'Recept' },
  { nyckel: 'ravaror', namn: 'Råvaror och snacks' },
  { nyckel: 'kom-igang', namn: 'Kom igång' },
]

/** Fliken i adressen (?flik=ravaror). Recept när den saknas eller är okänd. */
export function torkflikFranAdress(p: URLSearchParams): Torkflik {
  const f = p.get('flik')
  return TORKFLIKAR.some((t) => t.nyckel === f) ? (f as Torkflik) : 'recept'
}

const BAS = '/matplanering/katalog/torka-sjalv'

/** Sidan för ett recept eller en råvara. En råvara som också är ett recept (äpple och banan) leder till receptet. */
export function torkadress(post: Torkrecept | Torkguide): string {
  if ('recept' in post && post.recept) {
    const r = TORKRECEPT.find((x) => x.id === post.recept)
    if (r) return `${BAS}/${r.slug}`
  }
  return `${BAS}/${post.slug}`
}

/** Kom igång i Matkatalogen, eventuellt vid ett avsnitt, till exempel #sakerhet. */
export const komIgangAdress = (avsnitt?: string) => `/matplanering/katalog?del=torka&flik=kom-igang${avsnitt ? `#${avsnitt}` : ''}`

/** Receptet eller guiden med sidans slug. Äpplets och bananens guider har ingen egen sida. */
export function torkpostFor(slug: string | undefined): { typ: 'recept'; post: Torkrecept } | { typ: 'guide'; post: Torkguide } | null {
  const r = TORKRECEPT.find((x) => x.slug === slug)
  if (r) return { typ: 'recept', post: r }
  const g = TORKGUIDER.find((x) => x.slug === slug && !x.recept)
  return g ? { typ: 'guide', post: g } : null
}

/** Guiden som fördjupar ett recept, till exempel äppelringarna. */
export const guideForRecept = (id: string) => TORKGUIDER.find((g) => g.recept === id) ?? null

/**
 * Temperatur och tid för en råvara: "57 °C, cirka 6–12 timmar". En okänd tid skrivs aldrig som ett tal, och samma
 * min och max blir "cirka 10 timmar".
 */
export function torktid(g: Pick<Torkguide, 'temperatur' | 'timmarMin' | 'timmarMax'>): string {
  const { timmarMin: min, timmarMax: max } = g
  const tid = min === null || max === null ? 'tid saknas i källan' : min === max ? `cirka ${min} timmar` : `cirka ${min}–${max} timmar`
  return `${g.temperatur} °C, ${tid}`
}

/** Text utan fetstil och länkar, för sökning. */
const ren = (t: string) => t.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

/** Gemener med svenska regler. Å, ä och ö är egna bokstäver, så "ar" hittar inte "är". */
const normal = (t: string) => t.toLocaleLowerCase('sv-SE')

/** Söker i rubrik och all läsbar text. Varje ord i sökningen ska finnas. Tom sökning ger allt. */
export function sokTork<T extends Torkrecept | Torkguide>(poster: readonly T[], sok: string): T[] {
  const ord = normal(sok).split(/\s+/).filter(Boolean)
  if (ord.length === 0) return [...poster]
  return poster.filter((p) => {
    const text = normal(
      'avsnitt' in p
        ? [p.titel, p.anvandning, ...p.avsnitt.flatMap((a) => [a.rubrik, ren(a.text)])].join(' ')
        : [p.titel, p.forbered, p.torrhet, p.paTur, p.notis ?? ''].map(ren).join(' '),
    )
    return ord.every((o) => text.includes(o))
  })
}

/** Delarna i en text: vanlig text, fetstil och länkar (bara http och https). Ingen HTML tolkas. */
export type Textdel = { typ: 'text' | 'fet'; text: string } | { typ: 'lank'; text: string; url: string }

export function textdelar(t: string): Textdel[] {
  const delar: Textdel[] = []
  const monster = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let forra = 0
  for (const m of t.matchAll(monster)) {
    if (m.index > forra) delar.push({ typ: 'text', text: t.slice(forra, m.index) })
    if (m[1] !== undefined) delar.push({ typ: 'fet', text: m[1] })
    else delar.push({ typ: 'lank', text: m[2], url: m[3] })
    forra = m.index + m[0].length
  }
  if (forra < t.length) delar.push({ typ: 'text', text: t.slice(forra) })
  return delar
}

/** Första bokstaven versal: "lunch/huvudrätt" blir "Lunch/huvudrätt". */
export const forstaVersal = (t: string) => t.charAt(0).toLocaleUpperCase('sv-SE') + t.slice(1)
