// Importen av MinVandrings recept. CSV-filerna i supabase/katalog/recept (recept.csv, ingredienser.csv och steg.csv)
// är huvudlistan, och härifrån skapas seed-SQL:en. Rena funktioner: text in, resultat ut. Skriptet
// scripts/receptkatalog.mjs läser filerna och skriver migreringen. Formatet beskrivs i docs/katalog/recept.md.
import { arEnhet, type Enhet } from './handla'
import { lasCsv } from './katalogimport'
import type { Receptkatalogingrediens, Receptkatalogrecept, Receptkatalogsteg } from './typer'

export const RECEPTKOLUMNER = ['id', 'namn', 'maltid', 'portioner', 'kok_kravs', 'torkning_hemma', 'beskrivning', 'mangder', 'inspirerat_av', 'inspirerat_av_url', 'status'] as const
export const INGREDIENSKOLUMNER = ['recept_id', 'ordning', 'ingrediens', 'mangd', 'enhet', 'packas', 'kommentar', 'livsmedel_nummer', 'varukatalog', 'gram'] as const
export const STEGKOLUMNER = ['recept_id', 'steg_nr', 'var', 'steg', 'tid_min'] as const

export const RECEPTMALTIDER = ['frukost', 'lunch', 'middag', 'mellanmal', 'dryck'] as const
export const PACKAS = ['hemma', 'separat', 'pa_plats'] as const

/** Det som finns att koppla en ingrediens till: livsmedlens nummer och märkesvarorna som "märke | namn" med små bokstäver. */
export interface Kopplingar {
  livsmedel: ReadonlySet<number>
  varor: ReadonlySet<string>
}

/** En ingrediens som den står i CSV:n. Märkesvaran anges med märke och namn, eftersom id:t skapas i databasen. */
export type Importingrediens = Omit<Receptkatalogingrediens, 'varukatalog_id'> & { varukatalog: { marke: string; namn: string } | null }

/** Nyckeln för en märkesvara: "märke | namn" med små bokstäver. */
export const varunyckel = (marke: string, namn: string) => `${marke.trim().toLowerCase()} | ${namn.trim().toLowerCase()}`

