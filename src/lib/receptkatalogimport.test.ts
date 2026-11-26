import { describe, expect, it } from 'vitest'
import { importeraReceptkatalog, receptSeedSql, varunyckel } from './receptkatalogimport'

const RECEPT = 'id,namn,maltid,portioner,kok_kravs,torkning_hemma,beskrivning,mangder,inspirerat_av,inspirerat_av_url,status'
const INGR = 'recept_id,ordning,ingrediens,mangd,enhet,packas,kommentar,livsmedel_nummer,varukatalog'
const STEG = 'recept_id,steg_nr,var,steg,tid_min'
const kopplingar = { livsmedel: new Set([702]), varor: new Set([varunyckel('Pågen', 'Gifflar')]) }

const filer = (recept: string[], ingr: string[], steg: string[]) => ({ recept: [RECEPT, ...recept].join('\n'), ingredienser: [INGR, ...ingr].join('\n'), steg: [STEG, ...steg].join('\n') })
const grot = 'grot,Gröt med kanel,frukost,1,ja,nej,"Varm gröt, snabbt.",egna,Någon,https://exempel.se/grot,otestat'

describe('importen av recepten', () => {
  it('läser ett recept med ingredienser och steg', () => {
    const imp = importeraReceptkatalog(
      filer([grot], ['grot,1,Havregryn,6,msk,hemma,,702,', 'grot,2,Gifflar,1,st,separat,,,Pågen | Gifflar', 'grot,3,Vatten,3,dl,pa_plats,,,'], ['grot,1,turen,Koka upp vattnet.,5–10']),
      kopplingar,
    )
    expect(imp.fel).toEqual([])
    expect(imp.recept[0]).toMatchObject({ id: 'grot', portioner: 1, kok_kravs: true, torkning_hemma: false, beskrivning: 'Varm gröt, snabbt.' })
    expect(imp.ingredienser.map((i) => [i.livsmedel_nummer, i.varukatalog])).toEqual([
      [702, null],
      [null, { marke: 'Pågen', namn: 'Gifflar' }],
      [null, null],
    ])
    expect(imp.steg[0]).toMatchObject({ var: 'turen', tid_min: '5–10' })
  })

  it('stoppar fel i varje fil', () => {
    const imp = importeraReceptkatalog(
      filer(
        [grot, 'Fel id,X,brunch,0,kanske,nej,,egna,,http://x,klar'],
        ['grot,1,Havregryn,6,liter,hemma,,999,', 'grot,2,Salt,,tsk,hemma,,,', 'okant,1,X,1,g,hemma,,,', 'grot,3,Gifflar,1,st,hemma,,,Pågen Gifflar'],
        ['grot,1,ute,Koka.,snart'],
      ),
      kopplingar,
    )
    const text = imp.fel.join('\n')
    for (const f of [
      'id ska vara',
      'okänd måltid brunch',
      'portioner',
      'kok_kravs',
      'beskrivningen saknas',
      'https://',
      'status',
      'okänd enhet liter',
      'livsmedlet 999 finns inte',
      'mängd och enhet',
      'receptet okant finns inte',
      'märke och namn med |',
      'var ska vara',
      'tid_min',
    ])
      expect(text).toContain(f)
  })

  it('kräver att varje recept har ingredienser och steg', () => {
    const imp = importeraReceptkatalog(filer([grot], [], []), kopplingar)
    expect(imp.fel).toEqual(['Receptet grot har inga ingredienser.', 'Receptet grot har inga steg.'])
  })

  it('skriver seed som tar bort gamla recept och slår upp märkesvaran på märke och namn', () => {
    const imp = importeraReceptkatalog(filer([grot], ['grot,1,Gifflar,1,st,separat,,,Pågen | Gifflar'], ['grot,1,hemma,Packa maten.,']), kopplingar)
    const sql = receptSeedSql(imp)
    expect(sql).toContain("delete from public.receptkatalog where id not in ('grot');")
    expect(sql).toContain('on conflict (id) do update set')
    expect(sql).toContain("(select v.id from public.varukatalog v where lower(v.marke) = lower('Pågen') and lower(v.namn) = lower('Gifflar'))")
    expect(sql).toContain("'Varm gröt, snabbt.'")
    // Hittas varan inte stoppas migreringen i stället för att kopplingen blir tom.
    expect(sql).toContain('where varukatalog_id is not null) <> 1 then')
  })
})
