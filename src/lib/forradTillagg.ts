// Snabbare sätt att fylla förrådet: en egen sak med bara namn och vikt, och saker som man redan har i en turs
// packlista. Rena funktioner utan databas.
import { MAX_ANTAL, MAX_NAMN, forvaldTyp, underkategoriFor, type KategoriNyckel, type SakVarden, type UnderkategoriNyckel } from './forrad'
import type { PackradRad, PackstatusRad } from './typer'
import { tolkaVikt } from './viktfalt'

export interface Kategorival {
  kategori: KategoriNyckel
  underkategori: UnderkategoriNyckel | null
}

/**
 * Ord som pekar ut en kategori, i ordning: det första ordet som finns i namnet vinner, så de mer precisa står först
 * ("sovsäck" före "säck", "dagsryggsäck" före "ryggsäck"). Orden jämförs med små bokstäver.
 */
const ORD: readonly [string, KategoriNyckel, UnderkategoriNyckel | null][] = [
  ['dagsryggsäck', 'packning', 'dagsryggsack'],
  ['packpåse', 'packning', 'packpasar'],
  ['drybag', 'packning', 'packpasar'],
  ['regnskydd', 'packning', 'regnskydd'],
  ['ryggsäck', 'packning', 'ryggsack'],
  ['tältpinn', 'talt', 'talttillbehor'],
  ['tarp', 'talt', 'tarp'],
  ['vindsäck', 'talt', 'vindsack'],
  ['hängmatta', 'talt', 'hangmatta'],
  ['tält', 'talt', 'talt'],
  ['sovsäck', 'sova', 'sovsack'],
  ['quilt', 'sova', 'quilt'],
  ['liggunderlag', 'sova', 'liggunderlag'],
  ['sittunderlag', 'sova', 'sittunderlag'],
  ['underlag', 'sova', 'liggunderlag'],
  ['kudde', 'sova', 'kudde'],
  ['lakan', 'sova', 'lakan'],
  ['brännare', 'kok', 'brannare'],
  ['gas', 'kok', 'bransle'],
  ['kastrull', 'kok', 'kastrull'],
  ['kokkärl', 'kok', 'kastrull'],
  ['stekpanna', 'kok', 'kastrull'],
  ['kåsa', 'kok', 'kasa'],
  ['mugg', 'kok', 'kasa'],
  ['spork', 'kok', 'bestick'],
  ['sked', 'kok', 'bestick'],
  ['bestick', 'kok', 'bestick'],
  ['kaffe', 'kok', 'kaffe'],
  ['disk', 'kok', 'disk'],
  ['kök', 'kok', null],
  ['vattenfilter', 'vatten', 'filter'],
  ['filter', 'vatten', 'filter'],
  ['flaska', 'vatten', 'flaska'],
  ['vattensäck', 'vatten', 'dricksystem'],
  ['underställ', 'klader', 'understall'],
  ['fleece', 'klader', 'mellanlager'],
  ['dunjacka', 'klader', 'isolering'],
  ['vindjacka', 'klader', 'vindklader'],
  ['regnjacka', 'klader', 'regnklader'],
  ['regnbyxor', 'klader', 'regnklader'],
  ['byxor', 'klader', 'byxor'],
  ['shorts', 'klader', 'byxor'],
  ['t-shirt', 'klader', 'trojor'],
  ['tröja', 'klader', 'trojor'],
  ['kalsonger', 'klader', 'underklader'],
  ['trosor', 'klader', 'underklader'],
  ['strumpor', 'klader', 'strumpor'],
  ['mössa', 'klader', 'huvudbonad'],
  ['keps', 'klader', 'huvudbonad'],
  ['buff', 'klader', 'huvudbonad'],
  ['handskar', 'klader', 'handskar'],
  ['vantar', 'klader', 'handskar'],
  ['myggnät', 'klader', 'myggklader'],
  ['solglasögon', 'klader', 'solglasogon'],
  ['jacka', 'klader', null],
  ['kängor', 'skor', 'kangor'],
  ['lägerskor', 'skor', 'lagerskor'],
  ['skor', 'skor', null],
  ['sandaler', 'skor', 'lagerskor'],
  ['damasker', 'skor', 'damasker'],
  ['pannlampa', 'prylar', 'pannlampa'],
  ['lampa', 'prylar', 'pannlampa'],
  ['powerbank', 'prylar', 'powerbank'],
  ['batteri', 'prylar', 'powerbank'],
  ['laddare', 'prylar', 'laddning'],
  ['kabel', 'prylar', 'laddning'],
  ['solpanel', 'prylar', 'solpanel'],
  ['gps', 'prylar', 'kommunikation'],
  ['klocka', 'prylar', 'klocka'],
  ['hörlurar', 'prylar', 'ljud'],
  ['kamera', 'prylar', 'kamera'],
  ['karta', 'sakerhet', 'karta'],
  ['kompass', 'sakerhet', 'karta'],
  ['tändare', 'sakerhet', 'eld'],
  ['tändstickor', 'sakerhet', 'eld'],
  ['visselpipa', 'sakerhet', 'nodutrustning'],
  ['räddningsfilt', 'sakerhet', 'nodutrustning'],
  ['kniv', 'verktyg', 'kniv'],
  ['multiverktyg', 'verktyg', 'kniv'],
  ['stavar', 'verktyg', 'stavar'],
  ['silvertejp', 'verktyg', 'lagning'],
  ['lagning', 'verktyg', 'lagning'],
  ['yxa', 'verktyg', 'yxa'],
  ['såg', 'verktyg', 'yxa'],
  ['förband', 'medicin', 'forband'],
  ['plåster', 'medicin', 'forband'],
  ['skavsår', 'medicin', 'skavsar'],
  ['compeed', 'medicin', 'skavsar'],
  ['värktablett', 'medicin', 'mediciner'],
  ['tandborste', 'hygien', 'toalett'],
  ['tandkräm', 'hygien', 'toalett'],
  ['toapapper', 'hygien', 'toalett'],
  ['snöspade', 'vinter', 'snospade'],
  ['spade', 'hygien', 'toalett'],
  ['tvål', 'hygien', 'tvatt'],
  ['handsprit', 'hygien', 'tvatt'],
  ['handduk', 'hygien', 'tvatt'],
  ['solkräm', 'hygien', 'sol_mygg'],
  ['myggmedel', 'hygien', 'sol_mygg'],
  ['skidor', 'vinter', 'skidor'],
  ['pulka', 'vinter', 'pulka'],
  ['snöskor', 'vinter', 'snoskor'],
  ['fiskespö', 'ovrigt', 'fiske'],
  ['bok', 'ovrigt', 'bocker'],
  ['kortlek', 'ovrigt', 'bocker'],
]

