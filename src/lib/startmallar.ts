// MinVandrings startmallar: färdiga packlistor att lägga i en tur. Raderna är generiska och utan vikt, så att var och
// en byter till sina egna saker. Det personliga blir rader som alla ska ha, och det gruppen delar på blir gemensamma
// rader som ingen bär än. Rena data och funktioner utan databas.
import { forvaldTyp, type KategoriNyckel, type UnderkategoriNyckel } from './forrad'
import type { NyPackrad } from './packlista'

export interface Startmallrad {
  namn: string
  kategori: KategoriNyckel
  underkategori: UnderkategoriNyckel
  /** Alla har en egen, eller en person bär den åt gruppen. */
  vem: 'alla' | 'gemensam'
  antal?: number
}

export interface Startmall {
  id: string
  namn: string
  beskrivning: string
  rader: readonly Startmallrad[]
}

const a = (namn: string, kategori: KategoriNyckel, underkategori: UnderkategoriNyckel, antal?: number): Startmallrad => ({ namn, kategori, underkategori, vem: 'alla', antal })
const g = (namn: string, kategori: KategoriNyckel, underkategori: UnderkategoriNyckel, antal?: number): Startmallrad => ({ namn, kategori, underkategori, vem: 'gemensam', antal })

const KLADER_FJALL: readonly Startmallrad[] = [
  a('Underställ, tröja', 'klader', 'understall'),
  a('Underställ, byxor', 'klader', 'understall'),
  a('Fleecetröja', 'klader', 'mellanlager'),
  a('Dunjacka eller syntetjacka', 'klader', 'isolering'),
  a('Regnjacka', 'klader', 'regnklader'),
  a('Regnbyxor', 'klader', 'regnklader'),
  a('Vandringsbyxor', 'klader', 'byxor'),
  a('T-shirt', 'klader', 'trojor'),
  a('Underkläder', 'klader', 'underklader', 2),
  a('Strumpor', 'klader', 'strumpor', 3),
  a('Mössa', 'klader', 'huvudbonad'),
  a('Handskar', 'klader', 'handskar'),
  a('Solglasögon', 'klader', 'solglasogon'),
]

const HYGIEN: readonly Startmallrad[] = [
  a('Tandborste och tandkräm', 'hygien', 'toalett'),
  a('Toapapper', 'hygien', 'toalett'),
  a('Handsprit', 'hygien', 'tvatt'),
  a('Solkräm och myggmedel', 'hygien', 'sol_mygg'),
]