export interface Receptimport {
  fel: string[]
  recept: Receptkatalogrecept[]
  ingredienser: Importingrediens[]
  steg: Receptkatalogsteg[]
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/
/** Minuter, eller ett intervall med kort streck: 5 eller 5–10. */
const TID = /^\d{1,4}(–\d{1,4})?$/

function kolumnfel(fil: string, kolumner: readonly string[], forvantade: readonly string[]): string[] {
  const saknas = forvantade.filter((k) => !kolumner.includes(k)).map((k) => `${fil}: kolumnen ${k} saknas.`)
  const okanda = kolumner.filter((k) => !forvantade.includes(k)).map((k) => `${fil}: okänd kolumn ${k || '(tom rubrik)'}.`)
  return [...saknas, ...okanda]
}

function jaNej(text: string): boolean | null {
  return text === 'ja' ? true : text === 'nej' ? false : null
}

function text(varde: string, max: number): string | null {
  const t = varde.trim()
  return t && t.length <= max ? t : null
}

/**
 * Läser de tre filerna och kontrollerar varje rad. Ett fel var som helst stoppar hela importen, eftersom recept,
 * ingredienser och steg hör ihop.
 */
export function importeraReceptkatalog(filer: { recept: string; ingredienser: string; steg: string }, kopplingar: Kopplingar): Receptimport {
  const fel: string[] = []
  const r = lasCsv(filer.recept)
  const i = lasCsv(filer.ingredienser)
  const s = lasCsv(filer.steg)
  fel.push(...kolumnfel('recept.csv', r.kolumner, RECEPTKOLUMNER), ...kolumnfel('ingredienser.csv', i.kolumner, INGREDIENSKOLUMNER), ...kolumnfel('steg.csv', s.kolumner, STEGKOLUMNER))
  if (fel.length) return { fel, recept: [], ingredienser: [], steg: [] }

  const recept: Receptkatalogrecept[] = []
  for (const { rad, falt, antalFalt } of r.rader) {
    const var_ = `recept.csv rad ${rad}`
    if (antalFalt !== r.kolumner.length) {
      fel.push(`${var_}: raden har ${antalFalt} fält, rubrikraden har ${r.kolumner.length}.`)
      continue
    }
    const portioner = /^\d{1,2}$/.test(falt.portioner) ? Number(falt.portioner) : 0
    const kok = jaNej(falt.kok_kravs)
    const torkning = jaNej(falt.torkning_hemma)
    const namn = text(falt.namn, 80)
    const beskrivning = text(falt.beskrivning, 300)
    const kalla = text(falt.inspirerat_av, 80)
    const radfel = [
      !ID.test(falt.id) && 'id ska vara små bokstäver, siffror och bindestreck',
      recept.some((x) => x.id === falt.id) && `id ${falt.id} finns redan`,
      !namn && 'namnet saknas eller är längre än 80 tecken',
      !(RECEPTMALTIDER as readonly string[]).includes(falt.maltid) && `okänd måltid ${falt.maltid}`,
      (portioner < 1 || portioner > 50) && 'portioner ska vara 1 till 50',
      kok === null && 'kok_kravs ska vara ja eller nej',
      torkning === null && 'torkning_hemma ska vara ja eller nej',
      !beskrivning && 'beskrivningen saknas eller är längre än 300 tecken',
      falt.mangder !== 'fran_kallan' && falt.mangder !== 'egna' && 'mangder ska vara fran_kallan eller egna',
      !kalla && 'inspirerat_av saknas',
      !/^https:\/\/\S+$/.test(falt.inspirerat_av_url) && 'inspirerat_av_url ska börja med https://',
      falt.status !== 'otestat' && falt.status !== 'testat' && 'status ska vara otestat eller testat',
    ].filter((x): x is string => typeof x === 'string')
    if (radfel.length) {
      fel.push(...radfel.map((f) => `${var_}: ${f}.`))
      continue
    }
    recept.push({
      id: falt.id,
      namn: namn!,
      maltid: falt.maltid as Receptkatalogrecept['maltid'],
      portioner,
      kok_kravs: kok!,
      torkning_hemma: torkning!,
      beskrivning: beskrivning!,
      mangder: falt.mangder as Receptkatalogrecept['mangder'],
      inspirerat_av: kalla!,
      inspirerat_av_url: falt.inspirerat_av_url,
      status: falt.status as Receptkatalogrecept['status'],
    })
  }
  const receptId = new Set(recept.map((x) => x.id))

  const ingredienser: Importingrediens[] = []
  for (const { rad, falt, antalFalt } of i.rader) {
    const var_ = `ingredienser.csv rad ${rad}`
    if (antalFalt !== i.kolumner.length) {
      fel.push(`${var_}: raden har ${antalFalt} fält, rubrikraden har ${i.kolumner.length}.`)
      continue
    }
    const ordning = /^\d{1,2}$/.test(falt.ordning) ? Number(falt.ordning) : 0
    const mangd = falt.mangd === '' ? null : /^\d+(\.\d+)?$/.test(falt.mangd) ? Number(falt.mangd) : NaN
    const enhet: Enhet | null = falt.enhet === '' ? null : arEnhet(falt.enhet) ? falt.enhet : null
    const livsmedel = falt.livsmedel_nummer === '' ? null : /^\d+$/.test(falt.livsmedel_nummer) ? Number(falt.livsmedel_nummer) : NaN
    const delar = falt.varukatalog.split('|').map((x) => x.trim())
    const vara = falt.varukatalog.trim() === '' ? null : delar.length === 2 && delar[0] && delar[1] ? { marke: delar[0], namn: delar[1] } : undefined
    const namn = text(falt.ingrediens, 80)
    // Vikten för hela mängden, frivillig. Behövs för kcal när enheten inte är g eller kg.
    const gram = falt.gram === '' ? null : /^\d+(\.\d)?$/.test(falt.gram) ? Number(falt.gram) : NaN
    const radfel = [
      !receptId.has(falt.recept_id) && `receptet ${falt.recept_id} finns inte i recept.csv`,
      ordning < 1 && 'ordning ska vara ett heltal från 1',
      ingredienser.some((x) => x.recept_id === falt.recept_id && x.ordning === ordning) && `ordning ${ordning} finns redan i receptet`,
      !namn && 'ingrediensen saknas eller är längre än 80 tecken',
      (Number.isNaN(mangd) || (mangd !== null && (mangd <= 0 || mangd > 10000))) && 'mängden ska vara ett tal med punkt, större än 0',
      falt.enhet !== '' && !enhet && `okänd enhet ${falt.enhet}`,
      (mangd === null) !== (enhet === null) && 'mängd och enhet anges tillsammans',
      !(PACKAS as readonly string[]).includes(falt.packas) && `packas ska vara ${PACKAS.join(', ')}`,
      falt.kommentar.length > 120 && 'kommentaren är längre än 120 tecken',
      livsmedel !== null && (Number.isNaN(livsmedel) || !kopplingar.livsmedel.has(livsmedel)) && `livsmedlet ${falt.livsmedel_nummer} finns inte`,
      vara === undefined && 'varukatalog ska vara märke och namn med | emellan',
      vara && !kopplingar.varor.has(varunyckel(vara.marke, vara.namn)) && `varan ${falt.varukatalog} finns inte i varukatalogen`,
      livsmedel !== null && !!vara && 'koppla till ett livsmedel eller en vara, inte båda',
      (Number.isNaN(gram) || (gram !== null && (gram <= 0 || gram > 20000))) && 'gram ska vara ett tal med punkt och högst en decimal, större än 0 och högst 20000',
      gram !== null && (enhet === 'g' || enhet === 'kg') && 'gram behövs inte när enheten är g eller kg',
    ].filter((x): x is string => typeof x === 'string')
    if (radfel.length) {
      fel.push(...radfel.map((f) => `${var_}: ${f}.`))
      continue
    }
    ingredienser.push({
      recept_id: falt.recept_id,
      ordning,
      ingrediens: namn!,
      mangd,
      enhet,
      packas: falt.packas as Receptkatalogingrediens['packas'],
      kommentar: falt.kommentar.trim() || null,
      gram,
      livsmedel_nummer: livsmedel,
      varukatalog: vara ?? null,
    })
  }

  const steg: Receptkatalogsteg[] = []
  for (const { rad, falt, antalFalt } of s.rader) {
    const var_ = `steg.csv rad ${rad}`
    if (antalFalt !== s.kolumner.length) {
      fel.push(`${var_}: raden har ${antalFalt} fält, rubrikraden har ${s.kolumner.length}.`)
      continue
    }
    const nr = /^\d{1,2}$/.test(falt.steg_nr) ? Number(falt.steg_nr) : 0
    const stegtext = text(falt.steg, 400)
    const radfel = [
      !receptId.has(falt.recept_id) && `receptet ${falt.recept_id} finns inte i recept.csv`,
      nr < 1 && 'steg_nr ska vara ett heltal från 1',
      steg.some((x) => x.recept_id === falt.recept_id && x.steg_nr === nr) && `steg ${nr} finns redan i receptet`,
      falt.var !== 'hemma' && falt.var !== 'turen' && 'var ska vara hemma eller turen',
      !stegtext && 'steget saknas eller är längre än 400 tecken',
      falt.tid_min !== '' && !TID.test(falt.tid_min) && 'tid_min ska vara minuter, till exempel 5 eller 5–10',
    ].filter((x): x is string => typeof x === 'string')
    if (radfel.length) {
      fel.push(...radfel.map((f) => `${var_}: ${f}.`))
      continue
    }
    steg.push({ recept_id: falt.recept_id, steg_nr: nr, var: falt.var as Receptkatalogsteg['var'], steg: stegtext!, tid_min: falt.tid_min || null })
  }

  for (const x of recept) {
    if (!ingredienser.some((y) => y.recept_id === x.id)) fel.push(`Receptet ${x.id} har inga ingredienser.`)
    if (!steg.some((y) => y.recept_id === x.id)) fel.push(`Receptet ${x.id} har inga steg.`)
  }
  return { fel, recept, ingredienser, steg }
}

function sql(v: string | number | boolean | null): string {
  if (v === null) return 'null'
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return `'${v.replaceAll("'", "''")}'`
}

function insert<T extends object>(tabell: string, kolumner: readonly string[], rader: readonly T[], varde: (r: T, k: string) => string): string {
  const varden = rader.map((r) => `  (${kolumner.map((k) => varde(r, k)).join(', ')})`)
  return `insert into public.${tabell} (${kolumner.join(', ')}) values\n${varden.join(',\n')};`
}

const falt = <T extends object>(r: T, k: string) => sql((r as Record<string, string | number | boolean | null>)[k])

/** Märkesvarans id slås upp på märke och namn. */
function ingrediensvarde(r: Importingrediens, k: string): string {
  if (k !== 'varukatalog_id') return falt(r, k)
  if (!r.varukatalog) return 'null'
  return `(select v.id from public.varukatalog v where lower(v.marke) = lower(${sql(r.varukatalog.marke)}) and lower(v.namn) = lower(${sql(r.varukatalog.namn)}))`
}

const INGREDIENSKOLUMNER_DB = ['recept_id', 'ordning', 'ingrediens', 'mangd', 'enhet', 'packas', 'kommentar', 'gram', 'livsmedel_nummer', 'varukatalog_id'] as const

/**
 * Seed-SQL för recepten. Hela katalogen skrivs om: recept som inte längre finns i CSV:n tas bort, och varje recepts
 * ingredienser och steg skrivs på nytt. Så kan samma lista köras igen i en ny migrering när CSV:erna har ändrats.
 */
export function receptSeedSql(imp: Pick<Receptimport, 'recept' | 'ingredienser' | 'steg'>): string {
  const id = imp.recept.map((r) => sql(r.id)).join(', ')
  return [
    '-- MinVandrings recept från supabase/katalog/recept/ (recept.csv, ingredienser.csv och steg.csv).',
    '-- Skapad med "npm run receptkatalog". Ändra inte filen för hand: ändra CSV:erna och skapa en ny migrering.',
    '',
    imp.recept.length ? `delete from public.receptkatalog where id not in (${id});` : 'delete from public.receptkatalog;',
    '',
    ...(imp.recept.length
      ? [
          `${insert('receptkatalog', RECEPTKOLUMNER, imp.recept, falt).slice(0, -1)}\non conflict (id) do update set\n${RECEPTKOLUMNER.filter((k) => k !== 'id')
            .map((k) => `  ${k} = excluded.${k}`)
            .join(',\n')};`,
          '',
          `delete from public.receptkatalog_ingredienser where recept_id in (${id});`,
          `delete from public.receptkatalog_steg where recept_id in (${id});`,
          '',
          insert('receptkatalog_ingredienser', INGREDIENSKOLUMNER_DB, imp.ingredienser, ingrediensvarde),
          '',
          insert('receptkatalog_steg', STEGKOLUMNER, imp.steg, falt),
          '',
          '-- En märkesvara som inte finns i varukatalogen ger en tom koppling. Då stoppas migreringen i stället.',
          'do $$ begin',
          `  if (select count(*) from public.receptkatalog_ingredienser where varukatalog_id is not null) <> ${imp.ingredienser.filter((i) => i.varukatalog).length} then`,
          "    raise exception 'En märkesvara i receptkatalogen finns inte i varukatalogen';",
          '  end if;',
          'end $$;',
        ]
      : []),
    '',
  ].join('\n')
}