/** Kategorin som namnet pekar på, eller null när inget ord känns igen. */
export function gissaKategori(namn: string): Kategorival | null {
  const t = namn.toLowerCase()
  for (const [ord, kategori, underkategori] of ORD) if (t.includes(ord)) return { kategori, underkategori }
  return null
}

/**
 * En egen sak med bara namn och vikt. Kategorin är den som är vald i sökningen, annars den som namnet pekar på,
 * annars Övrigt. Underkategorin följer bara med när den hör till kategorin.
 */
export function snabbSak(
  namnText: string,
  viktText: string,
  vald: { kategori?: KategoriNyckel; underkategori?: UnderkategoriNyckel } = {},
): { ok: true; varden: SakVarden } | { ok: false; fel: string } {
  const namn = namnText.trim()
  if (!namn) return { ok: false, fel: 'Skriv vad saken heter.' }
  if (namn.length > MAX_NAMN) return { ok: false, fel: `Namnet får vara högst ${MAX_NAMN} tecken.` }
  const vikt = tolkaVikt(viktText)
  if (!vikt.ok) return { ok: false, fel: vikt.fel }
  const gissad = gissaKategori(namn)
  const kategori: KategoriNyckel = vald.kategori ?? gissad?.kategori ?? 'ovrigt'
  const kandidat = vald.kategori ? (vald.underkategori ?? (gissad?.kategori === vald.kategori ? gissad.underkategori : null)) : (gissad?.underkategori ?? null)
  const underkategori = kandidat && underkategoriFor(kategori, kandidat) ? kandidat : null
  return { ok: true, varden: { namn, kategori, underkategori, typ: forvaldTyp(kategori, underkategori), antal: 1, vikt_g: vikt.g, notering: null } }
}

export interface Turkandidat {
  /** Packradens id. */
  id: string
  varden: SakVarden & { produkt_id: string | null }
  /** Samma produkt eller samma namn finns redan i förrådet. */
  finnsRedan: boolean
}

/**
 * Det man bär själv i en tur, som saker till förrådet: raderna man bär (också gemensamma) och raderna alla ska ha,
 * med ens egen modell när man har valt en. Det som inte ska med i turen tas inte med, och inte heller det som redan
 * finns i förrådet med samma produkt eller samma namn (det markeras i stället).
 */
export function franTur(
  rader: readonly PackradRad[],
  status: readonly PackstatusRad[],
  mittId: string,
  forrad: readonly { namn: string; produkt_id: string | null }[],
): Turkandidat[] {
  const produkter = new Set(forrad.flatMap((s) => (s.produkt_id ? [s.produkt_id] : [])))
  const namn = new Set(forrad.map((s) => s.namn.trim().toLowerCase()))
  const egen = new Map(status.filter((s) => s.deltagare_id === mittId && s.namn).map((s) => [s.packrad_id, s]))
  return rader
    .filter((r) => r.med && (r.alla || r.bars_av === mittId))
    .sort((a, b) => a.sortering - b.sortering || a.namn.localeCompare(b.namn, 'sv'))
    .map((r) => {
      const modell = r.alla ? egen.get(r.id) : undefined
      const sakNamn = (modell?.namn ?? r.namn).trim().slice(0, MAX_NAMN)
      const produkt_id = modell ? modell.produkt_id : r.produkt_id
      const varden = {
        namn: sakNamn,
        kategori: r.kategori,
        underkategori: r.underkategori,
        produkt_id,
        typ: r.typ,
        antal: Math.min(Math.max(r.antal, 1), MAX_ANTAL),
        vikt_g: modell ? modell.vikt_g : r.vikt_g,
        notering: null,
      }
      return { id: r.id, varden, finnsRedan: (produkt_id !== null && produkter.has(produkt_id)) || namn.has(sakNamn.toLowerCase()) }
    })
}