export const STARTMALLAR: readonly Startmall[] = [
  {
    id: 'fjalltur-talt',
    namn: 'Fjälltur sommar med tält',
    beskrivning: 'Flera nätter i tält på fjället, med eget kök.',
    rader: [
      a('Ryggsäck', 'packning', 'ryggsack'),
      a('Regnskydd eller innersäck', 'packning', 'regnskydd'),
      a('Packpåsar', 'packning', 'packpasar'),
      g('Tält', 'talt', 'talt'),
      a('Sovsäck', 'sova', 'sovsack'),
      a('Liggunderlag', 'sova', 'liggunderlag'),
      g('Kök', 'kok', 'brannare'),
      g('Gas', 'kok', 'bransle'),
      g('Kastrull', 'kok', 'kastrull'),
      a('Kåsa', 'kok', 'kasa'),
      a('Spork', 'kok', 'bestick'),
      a('Vattenflaska', 'vatten', 'flaska'),
      g('Vattenfilter', 'vatten', 'filter'),
      ...KLADER_FJALL,
      a('Myggnät', 'klader', 'myggklader'),
      a('Kängor', 'skor', 'kangor'),
      a('Lägerskor', 'skor', 'lagerskor'),
      a('Pannlampa', 'prylar', 'pannlampa'),
      a('Powerbank', 'prylar', 'powerbank'),
      g('Karta och kompass', 'sakerhet', 'karta'),
      g('Tändare', 'sakerhet', 'eld'),
      a('Kniv', 'verktyg', 'kniv'),
      a('Vandringsstavar', 'verktyg', 'stavar'),
      g('Lagningssats', 'verktyg', 'lagning'),
      g('Förbandslåda', 'medicin', 'forband'),
      a('Skavsårsplåster', 'medicin', 'skavsar'),
      ...HYGIEN,
    ],
  },
  {
    id: 'stugtur',
    namn: 'Stugtur i fjällen',
    beskrivning: 'Från stuga till stuga, där kök och sängar finns på plats.',
    rader: [
      a('Ryggsäck', 'packning', 'ryggsack'),
      a('Regnskydd eller innersäck', 'packning', 'regnskydd'),
      a('Lakan', 'sova', 'lakan'),
      a('Vattenflaska', 'vatten', 'flaska'),
      ...KLADER_FJALL,
      a('Kängor', 'skor', 'kangor'),
      a('Inneskor', 'skor', 'lagerskor'),
      a('Pannlampa', 'prylar', 'pannlampa'),
      a('Powerbank', 'prylar', 'powerbank'),
      g('Karta och kompass', 'sakerhet', 'karta'),
      a('Vandringsstavar', 'verktyg', 'stavar'),
      g('Förbandslåda', 'medicin', 'forband'),
      a('Skavsårsplåster', 'medicin', 'skavsar'),
      ...HYGIEN,
    ],
  },
  {
    id: 'helg-skogen',
    namn: 'Helg i skogen',
    beskrivning: 'En eller två nätter i tält, nära hemma.',
    rader: [
      a('Ryggsäck', 'packning', 'ryggsack'),
      g('Tält', 'talt', 'talt'),
      a('Sovsäck', 'sova', 'sovsack'),
      a('Liggunderlag', 'sova', 'liggunderlag'),
      a('Sittunderlag', 'sova', 'sittunderlag'),
      g('Kök', 'kok', 'brannare'),
      g('Gas', 'kok', 'bransle'),
      g('Kastrull', 'kok', 'kastrull'),
      a('Kåsa', 'kok', 'kasa'),
      a('Spork', 'kok', 'bestick'),
      a('Vattenflaska', 'vatten', 'flaska'),
      g('Vattenfilter', 'vatten', 'filter'),
      a('Fleecetröja', 'klader', 'mellanlager'),
      a('Regnjacka', 'klader', 'regnklader'),
      a('Underkläder', 'klader', 'underklader'),
      a('Strumpor', 'klader', 'strumpor', 2),
      a('Mössa', 'klader', 'huvudbonad'),
      a('Kängor', 'skor', 'kangor'),
      a('Pannlampa', 'prylar', 'pannlampa'),
      g('Karta och kompass', 'sakerhet', 'karta'),
      g('Tändare', 'sakerhet', 'eld'),
      a('Kniv', 'verktyg', 'kniv'),
      g('Förbandslåda', 'medicin', 'forband'),
      a('Tandborste och tandkräm', 'hygien', 'toalett'),
      a('Toapapper', 'hygien', 'toalett'),
      a('Solkräm och myggmedel', 'hygien', 'sol_mygg'),
    ],
  },
]

/** Antalet saker i en startmall, där en rad med antal 3 räknas som tre. */
export function antalSaker(mall: Startmall): number {
  return mall.rader.reduce((n, r) => n + (r.antal ?? 1), 0)
}

/** Startmallen som packrader i en tur, i mallens ordning efter det som redan finns. Ingen bär något än. */
export function startmallTillPackrader(mall: Startmall, turId: string, sist = 0): (NyPackrad & { sortering: number })[] {
  return mall.rader.map((r, i) => ({
    tur_id: turId,
    namn: r.namn,
    kategori: r.kategori,
    underkategori: r.underkategori,
    produkt_id: null,
    antal: r.antal ?? 1,
    vikt_g: null,
    typ: forvaldTyp(r.kategori, r.underkategori),
    bars_av: null,
    alla: r.vem === 'alla',
    gemensam: r.vem === 'gemensam',
    notering: null,
    sortering: sist + i + 1,
  }))
}
