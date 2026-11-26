// Testar åtkomstkontrollen (RLS) mot en riktig Postgres som körs i minnet (PGlite).
// Migrationerna i supabase/migrations körs i ordning, och Supabase-delarna de behöver (auth.users, auth.uid(),
// rollerna anon och authenticated) skapas som enkla kopior här. Inget skickas till den riktiga databasen.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { KATEGORIER } from '../src/lib/forrad'
import { AVDELNINGAR, ENHETER } from '../src/lib/handla'
import { ALLERGENER } from '../src/lib/kost'
import { AMNEN } from '../src/lib/lardomar'
import { NOTISTYPER } from '../src/lib/notiser'
import { godkanda, importera } from '../src/lib/katalogimport'
import { godkandaLivsmedel, importeraLivsmedel, LIVSMEDELSKOLUMNER, livsmedelSeedSql } from '../src/lib/livsmedelimport'
import { godkandaPasar, importeraMatkatalog, MATKOLUMNER, matSeedSql } from '../src/lib/matkatalogimport'

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'
const D = '00000000-0000-0000-0000-00000000000d'
const E = '00000000-0000-0000-0000-00000000000e'
const F = '00000000-0000-0000-0000-00000000000f'
const G = '00000000-0000-0000-0000-000000000010'

let db: PGlite

/** Kör som en inloggad användare, precis som en anrop från appen med användarens inloggning. */
async function som<T>(anvandare: string, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role authenticated; set local request.jwt.claim.sub = '${anvandare}';`)
    return fn(tx)
  })
}

async function forvantaFel(p: Promise<unknown>) {
  await expect(p).rejects.toThrow()
}

async function turnamn(id: string) {
  const r = await db.query<{ namn: string }>('select namn from public.turer where id = $1', [id])
  return r.rows[0]?.namn
}

/** Skapar en tur som appen gör: id:t väljs i förväg och raden läses inte tillbaka. */
async function skapaTur(agare: string, namn: string): Promise<string> {
  const id = crypto.randomUUID()
  await som(agare, (tx) => tx.query('insert into public.turer (id, namn) values ($1, $2)', [id, namn]))
  return id
}

async function kodFor(turId: string) {
  const r = await db.query<{ kod: string }>('select kod from public.inbjudningar where tur_id = $1', [turId])
  return r.rows[0].kod
}

/**
 * En ny databas i minnet med Supabase-delarna och migreringarna. Med migreringar körs bara de filer som
 * funktionen släpper igenom, till exempel för att lägga in gamla rader innan en senare migrering körs.
 */
async function nyDatabas(migreringar: (fil: string) => boolean = () => true): Promise<PGlite> {
  const ny = new PGlite({ extensions: { pgcrypto } })
  await ny.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema extensions;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    grant usage on schema public to authenticated, anon;
    create publication supabase_realtime;
    -- En enkel kopia av Supabase Storage: tabellerna och funktionen som migreringarna och policyerna använder.
    -- Som i Supabase har API-rollerna rättigheter på storage.objects, och RLS avgör vad de når.
    create schema storage;
    create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, unique (bucket_id, name));
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema storage to authenticated, anon;
    grant select, insert, update, delete on storage.objects to authenticated, anon;
    grant execute on function storage.foldername(text) to authenticated, anon;
    -- Som i Supabase: nya funktioner i public får execute för anon och authenticated.
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    -- Supabase skapar rls_auto_enable själv (automatisk RLS). En kopia utan search_path, som i ett nytt projekt.
    create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin end $$;
  `)
  await korMigreringar(ny, migreringar)
  return ny
}

async function korMigreringar(db: PGlite, vilka: (fil: string) => boolean) {
  const mapp = path.join(import.meta.dirname, 'migrations')
  for (const fil of fs.readdirSync(mapp).sort().filter(vilka)) {
    await db.exec(fs.readFileSync(path.join(mapp, fil), 'utf8'))
  }
}

beforeAll(async () => {
  db = await nyDatabas()
  await db.exec(`
    insert into auth.users (id, email) values
      ('${A}', 'anna@exempel.se'), ('${B}', 'bertil@exempel.se'), ('${C}', 'cilla@exempel.se'),
      ('${D}', 'david@exempel.se'),
      ('${E}', 'erik@exempel.se'), ('${F}', 'frida@exempel.se'), ('${G}', 'gustav@exempel.se');
  `)
}, 60_000)

/** Kör utan inloggning, som ett anrop till API:t med bara den publika nyckeln. */
async function somAnon<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('set local role anon;')
    return fn(tx)
  })
}

async function kanAnropa(roll: 'anon' | 'authenticated', funktion: string) {
  const r = await db.query<{ ok: boolean }>("select has_function_privilege($1, $2, 'execute') as ok", [roll, funktion])
  return r.rows[0].ok
}

describe('funktionerna i public', () => {
  const interna = [
    'public.ny_anvandare()',
    'public.ny_tur()',
    'public.skydda_deltagare()',
    'public.ny_deltagare_utan_konto()',
    'public.synka_namn()',
    'public.min_roll(uuid)',
    'public.rls_auto_enable()',
    'public.slumpkod()',
    'public.ny_inbjudan()',
    'public.tur_for_kod(text)',
    'public.skydda_kostbehov()',
    'public.bara_personer_ater()',
    'public.hund_ater_inte()',
    'public.bara_personer_koper()',
    'public.konto_raderas()',
    'public.bara_personer_bar()',
    'public.pase_utan_ingredienser()',
    'public.skydda_forradskok()',
    'public.anteckning_andrad()',
    'public.privata_anteckningar_bort()',
    'public.lardom_tur_namn()',
    'public.notis_gick_med()',
    'public.notiser_bort_med_deltagare()',
  ]
  const forInloggade = [
    'public.ar_medlem(uuid)',
    'public.kan_andra(uuid)',
    'public.ar_agare(uuid)',
    'public.ga_med(text, uuid)',
    'public.inbjudan(text)',
    'public.ny_inbjudningskod(uuid)',
    'public.delar_tur(uuid)',
    'public.ta_bort_egen_ratt(uuid)',
    'public.spara_egen_ratt(uuid, uuid, text, jsonb, integer, text, integer)',
    'public.spara_recept(uuid, text, jsonb)',
    'public.ta_ratt(uuid)',
    'public.slapp_ratt(uuid)',
    'public.ta_med_gemensam(uuid, boolean)',
  ]

  it('går inte att anropa utan inloggning', async () => {
    for (const f of [...interna, ...forInloggade]) expect(await kanAnropa('anon', f), f).toBe(false)
    await forvantaFel(somAnon((tx) => tx.query(`select public.ga_med('NAGOT')`)))
    await forvantaFel(somAnon((tx) => tx.query(`select public.ar_medlem('${A}')`)))
  })

  it('triggerfunktionerna och min_roll går inte att anropa för inloggade heller', async () => {
    for (const f of interna) expect(await kanAnropa('authenticated', f), f).toBe(false)
    await forvantaFel(som(A, (tx) => tx.query(`select public.min_roll('${A}')`)))
  })

  it('hjälpfunktionerna i policyerna och ga_med går att anropa för inloggade', async () => {
    for (const f of forInloggade) expect(await kanAnropa('authenticated', f), f).toBe(true)
  })

  it('alla security definer-funktioner har en fast search_path, utom Supabases rls_auto_enable som lämnas orörd', async () => {
    const r = await db.query<{ namn: string }>(`
      select p.proname as namn from pg_proc p
      where p.pronamespace = 'public'::regnamespace and p.prosecdef
        and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')`)
    expect(r.rows).toEqual([{ namn: 'rls_auto_enable' }])
  })

  it('inloggade kan fortfarande skapa en tur, gå med via länk och se sina turer', async () => {
    const tur = await skapaTur(A, 'Tur efter stängningen')
    const kod = await kodFor(tur)
    await som(B, (tx) => tx.query('select public.ga_med($1)', [kod]))
    for (const vem of [A, B]) {
      const r = await som(vem, (tx) => tx.query<{ id: string }>('select id from public.turer where id = $1', [tur]))
      expect(r.rows, vem).toHaveLength(1)
    }
    const roller = await db.query<{ roll: string }>('select roll from public.deltagare where tur_id = $1 order by roll', [tur])
    expect(roller.rows.map((r) => r.roll)).toEqual(['editor', 'owner'])
  })

  it('anon ser inga turer', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.turer')))
  })
})

describe('profiler', () => {
  it('skapas automatiskt för nya användare', async () => {
    const r = await db.query('select id from public.profiler')
    expect(r.rows).toHaveLength(7)
  })

  it('går bara att ändra för en själv', async () => {
    const andrade = await som(B, (tx) => tx.query(`update public.profiler set namn = 'Hackad' where id = '${A}'`))
    expect(andrade.affectedRows).toBe(0)
    const r = await db.query<{ namn: string }>(`select namn from public.profiler where id = '${A}'`)
    expect(r.rows[0].namn).toBe('anna')
  })
})

describe('en annan användares tur', () => {
  let tur: string

  beforeAll(async () => {
    tur = await skapaTur(A, 'Annas tur')
  })

  it('gör skaparen till owner', async () => {
    const r = await db.query<{ roll: string }>(`select roll from public.deltagare where tur_id = $1 and user_id = '${A}'`, [tur])
    expect(r.rows[0].roll).toBe('owner')
  })

  it('syns inte för någon som inte är med', async () => {
    const r = await som(B, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(r.rows).toHaveLength(0)
    const d = await som(B, (tx) => tx.query('select id from public.deltagare where tur_id = $1', [tur]))
    expect(d.rows).toHaveLength(0)
  })

  it('går inte att ändra eller radera för någon som inte är med', async () => {
    await som(B, (tx) => tx.query(`update public.turer set namn = 'Bertils nu' where id = $1`, [tur]))
    await som(B, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect(await turnamn(tur)).toBe('Annas tur')
  })

  it('går inte att lägga till saker i för någon som inte är med', async () => {
    await forvantaFel(som(B, (tx) => tx.query(`insert into public.packrader (tur_id, namn) values ($1, 'Smygsak')`, [tur])))
  })

  it('går inte att ta sig in i genom att lägga till sig själv som deltagare', async () => {
    await forvantaFel(
      som(B, (tx) =>
        tx.query(`insert into public.deltagare (tur_id, user_id, namn, roll) values ($1, '${B}', 'Bertil', 'owner')`, [tur]),
      ),
    )
  })

  it('går inte att gå med i med fel kod', async () => {
    const r = await som(B, (tx) => tx.query<{ t: string | null }>(`select public.ga_med('FELKOD') as t`))
    expect(r.rows[0].t).toBeNull()
    const syns = await som(B, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(syns.rows).toHaveLength(0)
  })
})

describe('roller', () => {
  let tur: string
  let cillasDeltagare: string
  let annasDeltagare: string
  let davidsDeltagare: string
  let packrad: string

  beforeAll(async () => {
    tur = await skapaTur(A, 'Gemensam tur')
    const kod = await kodFor(tur)
    await som(C, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const d = await db.query<{ id: string; user_id: string }>('select id, user_id from public.deltagare where tur_id = $1', [tur])
    cillasDeltagare = d.rows.find((r) => r.user_id === C)!.id
    annasDeltagare = d.rows.find((r) => r.user_id === A)!.id
    const p = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn, alla) values ($1, 'Sovsäck', true) returning id`, [tur]),
    )
    packrad = p.rows[0].id
  })

  it('den som går med via inbjudan blir editor och kan ändra turen', async () => {
    const r = await db.query<{ roll: string }>('select roll from public.deltagare where id = $1', [cillasDeltagare])
    expect(r.rows[0].roll).toBe('editor')
    await som(C, (tx) => tx.query(`update public.turer set destination = 'Sarek' where id = $1`, [tur]))
    const t = await db.query<{ destination: string }>('select destination from public.turer where id = $1', [tur])
    expect(t.rows[0].destination).toBe('Sarek')
  })

  it('editor kan inte radera turen', async () => {
    await som(C, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect(await turnamn(tur)).toBe('Gemensam tur')
  })

  it('editor kan inte göra sig själv till owner', async () => {
    // Policyn släpper inte fram redigerarens egen rad, så ingenting ändras.
    const r = await som(C, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [cillasDeltagare]))
    expect(r.affectedRows).toBe(0)
    const roll = await db.query<{ roll: string }>('select roll from public.deltagare where id = $1', [cillasDeltagare])
    expect(roll.rows[0].roll).toBe('editor')
  })

  it('editor kan lägga till en hund men inte en annan användare', async () => {
    await som(C, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Bamse', 'hund')`, [tur]))
    await forvantaFel(
      som(C, (tx) => tx.query(`insert into public.deltagare (tur_id, user_id, namn) values ($1, '${B}', 'Bertil')`, [tur])),
    )
  })

  // Samma regler som kanTaBort i src/lib/roller.ts, som styr vilka kryss som visas i deltagarlistan.
  it('editor kan ta bort en hund, men inte en deltagare med konto, och kan inte ändra någon annans roll', async () => {
    const kod = await kodFor(tur)
    await som(D, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const d = await db.query<{ id: string }>(`select id from public.deltagare where tur_id = $1 and user_id = '${D}'`, [tur])
    davidsDeltagare = d.rows[0].id

    await som(C, (tx) => tx.query(`delete from public.deltagare where tur_id = $1 and namn = 'Bamse'`, [tur]))
    const hundar = await db.query(`select id from public.deltagare where tur_id = $1 and typ = 'hund'`, [tur])
    expect(hundar.rows).toHaveLength(0)

    await som(C, (tx) => tx.query('delete from public.deltagare where id = $1', [davidsDeltagare]))
    const kvar = await db.query('select id from public.deltagare where id = $1', [davidsDeltagare])
    expect(kvar.rows).toHaveLength(1)

    const r = await som(C, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [davidsDeltagare]))
    expect(r.affectedRows).toBe(0)
    const roll = await db.query<{ roll: string }>('select roll from public.deltagare where id = $1', [davidsDeltagare])
    expect(roll.rows[0].roll).toBe('editor')
  })

  it('viewer ser turen men kan inte ändra den', async () => {
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [cillasDeltagare]))
    const syns = await som(C, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(syns.rows).toHaveLength(1)
    await som(C, (tx) => tx.query(`update public.turer set namn = 'Ändrad av viewer' where id = $1`, [tur]))
    expect(await turnamn(tur)).toBe('Gemensam tur')
    await forvantaFel(som(C, (tx) => tx.query(`insert into public.packrader (tur_id, namn) values ($1, 'Kåsa')`, [tur])))
  })

  it('viewer kan bocka av sin egen packning men inte någon annans', async () => {
    await som(C, (tx) =>
      tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id, packad) values ($1, $2, $3, true)', [packrad, cillasDeltagare, tur]),
    )
    await forvantaFel(
      som(C, (tx) =>
        tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id, packad) values ($1, $2, $3, true)', [packrad, annasDeltagare, tur]),
      ),
    )
  })

  it('viewer kan inte lägga till eller ta bort deltagare, och kan inte ändra dem', async () => {
    await forvantaFel(som(C, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Smyghund', 'hund')`, [tur])))

    await som(A, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Rex', 'hund')`, [tur]))
    await som(C, (tx) => tx.query(`delete from public.deltagare where tur_id = $1 and namn = 'Rex'`, [tur]))
    await som(C, (tx) => tx.query('delete from public.deltagare where id = $1', [davidsDeltagare]))
    await som(C, (tx) => tx.query(`update public.deltagare set namn = 'Ändrad av viewer' where tur_id = $1 and namn = 'Rex'`, [tur]))
    const kvar = await db.query<{ namn: string }>(`select namn from public.deltagare where tur_id = $1 and (namn = 'Rex' or id = $2)`, [tur, davidsDeltagare])
    expect(kvar.rows).toHaveLength(2)
  })

  it('en tur måste alltid ha en owner', async () => {
    await forvantaFel(som(A, (tx) => tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [annasDeltagare])))
    await forvantaFel(som(A, (tx) => tx.query('delete from public.deltagare where id = $1', [annasDeltagare])))
  })

  it('namnbyte i profilen syns i turen', async () => {
    await som(A, (tx) => tx.query(`update public.profiler set namn = 'Anna' where id = '${A}'`))
    const r = await db.query<{ namn: string }>('select namn from public.deltagare where id = $1', [annasDeltagare])
    expect(r.rows[0].namn).toBe('Anna')
  })

  it('viewer kan lämna turen, och ser den inte längre', async () => {
    await som(C, (tx) => tx.query('delete from public.deltagare where id = $1', [cillasDeltagare]))
    const kvar = await db.query('select id from public.deltagare where id = $1', [cillasDeltagare])
    expect(kvar.rows).toHaveLength(0)
    const syns = await som(C, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(syns.rows).toHaveLength(0)
  })

  it('owner kan ta bort en deltagare med konto', async () => {
    await som(A, (tx) => tx.query('delete from public.deltagare where id = $1', [davidsDeltagare]))
    const kvar = await db.query('select id from public.deltagare where id = $1', [davidsDeltagare])
    expect(kvar.rows).toHaveLength(0)
  })

  it('owner kan radera turen, och då försvinner allt i den', async () => {
    await som(A, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect(await turnamn(tur)).toBeUndefined()
    const d = await db.query('select id from public.deltagare where tur_id = $1', [tur])
    expect(d.rows).toHaveLength(0)
  })
})

// Ägaren ändrar alla rader, redigeraren bara rader utan konto och läsaren ingen.
describe('ändra deltagare', () => {
  let tur: string
  let agare: string
  let redigerare: string
  let annanRedigerare: string
  let lasare: string
  let hund: string
  let platshallare: string

  interface Rad {
    namn: string
    typ: string
    roll: string
    user_id: string | null
    sortering: number
    max_barvikt_kg: string
    matandel: string | null
    hundmat_per_dag_g: number | null
  }
  const rad = async (id: string) =>
    (
      await db.query<Rad>(
        'select namn, typ, roll, user_id, sortering, max_barvikt_kg, matandel, hundmat_per_dag_g from public.deltagare where id = $1',
        [id],
      )
    ).rows[0]

  /** Försöker ändra allt utom rollen på raden. Ger antalet ändrade rader. */
  const forsokAndra = (vem: string, id: string) =>
    som(vem, (tx) =>
      tx.query(
        `update public.deltagare set namn = 'Kapad', typ = 'hund', sortering = 99, max_barvikt_kg = 1, matandel = 1, hundmat_per_dag_g = 999 where id = $1`,
        [id],
      ),
    ).then((r) => r.affectedRows)

  /** Rollbyte som policyn ska dölja raden för: ingen rad ändras och inget fel kastas. */
  async function forvantaSammaRoll(vem: string, id: string, nyRoll: string) {
    const fore = await rad(id)
    const r = await som(vem, (tx) => tx.query('update public.deltagare set roll = $1 where id = $2', [nyRoll, id]))
    expect(r.affectedRows).toBe(0)
    expect(await rad(id)).toEqual(fore)
  }

  /** Raden ska vara orörd efter ett försök som inte fick gå igenom. */
  async function forvantaOrord(vem: string, id: string) {
    const fore = await rad(id)
    expect(await forsokAndra(vem, id)).toBe(0)
    expect(await rad(id)).toEqual(fore)
  }

  beforeAll(async () => {
    tur = await skapaTur(A, 'Tur med alla roller')
    const kod = await kodFor(tur)
    for (const vem of [B, C, D]) await som(vem, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const utanKonto = await som(A, (tx) =>
      tx.query<{ id: string; typ: string }>(
        `insert into public.deltagare (tur_id, namn, typ) values ($1, 'Bamse', 'hund'), ($1, 'Pichi', 'person') returning id, typ`,
        [tur],
      ),
    )
    hund = utanKonto.rows.find((r) => r.typ === 'hund')!.id
    platshallare = utanKonto.rows.find((r) => r.typ === 'person')!.id
    const d = await db.query<{ id: string; user_id: string }>('select id, user_id from public.deltagare where tur_id = $1', [tur])
    const radFor = (vem: string) => d.rows.find((r) => r.user_id === vem)!.id
    agare = radFor(A)
    lasare = radFor(B)
    redigerare = radFor(C)
    annanRedigerare = radFor(D)
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [lasare]))
  })

  it('ägaren kan ändra alla rader i sin tur: sin egen, andras och de utan konto', async () => {
    for (const id of [agare, redigerare, lasare, hund, platshallare]) {
      const r = await som(A, (tx) => tx.query('update public.deltagare set max_barvikt_kg = 12.5, sortering = 7 where id = $1', [id]))
      expect(r.affectedRows).toBe(1)
      expect(await rad(id)).toMatchObject({ max_barvikt_kg: '12.5', sortering: 7 })
    }
    await som(A, (tx) => tx.query(`update public.deltagare set namn = 'Bamse den store' where id = $1`, [hund]))
    expect((await rad(hund)).namn).toBe('Bamse den store')
  })

  it('redigeraren kan ändra en hund och en person utan konto', async () => {
    await som(C, (tx) => tx.query(`update public.deltagare set namn = 'Bamse', sortering = 3, max_barvikt_kg = 8 where id = $1`, [hund]))
    expect(await rad(hund)).toMatchObject({ namn: 'Bamse', sortering: 3, max_barvikt_kg: '8.0' })
    await som(C, (tx) => tx.query(`update public.deltagare set namn = 'Pichi P', matandel = 0.5 where id = $1`, [platshallare]))
    expect(await rad(platshallare)).toMatchObject({ namn: 'Pichi P', matandel: '0.500' })
  })

  it('redigeraren kan inte ändra ägarens rad, och inte ägarens roll', async () => {
    await forvantaOrord(C, agare)
    await forvantaSammaRoll(C, agare, 'viewer')
  })

  it('redigeraren kan inte ändra en annan redigerares eller en läsares rad', async () => {
    await forvantaOrord(C, annanRedigerare)
    await forvantaOrord(C, lasare)
    await forvantaSammaRoll(C, annanRedigerare, 'viewer')
  })

  it('redigeraren kan inte ändra sin egen rad, och inte göra sig själv till ägare', async () => {
    await forvantaOrord(C, redigerare)
    await forvantaSammaRoll(C, redigerare, 'owner')
  })

  // Tre olika skydd, ett per försök: triggern för roller, with check i policyn och triggern för flytt.
  it('redigeraren kan inte ändra rollen på en rad utan konto, och inte koppla den till ett konto', async () => {
    const forsok = (sql: string, id: string) => som(C, (tx) => tx.query(sql, [id]))
    await expect(forsok(`update public.deltagare set roll = 'owner' where id = $1`, platshallare)).rejects.toThrow(/Bara ägaren/)
    await expect(forsok(`update public.deltagare set roll = 'viewer' where id = $1`, hund)).rejects.toThrow(/Bara ägaren/)
    await expect(forsok(`update public.deltagare set user_id = '${C}' where id = $1`, platshallare)).rejects.toThrow(/row-level security/)
    await expect(forsok(`update public.deltagare set user_id = '${E}' where id = $1`, platshallare)).rejects.toThrow(/flytta/)
    expect(await rad(platshallare)).toMatchObject({ roll: 'editor', user_id: null })
    expect(await rad(hund)).toMatchObject({ roll: 'editor', user_id: null })
  })

  it('redigeraren kan inte ändra en person utan konto som är ägare, men ägaren kan', async () => {
    const r = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Platsägare', 'person') returning id`, [tur]),
    )
    const platsagare = r.rows[0].id
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [platsagare]))

    await forvantaOrord(C, platsagare)
    await forvantaSammaRoll(C, platsagare, 'editor')

    await som(A, (tx) => tx.query(`update public.deltagare set namn = 'Platsägaren' where id = $1`, [platsagare]))
    expect((await rad(platsagare)).namn).toBe('Platsägaren')
    // Tillbaka till en vanlig person utan konto: då når redigeraren raden igen.
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [platsagare]))
    await som(C, (tx) => tx.query(`update public.deltagare set namn = 'Plats' where id = $1`, [platsagare]))
    expect((await rad(platsagare)).namn).toBe('Plats')
  })

  // Samma regel som kanTaBort i src/lib/roller.ts.
  it('redigeraren kan inte ta bort en person utan konto som är ägare, men ägaren kan', async () => {
    const r = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Ägare utan konto', 'person') returning id`, [tur]),
    )
    const platsagare = r.rows[0].id
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [platsagare]))

    const borta = await som(C, (tx) => tx.query('delete from public.deltagare where id = $1', [platsagare]))
    expect(borta.affectedRows).toBe(0)
    expect(await rad(platsagare)).toMatchObject({ namn: 'Ägare utan konto', roll: 'owner' })

    const agarenTarBort = await som(A, (tx) => tx.query('delete from public.deltagare where id = $1', [platsagare]))
    expect(agarenTarBort.affectedRows).toBe(1)
  })

  it('redigeraren kan inte flytta en rad utan konto till en annan tur', async () => {
    const egen = await skapaTur(C, 'Cillas egen tur')
    await forvantaFel(som(C, (tx) => tx.query('update public.deltagare set tur_id = $1 where id = $2', [egen, hund])))
    expect((await db.query<{ tur_id: string }>('select tur_id from public.deltagare where id = $1', [hund])).rows[0].tur_id).toBe(tur)
  })

  it('läsaren kan inte ändra någon rad, inte ens sin egen eller en hund', async () => {
    for (const id of [agare, redigerare, lasare, hund, platshallare]) await forvantaOrord(B, id)
  })

  it('läsaren kan inte ge sig själv eller någon annan en annan roll', async () => {
    await forvantaSammaRoll(B, lasare, 'editor')
    await forvantaSammaRoll(B, lasare, 'owner')
    await forvantaSammaRoll(B, hund, 'owner')
    await forvantaSammaRoll(B, agare, 'viewer')
  })

  it('den som inte är med i turen kan inte ändra någon rad, och inte heller den som inte är inloggad', async () => {
    for (const id of [agare, redigerare, hund, platshallare]) await forvantaOrord(E, id)
    const fore = await rad(hund)
    await forvantaFel(somAnon((tx) => tx.query(`update public.deltagare set namn = 'Kapad' where id = $1`, [hund])))
    expect(await rad(hund)).toEqual(fore)
  })

  it('ägaren i en annan tur kan inte ändra raderna här', async () => {
    await skapaTur(E, 'Eriks tur')
    for (const id of [agare, hund]) await forvantaOrord(E, id)
  })

  it('namnet i profilen följer fortfarande med till redigerarens och läsarens rader', async () => {
    for (const [vem, id] of [[D, annanRedigerare], [B, lasare]] as const) {
      const fore = (await rad(id)).namn
      await som(vem, (tx) => tx.query(`update public.profiler set namn = 'Nytt namn' where id = '${vem}'`))
      expect((await rad(id)).namn).toBe('Nytt namn')
      await som(vem, (tx) => tx.query('update public.profiler set namn = $1 where id = $2', [fore, vem]))
      expect((await rad(id)).namn).toBe(fore)
    }
  })

  it('en ny medlem kan fortfarande ta över en person utan konto via länken', async () => {
    const kod = await kodFor(tur)
    await som(G, (tx) => tx.query('select public.ga_med($1, $2)', [kod, platshallare]))
    expect(await rad(platshallare)).toMatchObject({ user_id: G, roll: 'editor' })
    // Nu har raden ett konto, så redigeraren når den inte längre.
    await forvantaOrord(C, platshallare)
  })

  it('en läsare som blir redigerare kan ändra hunden, och en redigerare som blir läsare kan det inte längre', async () => {
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [lasare]))
    await som(B, (tx) => tx.query(`update public.deltagare set sortering = 4 where id = $1`, [hund]))
    expect((await rad(hund)).sortering).toBe(4)
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [lasare]))
    await forvantaOrord(B, hund)
  })

  it('en borttagen redigerare kan inte längre ändra hunden', async () => {
    await som(A, (tx) => tx.query('delete from public.deltagare where id = $1', [redigerare]))
    await forvantaOrord(C, hund)
  })
})

describe('inbjudningar', () => {
  let tur: string
  let cillasDeltagare: string

  beforeAll(async () => {
    tur = await skapaTur(A, 'Inbjudningstur')
    const kod = await kodFor(tur)
    await som(C, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const d = await db.query<{ id: string }>(`select id from public.deltagare where tur_id = $1 and user_id = '${C}'`, [tur])
    cillasDeltagare = d.rows[0].id
  })

  const seKod = (vem: string) =>
    som(vem, (tx) => tx.query<{ kod: string }>('select kod from public.inbjudningar where tur_id = $1', [tur])).then((r) => r.rows)

  it('har en lång url-säker slumpkod, olika för varje tur', async () => {
    const r = await db.query<{ kod: string }>('select kod from public.inbjudningar')
    expect(r.rows.length).toBeGreaterThan(1)
    for (const { kod } of r.rows) expect(kod).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(new Set(r.rows.map((x) => x.kod)).size).toBe(r.rows.length)
  })

  it('gamla kolumnen med den korta koden finns inte kvar', async () => {
    const r = await db.query(`select 1 from information_schema.columns where table_name = 'turer' and column_name = 'inbjudningskod'`)
    expect(r.rows).toHaveLength(0)
  })

  it('syns för ägare och redigerare, men inte för läsare eller någon utanför', async () => {
    expect(await seKod(A)).toHaveLength(1)
    expect(await seKod(C)).toHaveLength(1)
    expect(await seKod(B)).toHaveLength(0)
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [cillasDeltagare]))
    expect(await seKod(C)).toHaveLength(0)
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [cillasDeltagare]))
  })

  it('går inte att ändra, lägga till eller ta bort direkt, inte ens för ägaren', async () => {
    const fore = await kodFor(tur)
    await forvantaFel(som(A, (tx) => tx.query(`update public.inbjudningar set kod = 'ENKEL' where tur_id = $1`, [tur])))
    await forvantaFel(som(A, (tx) => tx.query('delete from public.inbjudningar where tur_id = $1', [tur])))
    await forvantaFel(som(B, (tx) => tx.query(`insert into public.inbjudningar (tur_id, kod) values ($1, 'BERTIL')`, [tur])))
    expect(await kodFor(tur)).toBe(fore)
  })

  it('ägaren kan skapa en ny länk, och då slutar den gamla fungera', async () => {
    const gammal = await kodFor(tur)
    const r = await som(A, (tx) => tx.query<{ ny: string }>('select public.ny_inbjudningskod($1) as ny', [tur]))
    const ny = r.rows[0].ny
    expect(ny).not.toBe(gammal)
    expect(ny).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(await kodFor(tur)).toBe(ny)
    const medGammal = await som(B, (tx) => tx.query<{ t: string | null }>('select public.ga_med($1) as t', [gammal]))
    expect(medGammal.rows[0].t).toBeNull()
    const medNy = await som(B, (tx) => tx.query<{ t: string | null }>('select public.ga_med($1) as t', [ny]))
    expect(medNy.rows[0].t).toBe(tur)
  })

  it('redigerare, läsare och andra kan inte skapa en ny länk', async () => {
    const fore = await kodFor(tur)
    await forvantaFel(som(C, (tx) => tx.query('select public.ny_inbjudningskod($1)', [tur])))
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [cillasDeltagare]))
    await forvantaFel(som(C, (tx) => tx.query('select public.ny_inbjudningskod($1)', [tur])))
    await forvantaFel(som(D, (tx) => tx.query('select public.ny_inbjudningskod($1)', [tur])))
    expect(await kodFor(tur)).toBe(fore)
  })

  it('stoppar ett konto efter 10 felaktiga koder i timmen, även om nästa kod är rätt', async () => {
    for (let i = 0; i < 10; i++) {
      const r = await som(D, (tx) => tx.query<{ t: string | null }>('select public.ga_med($1) as t', [`gissning-${i}`]))
      expect(r.rows[0].t).toBeNull()
    }
    const kod = await kodFor(tur)
    await forvantaFel(som(D, (tx) => tx.query('select public.ga_med($1)', [kod])))
    const syns = await som(D, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(syns.rows).toHaveLength(0)
    // Andra konton påverkas inte.
    const annan = await skapaTur(B, 'Bertils andra tur')
    const annanKod = await kodFor(annan)
    const r = await som(C, (tx) => tx.query<{ t: string | null }>('select public.ga_med($1) as t', [annanKod]))
    expect(r.rows[0].t).toBe(annan)
  })

  it('försöken går inte att läsa', async () => {
    await forvantaFel(som(D, (tx) => tx.query('select * from public.inbjudningsforsok')))
  })
})

describe('skaparen av en tur', () => {
  it('kan skapa en tur med eget id utan att läsa tillbaka raden, och ser den sedan som ägare', async () => {
    const id = crypto.randomUUID()
    await som(A, (tx) => tx.query(`insert into public.turer (id, namn) values ($1, 'Ny tur')`, [id]))
    const r = await som(A, (tx) => tx.query<{ namn: string }>('select namn from public.turer where id = $1', [id]))
    expect(r.rows).toEqual([{ namn: 'Ny tur' }])
    const d = await db.query<{ roll: string; user_id: string }>('select roll, user_id from public.deltagare where tur_id = $1', [id])
    expect(d.rows).toEqual([{ roll: 'owner', user_id: A }])
  })

  it('kan inte skapa en tur i någon annans namn', async () => {
    await forvantaFel(
      som(B, (tx) => tx.query(`insert into public.turer (id, namn, skapad_av) values ($1, 'Falsk', '${A}')`, [crypto.randomUUID()])),
    )
  })

  it('ser inte turen längre efter att ha lämnat den', async () => {
    const tur = await skapaTur(A, 'Lämnas över')
    const kod = await kodFor(tur)
    await som(C, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'owner' where tur_id = $1 and user_id = '${C}'`, [tur]))
    await som(A, (tx) => tx.query(`delete from public.deltagare where tur_id = $1 and user_id = '${A}'`, [tur]))

    const ser = await som(A, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(ser.rows).toHaveLength(0)
    const andrad = await som(A, (tx) => tx.query(`update public.turer set namn = 'Ändrad' where id = $1`, [tur]))
    expect(andrad.affectedRows).toBe(0)
    // Den nya ägaren ser turen som förut.
    const cilla = await som(C, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(cilla.rows).toHaveLength(1)
  })

  it('ser inte turen längre efter att ha tagits bort av en annan ägare', async () => {
    const tur = await skapaTur(A, 'Tas bort')
    const kod = await kodFor(tur)
    await som(C, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'owner' where tur_id = $1 and user_id = '${C}'`, [tur]))
    await som(C, (tx) => tx.query(`delete from public.deltagare where tur_id = $1 and user_id = '${A}'`, [tur]))

    const ser = await som(A, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(ser.rows).toHaveLength(0)
    expect(await turnamn(tur)).toBe('Tas bort')
  })
})

describe('vandringsdagar', () => {
  it('är tomt på en ny tur tills någon anger det', async () => {
    const tur = await skapaTur(A, 'Utan dagar')
    const r = await db.query<{ dagar: number | null; reservdagar: number }>('select dagar, reservdagar from public.turer where id = $1', [tur])
    expect(r.rows[0]).toEqual({ dagar: null, reservdagar: 1 })
  })

  it('går att ange, tömma igen och måste vara 1 till 30', async () => {
    const tur = await skapaTur(A, 'Med dagar')
    await som(A, (tx) => tx.query('update public.turer set dagar = 5 where id = $1', [tur]))
    let r = await db.query<{ dagar: number | null }>('select dagar from public.turer where id = $1', [tur])
    expect(r.rows[0].dagar).toBe(5)
    await som(A, (tx) => tx.query('update public.turer set dagar = null where id = $1', [tur]))
    r = await db.query<{ dagar: number | null }>('select dagar from public.turer where id = $1', [tur])
    expect(r.rows[0].dagar).toBeNull()
    await forvantaFel(som(A, (tx) => tx.query('update public.turer set dagar = 0 where id = $1', [tur])))
    await forvantaFel(som(A, (tx) => tx.query('update public.turer set dagar = 31 where id = $1', [tur])))
  })
})

describe('ta över en person utan konto', () => {
  let tur: string
  let kod: string
  let pichi: string
  let hund: string
  let packrad: string

  interface Inbjudan {
    tur_id: string
    namn: string
    redan_med: boolean
    personer: { id: string; namn: string }[]
  }
  const inbjudan = (vem: string, k: string) =>
    som(vem, (tx) => tx.query<{ i: Inbjudan | null }>('select public.inbjudan($1) as i', [k])).then((r) => r.rows[0].i)
  const deltagare = () =>
    db.query<{ id: string; namn: string; user_id: string | null; roll: string }>(
      'select id, namn, user_id, roll from public.deltagare where tur_id = $1 order by sortering, namn',
      [tur],
    )

  beforeAll(async () => {
    tur = await skapaTur(A, 'Tur med platshållare')
    kod = await kodFor(tur)
    const d = await som(A, (tx) =>
      tx.query<{ id: string; typ: string }>(
        `insert into public.deltagare (tur_id, namn, typ, sortering) values ($1, 'Pichi', 'person', 1), ($1, 'Bamse', 'hund', 2) returning id, typ`,
        [tur],
      ),
    )
    pichi = d.rows.find((x) => x.typ === 'person')!.id
    hund = d.rows.find((x) => x.typ === 'hund')!.id
    // Något som redan är kopplat till Pichi: hon bär tältet, har packat det och har en egen maxvikt.
    const p = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn, bars_av) values ($1, 'Tält', $2) returning id`, [tur, pichi]),
    )
    packrad = p.rows[0].id
    await som(A, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id, packad) values ($1, $2, $3, true)', [packrad, pichi, tur]))
    await som(A, (tx) => tx.query('update public.deltagare set max_barvikt_kg = 14.5 where id = $1', [pichi]))
  })

  it('visar turens namn och personerna utan konto för den som har länken, inte hundar eller de med konto', async () => {
    const i = await inbjudan(E, kod)
    expect(i).toEqual({ tur_id: tur, namn: 'Tur med platshållare', redan_med: false, personer: [{ id: pichi, namn: 'Pichi' }] })
  })

  it('visar ingenting utan rätt kod eller utan inloggning', async () => {
    expect(await inbjudan(E, 'fel-kod')).toBeNull()
    await forvantaFel(somAnon((tx) => tx.query('select public.inbjudan($1)', [kod])))
  })

  it('säger om man redan är med', async () => {
    expect((await inbjudan(A, kod))?.redan_med).toBe(true)
  })

  it('går inte att ta över en hund, någon med konto eller en deltagare i en annan tur', async () => {
    const annan = await skapaTur(B, 'Annan tur')
    const annanPerson = await som(B, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Okänd', 'person') returning id`, [annan]),
    )
    const annas = (await deltagare()).rows.find((d) => d.user_id === A)!.id
    for (const mal of [hund, annas, annanPerson.rows[0].id]) {
      await forvantaFel(som(E, (tx) => tx.query('select public.ga_med($1, $2)', [kod, mal])))
    }
    expect((await deltagare()).rows.some((d) => d.user_id === E)).toBe(false)
  })

  it('går inte att ta över någon med fel kod', async () => {
    const r = await som(E, (tx) => tx.query<{ t: string | null }>('select public.ga_med($1, $2) as t', ['fel-kod-igen', pichi]))
    expect(r.rows[0].t).toBeNull()
    expect((await deltagare()).rows.find((d) => d.id === pichi)!.user_id).toBeNull()
  })

  it('den som redan är med kan inte ta över en person, varken via ga_med eller direkt', async () => {
    await som(A, (tx) => tx.query('select public.ga_med($1, $2)', [kod, pichi]))
    expect((await deltagare()).rows.find((d) => d.id === pichi)!.user_id).toBeNull()
    await forvantaFel(som(A, (tx) => tx.query(`update public.deltagare set user_id = '${A}' where id = $1`, [pichi])))
  })

  it('ingen kan koppla en person utan konto till någon annan än sig själv', async () => {
    await forvantaFel(som(A, (tx) => tx.query(`update public.deltagare set user_id = '${F}' where id = $1`, [pichi])))
    // Den som inte är med i turen når inte raden alls.
    const utanfor = await som(F, (tx) => tx.query(`update public.deltagare set user_id = '${F}' where id = $1`, [pichi]))
    expect(utanfor.affectedRows).toBe(0)
    expect((await deltagare()).rows.find((d) => d.id === pichi)!.user_id).toBeNull()
  })

  it('den som går med tar över personen: ingen dubblett, profilnamnet visas och det som var kopplat följer med', async () => {
    const fore = (await deltagare()).rows.length
    const r = await som(E, (tx) => tx.query<{ t: string }>('select public.ga_med($1, $2) as t', [kod, pichi]))
    expect(r.rows[0].t).toBe(tur)

    const efter = (await deltagare()).rows
    expect(efter).toHaveLength(fore)
    expect(efter.find((d) => d.id === pichi)).toEqual({ id: pichi, namn: 'erik', user_id: E, roll: 'editor' })

    const rad = await db.query<{ bars_av: string }>('select bars_av from public.packrader where id = $1', [packrad])
    expect(rad.rows[0].bars_av).toBe(pichi)
    const status = await db.query<{ packad: boolean }>('select packad from public.packstatus where packrad_id = $1 and deltagare_id = $2', [packrad, pichi])
    expect(status.rows[0].packad).toBe(true)
    const vikt = await db.query<{ max_barvikt_kg: string }>('select max_barvikt_kg from public.deltagare where id = $1', [pichi])
    expect(Number(vikt.rows[0].max_barvikt_kg)).toBe(14.5)

    // Erik är nu med: han ser turen och finns inte längre bland personerna utan konto.
    const ser = await som(E, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(ser.rows).toHaveLength(1)
    expect(await inbjudan(E, kod)).toMatchObject({ redan_med: true, personer: [] })
  })

  it('en tagen person går inte att ta över igen', async () => {
    await forvantaFel(som(F, (tx) => tx.query('select public.ga_med($1, $2)', [kod, pichi])))
  })

  it('"Ingen av dem" ger en ny deltagare som förut', async () => {
    const fore = (await deltagare()).rows.length
    const r = await som(F, (tx) => tx.query<{ t: string }>('select public.ga_med($1) as t', [kod]))
    expect(r.rows[0].t).toBe(tur)
    const efter = (await deltagare()).rows
    expect(efter).toHaveLength(fore + 1)
    expect(efter.find((d) => d.user_id === F)).toMatchObject({ namn: 'frida', roll: 'editor' })
  })

  it('en person utan konto som är ägare visas inte och går inte att ta över', async () => {
    const t = await skapaTur(A, 'Tur med ägare utan konto')
    const k = await kodFor(t)
    const r = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Platsägare', 'person') returning id`, [t]),
    )
    const platsagare = r.rows[0].id
    await som(A, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [platsagare]))

    expect((await inbjudan(G, k))?.personer).toEqual([])
    await forvantaFel(som(G, (tx) => tx.query('select public.ga_med($1, $2)', [k, platsagare])))
    const rad = await db.query<{ user_id: string | null; roll: string }>('select user_id, roll from public.deltagare where id = $1', [platsagare])
    expect(rad.rows[0]).toEqual({ user_id: null, roll: 'owner' })
    const gsRad = await db.query('select 1 from public.deltagare where tur_id = $1 and user_id = $2', [t, G])
    expect(gsRad.rows).toHaveLength(0)
  })

  it('felaktiga koder i inbjudan räknas mot samma gräns som i ga_med', async () => {
    const annan = await skapaTur(A, 'Gränsen')
    const riktig = await kodFor(annan)
    for (let i = 0; i < 10; i++) expect(await inbjudan(F, `gissning-${i}`)).toBeNull()
    await forvantaFel(som(F, (tx) => tx.query('select public.inbjudan($1)', [riktig])))
    await forvantaFel(som(F, (tx) => tx.query('select public.ga_med($1)', [riktig])))
  })
})

describe('produktkatalogen', () => {
  let produkt: string

  beforeAll(async () => {
    // Katalogen fylls via migreringar, som körs som databasens ägare.
    const r = await db.query<{ id: string }>(
      `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, granskad, egenskaper)
       values ('Testmärke', 'Testtält 2', 'talt', 'talt', 2400, 'https://exempel.se/testtalt-2', '2026-11-19', '{"personer": 2}')
       returning id`,
    )
    produkt = r.rows[0].id
  })

  it('inloggade kan läsa katalogen', async () => {
    const r = await som(A, (tx) => tx.query<{ modell: string }>('select modell from public.produkter where id = $1', [produkt]))
    expect(r.rows).toEqual([{ modell: 'Testtält 2' }])
  })

  it('ingen användare kan lägga till, ändra eller ta bort produkter', async () => {
    await forvantaFel(
      som(A, (tx) =>
        tx.query(
          `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, granskad)
           values ('Eget', 'Påhitt', 'talt', 'talt', 1, 'https://exempel.se', '2026-11-19')`,
        ),
      ),
    )
    await forvantaFel(som(A, (tx) => tx.query('update public.produkter set packvikt_g = 1 where id = $1', [produkt])))
    await forvantaFel(som(A, (tx) => tx.query('delete from public.produkter where id = $1', [produkt])))
    const r = await db.query<{ packvikt_g: number }>('select packvikt_g from public.produkter where id = $1', [produkt])
    expect(r.rows).toEqual([{ packvikt_g: 2400 }])
  })

  it('går inte att läsa eller skriva utan inloggning', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.produkter')))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.produkter')))
  })

  it('samma märke, modell och version går inte att lägga in två gånger', async () => {
    await forvantaFel(
      db.query(
        `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, granskad)
         values ('TESTMÄRKE', 'testtält 2', 'talt', 'talt', 2500, 'https://exempel.se/igen', '2026-11-19')`,
      ),
    )
  })

  it('kräver en vikt, en källa och egenskaper som ett objekt', async () => {
    const lagg = (kolumner: string, varden: string) =>
      db.query(
        `insert into public.produkter (marke, modell, granskad, kategori, underkategori, ${kolumner})
         values ('M', '${crypto.randomUUID()}', '2026-11-19', 'talt', 'talt', ${varden})`,
      )
    await lagg('packvikt_g, kalla', `100, 'https://exempel.se'`)
    await forvantaFel(lagg('packvikt_g, kalla', `0, 'https://exempel.se'`))
    await forvantaFel(lagg('packvikt_g, kalla', `100, 'exempel.se'`))
    await forvantaFel(lagg('packvikt_g', `100`))
    await forvantaFel(lagg('packvikt_g, kalla, egenskaper', `100, 'https://exempel.se', '[1]'`))
  })

  it('kräver både kategori och underkategori, och att de hör ihop', async () => {
    const lagg = (kategori: string | null, underkategori: string | null) =>
      db.query(
        `insert into public.produkter (marke, modell, granskad, packvikt_g, kalla, kategori, underkategori)
         values ('M', $1, '2026-11-19', 100, 'https://exempel.se', $2, $3)`,
        [crypto.randomUUID(), kategori, underkategori],
      )
    await lagg('sova', 'sovsack')
    await forvantaFel(lagg('talt', 'sovsack'))
    await forvantaFel(lagg('talt', null))
    await forvantaFel(lagg(null, 'talt'))
    await forvantaFel(lagg('Tält', 'talt'))
    await forvantaFel(lagg('talt', 'finns-inte'))
  })
})

describe('startutbudet i katalogen', () => {
  const seedfil = () => {
    const mapp = path.join(import.meta.dirname, 'migrations')
    const senaste = fs.readdirSync(mapp).filter((f) => /_katalog_.*\.sql$/.test(f)).sort().at(-1)!
    return fs.readFileSync(path.join(mapp, senaste), 'utf8')
  }
  // Så många produkter som CSV-filerna i supabase/katalog ger.
  const katalograder = (() => {
    const mapp = path.join(import.meta.dirname, 'katalog')
    return fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).flatMap((f) => godkanda(importera(fs.readFileSync(path.join(mapp, f), 'utf8'))))
  })()
  const iKatalogen = katalograder.length
  // De rader en grundare har godkänt efter stickprov.
  const kontrolleradeIKatalogen = katalograder.filter((r) => r.kontrollerad).length
  const antal = async () => (await db.query<{ n: number }>(`select count(*)::int as n from public.produkter where marke <> 'Testmärke' and marke <> 'M'`)).rows[0].n

  it('ligger i katalogen efter migreringarna, och inloggade hittar produkterna', async () => {
    expect(iKatalogen).toBeGreaterThanOrEqual(20)
    expect(await antal()).toBe(iKatalogen)
    const r = await som(A, (tx) =>
      tx.query<{ modell: string; packvikt_g: number; underkategori: string; kontrollerad: string | null; personer: number }>(
        `select modell, packvikt_g, underkategori, kontrollerad, (egenskaper ->> 'personer')::int as personer
         from public.produkter where marke ilike '%hilleberg%' and modell ilike '%akto%'`,
      ),
    )
    expect(r.rows).toEqual([{ modell: 'Akto', packvikt_g: 1700, underkategori: 'talt', kontrollerad: null, personer: 1 }])
  })

  it('inloggade kan läsa även produkter som inte är granskade, men ingen kan skriva eller markera dem som granskade', async () => {
    const ogranskade = await som(A, (tx) => tx.query<{ id: string }>('select id from public.produkter where kontrollerad is null'))
    expect(ogranskade.rows.length).toBeGreaterThanOrEqual(iKatalogen - kontrolleradeIKatalogen)
    const id = ogranskade.rows[0].id
    await forvantaFel(som(A, (tx) => tx.query(`update public.produkter set kontrollerad = '2026-11-20' where id = $1`, [id])))
    await forvantaFel(som(A, (tx) => tx.query('update public.produkter set packvikt_g = 1 where id = $1', [id])))
    await forvantaFel(som(A, (tx) => tx.query('delete from public.produkter where id = $1', [id])))
    await forvantaFel(somAnon((tx) => tx.query('select id from public.produkter where kontrollerad is null')))
    const kvar = await db.query<{ n: number }>('select count(*)::int as n from public.produkter where kontrollerad is not null and marke <> $1 and marke <> $2', ['Testmärke', 'M'])
    // Bara det grundarna har godkänt är kontrollerat, inget annat.
    expect(kvar.rows[0].n).toBe(kontrolleradeIKatalogen)
  })

  it('en produkt får sakna kontrollerad, och den går att sätta senare när den är granskad', async () => {
    const r = await db.query<{ n: number }>('select count(*)::int as n from public.produkter where kontrollerad is null')
    expect(r.rows[0].n).toBeGreaterThan(0)
    await db.query(`update public.produkter set granskad = '2026-11-19', kontrollerad = '2026-11-20' where modell = 'Soulo'`)
    await db.query(`update public.produkter set granskad = null, kontrollerad = null where modell = 'Soulo'`)
  })

  it('ingen användare kan ändra granskad, kontrollerad eller kalla_typ, men alla inloggade kan läsa dem', async () => {
    const id = (await db.query<{ id: string }>(`select id from public.produkter where modell = 'Soulo'`)).rows[0].id
    for (const sats of [`granskad = '2026-11-20'`, `kontrollerad = '2026-11-20'`, `kalla_typ = 'butik'`, `granskad = '2026-11-20', kontrollerad = '2026-11-21'`]) {
      await forvantaFel(som(A, (tx) => tx.query(`update public.produkter set ${sats} where id = $1`, [id])))
    }
    await forvantaFel(somAnon((tx) => tx.query(`update public.produkter set granskad = '2026-11-20' where id = $1`, [id])))
    const r = await som(A, (tx) => tx.query<{ granskad: string | null; kontrollerad: string | null; kalla_typ: string }>('select granskad, kontrollerad, kalla_typ from public.produkter where id = $1', [id]))
    expect(r.rows).toEqual([{ granskad: null, kontrollerad: null, kalla_typ: 'tillverkare' }])
  })

  it('varken inloggade eller anon har skrivrättigheter på produkter, och anon kan inte läsa dem', async () => {
    // Prövar rättigheterna direkt, så att testet inte bara lutar sig mot att en check eller ett villkor råkar neka.
    const rattighet = async (roll: string, vad: string) =>
      (await db.query<{ r: boolean }>(`select has_table_privilege($1, 'public.produkter', $2) as r`, [roll, vad])).rows[0].r
    for (const vad of ['insert', 'update', 'delete', 'truncate']) {
      expect(await rattighet('authenticated', vad)).toBe(false)
      expect(await rattighet('anon', vad)).toBe(false)
    }
    expect(await rattighet('authenticated', 'select')).toBe(true)
    expect(await rattighet('anon', 'select')).toBe(false)
  })

  it('kalla_typ är tillverkare som standard, och bara tillverkare och butik går an', async () => {
    const lagg = (kalla_typ: string | null) =>
      db.query(
        `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla${kalla_typ === null ? '' : ', kalla_typ'})
         values ('M', $1, 'talt', 'talt', 100, 'https://exempel.se'${kalla_typ === null ? '' : ', $2'}) returning kalla_typ`,
        kalla_typ === null ? [crypto.randomUUID()] : [crypto.randomUUID(), kalla_typ],
      )
    expect((await lagg(null)).rows).toEqual([{ kalla_typ: 'tillverkare' }])
    expect((await lagg('butik')).rows).toEqual([{ kalla_typ: 'butik' }])
    await forvantaFel(lagg('internet'))
    await forvantaFel(lagg(''))
  })

  it('kontrollerad kräver granskad, och en butiksrad kan varken vara granskad eller kontrollerad', async () => {
    const satt = (sats: string) => db.query(`update public.produkter set ${sats} where modell = 'Soulo'`)
    await forvantaFel(satt(`kontrollerad = '2026-11-20'`))
    await satt(`granskad = '2026-11-19'`)
    await satt(`kontrollerad = '2026-11-20'`)
    // En granskad rad kan inte bli butiksrad, och granskningen kan inte tas bort så länge raden är kontrollerad.
    await forvantaFel(satt(`kalla_typ = 'butik'`))
    await forvantaFel(satt('granskad = null'))
    await satt('granskad = null, kontrollerad = null')
    await satt(`kalla_typ = 'butik'`)
    await forvantaFel(satt(`granskad = '2026-11-19'`))
    await forvantaFel(satt(`granskad = '2026-11-19', kontrollerad = '2026-11-20'`))
    await forvantaFel(satt(`kontrollerad = '2026-11-20'`))
    await satt(`kalla_typ = 'tillverkare'`)
  })

  it('butiksraderna i CSV:erna är butik i databasen och har ingen nivå', async () => {
    const mapp = path.join(import.meta.dirname, 'katalog')
    const csvButik = fs
      .readdirSync(mapp)
      .filter((f) => f.endsWith('.csv'))
      .flatMap((f) => godkanda(importera(fs.readFileSync(path.join(mapp, f), 'utf8'))))
      .filter((p) => p.kalla_typ === 'butik').length
    expect(csvButik).toBeGreaterThan(0)
    const r = await db.query<{ n: number }>(`select count(*)::int as n from public.produkter where kalla_typ = 'butik' and granskad is null and kontrollerad is null and marke <> 'Testmärke' and marke <> 'M'`)
    expect(r.rows[0].n).toBe(csvButik)
  })

  it('går att köra igen utan dubbletter, och uppdaterar då produkterna som finns', async () => {
    await db.query(`update public.produkter set packvikt_g = 1 where modell = 'Akto'`)
    await db.exec(seedfil())
    expect(await antal()).toBe(iKatalogen)
    const r = await db.query<{ packvikt_g: number }>(`select packvikt_g from public.produkter where modell = 'Akto'`)
    expect(r.rows).toEqual([{ packvikt_g: 1700 }])
  })

  it('en sak som valts ur katalogen följer med märkningen, men bara för ägaren', async () => {
    const p = await db.query<{ id: string }>(`select id from public.produkter where modell = 'Enan'`)
    await som(C, (tx) =>
      tx.query(`insert into public.forradssaker (produkt_id, namn, kategori, underkategori, vikt_g) values ($1, 'Hilleberg Enan', 'talt', 'talt', 1200)`, [
        p.rows[0].id,
      ]),
    )
    const egen = await som(C, (tx) =>
      tx.query<{ namn: string; kontrollerad: string | null }>(
        'select s.namn, p.kontrollerad from public.forradssaker s join public.produkter p on p.id = s.produkt_id',
      ),
    )
    expect(egen.rows).toEqual([{ namn: 'Hilleberg Enan', kontrollerad: null }])
    const annan = await som(B, (tx) => tx.query('select s.id from public.forradssaker s join public.produkter p on p.id = s.produkt_id'))
    expect(annan.rows).toHaveLength(0)
    await som(C, (tx) => tx.query('delete from public.forradssaker'))
  })
})

describe('kategorierna i databasen', () => {
  it('är samma som i src/lib/forrad.ts, med varje underkategori under rätt huvudkategori', async () => {
    const k = await db.query<{ nyckel: string }>('select nyckel from public.kategorier')
    expect(k.rows.map((r) => r.nyckel).sort()).toEqual(KATEGORIER.map((x) => x.nyckel).sort())
    const u = await db.query<{ par: string }>(`select kategori || '/' || nyckel as par from public.underkategorier`)
    expect(u.rows.map((r) => r.par).sort()).toEqual(KATEGORIER.flatMap((x) => x.under.map((y) => `${x.nyckel}/${y.nyckel}`)).sort())
  })

  it('en underkategori kan inte läggas under en andra huvudkategori', async () => {
    await forvantaFel(db.query(`insert into public.underkategorier (kategori, nyckel) values ('sova', 'tarp')`))
  })

  it('går inte att läsa eller ändra via API:t, varken inloggad eller utan inloggning', async () => {
    for (const tabell of ['kategorier', 'underkategorier']) {
      await forvantaFel(som(A, (tx) => tx.query(`select nyckel from public.${tabell}`)))
      await forvantaFel(som(A, (tx) => tx.query(`delete from public.${tabell}`)))
      await forvantaFel(somAnon((tx) => tx.query(`select nyckel from public.${tabell}`)))
    }
    await forvantaFel(som(A, (tx) => tx.query(`insert into public.kategorier (nyckel) values ('egen')`)))
  })
})

describe('Mitt förråd', () => {
  // En egen användare som kan tas bort utan att röra de andra testerna.
  const H = '00000000-0000-0000-0000-000000000011'
  let tur: string
  let annasSak: string

  const annasRad = () => db.query<{ namn: string; user_id: string }>('select namn, user_id from public.forradssaker where id = $1', [annasSak])

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values ('${H}', 'hanna@exempel.se')`)
    // Anna och Bertil delar en tur. Det ska inte ge Bertil någon åtkomst till Annas förråd.
    tur = await skapaTur(A, 'Tur med förråd')
    const kod = await kodFor(tur)
    await som(B, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const r = await som(A, (tx) =>
      tx.query<{ id: string }>(`insert into public.forradssaker (namn, kategori, underkategori, vikt_g) values ('Annas tält', 'talt', 'talt', 2400) returning id`),
    )
    annasSak = r.rows[0].id
  })

  it('saken blir ens egen utan att user_id anges, och man ser den själv', async () => {
    expect((await annasRad()).rows).toEqual([{ namn: 'Annas tält', user_id: A }])
    const r = await som(A, (tx) => tx.query<{ id: string }>('select id from public.forradssaker'))
    expect(r.rows.map((x) => x.id)).toContain(annasSak)
  })

  it('ägaren kan ändra och ta bort sina saker', async () => {
    const r = await som(A, (tx) => tx.query<{ id: string }>(`insert into public.forradssaker (namn, kategori) values ('Tillfällig', 'ovrigt') returning id`))
    const id = r.rows[0].id
    const andrad = await som(A, (tx) => tx.query('update public.forradssaker set antal = 2, vikt_g = 150 where id = $1', [id]))
    expect(andrad.affectedRows).toBe(1)
    const borta = await som(A, (tx) => tx.query('delete from public.forradssaker where id = $1', [id]))
    expect(borta.affectedRows).toBe(1)
  })

  it('någon annan ser inte sakerna, inte ens i samma tur', async () => {
    const delar = await som(B, (tx) => tx.query('select id from public.turer where id = $1', [tur]))
    expect(delar.rows).toHaveLength(1)
    for (const vem of [B, C]) {
      const r = await som(vem, (tx) => tx.query('select id from public.forradssaker'))
      expect(r.rows).toHaveLength(0)
    }
  })

  it('någon annan kan inte ändra eller ta bort sakerna', async () => {
    const andrad = await som(B, (tx) => tx.query(`update public.forradssaker set namn = 'Bertils nu' where id = $1`, [annasSak]))
    expect(andrad.affectedRows).toBe(0)
    const borta = await som(B, (tx) => tx.query('delete from public.forradssaker where id = $1', [annasSak]))
    expect(borta.affectedRows).toBe(0)
    expect((await annasRad()).rows).toEqual([{ namn: 'Annas tält', user_id: A }])
  })

  it('ägaren sätter sin storlek på en sak, som har en längdgräns, och ingen annan ser eller ändrar den', async () => {
    expect((await som(A, (tx) => tx.query(`update public.forradssaker set storlek = 'L' where id = $1`, [annasSak]))).affectedRows).toBe(1)
    expect((await som(B, (tx) => tx.query(`update public.forradssaker set storlek = 'S' where id = $1`, [annasSak]))).affectedRows).toBe(0)
    expect((await som(B, (tx) => tx.query('select storlek from public.forradssaker where id = $1', [annasSak]))).rows).toEqual([])
    await forvantaFel(som(A, (tx) => tx.query(`update public.forradssaker set storlek = '1234567890123' where id = $1`, [annasSak])))
    await forvantaFel(som(A, (tx) => tx.query(`update public.forradssaker set storlek = '  ' where id = $1`, [annasSak])))
    const r = await db.query<{ storlek: string }>('select storlek from public.forradssaker where id = $1', [annasSak])
    expect(r.rows[0].storlek).toBe('L')
  })

  it('man kan inte lägga en sak i någon annans förråd eller ge bort sin egen', async () => {
    await forvantaFel(som(B, (tx) => tx.query(`insert into public.forradssaker (namn, kategori, user_id) values ('Smugglad', 'ovrigt', '${A}')`)))
    await forvantaFel(som(A, (tx) => tx.query(`update public.forradssaker set user_id = '${B}' where id = $1`, [annasSak])))
    expect((await annasRad()).rows[0].user_id).toBe(A)
  })

  it('går inte att nå utan inloggning', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.forradssaker')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.forradssaker (namn, kategori, user_id) values ('Anonym', 'ovrigt', '${A}')`)))
  })

  it('tar emot alla kategorier och underkategorier i src/lib/forrad.ts, med eller utan underkategori', async () => {
    const par = KATEGORIER.flatMap((k) => k.under.map((u) => [k.nyckel, u.nyckel] as const))
    await som(H, async (tx) => {
      for (const k of KATEGORIER) await tx.query('insert into public.forradssaker (namn, kategori) values ($1, $2)', [k.etikett, k.nyckel])
      for (const [k, u] of par) await tx.query('insert into public.forradssaker (namn, kategori, underkategori) values ($1, $2, $3)', [u, k, u])
    })
    const r = await som(H, (tx) => tx.query('select id from public.forradssaker'))
    expect(r.rows).toHaveLength(KATEGORIER.length + par.length)
  })

  it('kräver en känd kategori, och en underkategori som hör till den', async () => {
    const lagg = (kolumner: string, varden: string) =>
      som(A, (tx) => tx.query(`insert into public.forradssaker (namn, ${kolumner}) values ('Fel', ${varden})`))
    await forvantaFel(som(A, (tx) => tx.query(`insert into public.forradssaker (namn) values ('Utan kategori')`)))
    await forvantaFel(lagg('kategori', `'Tält'`))
    await forvantaFel(lagg('kategori, underkategori', `'talt', 'sovsack'`))
    await forvantaFel(lagg('kategori, underkategori', `'talt', 'finns-inte'`))
    // Det går inte heller att flytta en sak till en kategori som underkategorin inte hör till.
    await forvantaFel(som(A, (tx) => tx.query(`update public.forradssaker set kategori = 'sova' where id = $1`, [annasSak])))
    const flyttad = await som(A, (tx) =>
      tx.query(`update public.forradssaker set kategori = 'sova', underkategori = 'sovsack' where id = $1`, [annasSak]),
    )
    expect(flyttad.affectedRows).toBe(1)
    await som(A, (tx) => tx.query(`update public.forradssaker set kategori = 'talt', underkategori = 'talt' where id = $1`, [annasSak]))
  })

  it('kräver ett namn, minst en i antal, en vikt som inte är negativ och en känd typ', async () => {
    const lagg = (kolumner: string, varden: string) =>
      som(A, (tx) => tx.query(`insert into public.forradssaker (kategori, ${kolumner}) values ('ovrigt', ${varden})`))
    await forvantaFel(lagg('namn', `'  '`))
    await forvantaFel(lagg('namn, antal', `'Noll', 0`))
    await forvantaFel(lagg('namn, vikt_g', `'Minus', -1`))
    await forvantaFel(lagg('namn, typ', `'Fel typ', 'slapas'`))
  })

  it('en sak från katalogen finns kvar när produkten tas bort', async () => {
    const p = await db.query<{ id: string }>(
      `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, granskad)
       values ('Testmärke', 'Utgående sovsäck', 'sova', 'sovsack', 900, 'https://exempel.se/sovsack', '2026-11-19') returning id`,
    )
    const s = await som(A, (tx) =>
      tx.query<{ id: string }>(
        `insert into public.forradssaker (produkt_id, namn, kategori, vikt_g) values ($1, 'Testmärke Utgående sovsäck', 'sova', 900) returning id`,
        [p.rows[0].id],
      ),
    )
    await db.query('delete from public.produkter where id = $1', [p.rows[0].id])
    const r = await db.query<{ produkt_id: string | null; vikt_g: number }>('select produkt_id, vikt_g from public.forradssaker where id = $1', [s.rows[0].id])
    expect(r.rows).toEqual([{ produkt_id: null, vikt_g: 900 }])
  })

  it('förrådet försvinner när kontot tas bort', async () => {
    await db.query('delete from auth.users where id = $1', [H])
    const r = await db.query('select 1 from public.forradssaker where user_id = $1', [H])
    expect(r.rows).toHaveLength(0)
  })
})

describe('köket i förrådet', () => {
  const ny = (vem: string, namn: string, underkategori: string, kok: string | null = null) =>
    som(vem, (tx) =>
      tx.query<{ id: string }>(`insert into public.forradssaker (namn, kategori, underkategori, kok_id) values ($1, 'kok', $2, $3) returning id`, [
        namn,
        underkategori,
        kok,
      ]),
    ).then((r) => r.rows[0].id)
  const kokFor = (id: string) => db.query<{ kok_id: string | null }>('select kok_id from public.forradssaker where id = $1', [id]).then((r) => r.rows[0]?.kok_id)

  it('kokkärl och bränsle kopplas till ens egen brännare', async () => {
    const brannare = await ny(A, 'Annas brännare', 'brannare')
    const kastrull = await ny(A, 'Annas kastrull', 'kastrull', brannare)
    const gas = await ny(A, 'Annas gas', 'bransle')
    await som(A, (tx) => tx.query('update public.forradssaker set kok_id = $1 where id = $2', [brannare, gas]))
    expect(await kokFor(kastrull)).toBe(brannare)
    expect(await kokFor(gas)).toBe(brannare)
    await som(A, (tx) => tx.query('update public.forradssaker set kok_id = null where id = $1', [gas]))
    expect(await kokFor(gas)).toBeNull()
  })

  it('går också att bygga kring ett komplett kök', async () => {
    const kok = await ny(A, 'Annas stormkök', 'komplett_kok')
    const gas = await ny(A, 'Gas till stormköket', 'bransle', kok)
    expect(await kokFor(gas)).toBe(kok)
  })

  it('ingen kan koppla sin sak till någon annans brännare', async () => {
    const annas = await ny(A, 'Annas andra brännare', 'brannare')
    await expect(ny(B, 'Bertils kastrull', 'kastrull', annas)).rejects.toThrow()
    const bertils = await ny(B, 'Bertils kastrull', 'kastrull')
    await forvantaFel(som(B, (tx) => tx.query('update public.forradssaker set kok_id = $1 where id = $2', [annas, bertils])))
    expect(await kokFor(bertils)).toBeNull()
  })

  it('bara kokkärl och bränsle är delar, och bara brännare och kompletta kök har delar', async () => {
    const brannare = await ny(A, 'Brännare för fel delar', 'brannare')
    const talt = som(A, (tx) => tx.query(`insert into public.forradssaker (namn, kategori, underkategori, kok_id) values ('Tält', 'talt', 'talt', $1)`, [brannare]))
    await expect(talt).rejects.toThrow(/Bara kokkärl och bränsle/)
    await expect(ny(A, 'Kåsa i köket', 'kasa', brannare)).rejects.toThrow(/Bara kokkärl och bränsle/)
    const kastrull = await ny(A, 'Kastrull utan kök', 'kastrull')
    await expect(ny(A, 'Gas till kastrullen', 'bransle', kastrull)).rejects.toThrow(/brännare eller ett komplett kök/)
  })

  it('en sak kan inte vara sitt eget kök, inte ens förbi triggern', async () => {
    const gas = await ny(A, 'Ensam gas', 'bransle')
    await forvantaFel(som(A, (tx) => tx.query('update public.forradssaker set kok_id = id where id = $1', [gas])))
    // Triggrarna stängs av, så att det är checken som prövas.
    const id = crypto.randomUUID()
    await db.query(`set session_replication_role = replica`)
    try {
      await expect(
        db.query(`insert into public.forradssaker (id, user_id, namn, kategori, kok_id) values ($1, $2, 'Själv', 'ovrigt', $1)`, [id, A]),
      ).rejects.toThrow(/forradssaker_kok_inte_sig_sjalv/)
    } finally {
      await db.query(`set session_replication_role = origin`)
    }
  })

  it('en brännare med delar kan bli ett komplett kök, men inte något annat', async () => {
    const brannare = await ny(A, 'Brännare med delar', 'brannare')
    await ny(A, 'Delen', 'kastrull', brannare)
    await expect(som(A, (tx) => tx.query(`update public.forradssaker set underkategori = 'kastrull' where id = $1`, [brannare]))).rejects.toThrow(/Ta bort delarna/)
    await som(A, (tx) => tx.query(`update public.forradssaker set underkategori = 'komplett_kok' where id = $1`, [brannare]))
  })

  it('en del i ett kök kan inte byta till en annan sorts sak', async () => {
    const brannare = await ny(A, 'Brännare med kastrull', 'brannare')
    const kastrull = await ny(A, 'Kastrull i köket', 'kastrull', brannare)
    for (const u of ['kasa', 'brannare'])
      await expect(som(A, (tx) => tx.query('update public.forradssaker set underkategori = $2 where id = $1', [kastrull, u]))).rejects.toThrow(/Bara kokkärl och bränsle/)
    await expect(som(A, (tx) => tx.query('update public.forradssaker set underkategori = null where id = $1', [kastrull]))).rejects.toThrow(/Bara kokkärl och bränsle/)
  })

  it('samma fel för någon annans brännare som för en som inte finns', async () => {
    const annas = await ny(A, 'Annas tredje brännare', 'brannare')
    await expect(ny(B, 'K1', 'kastrull', annas)).rejects.toThrow(/brännare eller ett komplett kök/)
    await expect(ny(B, 'K2', 'kastrull', crypto.randomUUID())).rejects.toThrow(/brännare eller ett komplett kök/)
  })

  it('nyckeln stoppar en koppling mellan två ägare även förbi RLS', async () => {
    const annas = await ny(A, 'Annas fjärde brännare', 'brannare')
    await expect(
      db.query(`insert into public.forradssaker (user_id, namn, kategori, underkategori, kok_id) values ($1, 'Smuggel', 'kok', 'kastrull', $2)`, [B, annas]),
    ).rejects.toThrow(/forradssaker_kok_samma_agare/)
  })

  it('ett konto med kök och delar går att ta bort', async () => {
    const K = '00000000-0000-0000-0000-0000000000c1'
    await db.query(`insert into auth.users (id, email) values ('${K}', 'kok@exempel.se')`)
    const brannare = await ny(K, 'Brännare', 'brannare')
    await ny(K, 'Kastrull', 'kastrull', brannare)
    await ny(K, 'Gas', 'bransle', brannare)
    await db.query('delete from auth.users where id = $1', [K])
    expect((await db.query('select 1 from public.forradssaker where user_id = $1', [K])).rows).toHaveLength(0)
  })

  it('delarna finns kvar utan koppling när brännaren tas bort', async () => {
    const brannare = await ny(A, 'Brännare som tas bort', 'brannare')
    const kastrull = await ny(A, 'Kastrull som blir kvar', 'kastrull', brannare)
    await som(A, (tx) => tx.query('delete from public.forradssaker where id = $1', [brannare]))
    expect(await kokFor(kastrull)).toBeNull()
  })
})

describe('profilbilder', () => {
  // Egna användare, så att turerna i de andra testerna inte påverkar vem som delar tur med vem.
  const P = '00000000-0000-0000-0000-0000000000a1'
  const Q = '00000000-0000-0000-0000-0000000000a2'
  const R = '00000000-0000-0000-0000-0000000000a3'
  const fil = (anvandare: string) => `${anvandare}/bild`
  let tur: string

  const delar = (jag: string, annan: string) =>
    som(jag, (tx) => tx.query<{ d: boolean }>('select public.delar_tur($1) as d', [annan])).then((r) => r.rows[0].d)
  const ser = (jag: string, vems: string) =>
    som(jag, (tx) => tx.query(`select 1 from storage.objects where bucket_id = 'profilbilder' and name = $1`, [fil(vems)])).then((r) => r.rows.length === 1)
  const laddaUpp = (jag: string, namn: string) =>
    som(jag, (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('profilbilder', $1)`, [namn]))

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email) values ('${P}', 'petra@exempel.se'), ('${Q}', 'quentin@exempel.se'), ('${R}', 'rut@exempel.se');`)
    // Petra och Quentin delar en tur. Rut är inte med i någon av deras turer.
    tur = await skapaTur(P, 'Tur med profilbilder')
    const kod = await kodFor(tur)
    await som(Q, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await skapaTur(R, 'Ruts egen tur')
  })

  describe('delar_tur', () => {
    it('är sant åt båda håll för två som är med i samma tur', async () => {
      expect(await delar(P, Q)).toBe(true)
      expect(await delar(Q, P)).toBe(true)
    })

    it('är falskt för någon man inte delar en tur med, åt båda håll', async () => {
      expect(await delar(P, R)).toBe(false)
      expect(await delar(R, P)).toBe(false)
      expect(await delar(R, Q)).toBe(false)
    })

    it('är falskt för en användare som inte finns', async () => {
      expect(await delar(P, '00000000-0000-0000-0000-0000000000ff')).toBe(false)
    })

    it('räknar inte en person utan konto eller en hund i turen', async () => {
      await som(P, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Platshållare', 'person'), ($1, 'Bamse', 'hund')`, [tur]))
      expect(await delar(R, P)).toBe(false)
    })

    it('går inte att anropa utan inloggning', async () => {
      await forvantaFel(somAnon((tx) => tx.query('select public.delar_tur($1)', [P])))
    })
  })

  describe('lagringen', () => {
    it('bucketen är privat och tar bara emot små bilder i WebP eller JPEG', async () => {
      const r = await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
        `select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'profilbilder'`,
      )
      expect(r.rows).toHaveLength(1)
      expect(r.rows[0].public).toBe(false)
      expect(Number(r.rows[0].file_size_limit)).toBe(512000)
      expect(r.rows[0].allowed_mime_types).toEqual(['image/webp', 'image/jpeg'])
    })

    it('man kan ladda upp sin egen bild, och ser den själv', async () => {
      await laddaUpp(P, fil(P))
      await laddaUpp(Q, fil(Q))
      await laddaUpp(R, fil(R))
      expect(await ser(P, P)).toBe(true)
    })

    it('man kan inte ladda upp i någon annans mapp eller under ett annat filnamn', async () => {
      await forvantaFel(laddaUpp(R, `${P}/bild2`))
      await forvantaFel(laddaUpp(P, `${P}/annan`))
      await forvantaFel(laddaUpp(P, `${P}/bild.webp`))
      await forvantaFel(laddaUpp(P, `${P}/undermapp/bild`))
      await forvantaFel(laddaUpp(P, 'bild'))
      await forvantaFel(som(P, (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('profilbilder', $1) on conflict do nothing`, [fil(R)])))
    })

    it('den man delar en tur med ser bilden, åt båda håll', async () => {
      expect(await ser(Q, P)).toBe(true)
      expect(await ser(P, Q)).toBe(true)
    })

    it('den man inte delar en tur med ser den inte', async () => {
      expect(await ser(R, P)).toBe(false)
      expect(await ser(P, R)).toBe(false)
      const allt = await som(R, (tx) => tx.query<{ name: string }>(`select name from storage.objects where bucket_id = 'profilbilder'`))
      expect(allt.rows.map((x) => x.name)).toEqual([fil(R)])
    })

    it('en turkamrat kan se bilden men inte byta eller ta bort den', async () => {
      const bytt = await som(Q, (tx) => tx.query(`update storage.objects set name = name where bucket_id = 'profilbilder' and name = $1`, [fil(P)]))
      expect(bytt.affectedRows).toBe(0)
      const borta = await som(Q, (tx) => tx.query(`delete from storage.objects where bucket_id = 'profilbilder' and name = $1`, [fil(P)]))
      expect(borta.affectedRows).toBe(0)
      expect(await ser(P, P)).toBe(true)
    })

    it('man kan inte flytta sin bild till någon annans mapp', async () => {
      await forvantaFel(som(Q, (tx) => tx.query(`update storage.objects set name = $2 where bucket_id = 'profilbilder' and name = $1`, [fil(Q), `${P}/bild3`])))
    })

    it('utan inloggning syns ingenting, och inget går att ladda upp', async () => {
      const r = await somAnon((tx) => tx.query(`select name from storage.objects where bucket_id = 'profilbilder'`))
      expect(r.rows).toHaveLength(0)
      await forvantaFel(somAnon((tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('profilbilder', $1)`, [fil(P)])))
    })

    it('en sökväg som inte börjar med ett user_id ger inget fel, den syns bara inte', async () => {
      await db.query(`insert into storage.objects (bucket_id, name) values ('profilbilder', 'skrap/bild')`)
      const r = await som(P, (tx) => tx.query<{ name: string }>(`select name from storage.objects where bucket_id = 'profilbilder' order by name`))
      expect(r.rows.map((x) => x.name)).toEqual([fil(P), fil(Q)].sort())
      await db.query(`delete from storage.objects where name = 'skrap/bild'`)
    })

    it('policyerna gäller bara profilbilder: en fil i en annan bucket släpps inte fram', async () => {
      await db.query(`insert into storage.buckets (id, name) values ('annat', 'annat')`)
      await db.query(`insert into storage.objects (bucket_id, name) values ('annat', $1)`, [fil(P)])
      const r = await som(P, (tx) => tx.query(`select 1 from storage.objects where bucket_id = 'annat'`))
      expect(r.rows).toHaveLength(0)
    })

    it('ägaren kan byta och ta bort sin bild', async () => {
      const bytt = await som(R, (tx) => tx.query(`update storage.objects set name = name where bucket_id = 'profilbilder' and name = $1`, [fil(R)]))
      expect(bytt.affectedRows).toBe(1)
      const borta = await som(R, (tx) => tx.query(`delete from storage.objects where bucket_id = 'profilbilder' and name = $1`, [fil(R)]))
      expect(borta.affectedRows).toBe(1)
    })
  })

  describe('när en deltagare tas bort ur turen', () => {
    it('delar de inte längre tur, och ser inte varandras bilder', async () => {
      await som(P, (tx) => tx.query('delete from public.deltagare where tur_id = $1 and user_id = $2', [tur, Q]))
      expect(await delar(P, Q)).toBe(false)
      expect(await delar(Q, P)).toBe(false)
      expect(await ser(Q, P)).toBe(false)
      expect(await ser(P, Q)).toBe(false)
      // Var och en ser fortfarande sin egen.
      expect(await ser(P, P)).toBe(true)
      expect(await ser(Q, Q)).toBe(true)
    })
  })

  describe('bild_uppdaterad i profilen', () => {
    it('är tom från början, och ägaren kan sätta och tömma den', async () => {
      const fore = await db.query<{ bild_uppdaterad: string | null }>('select bild_uppdaterad from public.profiler where id = $1', [P])
      expect(fore.rows[0].bild_uppdaterad).toBeNull()
      const satt = await som(P, (tx) => tx.query('update public.profiler set bild_uppdaterad = now() where id = $1', [P]))
      expect(satt.affectedRows).toBe(1)
      const tomd = await som(P, (tx) => tx.query('update public.profiler set bild_uppdaterad = null where id = $1', [P]))
      expect(tomd.affectedRows).toBe(1)
    })

    it('ingen annan kan läsa eller ändra den', async () => {
      const last = await som(Q, (tx) => tx.query('select bild_uppdaterad from public.profiler where id = $1', [P]))
      expect(last.rows).toHaveLength(0)
      const andrad = await som(Q, (tx) => tx.query('update public.profiler set bild_uppdaterad = now() where id = $1', [P]))
      expect(andrad.affectedRows).toBe(0)
    })

    it('namnet i turerna är oförändrat när bara bilden ändras', async () => {
      await som(P, (tx) => tx.query('update public.profiler set bild_uppdaterad = now() where id = $1', [P]))
      const r = await db.query<{ namn: string }>('select namn from public.deltagare where tur_id = $1 and user_id = $2', [tur, P])
      expect(r.rows).toEqual([{ namn: 'petra' }])
    })
  })
})

describe('matplanen', () => {
  // Egna användare, så att de andra testerna inte påverkas: ägare, redigerare, läsare och en utomstående.
  const AGARE = '00000000-0000-0000-0000-000000000021'
  const REDIGERARE = '00000000-0000-0000-0000-000000000022'
  const LASARE = '00000000-0000-0000-0000-000000000023'
  const UTOMSTAENDE = '00000000-0000-0000-0000-000000000024'
  const NYKOMLING = '00000000-0000-0000-0000-000000000025'
  const TAR_OVER = '00000000-0000-0000-0000-000000000026'
  let tur: string
  let annanTur: string
  let agarensDeltagare: string
  let redigerarensDeltagare: string
  let lasarensDeltagare: string
  let lisa: string
  let hund: string
  let pase: string

  const deltagareFor = async (t: string, user: string) =>
    (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [t, user])).rows[0].id

  /** Lägger in en påse i katalogen som databasens ägare, som en seed-migrering gör. Värdena i extra är SQL. */
  const nyPase = async (namn: string, extra: Record<string, string> = {}) => {
    const kolumner = ['marke', 'namn', 'maltid', 'vikt_torr_g', 'kcal', 'kalla', ...Object.keys(extra)]
    const varden = [`'Testmat'`, '$1', `'lunch_middag'`, '150', '600', `'https://exempel.se/pase'`, ...Object.values(extra)]
    const r = await db.query<{ id: string }>(
      `insert into public.matprodukter (${kolumner.join(', ')}) values (${varden.join(', ')}) returning id`,
      [namn],
    )
    return r.rows[0].id
  }

  const nyRatt = async (vem: string, t: string, namn: string, matprodukt: string | null = null) => {
    const r = await som(vem, (tx) =>
      tx.query<{ id: string }>('insert into public.ratter (tur_id, namn, matprodukt_id) values ($1, $2, $3) returning id', [t, namn, matprodukt]),
    )
    return r.rows[0].id
  }

  const nyVara = async (vem: string, t: string, namn: string) => {
    const r = await som(vem, (tx) =>
      tx.query<{ id: string }>('insert into public.varor (tur_id, namn, kcal_per_100g, protein_per_100g) values ($1, $2, 380, 12.5) returning id', [t, namn]),
    )
    return r.rows[0].id
  }

  const nyMaltid = (vem: string, t: string, dag: number, maltid: string, ratt: string) =>
    som(vem, (tx) => tx.query('insert into public.maltider (tur_id, dag, maltid, ratt_id) values ($1, $2, $3, $4)', [t, dag, maltid, ratt]))

  const nyIngrediens = (vem: string, t: string, ratt: string, vara: string) =>
    som(vem, (tx) => tx.query('insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values ($1, $2, $3, 90)', [t, ratt, vara]))

  beforeAll(async () => {
    await db.query(
      `insert into auth.users (id, email) values
        ('${AGARE}', 'agare@exempel.se'), ('${REDIGERARE}', 'redigerare@exempel.se'),
        ('${LASARE}', 'lasare@exempel.se'), ('${UTOMSTAENDE}', 'utomstaende@exempel.se'),
        ('${NYKOMLING}', 'nykomling@exempel.se'), ('${TAR_OVER}', 'tar-over@exempel.se')`,
    )
    tur = await skapaTur(AGARE, 'Tur med matplan')
    annanTur = await skapaTur(AGARE, 'Annan tur med mat')
    const kod = await kodFor(tur)
    await som(REDIGERARE, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(LASARE, (tx) => tx.query('select public.ga_med($1)', [kod]))
    agarensDeltagare = await deltagareFor(tur, AGARE)
    redigerarensDeltagare = await deltagareFor(tur, REDIGERARE)
    lasarensDeltagare = await deltagareFor(tur, LASARE)
    await som(AGARE, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [lasarensDeltagare]))
    const l = await som(AGARE, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Lisa') returning id`, [tur]))
    lisa = l.rows[0].id
    const h = await som(AGARE, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Hunden', 'hund') returning id`, [tur]),
    )
    hund = h.rows[0].id
    pase = await nyPase('Testgryta')
  })

  describe('matkatalogen', () => {
    it('inloggade kan läsa den, men ingen användare kan lägga till, ändra eller ta bort', async () => {
      const r = await som(LASARE, (tx) => tx.query<{ namn: string }>('select namn from public.matprodukter where id = $1', [pase]))
      expect(r.rows).toEqual([{ namn: 'Testgryta' }])
      await forvantaFel(
        som(AGARE, (tx) =>
          tx.query(`insert into public.matprodukter (marke, namn, maltid, vikt_torr_g, kcal, kalla) values ('E', 'Egen', 'frukost', 1, 1, 'https://exempel.se')`),
        ),
      )
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.matprodukter set kcal = 1 where id = $1', [pase])))
      await forvantaFel(som(AGARE, (tx) => tx.query('delete from public.matprodukter where id = $1', [pase])))
      const k = await db.query<{ kcal: number }>('select kcal from public.matprodukter where id = $1', [pase])
      expect(k.rows).toEqual([{ kcal: 600 }])
    })

    it('går inte att nå utan inloggning', async () => {
      await forvantaFel(somAnon((tx) => tx.query('select id from public.matprodukter')))
    })

    it('samma märke och namn går inte att lägga in två gånger', async () => {
      await forvantaFel(nyPase('TESTGRYTA'))
    })

    it('priskällan är en adress och kräver ett pris', async () => {
      await nyPase('Pris från butik', { pris_sek_ca: '129', pris_kalla: `'https://butik.exempel.se/gryta'` })
      await nyPase('Pris från tillverkaren', { pris_sek_ca: '119' })
      await forvantaFel(nyPase('Källa utan pris', { pris_kalla: `'https://butik.exempel.se/gryta'` }))
      await forvantaFel(nyPase('Källa som inte är en adress', { pris_sek_ca: '99', pris_kalla: `'butik.exempel.se'` }))
    })

    it('vegansk kräver vegetarisk, och okänt får vara tomt', async () => {
      await nyPase('Vegansk gryta', { vegetarisk: 'true', vegansk: 'true' })
      await nyPase('Okänd gryta', { vegansk: 'null' })
      await forvantaFel(nyPase('Felaktig gryta', { vegetarisk: 'false', vegansk: 'true' }))
    })

    it('allergener och spår tar bara emot de 14 nycklarna, och torkningen bara två värden', async () => {
      await nyPase('Med nötter', { allergener: `array['notter', 'mjolk']`, spar: `array['sesam']` })
      await nyPase('Utan allergener', { allergener: 'array[]::text[]' })
      await forvantaFel(nyPase('Med fel allergen', { allergener: `array['notter', 'paron']` }))
      await forvantaFel(nyPase('Med fel spår', { spar: `array['Gluten']` }))
      await nyPase('Frystorkad', { torkning: `'frystorkad'` })
      await forvantaFel(nyPase('Rökt', { torkning: `'rokt'` }))
    })

    it('seed-SQL:en från importen går att köra, och en ny körning uppdaterar påsen', async () => {
      // Fejkade rader i Astras format. De finns bara här.
      const csv = (kcal: string) =>
        [
          MATKOLUMNER.join(';'),
          `Seedmat;Gryta;"Viltgryta;8021";lunch_middag;frystorkad;150;2;${kcal};24,5;;;450;varmt;8;ja;ja;ja;;inga;sesam;129;https://butik.exempel.se/g;https://seedmat.exempel.se/g;2026-11-24`,
          'Seedmat;Müsli;;frukost;;100;;400;;;;;inget;;;;;;;;;;https://seedmat.exempel.se/m;',
        ].join('\n')
      const korSeed = (kcal: string) => db.exec(matSeedSql(godkandaPasar(importeraMatkatalog(csv(kcal))), ['test.csv']))
      await korSeed('600')
      await korSeed('640')
      const r = await som(LASARE, (tx) =>
        tx.query<{ namn: string; andra_namn: string[]; kcal: number; protein_g: string; allergener: string[] | null; spar: string[]; pris_kalla: string | null; portioner: number }>(
          `select namn, andra_namn, kcal, protein_g, allergener, spar, pris_kalla, portioner from public.matprodukter where marke = 'Seedmat' order by namn`,
        ),
      )
      expect(r.rows).toEqual([
        // Siffror tas bort ur andra namn.
        { namn: 'Gryta', andra_namn: ['Viltgryta'], kcal: 640, protein_g: '24.5', allergener: [], spar: ['sesam'], pris_kalla: 'https://butik.exempel.se/g', portioner: 2 },
        { namn: 'Müsli', andra_namn: [], kcal: 400, protein_g: null, allergener: null, spar: null, pris_kalla: null, portioner: 1 },
      ])
    })

    it('har andra namn från seeden, som inloggade läser, och ingen användare kan ändra dem', async () => {
      const r = await som(UTOMSTAENDE, (tx) => tx.query<{ andra_namn: string[] }>("select andra_namn from public.matprodukter where marke = 'Real Turmat' and namn = 'Reindeer Stew'"))
      expect(r.rows[0].andra_namn[0]).toBe('Viltgryta')
      await forvantaFel(som(AGARE, (tx) => tx.query("update public.matprodukter set andra_namn = '{Eget}' where marke = 'Real Turmat' and namn = 'Reindeer Stew'")))
    })

    it('ingen påse från seed-migreringarna har märket först i namnet, så att det inte står två gånger', async () => {
      const r = await db.query<{ marke: string; namn: string }>(
        `select marke, namn from public.matprodukter where lower(namn) like lower(marke) || ' %' and marke <> 'Testmat' and marke <> 'Seedmat'`,
      )
      expect(r.rows).toEqual([])
    })

    it('allergenerna i databasen är samma som i src/lib/kost.ts', async () => {
      const r = await db.query<{ def: string }>(
        `select pg_get_constraintdef(oid) as def from pg_constraint where contypid = 'public.allergenlista'::regtype`,
      )
      const nycklar = [...r.rows[0].def.matchAll(/'([a-z]+)'/g)].map((m) => m[1])
      expect(nycklar.sort()).toEqual(ALLERGENER.map((a) => a.nyckel).sort())
    })
  })

  describe('livsmedlen', () => {
    // Fejkade rader i CSV:ns format. De finns bara här. Numren är höga så att de inte krockar med seeden.
    const csv = (kcal: string) =>
      [
        LIVSMEDELSKOLUMNER.join(';'),
        `990001;Testpasta okokt;Pasta;torr;${kcal};12;1,7;70,1;3;2,5;0,01;0;2026-06-29`,
        '990002;Testmorot rå;;ra;;;;;;;;;',
      ].join('\n')
    const korSeed = (kcal: string) => db.exec(livsmedelSeedSql(godkandaLivsmedel(importeraLivsmedel(csv(kcal))), 'test.csv'))

    beforeAll(async () => {
      await korSeed('357')
    })

    it('alla inloggade kan läsa dem, också den som inte är med i någon tur', async () => {
      const r = await som(UTOMSTAENDE, (tx) => tx.query<{ namn: string }>('select namn from public.livsmedel where nummer = 990001'))
      expect(r.rows).toEqual([{ namn: 'Testpasta okokt' }])
    })

    it('ingen användare kan lägga till, ändra eller ta bort', async () => {
      await forvantaFel(som(AGARE, (tx) => tx.query(`insert into public.livsmedel (nummer, namn) values (990099, 'Eget')`)))
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.livsmedel set kcal_per_100g = 1 where nummer = 990001')))
      await forvantaFel(som(AGARE, (tx) => tx.query('delete from public.livsmedel where nummer = 990001')))
      const k = await db.query<{ kcal_per_100g: number }>('select kcal_per_100g from public.livsmedel where nummer = 990001')
      expect(k.rows).toEqual([{ kcal_per_100g: 357 }])
    })

    it('går inte att nå utan inloggning', async () => {
      await forvantaFel(somAnon((tx) => tx.query('select nummer from public.livsmedel')))
    })

    it('har allergener för enkla råvaror från seeden, som inloggade läser, och bara EU:s nycklar', async () => {
      const r = await som(UTOMSTAENDE, (tx) =>
        tx.query<{ namn: string; allergener: string[] | null }>(
          "select namn, allergener from public.livsmedel where namn in ('Vetemjöl', 'Linser torkade', 'Lapskojs') order by namn",
        ),
      )
      expect(r.rows).toEqual([
        { namn: 'Lapskojs', allergener: null },
        { namn: 'Linser torkade', allergener: [] },
        { namn: 'Vetemjöl', allergener: ['gluten'] },
      ])
      // Testpastan har gruppen "Pasta", som inte är en enkel grupp, så allergenerna är okända.
      expect((await db.query('select allergener from public.livsmedel where nummer = 990001')).rows).toEqual([{ allergener: null }])
      await forvantaFel(db.query("update public.livsmedel set allergener = array['nagot'] where nummer = 990001"))
    })

    it('har bara select för inloggade och ingenting för anon, och RLS är påslaget', async () => {
      // Prövar rättigheterna direkt, så att testet inte litar på att en check eller ett villkor råkar neka.
      const har = async (roll: string, vad: string) =>
        (await db.query<{ r: boolean }>(`select has_table_privilege($1, 'public.livsmedel', $2) as r`, [roll, vad])).rows[0].r
      for (const vad of ['insert', 'update', 'delete', 'truncate']) {
        expect(await har('authenticated', vad)).toBe(false)
        expect(await har('anon', vad)).toBe(false)
      }
      expect(await har('authenticated', 'select')).toBe(true)
      expect(await har('anon', 'select')).toBe(false)
      const rls = await db.query<{ relrowsecurity: boolean }>(`select relrowsecurity from pg_class where oid = 'public.livsmedel'::regclass`)
      expect(rls.rows).toEqual([{ relrowsecurity: true }])
    })

    it('seeden går att köra igen och uppdaterar livsmedlet, och värden som saknas blir null, inte 0', async () => {
      await korSeed('360')
      const r = await som(LASARE, (tx) =>
        tx.query<{ nummer: number; kcal_per_100g: number | null; protein_per_100g: string | null; salt_per_100g: string | null; vatten_per_100g: string | null; tillstand: string | null }>(
          'select nummer, kcal_per_100g, protein_per_100g, salt_per_100g, vatten_per_100g, tillstand from public.livsmedel where nummer >= 990001 order by nummer',
        ),
      )
      expect(r.rows).toEqual([
        { nummer: 990001, kcal_per_100g: 360, protein_per_100g: '12.0', salt_per_100g: '0.01', vatten_per_100g: '0.0', tillstand: 'torr' },
        { nummer: 990002, kcal_per_100g: null, protein_per_100g: null, salt_per_100g: null, vatten_per_100g: null, tillstand: 'ra' },
      ])
    })

    it('tillståndet tar bara emot torr, ra och tillagad, och värdena har gränser', async () => {
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn, tillstand) values (990010, 'Fel', 'kall')`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn, kcal_per_100g) values (990011, 'Fel', 1200)`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn, protein_per_100g) values (990012, 'Fel', -1)`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn) values (990013, '  ')`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn) values (0, 'Noll')`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn, grupp) values (990014, 'Lång grupp', repeat('a', 201))`))
      await forvantaFel(db.query(`insert into public.livsmedel (nummer, namn, salt_per_100g) values (990015, 'Saltig', 101)`))
    })
  })

  describe('rätter, varor och måltider', () => {
    let ratt: string
    let vara: string

    beforeAll(async () => {
      ratt = await nyRatt(REDIGERARE, tur, 'Gröt')
      vara = await nyVara(REDIGERARE, tur, 'Havregryn')
      await nyIngrediens(REDIGERARE, tur, ratt, vara)
    })

    it('redigeraren kan lägga flera rätter i samma måltid, både egna och påsar', async () => {
      const pasratt = await nyRatt(REDIGERARE, tur, 'Testgryta', pase)
      await nyMaltid(REDIGERARE, tur, 1, 'frukost', ratt)
      await nyMaltid(REDIGERARE, tur, 1, 'frukost', pasratt)
      const r = await som(LASARE, (tx) => tx.query(`select id from public.maltider where tur_id = $1 and dag = 1 and maltid = 'frukost'`, [tur]))
      expect(r.rows).toHaveLength(2)
    })

    it('läsaren ser matplanen men kan inte ändra den', async () => {
      for (const tabell of ['ratter', 'varor', 'ingredienser', 'maltider']) {
        const r = await som(LASARE, (tx) => tx.query(`select 1 from public.${tabell} where tur_id = $1`, [tur]))
        expect(r.rows.length, tabell).toBeGreaterThan(0)
        const borta = await som(LASARE, (tx) => tx.query(`delete from public.${tabell} where tur_id = $1`, [tur]))
        expect(borta.affectedRows, tabell).toBe(0)
      }
      await forvantaFel(nyRatt(LASARE, tur, 'Läsarens rätt'))
      await forvantaFel(nyVara(LASARE, tur, 'Läsarens vara'))
      await forvantaFel(nyMaltid(LASARE, tur, 2, 'lunch', ratt))
      await forvantaFel(nyIngrediens(LASARE, tur, ratt, vara))
      const klart = await som(LASARE, (tx) => tx.query('update public.varor set klart = true where id = $1', [vara]))
      expect(klart.affectedRows).toBe(0)
    })

    it('den som inte är med i turen ser ingenting och kan inte lägga till något', async () => {
      for (const tabell of ['ratter', 'varor', 'ingredienser', 'maltider']) {
        const r = await som(UTOMSTAENDE, (tx) => tx.query(`select 1 from public.${tabell} where tur_id = $1`, [tur]))
        expect(r.rows, tabell).toHaveLength(0)
      }
      await forvantaFel(nyRatt(UTOMSTAENDE, tur, 'Inkräktarens rätt'))
      await forvantaFel(nyVara(UTOMSTAENDE, tur, 'Inkräktarens vara'))
      await forvantaFel(nyMaltid(UTOMSTAENDE, tur, 2, 'lunch', ratt))
      await forvantaFel(nyIngrediens(UTOMSTAENDE, tur, ratt, vara))
    })

    it('en måltid kan inte peka på en rätt i en annan tur', async () => {
      const annanRatt = await nyRatt(AGARE, annanTur, 'Annan gröt')
      await forvantaFel(nyMaltid(AGARE, tur, 1, 'middag', annanRatt))
    })

    it('en ingrediens kan inte peka på en vara eller en rätt i en annan tur', async () => {
      const annanVara = await nyVara(AGARE, annanTur, 'Annat mjöl')
      const annanRatt = await nyRatt(AGARE, annanTur, 'Annan rätt')
      await forvantaFel(nyIngrediens(AGARE, tur, ratt, annanVara))
      await forvantaFel(nyIngrediens(AGARE, annanTur, ratt, annanVara))
      await forvantaFel(nyIngrediens(AGARE, tur, annanRatt, vara))
    })

    it('den ansvariga för en vara eller en påse måste vara med i samma tur', async () => {
      const iAnnanTur = await deltagareFor(annanTur, AGARE)
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.varor set ansvarig = $1 where id = $2', [iAnnanTur, vara])))
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.ratter set ansvarig = $1 where id = $2', [iAnnanTur, ratt])))
      const ok = await som(REDIGERARE, (tx) => tx.query('update public.varor set ansvarig = $1 where id = $2', [redigerarensDeltagare, vara]))
      expect(ok.affectedRows).toBe(1)
    })

    it('samma påse läggs bara in en gång per tur, och kan inte tas bort ur katalogen medan den används', async () => {
      await forvantaFel(nyRatt(AGARE, tur, 'Testgryta igen', pase))
      await forvantaFel(db.query('delete from public.matprodukter where id = $1', [pase]))
    })

    it('när rätten tas bort försvinner den ur måltiderna', async () => {
      const tillfallig = await nyRatt(AGARE, tur, 'Tillfällig')
      await nyMaltid(AGARE, tur, 3, 'middag', tillfallig)
      await som(AGARE, (tx) => tx.query('delete from public.ratter where id = $1', [tillfallig]))
      const r = await db.query('select id from public.maltider where ratt_id = $1', [tillfallig])
      expect(r.rows).toHaveLength(0)
    })

    it('läsaren kan inte bocka av eller välja ansvarig för en påse', async () => {
      const pasratt = (await db.query<{ id: string }>('select id from public.ratter where tur_id = $1 and matprodukt_id is not null', [tur])).rows[0].id
      const r = await som(LASARE, (tx) => tx.query('update public.ratter set klart = true, ansvarig = $1 where id = $2', [lasarensDeltagare, pasratt]))
      expect(r.affectedRows).toBe(0)
    })

    it('när den ansvariga tas bort ur turen blir ansvarig tom och raden ligger kvar i turen', async () => {
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Tillfällig ansvarig') returning id`, [tur]))
      const ansvarig = p.rows[0].id
      const v = await nyVara(AGARE, tur, 'Choklad')
      await som(AGARE, (tx) => tx.query('update public.varor set ansvarig = $1 where id = $2', [ansvarig, v]))
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [ansvarig]))
      const r = await db.query<{ ansvarig: string | null; tur_id: string }>('select ansvarig, tur_id from public.varor where id = $1', [v])
      expect(r.rows).toEqual([{ ansvarig: null, tur_id: tur }])
    })

    describe('ta_bort_egen_ratt', () => {
      it('raderar rätten och varorna som ingen annan rätt använder, men inte delade varor eller varor med egen mängd', async () => {
        const gröt = await nyRatt(REDIGERARE, tur, 'Radera gröt')
        const musli = await nyRatt(REDIGERARE, tur, 'Behåll müsli')
        const [havre, russin, kaffe] = [await nyVara(REDIGERARE, tur, 'Radera havre'), await nyVara(REDIGERARE, tur, 'Delat russin'), await nyVara(REDIGERARE, tur, 'Eget kaffe')]
        await som(REDIGERARE, (tx) => tx.query('update public.varor set extra_g = 100 where id = $1', [kaffe]))
        for (const v of [havre, russin, kaffe]) await nyIngrediens(REDIGERARE, tur, gröt, v)
        await nyIngrediens(REDIGERARE, tur, musli, russin)
        await nyMaltid(REDIGERARE, tur, 2, 'frukost', gröt)
        await som(REDIGERARE, (tx) => tx.query('select public.ta_bort_egen_ratt($1)', [gröt]))
        const kvar = await db.query<{ id: string }>('select id from public.varor where id = any($1)', [[havre, russin, kaffe]])
        expect(kvar.rows.map((x) => x.id).sort()).toEqual([russin, kaffe].sort())
        expect((await db.query('select 1 from public.ratter where id = $1', [gröt])).rows).toHaveLength(0)
        expect((await db.query('select 1 from public.maltider where ratt_id = $1', [gröt])).rows).toHaveLength(0)
        expect((await db.query('select 1 from public.ingredienser where ratt_id = $1', [musli])).rows).toHaveLength(1)
      })

      it('nekar läsaren, den som inte är med och påsar ur katalogen', async () => {
        const ratt = await nyRatt(AGARE, tur, 'Får inte raderas')
        await forvantaFel(som(LASARE, (tx) => tx.query('select public.ta_bort_egen_ratt($1)', [ratt])))
        await forvantaFel(som(UTOMSTAENDE, (tx) => tx.query('select public.ta_bort_egen_ratt($1)', [ratt])))
        const pasratt = (await db.query<{ id: string }>('select id from public.ratter where tur_id = $1 and matprodukt_id is not null', [tur])).rows[0].id
        await forvantaFel(som(AGARE, (tx) => tx.query('select public.ta_bort_egen_ratt($1)', [pasratt])))
        expect((await db.query('select 1 from public.ratter where id = any($1)', [[ratt, pasratt]])).rows).toHaveLength(2)
      })
    })

    // Sparar rätten, varorna, ingredienserna och måltiden i en transaktion, så att inget blir halvsparat.
    describe('spara_egen_ratt', () => {
      type Rad = { vara: string; gram: number; kcal?: number | null; protein?: number | null }
      const spara = async (vem: string, r: string | null, namn: string, rader: Rad[], maltid: [number, string] | null = null, t = tur) =>
        (
          await som(vem, (tx) =>
            tx.query<{ id: string }>('select public.spara_egen_ratt($1::uuid, $2::uuid, $3::text, $4::jsonb, $5::int, $6::text, 3) as id', [
              t,
              r,
              namn,
              JSON.stringify(rader.map((x) => ({ kcal: null, protein: null, ...x }))),
              maltid?.[0] ?? null,
              maltid?.[1] ?? null,
            ]),
          )
        ).rows[0].id

      const ingredienserI = async (ratt: string) =>
        (
          await db.query<{ namn: string; gram_per_portion: number }>(
            'select v.namn, i.gram_per_portion from public.ingredienser i join public.varor v on v.id = i.vara_id where i.ratt_id = $1 order by v.namn',
            [ratt],
          )
        ).rows

      const rattnamn = async (ratt: string) => (await db.query<{ namn: string }>('select namn from public.ratter where id = $1', [ratt])).rows[0]?.namn

      it('sparar en ny rätt och lägger den i måltiden, och använder en vara som redan finns oavsett stora och små bokstäver', async () => {
        const id = await spara(REDIGERARE, null, 'Havregrynsgröt', [{ vara: 'HAVREGRYN', gram: 50, kcal: 370 }, { vara: 'Lingonsylt', gram: 30, kcal: 200, protein: 0.5 }], [4, 'middag'])
        expect(await ingredienserI(id)).toEqual([
          { namn: 'Havregryn', gram_per_portion: 50 },
          { namn: 'Lingonsylt', gram_per_portion: 30 },
        ])
        // Den befintliga varan får värdena från formuläret: kcal 370, och proteinet töms eftersom fältet var tomt.
        const v = await db.query<{ kcal_per_100g: number; protein_per_100g: string | null }>('select kcal_per_100g, protein_per_100g from public.varor where id = $1', [vara])
        expect(v.rows).toEqual([{ kcal_per_100g: 370, protein_per_100g: null }])
        // Utan nyckeln protein behålls värdet, för den som anropar funktionen utan fältet.
        await som(REDIGERARE, (tx) => tx.query(`update public.varor set protein_per_100g = 12.5 where id = $1`, [vara]))
        await som(REDIGERARE, (tx) =>
          tx.query('select public.spara_egen_ratt($1, null, $2, $3::jsonb)', [tur, 'Utan proteinnyckel', JSON.stringify([{ vara: 'Havregryn', gram: 40, kcal: 370 }])]),
        )
        expect((await db.query('select protein_per_100g from public.varor where id = $1', [vara])).rows).toEqual([{ protein_per_100g: '12.5' }])
        const m = await db.query('select dag, maltid, sortering from public.maltider where ratt_id = $1', [id])
        expect(m.rows).toEqual([{ dag: 4, maltid: 'middag', sortering: 3 }])
      })

      it('ändrar en rätt: nytt namn och alla ingredienser på nytt, och den ligger kvar i sin måltid', async () => {
        const id = await spara(REDIGERARE, null, 'Ändras', [{ vara: 'Ris', gram: 100 }], [5, 'lunch'])
        expect(await spara(REDIGERARE, id, 'Ändrad', [{ vara: 'Bulgur', gram: 80 }, { vara: 'Lök', gram: 20 }])).toBe(id)
        expect(await rattnamn(id)).toBe('Ändrad')
        expect(await ingredienserI(id)).toEqual([
          { namn: 'Bulgur', gram_per_portion: 80 },
          { namn: 'Lök', gram_per_portion: 20 },
        ])
        expect((await db.query('select 1 from public.maltider where ratt_id = $1', [id])).rows).toHaveLength(1)
      })

      it('sparar ingenting när något går fel mitt i: de gamla ingredienserna ligger kvar och ingen ny rätt blir kvar', async () => {
        const id = await spara(AGARE, null, 'Orörd', [{ vara: 'Linser', gram: 70 }])
        await forvantaFel(spara(AGARE, id, 'Nytt namn', [{ vara: 'Nudlar', gram: 60 }, { vara: 'Fel', gram: 0 }]))
        expect(await rattnamn(id)).toBe('Orörd')
        expect(await ingredienserI(id)).toEqual([{ namn: 'Linser', gram_per_portion: 70 }])

        await forvantaFel(spara(AGARE, null, 'Aldrig sparad', [{ vara: 'Kikärtor', gram: 50 }, { vara: 'x'.repeat(81), gram: 10 }]))
        // En måltid som inte går att spara: rätten blir inte kvar i turen utan måltid.
        await forvantaFel(spara(AGARE, null, 'Utan måltid', [{ vara: 'Kikärtor', gram: 50 }], [1, 'brunch']))
        const kvar = await db.query(`select 1 from public.ratter where tur_id = $1 and namn in ('Aldrig sparad', 'Utan måltid')`, [tur])
        expect(kvar.rows).toHaveLength(0)
        const varor = await db.query(`select 1 from public.varor where tur_id = $1 and namn in ('Nudlar', 'Kikärtor')`, [tur])
        expect(varor.rows).toHaveLength(0)
      })

      it('tar bara emot det som formuläret tar emot', async () => {
        const fel: [string, Rad[]][] = [
          ['  ', [{ vara: 'Mjöl', gram: 10 }]],
          ['x'.repeat(81), [{ vara: 'Mjöl', gram: 10 }]],
          ['Tom vara', [{ vara: ' ', gram: 10 }]],
          ['Noll gram', [{ vara: 'Mjöl', gram: 0 }]],
          ['För mycket', [{ vara: 'Mjöl', gram: 5001 }]],
          ['För mycket kcal', [{ vara: 'Mjöl', gram: 10, kcal: 901 }]],
          ['Minus kcal', [{ vara: 'Mjöl', gram: 10, kcal: -1 }]],
          ['För mycket protein', [{ vara: 'Mjöl', gram: 10, protein: 100.1 }]],
        ]
        for (const [namn, rader] of fel) await forvantaFel(spara(AGARE, null, namn, rader))
        // Samma vara två gånger, som formuläret stoppar, och en lista som inte är en lista.
        await forvantaFel(spara(AGARE, null, 'Dubbel', [{ vara: 'Ris', gram: 50 }, { vara: 'RIS', gram: 20 }]))
        for (const rader of ['{"vara": "Ris", "gram": 10}', '"Ris"'])
          await forvantaFel(som(AGARE, (tx) => tx.query(`select public.spara_egen_ratt($1, null, 'Inte en lista', $2::jsonb)`, [tur, rader])))
        expect((await db.query(`select 1 from public.ratter where namn in ('Dubbel', 'Inte en lista')`)).rows).toHaveLength(0)
        const id = await spara(AGARE, null, 'y'.repeat(80), [{ vara: 'z'.repeat(80), gram: 5000, kcal: 900, protein: 100 }, { vara: 'Minst', gram: 1, kcal: 0, protein: 0 }])
        expect(await ingredienserI(id)).toHaveLength(2)
      })

      // Handlingslistan: mängd och enhet, frivilligt gram och rätter utan ingredienser.
      const mangderI = async (ratt: string) =>
        (
          await db.query<{ namn: string; mangd: string | null; enhet: string | null; gram_per_portion: number | null }>(
            'select v.namn, i.mangd, i.enhet, i.gram_per_portion from public.ingredienser i join public.varor v on v.id = i.vara_id where i.ratt_id = $1 order by v.namn',
            [ratt],
          )
        ).rows
      const sparaMed = async (namn: string, rader: object[]) =>
        (
          await som(REDIGERARE, (tx) =>
            tx.query<{ id: string }>('select public.spara_egen_ratt($1::uuid, null, $2::text, $3::jsonb) as id', [tur, namn, JSON.stringify(rader)]),
          )
        ).rows[0].id

      it('sparar mängd och enhet, räknar ut gram för g och kg, och låter gram vara frivilligt för andra enheter', async () => {
        const id = await sparaMed('Pannkakor', [
          { vara: 'Vetemjöl', mangd: 0.1, enhet: 'kg' },
          { vara: 'Mjölk till pannkakor', mangd: 3, enhet: 'dl', gram: 300 },
          { vara: 'Ägg', mangd: 1, enhet: 'st' },
          { vara: 'Salt till pannkakor' },
          { vara: 'Smör till pannkakor', mangd: 12.5, enhet: 'g' },
          { vara: 'Kardemumma', mangd: 2, enhet: 'krm' },
        ])
        expect(await mangderI(id)).toEqual([
          { namn: 'Kardemumma', mangd: '2.00', enhet: 'krm', gram_per_portion: null },
          { namn: 'Mjölk till pannkakor', mangd: '3.00', enhet: 'dl', gram_per_portion: 300 },
          { namn: 'Salt till pannkakor', mangd: null, enhet: null, gram_per_portion: null },
          { namn: 'Smör till pannkakor', mangd: '12.50', enhet: 'g', gram_per_portion: 13 },
          { namn: 'Vetemjöl', mangd: '0.10', enhet: 'kg', gram_per_portion: 100 },
          { namn: 'Ägg', mangd: '1.00', enhet: 'st', gram_per_portion: null },
        ])
      })

      it('sparar en rätt utan ingredienser, och tar bort ingredienserna när en rätt sparas utan dem', async () => {
        const id = await sparaMed('Fika hos mormor', [])
        expect(await rattnamn(id)).toBe('Fika hos mormor')
        expect(await mangderI(id)).toEqual([])
        const annan = await sparaMed('Blir tom', [{ vara: 'Russin till tom', mangd: 1, enhet: 'dl' }])
        await som(REDIGERARE, (tx) => tx.query(`select public.spara_egen_ratt($1::uuid, $2::uuid, 'Blir tom', '[]'::jsonb)`, [tur, annan]))
        expect(await mangderI(annan)).toEqual([])
      })

      it('stoppar okända enheter, mängd utan enhet och för mycket i kg', async () => {
        for (const rad of [
          { vara: 'Fel enhet', mangd: 1, enhet: 'kopp' },
          { vara: 'Utan enhet', mangd: 1 },
          { vara: 'Utan mängd', enhet: 'dl' },
          { vara: 'För tungt', mangd: 6, enhet: 'kg' },
          { vara: 'För tungt i gram', mangd: 5001, enhet: 'g' },
          { vara: 'Noll', mangd: 0, enhet: 'st' },
          { vara: 'Avrundas till noll', mangd: 0.004, enhet: 'kg' },
        ])
          await forvantaFel(sparaMed('Stoppas', [rad]))
        expect((await db.query(`select 1 from public.ratter where namn = 'Stoppas'`)).rows).toHaveLength(0)
        const id = await sparaMed('Gränser', [{ vara: 'Precis 5000 g', mangd: 5000, enhet: 'g' }, { vara: 'Avrundas', mangd: 0.125, enhet: 'kg' }])
        // Mängden sparas med två decimaler, och gram räknas från den avrundade mängden.
        expect(await mangderI(id)).toEqual([
          { namn: 'Avrundas', mangd: '0.13', enhet: 'kg', gram_per_portion: 130 },
          { namn: 'Precis 5000 g', mangd: '5000.00', enhet: 'g', gram_per_portion: 5000 },
        ])
      })

      it('nekar läsaren, den som inte är med och en rätt i en annan tur även med en tom lista, och ingredienserna ligger kvar', async () => {
        const id = await sparaMed('Ska ligga kvar', [{ vara: 'Kvar', mangd: 1, enhet: 'dl' }])
        for (const [vem, t] of [[LASARE, tur], [UTOMSTAENDE, tur], [AGARE, annanTur]] as const)
          await forvantaFel(som(vem, (tx) => tx.query(`select public.spara_egen_ratt($1::uuid, $2::uuid, 'Kapad', '[]'::jsonb)`, [t, id])))
        await forvantaFel(som(LASARE, (tx) => tx.query(`select public.spara_egen_ratt($1::uuid, null, 'Läsarens', '[{"vara": "Ris", "mangd": 1, "enhet": "dl"}]'::jsonb)`, [tur])))
        expect(await rattnamn(id)).toBe('Ska ligga kvar')
        expect(await mangderI(id)).toHaveLength(1)
      })

      it('tabellerna kräver att gram stämmer med mängden för g och kg, även utan spara_egen_ratt', async () => {
        const r = await nyRatt(REDIGERARE, tur, 'Direkt i tabellen')
        const v = await nyVara(REDIGERARE, tur, 'Direktvara')
        await forvantaFel(
          som(REDIGERARE, (tx) => tx.query(`insert into public.ingredienser (tur_id, ratt_id, vara_id, mangd, enhet, gram_per_portion) values ($1, $2, $3, 100, 'g', 9999)`, [tur, r, v])),
        )
        const ok = await som(REDIGERARE, (tx) =>
          tx.query(`insert into public.ingredienser (tur_id, ratt_id, vara_id, mangd, enhet, gram_per_portion) values ($1, $2, $3, 2, 'dl', 180)`, [tur, r, v]),
        )
        expect(ok.affectedRows).toBe(1)
      })

      it('redigeraren väljer butiksavdelning för en vara, men läsaren kan inte, och en okänd avdelning stoppas', async () => {
        const ok = await som(REDIGERARE, (tx) => tx.query(`update public.varor set avdelning = 'mejeri' where id = $1`, [vara]))
        expect(ok.affectedRows).toBe(1)
        const nej = await som(LASARE, (tx) => tx.query(`update public.varor set avdelning = 'fryst' where id = $1`, [vara]))
        expect(nej.affectedRows).toBe(0)
        await forvantaFel(som(REDIGERARE, (tx) => tx.query(`update public.varor set avdelning = 'apotek' where id = $1`, [vara])))
      })

      it('nekar läsaren, den som inte är med, påsar ur katalogen och en rätt i en annan tur', async () => {
        const id = await spara(AGARE, null, 'Skyddad', [{ vara: 'Mjöl', gram: 10 }])
        const rad = [{ vara: 'Smuggel', gram: 10 }]
        await forvantaFel(spara(LASARE, null, 'Läsarens rätt', rad))
        await forvantaFel(spara(LASARE, id, 'Kapad', rad))
        await forvantaFel(spara(UTOMSTAENDE, null, 'Inkräktarens rätt', rad))
        await forvantaFel(spara(UTOMSTAENDE, id, 'Kapad', rad))
        await forvantaFel(spara(UTOMSTAENDE, null, 'Inkräktarens rätt', rad, [6, 'middag']))
        const pasratt = (await db.query<{ id: string }>('select id from public.ratter where tur_id = $1 and matprodukt_id is not null', [tur])).rows[0].id
        await forvantaFel(spara(AGARE, pasratt, 'Påsen', rad))
        await forvantaFel(spara(AGARE, id, 'Flyttad', rad, null, annanTur))
        expect(await rattnamn(id)).toBe('Skyddad')
        expect(await ingredienserI(id)).toEqual([{ namn: 'Mjöl', gram_per_portion: 10 }])
        expect((await db.query(`select 1 from public.varor where namn = 'Smuggel'`)).rows).toHaveLength(0)
        expect((await db.query(`select 1 from public.ratter where namn in ('Läsarens rätt', 'Inkräktarens rätt')`)).rows).toHaveLength(0)
      })

      it('använder bara varor i samma tur, också när man kan ändra en annan tur med en vara som heter likadant', async () => {
        const iAnnanTur = await nyVara(AGARE, annanTur, 'Tvillingvara')
        const id = await spara(AGARE, null, 'Tvilling', [{ vara: 'Tvillingvara', gram: 10, kcal: 500 }])
        const annan = await db.query<{ kcal_per_100g: number }>('select kcal_per_100g from public.varor where id = $1', [iAnnanTur])
        expect(annan.rows).toEqual([{ kcal_per_100g: 380 }])
        const i = await db.query<{ tur_id: string }>('select v.tur_id from public.ingredienser i join public.varor v on v.id = i.vara_id where i.ratt_id = $1', [id])
        expect(i.rows).toEqual([{ tur_id: tur }])
      })
    })
  })

  describe('vem bär och vem äter', () => {
    let ratt: string
    const nyRad = async (vem: string, t: string, dag: number, r: string) =>
      (
        await som(vem, (tx) =>
          tx.query<{ id: string }>(`insert into public.maltider (tur_id, dag, maltid, ratt_id) values ($1, $2, 'middag', $3) returning id`, [t, dag, r]),
        )
      ).rows[0].id
    const barsAv = async (rad: string) => (await db.query<{ bars_av: string | null }>('select bars_av from public.maltider where id = $1', [rad])).rows[0]?.bars_av
    const taRatt = async (vem: string, rad: string) =>
      (await som(vem, (tx) => tx.query<{ ok: boolean }>('select public.ta_ratt($1) as ok', [rad]))).rows[0].ok
    const nyAtare = (vem: string, t: string, rad: string, deltagare: string) =>
      som(vem, (tx) => tx.query('insert into public.maltid_atare (tur_id, maltid_id, deltagare_id) values ($1, $2, $3)', [t, rad, deltagare]))

    beforeAll(async () => {
      ratt = await nyRatt(REDIGERARE, tur, 'Bärgryta')
    })

    it('redigeraren väljer vem som bär en rad, men läsaren kan inte ändra den direkt', async () => {
      const rad = await nyRad(REDIGERARE, tur, 4, ratt)
      const ok = await som(REDIGERARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [lisa, rad]))
      expect(ok.affectedRows).toBe(1)
      const nej = await som(LASARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [lasarensDeltagare, rad]))
      expect(nej.affectedRows).toBe(0)
      expect(await barsAv(rad)).toBe(lisa)
    })

    it('den som bär måste vara med i samma tur', async () => {
      const rad = await nyRad(AGARE, tur, 4, ratt)
      const iAnnanTur = await deltagareFor(annanTur, AGARE)
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [iAnnanTur, rad])))
    })

    it('läsaren tar en rad som ingen bär, men inte en som någon annan bär', async () => {
      const ledig = await nyRad(AGARE, tur, 5, ratt)
      const upptagen = await nyRad(AGARE, tur, 5, ratt)
      await som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [redigerarensDeltagare, upptagen]))
      expect(await taRatt(LASARE, ledig)).toBe(true)
      expect(await barsAv(ledig)).toBe(lasarensDeltagare)
      // Att ta en rad man redan bär går också bra.
      expect(await taRatt(LASARE, ledig)).toBe(true)
      expect(await taRatt(LASARE, upptagen)).toBe(false)
      expect(await barsAv(upptagen)).toBe(redigerarensDeltagare)
    })

    it('läsaren släpper en rad hen bär, men inte någon annans', async () => {
      const slapp = async (vem: string, rad: string) =>
        (await som(vem, (tx) => tx.query<{ ok: boolean }>('select public.slapp_ratt($1) as ok', [rad]))).rows[0].ok
      const egen = await nyRad(AGARE, tur, 5, ratt)
      const annans = await nyRad(AGARE, tur, 5, ratt)
      await som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [redigerarensDeltagare, annans]))
      expect(await taRatt(LASARE, egen)).toBe(true)
      expect(await slapp(LASARE, egen)).toBe(true)
      expect(await barsAv(egen)).toBeNull()
      expect(await slapp(LASARE, annans)).toBe(false)
      expect(await barsAv(annans)).toBe(redigerarensDeltagare)
      await forvantaFel(slapp(UTOMSTAENDE, annans))
      await forvantaFel(somAnon((tx) => tx.query('select public.slapp_ratt($1)', [annans])))
    })

    it('maltid_atare: inget för anon, ingen update, och RLS är påslaget', async () => {
      const har = async (roll: string, r: string) =>
        (await db.query<{ ok: boolean }>("select has_table_privilege($1, 'public.maltid_atare', $2) as ok", [roll, r])).rows[0].ok
      for (const r of ['select', 'insert', 'update', 'delete', 'truncate']) expect(await har('anon', r), r).toBe(false)
      expect(await har('authenticated', 'update')).toBe(false)
      expect(await har('authenticated', 'truncate')).toBe(false)
      const rls = await db.query("select relrowsecurity from pg_class where oid = 'public.maltid_atare'::regclass")
      expect(rls.rows).toEqual([{ relrowsecurity: true }])
    })

    it('en person som blir en hund slutar äta rätterna', async () => {
      const rad = await nyRad(AGARE, tur, 8, ratt)
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>("insert into public.deltagare (tur_id, namn) values ($1, 'Blir hund') returning id", [tur]))
      await nyAtare(AGARE, tur, rad, p.rows[0].id)
      await som(AGARE, (tx) => tx.query("update public.deltagare set typ = 'hund' where id = $1", [p.rows[0].id]))
      expect((await db.query('select 1 from public.maltid_atare where deltagare_id = $1', [p.rows[0].id])).rows).toHaveLength(0)
    })

    it('den som inte är med i turen kan inte ta en rad, och anon kan inte anropa ta_ratt', async () => {
      const rad = await nyRad(AGARE, tur, 5, ratt)
      await forvantaFel(taRatt(UTOMSTAENDE, rad))
      await forvantaFel(somAnon((tx) => tx.query('select public.ta_ratt($1)', [rad])))
      expect(await barsAv(rad)).toBeNull()
    })

    it('när den som bär tas bort ur turen blir raden utan bärare och ligger kvar', async () => {
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Tillfällig bärare') returning id`, [tur]))
      const rad = await nyRad(AGARE, tur, 6, ratt)
      await som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [p.rows[0].id, rad]))
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [p.rows[0].id]))
      expect(await barsAv(rad)).toBeNull()
    })

    it('redigeraren väljer vem som äter, läsaren ser det men kan inte ändra, och den som inte är med ser ingenting', async () => {
      const rad = await nyRad(REDIGERARE, tur, 7, ratt)
      await nyAtare(REDIGERARE, tur, rad, lisa)
      await nyAtare(REDIGERARE, tur, rad, agarensDeltagare)
      const ser = await som(LASARE, (tx) => tx.query('select deltagare_id from public.maltid_atare where maltid_id = $1', [rad]))
      expect(ser.rows).toHaveLength(2)
      await forvantaFel(nyAtare(LASARE, tur, rad, lasarensDeltagare))
      const borta = await som(LASARE, (tx) => tx.query('delete from public.maltid_atare where maltid_id = $1', [rad]))
      expect(borta.affectedRows).toBe(0)
      const inget = await som(UTOMSTAENDE, (tx) => tx.query('select 1 from public.maltid_atare where tur_id = $1', [tur]))
      expect(inget.rows).toHaveLength(0)
      await forvantaFel(nyAtare(UTOMSTAENDE, tur, rad, lisa))
      const bort = await som(REDIGERARE, (tx) => tx.query('delete from public.maltid_atare where maltid_id = $1 and deltagare_id = $2', [rad, lisa]))
      expect(bort.affectedRows).toBe(1)
    })

    it('bara personer i samma tur kan äta en rad, och raden måste höra till turen', async () => {
      const rad = await nyRad(AGARE, tur, 7, ratt)
      await forvantaFel(nyAtare(AGARE, tur, rad, hund))
      await forvantaFel(nyAtare(AGARE, tur, rad, await deltagareFor(annanTur, AGARE)))
      const annanRatt = await nyRatt(AGARE, annanTur, 'Annan bärgryta')
      const annanRad = await nyRad(AGARE, annanTur, 1, annanRatt)
      await forvantaFel(nyAtare(AGARE, tur, annanRad, lisa))
      await forvantaFel(nyAtare(AGARE, annanTur, annanRad, lisa))
    })

    it('ätarna försvinner med måltidsraden och med deltagaren', async () => {
      const rad = await nyRad(AGARE, tur, 8, ratt)
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Tillfällig ätare') returning id`, [tur]))
      await nyAtare(AGARE, tur, rad, p.rows[0].id)
      await nyAtare(AGARE, tur, rad, lisa)
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [p.rows[0].id]))
      expect((await db.query('select 1 from public.maltid_atare where maltid_id = $1', [rad])).rows).toHaveLength(1)
      await som(AGARE, (tx) => tx.query('delete from public.maltider where id = $1', [rad]))
      expect((await db.query('select 1 from public.maltid_atare where maltid_id = $1', [rad])).rows).toHaveLength(0)
    })
  })

  describe('avbockning per person i inköpslistan', () => {
    let vara: string
    let pase: string
    const bocka = (vem: string, deltagare: string, kolumn: 'vara_id' | 'ratt_id', id: string, t = tur) =>
      som(vem, (tx) => tx.query(`insert into public.inkop_klart (tur_id, deltagare_id, ${kolumn}) values ($1, $2, $3)`, [t, deltagare, id]))
    const bockar = async (id: string) => (await db.query<{ deltagare_id: string }>('select deltagare_id from public.inkop_klart where vara_id = $1 or ratt_id = $1 order by deltagare_id', [id])).rows.map((r) => r.deltagare_id)

    beforeAll(async () => {
      vara = await nyVara(REDIGERARE, tur, 'Bockvara')
      pase = (await db.query<{ id: string }>('select id from public.ratter where tur_id = $1 and matprodukt_id is not null limit 1', [tur])).rows[0].id
    })

    it('redigeraren bockar av åt vem som helst, och två personer bockar av samma vara var för sig', async () => {
      await bocka(REDIGERARE, lisa, 'vara_id', vara)
      await bocka(REDIGERARE, agarensDeltagare, 'vara_id', vara)
      await bocka(REDIGERARE, lisa, 'ratt_id', pase)
      expect(await bockar(vara)).toEqual([lisa, agarensDeltagare].sort())
      expect(await bockar(pase)).toEqual([lisa])
      // Samma bock två gånger går inte.
      await forvantaFel(bocka(REDIGERARE, lisa, 'vara_id', vara))
      // Redigeraren tar bort någon annans bock.
      const bort = await som(REDIGERARE, (tx) => tx.query('delete from public.inkop_klart where ratt_id = $1 and deltagare_id = $2', [pase, lisa]))
      expect(bort.affectedRows).toBe(1)
    })

    it('bara personer bockar av, och en person som blir hund förlorar sina bockar', async () => {
      await forvantaFel(bocka(AGARE, hund, 'vara_id', vara))
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>("insert into public.deltagare (tur_id, namn) values ($1, 'Blir hund i inköpen') returning id", [tur]))
      await bocka(AGARE, p.rows[0].id, 'vara_id', vara)
      await som(AGARE, (tx) => tx.query("update public.deltagare set typ = 'hund' where id = $1", [p.rows[0].id]))
      expect((await db.query('select 1 from public.inkop_klart where deltagare_id = $1', [p.rows[0].id])).rows).toHaveLength(0)
    })

    it('läsaren ser alla bockar, bockar av och tar bort sin egen, men inte någon annans', async () => {
      const ser = await som(LASARE, (tx) => tx.query('select 1 from public.inkop_klart where tur_id = $1', [tur]))
      expect(ser.rows.length).toBeGreaterThan(0)
      await bocka(LASARE, lasarensDeltagare, 'vara_id', vara)
      await forvantaFel(bocka(LASARE, redigerarensDeltagare, 'vara_id', vara))
      const annans = await som(LASARE, (tx) => tx.query('delete from public.inkop_klart where vara_id = $1 and deltagare_id = $2', [vara, lisa]))
      expect(annans.affectedRows).toBe(0)
      // Läsarens egen rad i en annan tur gäller inte här.
      const kod = await kodFor(annanTur)
      await som(LASARE, (tx) => tx.query('select public.ga_med($1)', [kod]))
      const iAnnan = await deltagareFor(annanTur, LASARE)
      await forvantaFel(bocka(LASARE, iAnnan, 'vara_id', vara))
      // Läsaren lämnar den andra turen igen, så att de andra testerna inte påverkas.
      await som(LASARE, (tx) => tx.query('delete from public.deltagare where id = $1', [iAnnan]))
      const egen = await som(LASARE, (tx) => tx.query('delete from public.inkop_klart where vara_id = $1 and deltagare_id = $2', [vara, lasarensDeltagare]))
      expect(egen.affectedRows).toBe(1)
    })

    it('den som inte är med ser inga bockar och kan inte bocka av, och anon får ingenting', async () => {
      const inget = await som(UTOMSTAENDE, (tx) => tx.query('select 1 from public.inkop_klart where tur_id = $1', [tur]))
      expect(inget.rows).toHaveLength(0)
      await forvantaFel(bocka(UTOMSTAENDE, lisa, 'vara_id', vara))
      const bort = await som(UTOMSTAENDE, (tx) => tx.query('delete from public.inkop_klart where tur_id = $1', [tur]))
      expect(bort.affectedRows).toBe(0)
      await forvantaFel(somAnon((tx) => tx.query('select 1 from public.inkop_klart')))
      const har = async (roll: string, r: string) =>
        (await db.query<{ ok: boolean }>("select has_table_privilege($1, 'public.inkop_klart', $2) as ok", [roll, r])).rows[0].ok
      for (const r of ['select', 'insert', 'update', 'delete']) expect(await har('anon', r), r).toBe(false)
      expect(await har('authenticated', 'update')).toBe(false)
      const rls = await db.query("select relrowsecurity from pg_class where oid = 'public.inkop_klart'::regclass")
      expect(rls.rows).toEqual([{ relrowsecurity: true }])
    })

    it('en bock gäller antingen en vara eller en påse, och allt måste höra till samma tur', async () => {
      await forvantaFel(som(AGARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id) values ($1, $2)', [tur, lisa])))
      await forvantaFel(som(AGARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, vara_id, ratt_id) values ($1, $2, $3, $4)', [tur, lisa, vara, pase])))
      const annanVara = await nyVara(AGARE, annanTur, 'Vara i annan tur')
      await forvantaFel(bocka(AGARE, lisa, 'vara_id', annanVara))
      await forvantaFel(bocka(AGARE, await deltagareFor(annanTur, AGARE), 'vara_id', vara))
    })

    it('bocken försvinner med påsen', async () => {
      const mp = await nyPase('Bockpåse')
      const r = await nyRatt(AGARE, tur, 'Testmat Bockpåse', mp)
      await bocka(AGARE, lisa, 'ratt_id', r)
      await som(AGARE, (tx) => tx.query('delete from public.ratter where id = $1', [r]))
      expect((await db.query('select 1 from public.inkop_klart where ratt_id = $1', [r])).rows).toHaveLength(0)
    })

    it('sparar mängden som bockades av, och bocka_inkop byter bocken i en transaktion med samma rättigheter som tabellen', async () => {
      const v = await nyVara(AGARE, tur, 'Mängdvara')
      const bocka = (vem: string, deltagare: string, klart: boolean, mangd: string) =>
        som(vem, (tx) => tx.query('select public.bocka_inkop($1, $2, $3, null, $4, $5)', [tur, deltagare, v, klart, mangd]))
      const mangder = async () => (await db.query<{ deltagare_id: string; mangd: string }>('select deltagare_id, mangd from public.inkop_klart where vara_id = $1 order by deltagare_id', [v])).rows
      // Läsaren bockar av åt sig själv, och en ny mängd byter ut den gamla bocken.
      await bocka(LASARE, lasarensDeltagare, true, '1 dl')
      await bocka(LASARE, lasarensDeltagare, true, '3 dl')
      expect(await mangder()).toEqual([{ deltagare_id: lasarensDeltagare, mangd: '3 dl' }])
      // En bock ändras inte direkt, inte heller mängden.
      await forvantaFel(som(LASARE, (tx) => tx.query("update public.inkop_klart set mangd = '9 dl' where vara_id = $1", [v])))
      // Läsaren bockar inte åt någon annan, och då blir ingenting borttaget heller.
      await bocka(REDIGERARE, lisa, true, '2 dl')
      await forvantaFel(bocka(LASARE, lisa, true, '5 dl'))
      expect((await mangder()).find((r) => r.deltagare_id === lisa)?.mangd).toBe('2 dl')
      // Redigeraren bockar åt vem som helst och tar bort bocken med klart = false.
      await bocka(REDIGERARE, lasarensDeltagare, false, '')
      expect(await mangder()).toEqual([{ deltagare_id: lisa, mangd: '2 dl' }])
      // Den som inte är med når ingenting, och anon kan inte anropa funktionen.
      await forvantaFel(bocka(UTOMSTAENDE, lisa, true, '1 dl'))
      await forvantaFel(somAnon((tx) => tx.query('select public.bocka_inkop($1, $2, $3, null, true, $4)', [tur, lisa, v, '1 dl'])))
      // Antingen en vara eller en påse, och högst 200 tecken.
      await forvantaFel(som(AGARE, (tx) => tx.query('select public.bocka_inkop($1, $2, null, null, true, $3)', [tur, lisa, '1 dl'])))
      await bocka(AGARE, lisa, true, 'x'.repeat(200))
      await forvantaFel(bocka(AGARE, lisa, true, 'x'.repeat(201)))
      await som(AGARE, (tx) => tx.query('delete from public.varor where id = $1', [v]))
    })

    it('bockarna försvinner med deltagaren och med varan', async () => {
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>("insert into public.deltagare (tur_id, namn) values ($1, 'Tillfällig köpare') returning id", [tur]))
      const v = await nyVara(AGARE, tur, 'Tillfällig bockvara')
      await bocka(AGARE, p.rows[0].id, 'vara_id', vara)
      await bocka(AGARE, lisa, 'vara_id', v)
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [p.rows[0].id]))
      await som(AGARE, (tx) => tx.query('delete from public.varor where id = $1', [v]))
      expect((await db.query('select 1 from public.inkop_klart where deltagare_id = $1 or vara_id = $2', [p.rows[0].id, v])).rows).toHaveLength(0)
    })
  })

  describe('MinVandrings recept', () => {
    const TABELLER = ['public.receptkatalog', 'public.receptkatalog_ingredienser', 'public.receptkatalog_steg']

    it('inloggade läser recepten med ingredienser och steg från seeden', async () => {
      const r = await som(LASARE, (tx) => tx.query<{ n: number }>('select count(*)::int as n from public.receptkatalog'))
      expect(r.rows[0].n).toBe(29)
      // Alla recept har bild efter seeden receptkatalog_bilder.
      const b = await som(LASARE, (tx) => tx.query<{ n: number }>('select count(*)::int as n from public.receptkatalog where bild'))
      expect(b.rows[0].n).toBe(29)
      const i = await som(LASARE, (tx) =>
        tx.query<{ ingrediens: string; livsmedel_nummer: number | null }>("select ingrediens, livsmedel_nummer from public.receptkatalog_ingredienser where recept_id = 'aprikosgrot' order by ordning limit 2"),
      )
      expect(i.rows).toEqual([
        { ingrediens: 'Snabbhavregryn', livsmedel_nummer: 702 },
        { ingrediens: 'Mjölkpulver', livsmedel_nummer: 4537 },
      ])
      const s = await som(UTOMSTAENDE, (tx) => tx.query<{ n: number }>("select count(*)::int as n from public.receptkatalog_steg where recept_id = 'aprikosgrot'"))
      expect(s.rows[0].n).toBeGreaterThan(0)
    })

    it('gram läses av inloggade, ändras inte via API:t och anges bara när enheten inte är g eller kg', async () => {
      const r = await som(LASARE, (tx) => tx.query<{ gram: string | null }>("select gram from public.receptkatalog_ingredienser where recept_id = 'aprikosgrot' and ordning = 1"))
      expect(r.rows).toEqual([{ gram: null }])
      const u = await som(AGARE, (tx) => tx.query("update public.receptkatalog_ingredienser set gram = 90 where recept_id = 'aprikosgrot'")).catch(() => null)
      expect(u?.affectedRows ?? 0).toBe(0)
      // Som migreringen: grams gränser och att g och kg inte har gram.
      expect((await db.query<{ ok: boolean }>("select has_column_privilege('authenticated', 'public.receptkatalog_ingredienser', 'gram', 'update') as ok")).rows[0].ok).toBe(false)
      await forvantaFel(db.query("update public.receptkatalog_ingredienser set gram = 0 where recept_id = 'aprikosgrot' and ordning = 1"))
      await forvantaFel(db.query("update public.receptkatalog_ingredienser set gram = 20000.1 where recept_id = 'aprikosgrot' and ordning = 1"))
      await db.query('begin')
      try {
        await db.query("update public.receptkatalog_ingredienser set gram = 20000 where recept_id = 'aprikosgrot' and ordning = 1")
        await db.query("update public.receptkatalog_ingredienser set gram = 90 where recept_id = 'aprikosgrot' and ordning = 1")
        await forvantaFel(db.query("update public.receptkatalog_ingredienser set mangd = 90, enhet = 'g' where recept_id = 'aprikosgrot' and ordning = 1"))
      } finally {
        await db.query('rollback')
      }
    })

    it('ingen ändrar via API:t, anon når ingenting och RLS är påslaget', async () => {
      await forvantaFel(
        som(AGARE, (tx) =>
          tx.query(
            "insert into public.receptkatalog (id, namn, maltid, portioner, kok_kravs, torkning_hemma, beskrivning, mangder, inspirerat_av, inspirerat_av_url, status) values ('eget', 'Eget', 'middag', 1, true, false, 'Text', 'egna', 'Någon', 'https://x.se', 'testat')",
          ),
        ),
      )
      const u = await som(AGARE, (tx) => tx.query("update public.receptkatalog set status = 'testat' where id = 'aprikosgrot'")).catch(() => null)
      expect(u?.affectedRows ?? 0).toBe(0)
      await forvantaFel(som(AGARE, (tx) => tx.query("delete from public.receptkatalog_steg where recept_id = 'aprikosgrot'")))
      for (const t of TABELLER) {
        await forvantaFel(somAnon((tx) => tx.query(`select 1 from ${t}`)))
        const har = async (roll: string, r: string) => (await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [roll, t, r])).rows[0].ok
        for (const r of ['insert', 'update', 'delete', 'truncate']) expect(await har('authenticated', r), `${t} ${r}`).toBe(false)
        for (const r of ['select', 'insert', 'update', 'delete']) expect(await har('anon', r), `${t} ${r}`).toBe(false)
        const rls = await db.query('select relrowsecurity from pg_class where oid = $1::regclass', [t])
        expect(rls.rows, t).toEqual([{ relrowsecurity: true }])
      }
    })

    it('mängd och enhet hör ihop, och en ingrediens kopplas till högst ett livsmedel eller en vara', async () => {
      const ny = (varden: string) =>
        db.query(`insert into public.receptkatalog_ingredienser (recept_id, ordning, ingrediens, mangd, enhet, packas, livsmedel_nummer, varukatalog_id) values ('aprikosgrot', 90, 'Test', ${varden})`)
      await forvantaFel(ny("2, null, 'hemma', null, null"))
      await forvantaFel(ny("null, 'g', 'hemma', null, null"))
      await forvantaFel(ny("2, 'liter', 'hemma', null, null"))
      const vara = (
        await db.query<{ id: string }>("insert into public.varukatalog (marke, namn, kategori, forpackning_g, kcal_per_100g, kalla) values ('Test', 'Receptvara båda', 'brod', 100, 100, 'https://x.se') returning id")
      ).rows[0].id
      await forvantaFel(ny(`2, 'g', 'hemma', 702, '${vara}'`))
    })

    it('stoppar fel id, packas, plats, tid och portioner', async () => {
      const recept = (id: string, portioner: number) =>
        db.query(
          `insert into public.receptkatalog (id, namn, maltid, portioner, kok_kravs, torkning_hemma, beskrivning, mangder, inspirerat_av, inspirerat_av_url, status) values ($1, 'Test', 'middag', $2, true, false, 'Text', 'egna', 'Någon', 'https://x.se', 'otestat')`,
          [id, portioner],
        )
      await forvantaFel(recept('Stor_Bokstav', 1))
      await forvantaFel(recept('noll-portioner', 0))
      await forvantaFel(recept('for-manga', 51))
      await forvantaFel(db.query("insert into public.receptkatalog_ingredienser (recept_id, ordning, ingrediens, packas) values ('aprikosgrot', 91, 'Test', 'annat')"))
      const steg = (plats: string, tid: string) => db.query("insert into public.receptkatalog_steg (recept_id, steg_nr, var, steg, tid_min) values ('aprikosgrot', 90, $1, 'Test', $2)", [plats, tid])
      await forvantaFel(steg('hem', '5'))
      // Ett intervall skrivs med kort streck, inte med bindestreck.
      await forvantaFel(steg('turen', '5-10'))
    })

    it('kopplingen blir tom när livsmedlet försvinner, och ingredienserna försvinner med receptet', async () => {
      await db.query("insert into public.livsmedel (nummer, namn) values (999901, 'Testlivsmedel')")
      await db.query(
        "insert into public.receptkatalog (id, namn, maltid, portioner, kok_kravs, torkning_hemma, beskrivning, mangder, inspirerat_av, inspirerat_av_url, status) values ('testrecept', 'Test', 'middag', 1, true, false, 'Text', 'egna', 'Någon', 'https://x.se', 'otestat')",
      )
      await db.query("insert into public.receptkatalog_ingredienser (recept_id, ordning, ingrediens, packas, livsmedel_nummer) values ('testrecept', 1, 'Test', 'hemma', 999901)")
      await db.query("insert into public.receptkatalog_steg (recept_id, steg_nr, var, steg, tid_min) values ('testrecept', 1, 'turen', 'Koka.', '5–10')")
      const vara = (
        await db.query<{ id: string }>("insert into public.varukatalog (marke, namn, kategori, forpackning_g, kcal_per_100g, kalla) values ('Test', 'Receptvara', 'brod', 100, 100, 'https://x.se') returning id")
      ).rows[0].id
      await db.query("insert into public.receptkatalog_ingredienser (recept_id, ordning, ingrediens, packas, varukatalog_id) values ('testrecept', 2, 'Vara', 'hemma', $1)", [vara])
      await db.query('delete from public.livsmedel where nummer = 999901')
      await db.query('delete from public.varukatalog where id = $1', [vara])
      const k = await db.query("select livsmedel_nummer, varukatalog_id from public.receptkatalog_ingredienser where recept_id = 'testrecept' order by ordning")
      expect(k.rows).toEqual([
        { livsmedel_nummer: null, varukatalog_id: null },
        { livsmedel_nummer: null, varukatalog_id: null },
      ])
      await db.query("delete from public.receptkatalog where id = 'testrecept'")
      const kvar = await db.query("select 1 from public.receptkatalog_ingredienser where recept_id = 'testrecept' union all select 1 from public.receptkatalog_steg where recept_id = 'testrecept'")
      expect(kvar.rows).toEqual([])
    })
  })

  describe('varukatalogen', () => {
    let vk: string
    const nyVaruKatalograd = async (namn: string, allergener = "array['gluten']::text[]") =>
      (
        await db.query<{ id: string }>(
          `insert into public.varukatalog (marke, namn, kategori, forpackning_g, kcal_per_100g, allergener, kalla) values ('Testbröd', $1, 'brod', 375, 280, ${allergener}, 'https://exempel.se') returning id`,
          [namn],
        )
      ).rows[0].id

    beforeAll(async () => {
      vk = await nyVaruKatalograd('Sarek')
    })

    it('inloggade läser, ingen ändrar via API:t och anon når ingenting', async () => {
      const r = await som(LASARE, (tx) => tx.query('select namn from public.varukatalog where id = $1', [vk]))
      expect(r.rows).toEqual([{ namn: 'Sarek' }])
      await forvantaFel(som(AGARE, (tx) => tx.query(`insert into public.varukatalog (marke, namn, kategori, forpackning_g, kcal_per_100g, kalla) values ('X', 'Y', 'brod', 1, 1, 'https://x.se')`)))
      const u = await som(AGARE, (tx) => tx.query("update public.varukatalog set namn = 'Ändrad' where id = $1", [vk])).catch(() => null)
      expect(u?.affectedRows ?? 0).toBe(0)
      await forvantaFel(somAnon((tx) => tx.query('select 1 from public.varukatalog')))
      const har = async (roll: string, r: string) =>
        (await db.query<{ ok: boolean }>("select has_table_privilege($1, 'public.varukatalog', $2) as ok", [roll, r])).rows[0].ok
      for (const r of ['insert', 'update', 'delete', 'truncate']) expect(await har('authenticated', r), r).toBe(false)
      for (const r of ['select', 'insert', 'update', 'delete']) expect(await har('anon', r), r).toBe(false)
      const rls = await db.query("select relrowsecurity from pg_class where oid = 'public.varukatalog'::regclass")
      expect(rls.rows).toEqual([{ relrowsecurity: true }])
      // Samma märke och namn två gånger går inte, oavsett stora och små bokstäver.
      await forvantaFel(nyVaruKatalograd('SAREK'))
    })

    it('spara_egen_ratt sparar kopplingen på varan, och null tar bort den', async () => {
      const spara = (rader: object[]) =>
        som(REDIGERARE, (tx) => tx.query<{ id: string }>('select public.spara_egen_ratt($1, null, $2, $3::jsonb) as id', [tur, `Rätt ${crypto.randomUUID().slice(0, 6)}`, JSON.stringify(rader)]))
      await spara([{ vara: 'Testbröd Sarek', gram: 60, kcal: 280, protein: 9.8, varukatalog: vk }])
      const koppling = async () => (await db.query<{ varukatalog_id: string | null }>("select varukatalog_id from public.varor where tur_id = $1 and namn = 'Testbröd Sarek'", [tur])).rows[0].varukatalog_id
      expect(await koppling()).toBe(vk)
      // Utan nyckeln behålls kopplingen.
      await spara([{ vara: 'Testbröd Sarek', gram: 60, kcal: 280, protein: 9.8 }])
      expect(await koppling()).toBe(vk)
      await spara([{ vara: 'Testbröd Sarek', gram: 60, kcal: 280, protein: 9.8, varukatalog: null }])
      expect(await koppling()).toBeNull()
    })

    it('spara_recept sparar kopplingen på raden, och kopplingen blir tom när varan försvinner ur katalogen', async () => {
      const borta = await nyVaruKatalograd('Försvinner')
      const id = (
        await som(LASARE, (tx) =>
          tx.query<{ id: string }>('select public.spara_recept(null, $1, $2::jsonb) as id', ['Recept med katalogvara', JSON.stringify([{ vara: 'Testbröd Försvinner', mangd: 60, enhet: 'g', kcal: 280, varukatalog: borta }])]),
        )
      ).rows[0].id
      const rad = async () => (await db.query<{ varukatalog_id: string | null }>('select varukatalog_id from public.receptrader where recept_id = $1', [id])).rows[0].varukatalog_id
      expect(await rad()).toBe(borta)
      await db.query('delete from public.varukatalog where id = $1', [borta])
      expect(await rad()).toBeNull()
    })

    it('bara ägare och redigerare kopplar en vara i turen, och ingen kopplar någon annans receptrad', async () => {
      const v = await nyVara(AGARE, tur, 'Kopplingsvara')
      for (const vem of [LASARE, UTOMSTAENDE]) {
        const u = await som(vem, (tx) => tx.query('update public.varor set varukatalog_id = $1 where id = $2', [vk, v]))
        expect(u.affectedRows, vem).toBe(0)
      }
      await forvantaFel(som(LASARE, (tx) => tx.query('select public.spara_egen_ratt($1, null, $2, $3::jsonb)', [tur, 'Läsarens rätt', JSON.stringify([{ vara: 'Y', gram: 10, varukatalog: vk }])])))
      const ok = await som(REDIGERARE, (tx) => tx.query('update public.varor set varukatalog_id = $1 where id = $2', [vk, v]))
      expect(ok.affectedRows).toBe(1)
      // Lisas recept går inte att koppla för någon annan.
      const recept = (await som(LASARE, (tx) => tx.query<{ id: string }>('select public.spara_recept(null, $1, $2::jsonb) as id', ['Läsarens recept', JSON.stringify([{ vara: 'X', mangd: 10, enhet: 'g' }])]))).rows[0].id
      const annan = await som(UTOMSTAENDE, (tx) => tx.query('update public.receptrader set varukatalog_id = $1 where recept_id = $2', [vk, recept]))
      expect(annan.affectedRows).toBe(0)
    })

    it('spara_egen_ratt sparar kopplingen, så att den inte försvinner om en äldre version av funktionen körs efteråt', async () => {
      const def = await db.query<{ prosrc: string }>("select prosrc from pg_proc where proname = 'spara_egen_ratt'")
      expect(def.rows).toHaveLength(1)
      expect(def.rows[0].prosrc).toContain('varukatalog_id')
    })

    it('en koppling till en vara som inte finns stoppas', async () => {
      await forvantaFel(
        som(REDIGERARE, (tx) =>
          tx.query('select public.spara_egen_ratt($1, null, $2, $3::jsonb)', [tur, 'Rätt med okänd vara', JSON.stringify([{ vara: 'Okänd', gram: 10, varukatalog: crypto.randomUUID() }])]),
        ),
      )
    })
  })

  describe('reglerna från felsökningen av matdelen', () => {
    let egen: string
    let paseRatt: string
    let rad: string
    let vara: string
    let ingrediens: string

    beforeAll(async () => {
      egen = await nyRatt(AGARE, tur, 'Regelgryta')
      vara = await nyVara(AGARE, tur, 'Regelvara')
      await nyIngrediens(AGARE, tur, egen, vara)
      ingrediens = (await db.query<{ id: string }>('select id from public.ingredienser where ratt_id = $1', [egen])).rows[0].id
      paseRatt = await nyRatt(AGARE, tur, 'Testmat Regelpåse', await nyPase('Regelpåse'))
      rad = (
        await som(AGARE, (tx) => tx.query<{ id: string }>(`insert into public.maltider (tur_id, dag, maltid, ratt_id) values ($1, 2, 'lunch', $2) returning id`, [tur, egen]))
      ).rows[0].id
    })

    it('bara personer bär en rad, och en person som blir hund släpper raderna hen bar', async () => {
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [hund, rad])))
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>("insert into public.deltagare (tur_id, namn) values ($1, 'Blir hund och bär') returning id", [tur]))
      await som(AGARE, (tx) => tx.query('update public.maltider set bars_av = $1 where id = $2', [p.rows[0].id, rad]))
      // Redigeraren ändrar typen på en person utan konto, och raden blir utan bärare.
      await som(REDIGERARE, (tx) => tx.query("update public.deltagare set typ = 'hund' where id = $1", [p.rows[0].id]))
      expect((await db.query('select bars_av from public.maltider where id = $1', [rad])).rows).toEqual([{ bars_av: null }])
    })

    it('ta_ratt och slapp_ratt med tomt id ger fel, och redigerare och ägare tar en rad själva', async () => {
      await forvantaFel(som(LASARE, (tx) => tx.query('select public.ta_ratt(null)')))
      await forvantaFel(som(LASARE, (tx) => tx.query('select public.slapp_ratt(null)')))
      const ta = async (vem: string) => (await som(vem, (tx) => tx.query<{ ok: boolean }>('select public.ta_ratt($1) as ok', [rad]))).rows[0].ok
      expect(await ta(REDIGERARE)).toBe(true)
      // Ägaren tar inte en rad som redigeraren bär.
      expect(await ta(AGARE)).toBe(false)
      await som(REDIGERARE, (tx) => tx.query('select public.slapp_ratt($1)', [rad]))
      expect(await ta(AGARE)).toBe(true)
      await som(AGARE, (tx) => tx.query('select public.slapp_ratt($1)', [rad]))
    })

    it('en bock på en rätt gäller bara påsar, och läsaren bockar av en påse åt sig själv', async () => {
      await forvantaFel(som(AGARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, ratt_id) values ($1, $2, $3)', [tur, lisa, egen])))
      await som(LASARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, ratt_id) values ($1, $2, $3)', [tur, lasarensDeltagare, paseRatt]))
      expect((await db.query('select 1 from public.inkop_klart where ratt_id = $1 and deltagare_id = $2', [paseRatt, lasarensDeltagare])).rows).toHaveLength(1)
    })

    it('en påse får inga ingredienser, och en rätt med ingredienser blir ingen påse', async () => {
      await forvantaFel(som(AGARE, (tx) => tx.query('insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values ($1, $2, $3, 50)', [tur, paseRatt, vara])))
      await forvantaFel(som(AGARE, async (tx) => tx.query('update public.ratter set matprodukt_id = (select matprodukt_id from public.ratter where id = $2) where id = $1', [egen, paseRatt])))
    })

    it('gränserna för gram, kcal och protein gäller också utan spara_egen_ratt', async () => {
      for (const gram of [0, 5001, 2_000_000_000]) {
        await forvantaFel(som(AGARE, (tx) => tx.query('update public.ingredienser set gram_per_portion = $1 where id = $2', [gram, ingrediens])))
      }
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.varor set kcal_per_100g = 901 where id = $1', [vara])))
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.varor set protein_per_100g = 100.5 where id = $1', [vara])))
      const ok = await som(AGARE, (tx) => tx.query('update public.varor set kcal_per_100g = 900, protein_per_100g = 100 where id = $1', [vara]))
      expect(ok.affectedRows).toBe(1)
    })

    it('läsaren ändrar inte rätter, ingredienser eller måltider, och den som inte är med ändrar och tar bort ingenting', async () => {
      for (const [sql, params] of [
        ["update public.ratter set namn = 'Läsarens' where id = $1", [egen]],
        ['update public.ingredienser set gram_per_portion = 10 where id = $1', [ingrediens]],
        ['update public.maltider set dag = 3 where id = $1', [rad]],
      ] as const) {
        const r = await som(LASARE, (tx) => tx.query(sql, [...params]))
        expect(r.affectedRows, sql).toBe(0)
      }
      for (const tabell of ['ratter', 'varor', 'ingredienser', 'maltider']) {
        const u = await som(UTOMSTAENDE, (tx) => tx.query(`update public.${tabell} set tur_id = tur_id where tur_id = $1`, [tur]))
        const d = await som(UTOMSTAENDE, (tx) => tx.query(`delete from public.${tabell} where tur_id = $1`, [tur]))
        expect([u.affectedRows, d.affectedRows], tabell).toEqual([0, 0])
      }
    })

    it('redigeraren flyttar inte en rad till en tur hen inte är med i', async () => {
      const ingen = await skapaTur(UTOMSTAENDE, 'Utomståendes tur')
      for (const [tabell, id] of [
        ['ratter', egen],
        ['varor', vara],
        ['maltider', rad],
      ] as const) {
        await forvantaFel(som(REDIGERARE, (tx) => tx.query(`update public.${tabell} set tur_id = $1 where id = $2`, [ingen, id])).then((r) => {
          if (r.affectedRows === 0) throw new Error('stoppad')
        }))
      }
    })

    it('ratter.ansvarig blir tom när deltagaren tas bort', async () => {
      const p = await som(AGARE, (tx) => tx.query<{ id: string }>("insert into public.deltagare (tur_id, namn) values ($1, 'Ansvarig en stund') returning id", [tur]))
      await som(AGARE, (tx) => tx.query('update public.ratter set ansvarig = $1 where id = $2', [p.rows[0].id, paseRatt]))
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [p.rows[0].id]))
      expect((await db.query('select ansvarig from public.ratter where id = $1', [paseRatt])).rows).toEqual([{ ansvarig: null }])
    })

    it('matkatalogen går inte att ändra för inloggade, och anon når inte kostbehoven', async () => {
      const har = async (roll: string, tabell: string, r: string) =>
        (await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [roll, tabell, r])).rows[0].ok
      for (const r of ['insert', 'update', 'delete', 'truncate']) expect(await har('authenticated', 'public.matprodukter', r), r).toBe(false)
      for (const r of ['select', 'insert', 'update', 'delete']) expect(await har('anon', 'public.kostbehov', r), r).toBe(false)
    })

    it('bockarna försvinner när turen raderas', async () => {
      const t = await skapaTur(AGARE, 'Tur som raderas med bockar')
      const v = await nyVara(AGARE, t, 'Bockvara som försvinner')
      const d = await deltagareFor(t, AGARE)
      await som(AGARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, vara_id) values ($1, $2, $3)', [t, d, v]))
      await som(AGARE, (tx) => tx.query('delete from public.turer where id = $1', [t]))
      expect((await db.query('select 1 from public.inkop_klart where tur_id = $1', [t])).rows).toHaveLength(0)
    })
  })

  describe('kostbehov', () => {
    // Samtycket sparas som en tidpunkt när personen själv sparar sina kostbehov.
    const satt = (vem: string, deltagare: string, utan = `array['gluten']`) =>
      som(vem, (tx) =>
        tx.query(`insert into public.kostbehov (deltagare_id, glutenfri, utan, samtycke_tid) values ($1, true, ${utan}, now())`, [deltagare]),
      )
    const andra = (vem: string, deltagare: string) =>
      som(vem, (tx) => tx.query('update public.kostbehov set vegansk = true, vegetarisk = true where deltagare_id = $1', [deltagare]))
    const taBort = (vem: string, deltagare: string) => som(vem, (tx) => tx.query('delete from public.kostbehov where deltagare_id = $1', [deltagare]))
    const nyPlatshallare = async (namn: string) => {
      const r = await som(AGARE, (tx) => tx.query<{ id: string }>('insert into public.deltagare (tur_id, namn) values ($1, $2) returning id', [tur, namn]))
      return r.rows[0].id
    }

    beforeAll(async () => {
      await satt(REDIGERARE, redigerarensDeltagare)
      await satt(AGARE, agarensDeltagare)
    })

    it('var och en kan ange, ändra och ta bort sina egna, även läsaren', async () => {
      await satt(LASARE, lasarensDeltagare, `array['notter']`)
      expect((await andra(LASARE, lasarensDeltagare)).affectedRows).toBe(1)
      expect((await taBort(LASARE, lasarensDeltagare)).affectedRows).toBe(1)
      await satt(LASARE, lasarensDeltagare, `array['notter']`)
    })

    it('får alltid en tidpunkt för samtycket, satt av databasen', async () => {
      const kod = await kodFor(tur)
      await som(NYKOMLING, (tx) => tx.query('select public.ga_med($1)', [kod]))
      const nykomling = await deltagareFor(tur, NYKOMLING)
      await som(NYKOMLING, (tx) => tx.query('insert into public.kostbehov (deltagare_id, glutenfri) values ($1, true)', [nykomling]))
      await som(REDIGERARE, (tx) => tx.query('update public.kostbehov set samtycke_tid = null where deltagare_id = $1', [redigerarensDeltagare]))
      const r = await db.query<{ satt: boolean }>('select bool_and(samtycke_tid is not null) as satt from public.kostbehov where deltagare_id = any($1)', [
        [nykomling, redigerarensDeltagare],
      ])
      expect(r.rows).toEqual([{ satt: true }])
    })

    it('alla i turen ser dem, men ingen utanför', async () => {
      for (const vem of [AGARE, REDIGERARE, LASARE]) {
        const r = await som(vem, (tx) => tx.query('select deltagare_id from public.kostbehov where deltagare_id = $1', [redigerarensDeltagare]))
        expect(r.rows, vem).toHaveLength(1)
      }
      const r = await som(UTOMSTAENDE, (tx) => tx.query('select deltagare_id from public.kostbehov'))
      expect(r.rows).toHaveLength(0)
      await forvantaFel(somAnon((tx) => tx.query('select deltagare_id from public.kostbehov')))
    })

    it('ingen kan ange, ändra eller ta bort någon annans, inte ens ägaren', async () => {
      for (const [vem, deltagare] of [
        [AGARE, redigerarensDeltagare],
        [AGARE, lasarensDeltagare],
        [REDIGERARE, agarensDeltagare],
        [REDIGERARE, lasarensDeltagare],
        [LASARE, agarensDeltagare],
        [UTOMSTAENDE, agarensDeltagare],
      ]) {
        expect((await andra(vem, deltagare)).affectedRows, `${vem} ändrar`).toBe(0)
        expect((await taBort(vem, deltagare)).affectedRows, `${vem} tar bort`).toBe(0)
      }
      await forvantaFel(satt(AGARE, await deltagareFor(tur, NYKOMLING)))
      await forvantaFel(satt(REDIGERARE, await deltagareFor(tur, NYKOMLING)))
    })

    it('ingen anger kostbehov för en person utan konto, inte ägaren, redigeraren, läsaren eller någon utanför', async () => {
      const platshallare = await nyPlatshallare('Utan konto')
      for (const vem of [AGARE, REDIGERARE, LASARE, UTOMSTAENDE]) await forvantaFel(satt(vem, platshallare))
      await forvantaFel(satt(AGARE, lisa))
      await forvantaFel(satt(AGARE, hund))
    })

    it('ingen kan flytta sina kostbehov till någon annan', async () => {
      await forvantaFel(som(LASARE, (tx) => tx.query('update public.kostbehov set deltagare_id = $1 where deltagare_id = $2', [lisa, lasarensDeltagare])))
      const nykomling = await deltagareFor(tur, NYKOMLING)
      await forvantaFel(som(LASARE, (tx) => tx.query('update public.kostbehov set deltagare_id = $1 where deltagare_id = $2', [nykomling, lasarensDeltagare])))
    })

    it('tar bara emot de 14 allergenerna', async () => {
      await forvantaFel(som(LASARE, (tx) => tx.query(`update public.kostbehov set utan = array['jordgubbar'] where deltagare_id = $1`, [lasarensDeltagare])))
    })

    it('den som tar över en person utan konto kan sedan ange sina egna', async () => {
      const platshallare = await nyPlatshallare('Övertagen')
      const kod = await kodFor(tur)
      await som(TAR_OVER, (tx) => tx.query('select public.ga_med($1, $2)', [kod, platshallare]))
      await satt(TAR_OVER, platshallare)
      expect((await andra(AGARE, platshallare)).affectedRows).toBe(0)
      expect((await andra(TAR_OVER, platshallare)).affectedRows).toBe(1)
    })

    it('databasen sätter tiden för samtycket, också när appen skickar en annan', async () => {
      await som(REDIGERARE, (tx) => tx.query(`update public.kostbehov set samtycke_tid = '2099-01-01' where deltagare_id = $1`, [redigerarensDeltagare]))
      const r = await db.query<{ ok: boolean }>('select samtycke_tid <= now() as ok from public.kostbehov where deltagare_id = $1', [redigerarensDeltagare])
      expect(r.rows).toEqual([{ ok: true }])
    })

    it('appens upsert fungerar för den egna raden men inte för någon annans', async () => {
      const upsert = (vem: string, deltagare: string) =>
        som(vem, (tx) =>
          tx.query(
            `insert into public.kostbehov (deltagare_id, laktosfri, samtycke_tid) values ($1, true, now())
             on conflict (deltagare_id) do update set laktosfri = excluded.laktosfri, samtycke_tid = excluded.samtycke_tid`,
            [deltagare],
          ),
        )
      await upsert(REDIGERARE, redigerarensDeltagare)
      await forvantaFel(upsert(AGARE, redigerarensDeltagare))
    })

    it('ingen kan flytta sina kostbehov till sin egen rad i en annan tur, eftersom samtycket gäller en tur', async () => {
      const iAnnanTur = await deltagareFor(annanTur, AGARE)
      await forvantaFel(som(AGARE, (tx) => tx.query('update public.kostbehov set deltagare_id = $1 where deltagare_id = $2', [iAnnanTur, agarensDeltagare])))
    })

    it('den som är med i en annan tur ser bara sina egna kostbehov där, inte turens', async () => {
      const kod = await kodFor(annanTur)
      await som(UTOMSTAENDE, (tx) => tx.query('select public.ga_med($1)', [kod]))
      await satt(UTOMSTAENDE, await deltagareFor(annanTur, UTOMSTAENDE))
      const r = await som(UTOMSTAENDE, (tx) => tx.query<{ deltagare_id: string }>('select deltagare_id from public.kostbehov'))
      expect(r.rows.map((x) => x.deltagare_id)).toEqual([await deltagareFor(annanTur, UTOMSTAENDE)])
    })

    it('den som lämnar turen själv tar sina kostbehov med sig', async () => {
      // Nykomlingen sparade sina kostbehov i testet om tidpunkten ovan.
      const nykomling = await deltagareFor(tur, NYKOMLING)
      expect((await db.query('select 1 from public.kostbehov where deltagare_id = $1', [nykomling])).rows).toHaveLength(1)
      await som(NYKOMLING, (tx) => tx.query('delete from public.deltagare where id = $1', [nykomling]))
      expect((await db.query('select 1 from public.kostbehov where deltagare_id = $1', [nykomling])).rows).toHaveLength(0)
    })

    it('en borttagen deltagare förlorar åtkomsten och kostbehoven raderas', async () => {
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [lasarensDeltagare]))
      const kvar = await db.query('select 1 from public.kostbehov where deltagare_id = $1', [lasarensDeltagare])
      expect(kvar.rows).toHaveLength(0)
      for (const tabell of ['kostbehov', 'maltider', 'ratter', 'maltid_atare', 'inkop_klart', 'varor', 'ingredienser']) {
        const r = await som(LASARE, (tx) => tx.query(`select 1 from public.${tabell}`))
        expect(r.rows, tabell).toHaveLength(0)
      }
      const rad = (await db.query<{ id: string }>('select id from public.maltider where tur_id = $1 and bars_av is null limit 1', [tur])).rows[0].id
      await forvantaFel(som(LASARE, (tx) => tx.query('select public.ta_ratt($1)', [rad])))
      await forvantaFel(som(LASARE, (tx) => tx.query('select public.slapp_ratt($1)', [rad])))
      const vara = (await db.query<{ id: string }>('select id from public.varor where tur_id = $1 limit 1', [tur])).rows[0].id
      await forvantaFel(som(LASARE, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, vara_id) values ($1, $2, $3)', [tur, lasarensDeltagare, vara])))
      // Inte heller funktionerna för egna rätter släpper fram den som inte är med längre.
      await forvantaFel(som(LASARE, (tx) => tx.query(`select public.spara_egen_ratt($1, null, 'Smygrätt', '[]'::jsonb)`, [tur])))
      const egen = (await db.query<{ id: string }>('select id from public.ratter where tur_id = $1 and matprodukt_id is null limit 1', [tur])).rows[0].id
      await som(LASARE, (tx) => tx.query('select public.ta_bort_egen_ratt($1)', [egen])).catch(() => null)
      expect((await db.query('select 1 from public.ratter where id = $1', [egen])).rows).toHaveLength(1)
    })

    it('en borttagen redigerare förlorar rätten att ändra', async () => {
      const d = await deltagareFor(tur, REDIGERARE)
      await som(AGARE, (tx) => tx.query('delete from public.deltagare where id = $1', [d]))
      const r = await som(REDIGERARE, (tx) => tx.query("update public.ratter set namn = namn || ' ändrad' where tur_id = $1", [tur]))
      expect(r.affectedRows).toBe(0)
      await forvantaFel(som(REDIGERARE, (tx) => tx.query(`select public.spara_egen_ratt($1, null, 'Efteråt', '[]'::jsonb)`, [tur])))
    })
  })
})

describe('ett konto som raderas', () => {
  // Egna användare: Kim raderar sitt konto. Jon och Mia är med i Kims turer.
  const KIM = '00000000-0000-0000-0000-000000000ab1'
  const JON = '00000000-0000-0000-0000-000000000ab2'
  const MIA = '00000000-0000-0000-0000-000000000ab3'
  let medAndra: string
  let ensam: string
  let somRedigerare: string
  let kimsRad: string
  let platshallare: string
  let tvaAgare: string
  let lasareForst: string
  let kimsMaltid: string

  const deltagare = async (t: string) =>
    (await db.query<{ user_id: string | null; roll: string; namn: string }>('select user_id, roll, namn from public.deltagare where tur_id = $1 order by namn', [t])).rows

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values ('${KIM}', 'kim@exempel.se'), ('${JON}', 'jon@exempel.se'), ('${MIA}', 'mia@exempel.se')`)
    // Kim äger en tur med Jon och Mia (Jon gick med först) och en person utan konto, och har kostbehov där.
    medAndra = await skapaTur(KIM, 'Kims tur med andra')
    const kod = await kodFor(medAndra)
    await som(JON, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(MIA, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(KIM, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, sortering) values ($1, 'Utan konto', 0)`, [medAndra]))
    kimsRad = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [medAndra, KIM])).rows[0].id
    await som(KIM, (tx) => tx.query(`insert into public.kostbehov (deltagare_id, glutenfri) values ($1, true)`, [kimsRad]))
    // En tur där ingen annan har konto.
    ensam = await skapaTur(KIM, 'Kims egen tur')
    await som(KIM, (tx) => tx.query(`insert into public.deltagare (tur_id, namn) values ($1, 'Bara namn')`, [ensam]))
    // En tur där Kim är redigerare hos Jon.
    somRedigerare = await skapaTur(JON, 'Jons tur')
    const jonsKod = await kodFor(somRedigerare)
    await som(KIM, (tx) => tx.query('select public.ga_med($1)', [jonsKod]))
    // Kim bär en rad, äter den ensam och har bockat av den i den första turen.
    const r = await som(KIM, (tx) => tx.query<{ id: string }>(`insert into public.ratter (tur_id, namn) values ($1, 'Kims gröt') returning id`, [medAndra]))
    kimsMaltid = (
      await som(KIM, (tx) =>
        tx.query<{ id: string }>(`insert into public.maltider (tur_id, dag, maltid, ratt_id, bars_av) values ($1, 1, 'frukost', $2, $3) returning id`, [medAndra, r.rows[0].id, kimsRad]),
      )
    ).rows[0].id
    await som(KIM, (tx) => tx.query('insert into public.maltid_atare (tur_id, maltid_id, deltagare_id) values ($1, $2, $3)', [medAndra, kimsMaltid, kimsRad]))
    const v = await som(KIM, (tx) => tx.query<{ id: string }>(`insert into public.varor (tur_id, namn) values ($1, 'Kims havregryn') returning id`, [medAndra]))
    await som(KIM, (tx) => tx.query('insert into public.inkop_klart (tur_id, deltagare_id, vara_id) values ($1, $2, $3)', [medAndra, kimsRad, v.rows[0].id]))
    // En tur där Kim har gjort en platshållare utan konto till ägare, och Jon är redigerare.
    platshallare = await skapaTur(KIM, 'Kims tur med platshållare')
    const p = await som(KIM, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Pelle') returning id`, [platshallare]))
    await som(KIM, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [p.rows[0].id]))
    const pk = await kodFor(platshallare)
    await som(JON, (tx) => tx.query('select public.ga_med($1)', [pk]))
    // En tur där Kim och Jon båda är ägare, och Mia redigerare.
    tvaAgare = await skapaTur(KIM, 'Kims och Jons tur')
    const tk = await kodFor(tvaAgare)
    await som(JON, (tx) => tx.query('select public.ga_med($1)', [tk]))
    await som(MIA, (tx) => tx.query('select public.ga_med($1)', [tk]))
    await som(KIM, (tx) => tx.query(`update public.deltagare set roll = 'owner' where tur_id = $1 and user_id = $2`, [tvaAgare, JON]))
    // En tur där Jon gick med först men är läsare, och Mia är redigerare.
    lasareForst = await skapaTur(KIM, 'Kims tur med läsare först')
    const lk = await kodFor(lasareForst)
    await som(JON, (tx) => tx.query('select public.ga_med($1)', [lk]))
    await som(MIA, (tx) => tx.query('select public.ga_med($1)', [lk]))
    await som(KIM, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where tur_id = $1 and user_id = $2`, [lasareForst, JON]))
  })

  it('tar bort personen och kostbehoven, gör nästa med konto till ägare och raderar turen där ingen annan har konto', async () => {
    await db.query('delete from auth.users where id = $1', [KIM])

    // Jon gick med först och blir ägare. Mia är kvar som redigerare, och personen utan konto är kvar.
    const kvar = await deltagare(medAndra)
    expect(kvar.map((d) => [d.user_id, d.roll]).sort()).toEqual([
      [JON, 'owner'],
      [MIA, 'editor'],
      [null, 'editor'],
    ].sort())
    expect((await db.query('select 1 from public.kostbehov where deltagare_id = $1', [kimsRad])).rows).toHaveLength(0)
    // Den nya ägaren kan ändra roller som en ägare.
    const mia = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [medAndra, MIA])).rows[0].id
    const ok = await som(JON, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [mia]))
    expect(ok.affectedRows).toBe(1)

    // Turen där ingen annan hade konto finns inte längre.
    expect(await turnamn(ensam)).toBeUndefined()
    // I Jons tur försvinner bara Kims rad.
    expect((await deltagare(somRedigerare)).map((d) => d.user_id)).toEqual([JON])
    expect(await turnamn(somRedigerare)).toBe('Jons tur')
    // Turen som Kim skapade finns kvar utan skapare.
    expect((await db.query('select skapad_av from public.turer where id = $1', [medAndra])).rows).toEqual([{ skapad_av: null }])
    // Ätarna och bockarna försvinner med Kims rad. Raden Kim bar blir utan bärare och ligger kvar i turen.
    expect((await db.query('select 1 from public.maltid_atare where deltagare_id = $1', [kimsRad])).rows).toHaveLength(0)
    expect((await db.query('select 1 from public.inkop_klart where deltagare_id = $1', [kimsRad])).rows).toHaveLength(0)
    expect((await db.query('select tur_id, bars_av from public.maltider where id = $1', [kimsMaltid])).rows).toEqual([{ tur_id: medAndra, bars_av: null }])
    // Profilen försvinner med kontot.
    expect((await db.query('select 1 from public.profiler where id = $1', [KIM])).rows).toHaveLength(0)
  })

  it('en ägare utan konto räknas inte, en annan ägare med konto behålls, och en redigerare går före en läsare', async () => {
    // Platshållaren Pelle var ägare, men utan konto. Jon blir ägare.
    expect((await deltagare(platshallare)).map((d) => [d.user_id, d.roll]).sort()).toEqual([
      [JON, 'owner'],
      [null, 'owner'],
    ].sort())
    // Jon var redan ägare. Mia förblir redigerare.
    expect((await deltagare(tvaAgare)).map((d) => [d.user_id, d.roll]).sort()).toEqual([
      [JON, 'owner'],
      [MIA, 'editor'],
    ].sort())
    // Jon gick med först men är läsare, så Mia, som är redigerare, blir ägare.
    expect((await deltagare(lasareForst)).map((d) => [d.user_id, d.roll]).sort()).toEqual([
      [JON, 'viewer'],
      [MIA, 'owner'],
    ].sort())
  })

  it('undantaget för ägarbyte gäller bara när en ny ägare utses vid en kontoradering', async () => {
    const t = await skapaTur(JON, 'Jons tur med två ägare')
    const kod = await kodFor(t)
    await som(MIA, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const mia = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [t, MIA])).rows[0].id
    await som(JON, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [mia]))
    // Även med inställningen satt går det inte att nedgradera en ägare utan att vara ägare.
    await forvantaFel(
      db.transaction(async (tx) => {
        await tx.query(`select set_config('minvandring.konto_raderas', 'x', true)`)
        return tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [mia])
      }),
    )
    // En redigerare får ändra en rad utan konto, men inte dess roll.
    const p = await som(JON, (tx) => tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn) values ($1, 'Platshållare') returning id`, [t]))
    await som(JON, (tx) => tx.query(`update public.deltagare set roll = 'editor' where id = $1`, [mia]))
    await forvantaFel(som(MIA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [p.rows[0].id])))
  })

  it('ingen inloggad kan själv göra någon till ägare utan att vara ägare', async () => {
    const t = await skapaTur(JON, 'Jons andra tur')
    const kod = await kodFor(t)
    await som(MIA, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const mia = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [t, MIA])).rows[0].id
    const forsok = (p: Promise<unknown>) => p.catch(() => null)
    await forsok(som(MIA, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [mia])))
    // Inte heller som anon, eller med rollen authenticated utan inloggning, som när auth.uid() är tom.
    await forsok(somAnon((tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [mia])))
    await forsok(
      db.transaction(async (tx) => {
        await tx.exec('set local role authenticated;')
        return tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [mia])
      }),
    )
    expect((await db.query('select roll from public.deltagare where id = $1', [mia])).rows).toEqual([{ roll: 'editor' }])
  })
})

describe('matplanens migrering mot befintliga rader', () => {
  // Migreringen byter namn med ett nytt datum innan den körs, så den hittas på namnet och inte på datumet.
  const matplan = fs.readdirSync(path.join(import.meta.dirname, 'migrations')).find((f) => f.endsWith('_matplan.sql'))!
  let gammal: PGlite

  const antal = async (sql: string) => (await gammal.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0].n

  beforeAll(async () => {
    gammal = await nyDatabas((f) => f < matplan)
    // Rader som de gamla policyerna släppte igenom: en måltid utan rätt, en måltid och en ingrediens som pekar
    // in i en annan tur och en vara med en ansvarig från en annan tur.
    await gammal.exec(`
      insert into auth.users (id, email) values ('${A}', 'anna@exempel.se');
      insert into public.turer (id, namn, skapad_av) values
        ('00000000-0000-0000-0000-0000000000a1', 'Tur ett', '${A}'),
        ('00000000-0000-0000-0000-0000000000a2', 'Tur två', '${A}');
      insert into public.ratter (id, tur_id, namn) values
        ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'Gröt'),
        ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', 'Annan gröt');
      insert into public.varor (id, tur_id, namn, ansvarig) values
        ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Havregryn',
          (select id from public.deltagare where tur_id = '00000000-0000-0000-0000-0000000000a1')),
        ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', 'Russin',
          (select id from public.deltagare where tur_id = '00000000-0000-0000-0000-0000000000a2')),
        ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000a2', 'Annat mjöl', null);
      insert into public.ingredienser (ratt_id, vara_id, gram_per_portion) values
        ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1', 90),
        ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c3', 10);
      insert into public.maltider (tur_id, dag, maltid, ratt_id) values
        ('00000000-0000-0000-0000-0000000000a1', 1, 'frukost', '00000000-0000-0000-0000-0000000000b1'),
        ('00000000-0000-0000-0000-0000000000a1', 1, 'lunch', null),
        ('00000000-0000-0000-0000-0000000000a1', 1, 'middag', '00000000-0000-0000-0000-0000000000b2');
    `)
    await korMigreringar(gammal, (f) => f >= matplan)
  })

  it('går igenom och behåller det som hör till rätt tur', async () => {
    expect(await antal(`public.maltider where ratt_id = '00000000-0000-0000-0000-0000000000b1'`)).toBe(1)
    expect(await antal(`public.ingredienser where vara_id = '00000000-0000-0000-0000-0000000000c1' and tur_id = '00000000-0000-0000-0000-0000000000a1'`)).toBe(1)
    expect(await antal(`public.varor where ansvarig is not null`)).toBe(1)
  })

  it('tar bort måltider utan rätt och det som pekar in i en annan tur', async () => {
    expect(await antal('public.maltider')).toBe(1)
    expect(await antal('public.ingredienser')).toBe(1)
    expect(await antal(`public.varor where id = '00000000-0000-0000-0000-0000000000c2' and ansvarig is null`)).toBe(1)
  })
})

describe('migreringen för vem som bär, mot befintliga rader', () => {
  const fil = fs.readdirSync(path.join(import.meta.dirname, 'migrations')).find((f) => f.endsWith('_vem_ater_och_bar.sql'))!
  let gammal: PGlite
  const T = '00000000-0000-0000-0000-0000000000d1'
  const id = (n: string) => `00000000-0000-0000-0000-0000000000${n}`
  const barsAv = async (rad: string) => (await gammal.query<{ bars_av: string | null }>('select bars_av from public.maltider where id = $1', [rad])).rows[0].bars_av

  beforeAll(async () => {
    gammal = await nyDatabas((f) => f < fil)
    // Ägaren och Lisa i samma tur. En påse med ansvarig, en egen rätt där alla varor har samma ansvariga och en där
    // varorna har olika eller saknar ansvarig.
    await gammal.exec(`
      insert into auth.users (id, email) values ('${A}', 'anna@exempel.se');
      insert into public.turer (id, namn, skapad_av) values ('${T}', 'Gammal tur', '${A}');
      insert into public.deltagare (id, tur_id, namn) values ('${id('e1')}', '${T}', 'Lisa');
      insert into public.matprodukter (id, marke, namn, maltid, vikt_torr_g, kcal, kalla)
        values ('${id('f1')}', 'Test', 'Påse', 'lunch_middag', 150, 600, 'https://exempel.se'),
          ('${id('f2')}', 'Test', 'Påse två', 'lunch_middag', 150, 600, 'https://exempel.se');
      insert into public.ratter (id, tur_id, namn, matprodukt_id, ansvarig) values
        ('${id('b1')}', '${T}', 'Test Påse', '${id('f1')}', '${id('e1')}'),
        ('${id('b2')}', '${T}', 'Gröt', null, null),
        ('${id('b3')}', '${T}', 'Soppa', null, null),
        ('${id('b4')}', '${T}', 'Test Påse två', '${id('f2')}', null);
      insert into public.varor (id, tur_id, namn, ansvarig) values
        ('${id('c1')}', '${T}', 'Havre', '${id('e1')}'),
        ('${id('c2')}', '${T}', 'Russin', '${id('e1')}'),
        ('${id('c3')}', '${T}', 'Buljong', '${id('e1')}'),
        ('${id('c4')}', '${T}', 'Nudlar', null);
      insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values
        ('${T}', '${id('b2')}', '${id('c1')}', 90), ('${T}', '${id('b2')}', '${id('c2')}', 10),
        ('${T}', '${id('b3')}', '${id('c3')}', 10), ('${T}', '${id('b3')}', '${id('c4')}', 80);
      insert into public.maltider (id, tur_id, dag, maltid, ratt_id) values
        ('${id('a1')}', '${T}', 1, 'lunch', '${id('b1')}'),
        ('${id('a2')}', '${T}', 1, 'frukost', '${id('b2')}'),
        ('${id('a3')}', '${T}', 1, 'middag', '${id('b3')}'),
        ('${id('a4')}', '${T}', 2, 'lunch', '${id('b4')}'),
        ('${id('a5')}', '${T}', 2, 'frukost', '${id('b2')}');
    `)
    await korMigreringar(gammal, (f) => f >= fil)
  })

  it('påsens ansvariga bär påsen, och en påse utan ansvarig bärs av ingen', async () => {
    expect(await barsAv(id('a1'))).toBe(id('e1'))
    expect(await barsAv(id('a4'))).toBeNull()
  })

  it('en egen rätt bärs av den ansvariga när alla varor har samma, annars av ingen', async () => {
    expect(await barsAv(id('a2'))).toBe(id('e1'))
    // Samma rätt i en måltid till får samma bärare.
    expect(await barsAv(id('a5'))).toBe(id('e1'))
    expect(await barsAv(id('a3'))).toBeNull()
  })

  it('ingen rad får ätare, så alla äter som förut', async () => {
    expect((await gammal.query('select 1 from public.maltid_atare')).rows).toHaveLength(0)
  })
})

describe('handlingslistans nycklar i databasen', () => {
  const tillatna = async (tabell: string, kolumn: string) => {
    const r = await db.query<{ def: string }>(
      `select pg_get_constraintdef(c.oid) as def from pg_constraint c
        where c.conrelid = $1::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) like '%' || $2 || '%ANY%'`,
      [`public.${tabell}`, kolumn],
    )
    return [...(r.rows[0]?.def ?? '').matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1])
  }

  it('enheterna i ingredienser och receptrader är desamma som i src/lib/handla.ts', async () => {
    expect(await tillatna('ingredienser', 'enhet')).toEqual([...ENHETER])
    expect(await tillatna('receptrader', 'enhet')).toEqual([...ENHETER])
  })

  it('avdelningarna i varor är desamma som i src/lib/handla.ts', async () => {
    expect(await tillatna('varor', 'avdelning')).toEqual(AVDELNINGAR.map((a) => a.nyckel))
  })
})

describe('handlingslistans migrering mot befintliga rader', () => {
  const fil = fs.readdirSync(path.join(import.meta.dirname, 'migrations')).find((f) => f.endsWith('_handlingslista.sql'))!
  let gammal: PGlite
  const T = '00000000-0000-0000-0000-0000000000e1'

  beforeAll(async () => {
    gammal = await nyDatabas((f) => f < fil)
    await gammal.exec(`
      insert into auth.users (id, email) values ('${A}', 'anna@exempel.se');
      insert into public.turer (id, namn, skapad_av) values ('${T}', 'Gammal tur', '${A}');
      insert into public.ratter (id, tur_id, namn) values ('00000000-0000-0000-0000-0000000000e2', '${T}', 'Gröt');
      insert into public.varor (id, tur_id, namn) values ('00000000-0000-0000-0000-0000000000e3', '${T}', 'Havregryn');
      insert into public.varor (id, tur_id, namn) values ('00000000-0000-0000-0000-0000000000e5', '${T}', 'Salt');
      insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values
        ('${T}', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e3', 90),
        ('${T}', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e5', 0);
      insert into public.recept (id, user_id, namn) values ('00000000-0000-0000-0000-0000000000e4', '${A}', 'Gammalt recept');
      update public.varor set klart = true where id = '00000000-0000-0000-0000-0000000000e3';
      insert into public.deltagare (id, tur_id, namn) values
        ('00000000-0000-0000-0000-0000000000e6', '${T}', 'Lisa'),
        ('00000000-0000-0000-0000-0000000000f6', '${T}', 'Erik');
      -- Russin: i två rätter som bärs av Lisa och Erik, och i en rätt till som Lisa bär. Två bockar.
      -- Nötter: avbockad med Erik som ansvarig, men ingen bär en rad med dem. Erik får bocken.
      -- Soppa: en egen rätt med ratter.klart, som inte ger någon bock.
      insert into public.ratter (id, tur_id, namn, klart) values
        ('00000000-0000-0000-0000-0000000000f1', '${T}', 'Müsli', false),
        ('00000000-0000-0000-0000-0000000000f2', '${T}', 'Kaka', false),
        ('00000000-0000-0000-0000-0000000000f3', '${T}', 'Soppa', true),
        ('00000000-0000-0000-0000-0000000000f7', '${T}', 'Nötmix', false);
      insert into public.varor (id, tur_id, namn, klart, ansvarig) values
        ('00000000-0000-0000-0000-0000000000f4', '${T}', 'Russin', true, null),
        ('00000000-0000-0000-0000-0000000000f5', '${T}', 'Nötter', true, '00000000-0000-0000-0000-0000000000f6');
      insert into public.ingredienser (tur_id, ratt_id, vara_id, gram_per_portion) values
        ('${T}', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f4', 20),
        ('${T}', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f4', 10),
        ('${T}', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f4', 5),
        ('${T}', '00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000f5', 30);
      insert into public.maltider (tur_id, dag, maltid, ratt_id, bars_av) values
        ('${T}', 2, 'mellanmal', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000f6'),
        ('${T}', 3, 'mellanmal', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000e6'),
        ('${T}', 3, 'middag', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000e6'),
        ('${T}', 3, 'lunch', '00000000-0000-0000-0000-0000000000f7', null);
      insert into public.matprodukter (id, marke, namn, maltid, vikt_torr_g, kcal, kalla)
        values ('00000000-0000-0000-0000-0000000000e7', 'Test', 'Påse', 'lunch_middag', 150, 600, 'https://exempel.se');
      insert into public.ratter (id, tur_id, namn, matprodukt_id, klart)
        values ('00000000-0000-0000-0000-0000000000e8', '${T}', 'Test Påse', '00000000-0000-0000-0000-0000000000e7', true);
      insert into public.maltider (tur_id, dag, maltid, ratt_id, bars_av) values
        ('${T}', 1, 'frukost', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e6'),
        ('${T}', 2, 'frukost', '00000000-0000-0000-0000-0000000000e2', null),
        ('${T}', 1, 'lunch', '00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-0000000000e6');
      insert into public.receptrader (recept_id, user_id, vara, gram_per_portion)
        values ('00000000-0000-0000-0000-0000000000e4', '${A}', 'Bulgur', 80);
    `)
    await korMigreringar(gammal, (f) => f >= fil)
  })

  it('flyttar befintliga bockar till den som bär raden, och behåller de gamla kolumnerna', async () => {
    const r = await gammal.query('select deltagare_id, vara_id, ratt_id from public.inkop_klart order by vara_id nulls last, deltagare_id')
    expect(r.rows).toEqual([
      // Havregryn: Lisa bär gröten dag 1.
      { deltagare_id: '00000000-0000-0000-0000-0000000000e6', vara_id: '00000000-0000-0000-0000-0000000000e3', ratt_id: null },
      // Russin: en bock var för Lisa och Erik, och bara en för Lisa fast hon bär två rätter med russin.
      { deltagare_id: '00000000-0000-0000-0000-0000000000e6', vara_id: '00000000-0000-0000-0000-0000000000f4', ratt_id: null },
      { deltagare_id: '00000000-0000-0000-0000-0000000000f6', vara_id: '00000000-0000-0000-0000-0000000000f4', ratt_id: null },
      // Nötter: ingen bär dem, så den ansvariga Erik får bocken.
      { deltagare_id: '00000000-0000-0000-0000-0000000000f6', vara_id: '00000000-0000-0000-0000-0000000000f5', ratt_id: null },
      // Påsen: Lisa bär den. Soppan är en egen rätt och ger ingen bock.
      { deltagare_id: '00000000-0000-0000-0000-0000000000e6', vara_id: null, ratt_id: '00000000-0000-0000-0000-0000000000e8' },
    ])
    expect((await gammal.query('select klart from public.varor where klart')).rows).toHaveLength(3)
  })

  it('ger befintliga ingredienser och receptrader mängden i gram, och tar inte bort något', async () => {
    expect((await gammal.query("select mangd, enhet, gram_per_portion from public.ingredienser where vara_id in ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000e5') order by gram_per_portion")).rows).toEqual([
      { mangd: null, enhet: null, gram_per_portion: 0 },
      { mangd: '90.00', enhet: 'g', gram_per_portion: 90 },
    ])
    expect((await gammal.query('select mangd, enhet, gram_per_portion from public.receptrader')).rows).toEqual([{ mangd: '80.00', enhet: 'g', gram_per_portion: 80 }])
  })
})

describe('skafferiet', () => {
  // Egna användare: Sara och Tor delar en tur, Ulla tas bort på slutet.
  const SARA = '00000000-0000-0000-0000-000000000031'
  const TOR = '00000000-0000-0000-0000-000000000032'
  const ULLA = '00000000-0000-0000-0000-000000000033'
  let gryta: string
  let grot: string
  let sarasRad: string

  const nyPase = async (namn: string) => {
    const r = await db.query<{ id: string }>(
      `insert into public.matprodukter (marke, namn, maltid, vikt_torr_g, kcal, kalla) values ('Skafferitest', $1, 'lunch_middag', 150, 600, 'https://exempel.se/pase') returning id`,
      [namn],
    )
    return r.rows[0].id
  }

  const sarasSkafferi = () => db.query<{ antal: number; user_id: string }>('select antal, user_id from public.skafferi where id = $1', [sarasRad])

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values ('${SARA}', 'sara@exempel.se'), ('${TOR}', 'tor@exempel.se'), ('${ULLA}', 'ulla@exempel.se')`)
    // Sara och Tor delar en tur. Det ska inte ge Tor någon åtkomst till Saras skafferi.
    const tur = await skapaTur(SARA, 'Tur med skafferi')
    const kod = await kodFor(tur)
    await som(TOR, (tx) => tx.query('select public.ga_med($1)', [kod]))
    gryta = await nyPase('Skafferigryta')
    grot = await nyPase('Skafferigröt')
    const r = await som(SARA, (tx) =>
      tx.query<{ id: string }>(`insert into public.skafferi (matprodukt_id, antal, bast_fore) values ($1, 2, '2027-06-01') returning id`, [gryta]),
    )
    sarasRad = r.rows[0].id
    await som(SARA, (tx) => tx.query('insert into public.matfavoriter (matprodukt_id) values ($1)', [gryta]))
  })

  it('raden blir ens egen utan att user_id anges, och man ser den själv', async () => {
    expect((await sarasSkafferi()).rows).toEqual([{ antal: 2, user_id: SARA }])
    const r = await som(SARA, (tx) => tx.query<{ id: string }>('select id from public.skafferi'))
    expect(r.rows.map((x) => x.id)).toEqual([sarasRad])
    const f = await som(SARA, (tx) => tx.query<{ matprodukt_id: string; user_id: string }>('select matprodukt_id, user_id from public.matfavoriter'))
    expect(f.rows).toEqual([{ matprodukt_id: gryta, user_id: SARA }])
  })

  it('ägaren kan ändra antal och datum och ta bort', async () => {
    const andrad = await som(SARA, (tx) => tx.query(`update public.skafferi set antal = 3, bast_fore = null where id = $1`, [sarasRad]))
    expect(andrad.affectedRows).toBe(1)
    const r = await som(SARA, (tx) => tx.query<{ id: string }>('insert into public.skafferi (matprodukt_id) values ($1) returning id', [grot]))
    const borta = await som(SARA, (tx) => tx.query('delete from public.skafferi where id = $1', [r.rows[0].id]))
    expect(borta.affectedRows).toBe(1)
    await som(SARA, (tx) => tx.query('insert into public.matfavoriter (matprodukt_id) values ($1)', [grot]))
    const ingenFavorit = await som(SARA, (tx) => tx.query('delete from public.matfavoriter where matprodukt_id = $1', [grot]))
    expect(ingenFavorit.affectedRows).toBe(1)
  })

  it('någon annan ser inte skafferiet eller favoriterna, inte ens i samma tur', async () => {
    for (const vem of [TOR, C]) {
      expect((await som(vem, (tx) => tx.query('select id from public.skafferi'))).rows).toHaveLength(0)
      expect((await som(vem, (tx) => tx.query('select matprodukt_id from public.matfavoriter'))).rows).toHaveLength(0)
    }
  })

  it('någon annan kan inte ändra eller ta bort raderna', async () => {
    const andrad = await som(TOR, (tx) => tx.query('update public.skafferi set antal = 99 where id = $1', [sarasRad]))
    expect(andrad.affectedRows).toBe(0)
    const borta = await som(TOR, (tx) => tx.query('delete from public.skafferi where id = $1', [sarasRad]))
    expect(borta.affectedRows).toBe(0)
    const favorit = await som(TOR, (tx) => tx.query('delete from public.matfavoriter where matprodukt_id = $1', [gryta]))
    expect(favorit.affectedRows).toBe(0)
    expect((await sarasSkafferi()).rows).toEqual([{ antal: 3, user_id: SARA }])
  })

  it('man kan inte lägga något hos någon annan eller ge bort sina rader', async () => {
    const rls = /row-level security/
    await expect(som(TOR, (tx) => tx.query(`insert into public.skafferi (matprodukt_id, user_id) values ($1, '${SARA}')`, [grot]))).rejects.toThrow(rls)
    await expect(som(TOR, (tx) => tx.query(`insert into public.matfavoriter (matprodukt_id, user_id) values ($1, '${SARA}')`, [grot]))).rejects.toThrow(rls)
    await expect(som(SARA, (tx) => tx.query(`update public.skafferi set user_id = '${TOR}' where id = $1`, [sarasRad]))).rejects.toThrow(rls)
    // En favorit går inte att ändra alls, bara lägga till och ta bort.
    await forvantaFel(som(SARA, (tx) => tx.query(`update public.matfavoriter set user_id = '${TOR}' where matprodukt_id = $1`, [gryta])))
    expect((await sarasSkafferi()).rows[0].user_id).toBe(SARA)
  })

  it('går inte att nå utan inloggning', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.skafferi')))
    await forvantaFel(somAnon((tx) => tx.query('select matprodukt_id from public.matfavoriter')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.skafferi (matprodukt_id, user_id) values ($1, '${SARA}')`, [grot])))
    await forvantaFel(somAnon((tx) => tx.query('update public.skafferi set antal = 5')))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.skafferi')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.matfavoriter (matprodukt_id, user_id) values ($1, '${SARA}')`, [grot])))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.matfavoriter')))
  })

  it('har bara de avsedda rättigheterna: inget för anon, och favoriter ändras inte', async () => {
    const har = async (roll: string, tabell: string, rattighet: string) =>
      (await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [roll, tabell, rattighet])).rows[0].ok
    for (const r of ['select', 'insert', 'update', 'delete']) {
      expect(await har('anon', 'public.skafferi', r)).toBe(false)
      expect(await har('anon', 'public.matfavoriter', r)).toBe(false)
      expect(await har('authenticated', 'public.skafferi', r)).toBe(true)
    }
    expect(await har('authenticated', 'public.matfavoriter', 'update')).toBe(false)
  })

  it('kräver ett antal mellan 1 och 999, en påse i katalogen och en rad per påse', async () => {
    const r = await som(SARA, (tx) => tx.query<{ id: string }>('insert into public.skafferi (matprodukt_id) values ($1) returning id', [grot]))
    const grotRad = r.rows[0].id
    await forvantaFel(som(SARA, (tx) => tx.query('insert into public.skafferi (matprodukt_id, antal) values ($1, 0)', [crypto.randomUUID()])))
    await forvantaFel(som(SARA, (tx) => tx.query('update public.skafferi set antal = 0 where id = $1', [grotRad])))
    await forvantaFel(som(SARA, (tx) => tx.query('update public.skafferi set antal = 1000 where id = $1', [grotRad])))
    expect((await som(SARA, (tx) => tx.query('update public.skafferi set antal = 999 where id = $1', [grotRad]))).affectedRows).toBe(1)
    await forvantaFel(som(SARA, (tx) => tx.query('insert into public.skafferi (matprodukt_id) values ($1)', [crypto.randomUUID()])))
    // Samma påse två gånger, både som ny rad och genom att byta påse på en befintlig.
    const unik = (p: Promise<unknown>) => expect(p).rejects.toMatchObject({ code: '23505' })
    await unik(som(SARA, (tx) => tx.query('insert into public.skafferi (matprodukt_id) values ($1)', [grot])))
    await unik(som(SARA, (tx) => tx.query('update public.skafferi set matprodukt_id = $1 where id = $2', [grot, sarasRad])))
    await som(SARA, (tx) => tx.query('insert into public.matfavoriter (matprodukt_id) values ($1) on conflict do nothing', [gryta]))
    await unik(som(SARA, (tx) => tx.query('insert into public.matfavoriter (matprodukt_id) values ($1)', [gryta])))
    await som(SARA, (tx) => tx.query('delete from public.skafferi where id = $1', [grotRad]))
  })

  it('raderna försvinner när påsen tas bort ur katalogen', async () => {
    const pase = await nyPase('Skafferiutgående')
    await som(ULLA, async (tx) => {
      await tx.query('insert into public.skafferi (matprodukt_id) values ($1)', [pase])
      await tx.query('insert into public.matfavoriter (matprodukt_id) values ($1)', [pase])
    })
    await db.query('delete from public.matprodukter where id = $1', [pase])
    expect((await db.query('select 1 from public.skafferi where matprodukt_id = $1', [pase])).rows).toHaveLength(0)
    expect((await db.query('select 1 from public.matfavoriter where matprodukt_id = $1', [pase])).rows).toHaveLength(0)
  })

  it('skafferiet och favoriterna försvinner när kontot tas bort', async () => {
    await som(ULLA, async (tx) => {
      await tx.query('insert into public.skafferi (matprodukt_id) values ($1)', [grot])
      await tx.query('insert into public.matfavoriter (matprodukt_id) values ($1)', [grot])
    })
    await db.query('delete from auth.users where id = $1', [ULLA])
    expect((await db.query('select 1 from public.skafferi where user_id = $1', [ULLA])).rows).toHaveLength(0)
    expect((await db.query('select 1 from public.matfavoriter where user_id = $1', [ULLA])).rows).toHaveLength(0)
  })
})
describe('egna recept', () => {
  // Egna användare: Vera och Wilma delar en tur, Xenia tas bort på slutet.
  const VERA = '00000000-0000-0000-0000-000000000041'
  const WILMA = '00000000-0000-0000-0000-000000000042'
  const XENIA = '00000000-0000-0000-0000-000000000043'
  let verasRecept: string
  let verasRad: string

  const nyttRecept = async (vem: string, namn: string) =>
    (await som(vem, (tx) => tx.query<{ id: string }>('insert into public.recept (namn) values ($1) returning id', [namn]))).rows[0].id

  const nyRad = async (vem: string, recept: string, vara: string) =>
    (
      await som(vem, (tx) =>
        tx.query<{ id: string }>(
          'insert into public.receptrader (recept_id, vara, gram_per_portion, kcal_per_100g, protein_per_100g) values ($1, $2, 90, 380, 12.5) returning id',
          [recept, vara],
        ),
      )
    ).rows[0].id

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values ('${VERA}', 'vera@exempel.se'), ('${WILMA}', 'wilma@exempel.se'), ('${XENIA}', 'xenia@exempel.se')`)
    // Vera och Wilma delar en tur. Det ska inte ge Wilma någon åtkomst till Veras recept.
    const tur = await skapaTur(VERA, 'Tur med recept')
    const kod = await kodFor(tur)
    await som(WILMA, (tx) => tx.query('select public.ga_med($1)', [kod]))
    verasRecept = await nyttRecept(VERA, 'Veras gryta')
    verasRad = await nyRad(VERA, verasRecept, 'Couscous')
  })

  it('receptet och raderna blir ens egna utan att user_id anges, och man ser dem själv', async () => {
    const r = await som(VERA, (tx) => tx.query<{ namn: string; user_id: string }>('select namn, user_id from public.recept'))
    expect(r.rows).toEqual([{ namn: 'Veras gryta', user_id: VERA }])
    const rader = await som(VERA, (tx) => tx.query<{ vara: string; user_id: string }>('select vara, user_id from public.receptrader'))
    expect(rader.rows).toEqual([{ vara: 'Couscous', user_id: VERA }])
  })

  it('ägaren kan ändra och ta bort recept och rader', async () => {
    const id = await nyttRecept(VERA, 'Tillfälligt')
    const rad = await nyRad(VERA, id, 'Havregryn')
    expect((await som(VERA, (tx) => tx.query('update public.receptrader set gram_per_portion = 100 where id = $1', [rad]))).affectedRows).toBe(1)
    expect((await som(VERA, (tx) => tx.query(`update public.recept set namn = 'Tillfälligt nytt' where id = $1`, [id]))).affectedRows).toBe(1)
    expect((await som(VERA, (tx) => tx.query('delete from public.receptrader where id = $1', [rad]))).affectedRows).toBe(1)
    expect((await som(VERA, (tx) => tx.query('delete from public.recept where id = $1', [id]))).affectedRows).toBe(1)
  })

  it('raderna försvinner med receptet', async () => {
    const id = await nyttRecept(VERA, 'Försvinner')
    await nyRad(VERA, id, 'Ris')
    await som(VERA, (tx) => tx.query('delete from public.recept where id = $1', [id]))
    expect((await db.query('select 1 from public.receptrader where recept_id = $1', [id])).rows).toHaveLength(0)
  })

  it('någon annan ser inte recepten, inte ens i samma tur', async () => {
    for (const vem of [WILMA, C]) {
      expect((await som(vem, (tx) => tx.query('select id from public.recept'))).rows).toHaveLength(0)
      expect((await som(vem, (tx) => tx.query('select id from public.receptrader'))).rows).toHaveLength(0)
    }
  })

  it('någon annan kan inte ändra eller ta bort recepten', async () => {
    expect((await som(WILMA, (tx) => tx.query(`update public.recept set namn = 'Wilmas nu' where id = $1`, [verasRecept]))).affectedRows).toBe(0)
    expect((await som(WILMA, (tx) => tx.query('update public.receptrader set gram_per_portion = 1 where id = $1', [verasRad]))).affectedRows).toBe(0)
    expect((await som(WILMA, (tx) => tx.query('delete from public.receptrader where id = $1', [verasRad]))).affectedRows).toBe(0)
    expect((await som(WILMA, (tx) => tx.query('delete from public.recept where id = $1', [verasRecept]))).affectedRows).toBe(0)
    const r = await db.query<{ namn: string }>('select namn from public.recept where id = $1', [verasRecept])
    expect(r.rows).toEqual([{ namn: 'Veras gryta' }])
  })

  it('man kan inte lägga något hos någon annan eller ge bort sina recept', async () => {
    const rls = /row-level security/
    await expect(som(WILMA, (tx) => tx.query(`insert into public.recept (namn, user_id) values ('Smugglat', '${VERA}')`))).rejects.toThrow(rls)
    // En rad i någon annans recept: med sitt eget user_id stoppas den av nyckeln, med ägarens av RLS.
    // Felet är detsamma oavsett om varan finns i receptet, så att det inte avslöjar något om innehållet.
    for (const vara of ['Smuggel', 'Couscous', 'COUSCOUS'])
      await expect(
        som(WILMA, (tx) => tx.query('insert into public.receptrader (recept_id, vara, gram_per_portion) values ($1, $2, 10)', [verasRecept, vara])),
      ).rejects.toMatchObject({ code: '23503' })
    await expect(
      som(WILMA, (tx) => tx.query(`insert into public.receptrader (recept_id, user_id, vara, gram_per_portion) values ($1, '${VERA}', 'Smuggel', 10)`, [verasRecept])),
    ).rejects.toThrow(rls)
    await expect(som(VERA, (tx) => tx.query(`update public.recept set user_id = '${WILMA}' where id = $1`, [verasRecept]))).rejects.toThrow(rls)
    await expect(som(VERA, (tx) => tx.query(`update public.receptrader set user_id = '${WILMA}' where id = $1`, [verasRad]))).rejects.toThrow(rls)
    // En egen rad kan inte flyttas in i någon annans recept.
    const wilmas = await nyttRecept(WILMA, 'Wilmas soppa')
    await expect(som(VERA, (tx) => tx.query('update public.receptrader set recept_id = $1 where id = $2', [wilmas, verasRad]))).rejects.toMatchObject({ code: '23503' })
    const r = await db.query<{ recept_id: string; user_id: string }>('select recept_id, user_id from public.receptrader where id = $1', [verasRad])
    expect(r.rows).toEqual([{ recept_id: verasRecept, user_id: VERA }])
  })

  it('går inte att nå utan inloggning', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.recept')))
    await forvantaFel(somAnon((tx) => tx.query('select id from public.receptrader')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.recept (namn, user_id) values ('Anonymt', '${VERA}')`)))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.receptrader')))
    await forvantaFel(somAnon((tx) => tx.query(`update public.recept set namn = 'Anonymt'`)))
    await forvantaFel(somAnon((tx) => tx.query('update public.receptrader set gram_per_portion = 1')))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.recept')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.receptrader (recept_id, user_id, vara, gram_per_portion) values ($1, '${VERA}', 'Anonym', 10)`, [verasRecept])))
  })

  it('någon annan kan inte läsa ett recept genom att ange id:t', async () => {
    expect((await som(WILMA, (tx) => tx.query('select id from public.recept where id = $1', [verasRecept]))).rows).toHaveLength(0)
    expect((await som(WILMA, (tx) => tx.query('select id from public.receptrader where recept_id = $1', [verasRecept]))).rows).toHaveLength(0)
  })

  it('har bara de avsedda rättigheterna: inget för anon', async () => {
    const har = async (roll: string, tabell: string, rattighet: string) =>
      (await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [roll, tabell, rattighet])).rows[0].ok
    for (const r of ['select', 'insert', 'update', 'delete'])
      for (const t of ['public.recept', 'public.receptrader']) {
        expect(await har('anon', t, r)).toBe(false)
        expect(await har('authenticated', t, r)).toBe(true)
      }
  })

  it('kräver namn, ett namn en gång per person, och gränserna från formuläret', async () => {
    const unik = (p: Promise<unknown>) => expect(p).rejects.toMatchObject({ code: '23505' })
    await forvantaFel(som(VERA, (tx) => tx.query(`insert into public.recept (namn) values ('  ')`)))
    await forvantaFel(som(VERA, (tx) => tx.query('insert into public.recept (namn) values ($1)', ['x'.repeat(81)])))
    await unik(som(VERA, (tx) => tx.query(`insert into public.recept (namn) values ('VERAS GRYTA')`)))
    // Samma namn går bra för någon annan.
    await nyttRecept(WILMA, 'Veras gryta')
    const fel = (kolumner: string, varden: string) =>
      forvantaFel(som(VERA, (tx) => tx.query(`insert into public.receptrader (recept_id, ${kolumner}) values ($1, ${varden})`, [verasRecept])))
    await fel('vara, gram_per_portion', `' ', 10`)
    await fel('vara, gram_per_portion', `'Noll', 0`)
    await fel('vara, gram_per_portion', `'För mycket', 5001`)
    await fel('vara, gram_per_portion, kcal_per_100g', `'Kcal', 10, 901`)
    await fel('vara, gram_per_portion, protein_per_100g', `'Protein', 10, 100.1`)
    await unik(som(VERA, (tx) => tx.query(`insert into public.receptrader (recept_id, vara, gram_per_portion) values ($1, 'COUSCOUS', 10)`, [verasRecept])))
    // Mellanslag i början och slutet sparas inte, så samma namn går inte att få in två gånger.
    await forvantaFel(som(VERA, (tx) => tx.query(`insert into public.recept (namn) values (' Veras gryta')`)))
    await fel('vara, gram_per_portion', `'Couscous ', 10`)
    await fel('vara, gram_per_portion', `'${'x'.repeat(81)}', 10`)
    await fel('vara, gram_per_portion, kcal_per_100g', `'Minus kcal', 10, -1`)
    await fel('vara, gram_per_portion, protein_per_100g', `'Minus protein', 10, -0.1`)
    // Ett annat recept kan inte döpas om till ett namn man redan har, och en rad kan inte ändras till fel värde.
    const annat = await nyttRecept(VERA, 'Veras soppa')
    await unik(som(VERA, (tx) => tx.query(`update public.recept set namn = 'VERAS GRYTA' where id = $1`, [annat])))
    await forvantaFel(som(VERA, (tx) => tx.query('update public.receptrader set gram_per_portion = 0 where id = $1', [verasRad])))
  })

  it('tar emot värdena på gränserna och tomma kcal och protein', async () => {
    const id = await nyttRecept(VERA, 'x'.repeat(80))
    const lagg = (vara: string, gram: number, kcal: number | null, protein: number | null) =>
      som(VERA, (tx) =>
        tx.query('insert into public.receptrader (recept_id, vara, gram_per_portion, kcal_per_100g, protein_per_100g) values ($1, $2, $3, $4, $5)', [id, vara, gram, kcal, protein]),
      )
    await lagg('y'.repeat(80), 1, 0, 0)
    await lagg('Max', 5000, 900, 100)
    await lagg('Okänd', 10, null, null)
    expect((await som(VERA, (tx) => tx.query('select id from public.receptrader where recept_id = $1', [id]))).rows).toHaveLength(3)
  })

  // Sparar receptet och alla rader i en transaktion, så att ett ändrat recept aldrig blir utan ingredienser.
  describe('spara_recept', () => {
    type Rad = { vara: string; gram: number; kcal?: number | null; protein?: number | null }
    const spara = async (vem: string, r: string | null, namn: string, rader: Rad[]) =>
      (
        await som(vem, (tx) =>
          tx.query<{ id: string }>('select public.spara_recept($1::uuid, $2::text, $3::jsonb) as id', [
            r,
            namn,
            JSON.stringify(rader.map((x) => ({ kcal: null, protein: null, ...x }))),
          ]),
        )
      ).rows[0].id

    const raderI = async (recept: string) =>
      (
        await db.query<{ vara: string; gram_per_portion: number; kcal_per_100g: number | null; protein_per_100g: string | null; sortering: number }>(
          'select vara, gram_per_portion, kcal_per_100g, protein_per_100g, sortering from public.receptrader where recept_id = $1 order by sortering',
          [recept],
        )
      ).rows

    const receptnamn = async (id: string) => (await db.query<{ namn: string }>('select namn from public.recept where id = $1', [id])).rows[0]?.namn

    it('sparar ett nytt recept och ändrar det med alla rader på nytt, i ordning', async () => {
      const id = await spara(VERA, null, 'Spara gryta', [{ vara: 'Couscous', gram: 90, kcal: 360, protein: 12.5 }, { vara: 'Ajvar', gram: 40 }])
      expect(await raderI(id)).toEqual([
        { vara: 'Couscous', gram_per_portion: 90, kcal_per_100g: 360, protein_per_100g: '12.5', sortering: 0 },
        { vara: 'Ajvar', gram_per_portion: 40, kcal_per_100g: null, protein_per_100g: null, sortering: 1 },
      ])
      expect(await spara(VERA, id, 'Sparad gryta', [{ vara: 'Bulgur', gram: 80 }])).toBe(id)
      expect(await receptnamn(id)).toBe('Sparad gryta')
      expect((await raderI(id)).map((r) => r.vara)).toEqual(['Bulgur'])
      const agare = await db.query<{ user_id: string }>('select user_id from public.recept where id = $1', [id])
      expect(agare.rows).toEqual([{ user_id: VERA }])
    })

    it('sparar ingenting när något går fel mitt i', async () => {
      const id = await spara(VERA, null, 'Orört recept', [{ vara: 'Linser', gram: 70 }])
      await forvantaFel(spara(VERA, id, 'Nytt namn', [{ vara: 'Nudlar', gram: 60 }, { vara: 'Fel', gram: 0 }]))
      await forvantaFel(spara(VERA, id, 'Nytt namn', [{ vara: 'Nudlar', gram: 60 }, { vara: 'NUDLAR', gram: 10 }]))
      for (const rader of ['{"vara": "Ris", "gram": 10}', '"Ris"'])
        await forvantaFel(som(VERA, (tx) => tx.query(`select public.spara_recept($1, 'Nytt namn', $2::jsonb)`, [id, rader])))
      expect(await receptnamn(id)).toBe('Orört recept')
      expect((await raderI(id)).map((r) => r.vara)).toEqual(['Linser'])

      await forvantaFel(spara(VERA, null, 'Aldrig sparat', [{ vara: 'Kikärtor', gram: 50 }, { vara: 'x'.repeat(81), gram: 10 }]))
      await forvantaFel(spara(VERA, null, 'orört RECEPT', [{ vara: 'Kikärtor', gram: 50 }]))
      expect((await db.query(`select 1 from public.recept where namn = 'Aldrig sparat'`)).rows).toHaveLength(0)
    })

    it('stoppar tomt namn, för långt namn och samma namn två gånger, oavsett stora och små bokstäver', async () => {
      await forvantaFel(spara(VERA, null, '   ', []))
      await forvantaFel(spara(VERA, null, 'x'.repeat(81), []))
      await spara(VERA, null, 'Unikt recept', [])
      await forvantaFel(spara(VERA, null, 'UNIKT RECEPT', []))
      expect((await spara(VERA, null, 'y'.repeat(80), [])).length).toBeGreaterThan(0)
    })

    it('sparar ett recept utan rader, och rader med mängd och enhet', async () => {
      const tomt = await spara(VERA, null, 'Tomt recept', [])
      expect(await raderI(tomt)).toEqual([])
      const r = (
        await som(VERA, (tx) =>
          tx.query<{ id: string }>('select public.spara_recept(null, $1::text, $2::jsonb) as id', [
            'Recept med mängder',
            JSON.stringify([{ vara: 'Mjöl', mangd: 1.5, enhet: 'dl', gram: 90 }, { vara: 'Pasta', mangd: 0.12, enhet: 'kg' }, { vara: 'Salt' }]),
          ]),
        )
      ).rows[0].id
      const rader = await db.query('select vara, mangd, enhet, gram_per_portion from public.receptrader where recept_id = $1 order by sortering', [r])
      expect(rader.rows).toEqual([
        { vara: 'Mjöl', mangd: '1.50', enhet: 'dl', gram_per_portion: 90 },
        { vara: 'Pasta', mangd: '0.12', enhet: 'kg', gram_per_portion: 120 },
        { vara: 'Salt', mangd: null, enhet: null, gram_per_portion: null },
      ])
      for (const rad of [
        { vara: 'Ris', mangd: 1, enhet: 'kopp' },
        { vara: 'Ris', mangd: 1 },
        { vara: 'Ris', mangd: 6, enhet: 'kg' },
        { vara: 'Ris', mangd: 0, enhet: 'st' },
      ])
        await forvantaFel(som(VERA, (tx) => tx.query(`select public.spara_recept(null, 'Stoppas recept', $1::jsonb)`, [JSON.stringify([rad])])))
      expect((await db.query(`select 1 from public.recept where namn = 'Stoppas recept'`)).rows).toHaveLength(0)
      const avrundat = (
        await som(VERA, (tx) => tx.query<{ id: string }>(`select public.spara_recept(null, 'Avrundat recept', '[{"vara": "Pasta", "mangd": 0.125, "enhet": "kg"}]'::jsonb) as id`))
      ).rows[0].id
      expect((await db.query('select mangd, gram_per_portion from public.receptrader where recept_id = $1', [avrundat])).rows).toEqual([{ mangd: '0.13', gram_per_portion: 130 }])
    })

    it('kan inte ändra någon annans recept, och inte skapa ett utan inloggning', async () => {
      const fore = await raderI(verasRecept)
      await forvantaFel(spara(WILMA, verasRecept, 'Wilmas nu', [{ vara: 'Smuggel', gram: 10 }]))
      expect(await receptnamn(verasRecept)).toBe('Veras gryta')
      expect(await raderI(verasRecept)).toEqual(fore)
      await forvantaFel(somAnon((tx) => tx.query(`select public.spara_recept(null, 'Anonymt', '[{"vara": "Ris", "gram": 10}]'::jsonb)`)))
      await forvantaFel(spara(WILMA, verasRecept, 'Wilmas nu', []))
      expect(await raderI(verasRecept)).toEqual(fore)
    })
  })

  it('recepten försvinner när kontot tas bort', async () => {
    const id = await nyttRecept(XENIA, 'Xenias gröt')
    await nyRad(XENIA, id, 'Havregryn')
    await db.query('delete from auth.users where id = $1', [XENIA])
    expect((await db.query('select 1 from public.recept where user_id = $1', [XENIA])).rows).toHaveLength(0)
    expect((await db.query('select 1 from public.receptrader where user_id = $1', [XENIA])).rows).toHaveLength(0)
  })
})

describe('packlistan', () => {
  // Egna användare, så att försöken att gå med i de andra testerna inte räknas mot spärren här.
  const PA = '00000000-0000-0000-0000-0000000000b1'
  const PB = '00000000-0000-0000-0000-0000000000b2'
  const PC = '00000000-0000-0000-0000-0000000000b3'
  const PD = '00000000-0000-0000-0000-0000000000b4'
  let tur: string
  let annanTur: string
  let anna: string
  let cilla: string
  let david: string
  let annanPerson: string
  let sovsack: string
  let talt: string
  let gemensamKarta: string

  const status = (rad: string, deltagare: string) =>
    db.query<{ packad: boolean; namn: string | null; vikt_g: number | null }>(
      'select packad, namn, vikt_g from public.packstatus where packrad_id = $1 and deltagare_id = $2',
      [rad, deltagare],
    )

  beforeAll(async () => {
    await db.exec(
      `insert into auth.users (id, email) values ('${PA}', 'pa@exempel.se'), ('${PB}', 'pb@exempel.se'), ('${PC}', 'pc@exempel.se'), ('${PD}', 'pd@exempel.se');`,
    )
    tur = await skapaTur(PA, 'Packtur')
    const kod = await kodFor(tur)
    await som(PC, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(PD, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const d = await db.query<{ id: string; user_id: string }>('select id, user_id from public.deltagare where tur_id = $1', [tur])
    anna = d.rows.find((r) => r.user_id === PA)!.id
    cilla = d.rows.find((r) => r.user_id === PC)!.id
    david = d.rows.find((r) => r.user_id === PD)!.id
    await som(PA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [david]))

    annanTur = await skapaTur(PB, 'Någon annans tur')
    const p = await som(PB, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Okänd', 'person') returning id`, [annanTur]),
    )
    annanPerson = p.rows[0].id

    const r = await som(PA, (tx) =>
      tx.query<{ id: string; namn: string }>(
        `insert into public.packrader (tur_id, namn, kategori, underkategori, alla) values ($1, 'Sovsäck', 'sova', 'sovsack', true)
         returning id, namn`,
        [tur],
      ),
    )
    sovsack = r.rows[0].id
    const t = await som(PC, (tx) =>
      tx.query<{ id: string }>(
        `insert into public.packrader (tur_id, namn, kategori, vikt_g, gemensam, bars_av) values ($1, 'Tält', 'talt', 1800, true, $2) returning id`,
        [tur, anna],
      ),
    )
    talt = t.rows[0].id
  })

  it('en rad har förrådets kategori och en underkategori som hör till den', async () => {
    const r = await db.query<{ kategori: string }>(`select kategori from public.packrader where id = $1`, [sovsack])
    expect(r.rows[0].kategori).toBe('sova')
    await forvantaFel(som(PA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, kategori) values ($1, 'Grej', 'Övrigt')`, [tur])))
    await forvantaFel(
      som(PA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, kategori, underkategori) values ($1, 'Grej', 'talt', 'sovsack')`, [tur])),
    )
    const utan = await som(PA, (tx) => tx.query<{ kategori: string }>(`insert into public.packrader (tur_id, namn) values ($1, 'Grej') returning kategori`, [tur]))
    expect(utan.rows[0].kategori).toBe('ovrigt')
  })

  it('en rad kan inte både vara gemensam och något som alla ska ha, och namnet får inte vara tomt', async () => {
    await forvantaFel(som(PA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, gemensam, alla) values ($1, 'Kåsa', true, true)`, [tur])))
    await forvantaFel(som(PA, (tx) => tx.query(`insert into public.packrader (tur_id, namn) values ($1, '  ')`, [tur])))
  })

  it('den som bär en rad måste vara med i turen', async () => {
    await forvantaFel(
      som(PA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, bars_av) values ($1, 'Kök', $2)`, [tur, annanPerson])),
    )
    await forvantaFel(som(PA, (tx) => tx.query(`update public.packrader set bars_av = $2 where id = $1`, [talt, annanPerson])))
  })

  it('en bock måste gälla en packrad och en deltagare i samma tur', async () => {
    await forvantaFel(
      som(PA, (tx) =>
        tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [sovsack, annanPerson, tur]),
      ),
    )
    // Fel tur på raden går inte heller, även om man har rätt att ändra den turen.
    await forvantaFel(
      som(PB, (tx) =>
        tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [sovsack, annanPerson, annanTur]),
      ),
    )
  })

  it('en läsare väljer sin egen sovsäck och bockar av den, men inte någon annans', async () => {
    await som(PD, (tx) =>
      tx.query(`insert into public.packstatus (packrad_id, deltagare_id, tur_id, namn, vikt_g) values ($1, $2, $3, 'Mammut Nordic', 980)`, [
        sovsack,
        david,
        tur,
      ]),
    )
    await som(PD, (tx) => tx.query('update public.packstatus set packad = true where packrad_id = $1 and deltagare_id = $2', [sovsack, david]))
    expect((await status(sovsack, david)).rows[0]).toEqual({ packad: true, namn: 'Mammut Nordic', vikt_g: 980 })

    await forvantaFel(
      som(PD, (tx) =>
        tx.query(`insert into public.packstatus (packrad_id, deltagare_id, tur_id, namn) values ($1, $2, $3, 'Smygbyte')`, [sovsack, cilla, tur]),
      ),
    )
    await som(PA, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [sovsack, cilla, tur]))
    const r = await som(PD, (tx) => tx.query(`update public.packstatus set vikt_g = 1 where packrad_id = $1 and deltagare_id = $2`, [sovsack, cilla]))
    expect(r.affectedRows).toBe(0)
  })

  it('en läsare kan inte flytta sin bock till någon annan', async () => {
    await expect(
      som(PD, (tx) => tx.query('update public.packstatus set deltagare_id = $3 where packrad_id = $1 and deltagare_id = $2', [sovsack, david, anna])),
    ).rejects.toThrow(/row-level security/)
    expect((await status(sovsack, david)).rows).toHaveLength(1)
  })

  it('en läsare kan inte flytta sin bock till en packrad eller tur där hen inte hör hemma', async () => {
    // David är också med i en annan tur, med en egen packrad där.
    const egenTur = await skapaTur(PD, 'Davids egen tur')
    const r = await som(PD, (tx) => tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn) values ($1, 'Kåsa') returning id`, [egenTur]))
    await forvantaFel(
      som(PD, (tx) =>
        tx.query('update public.packstatus set packrad_id = $3, tur_id = $4 where packrad_id = $1 and deltagare_id = $2', [sovsack, david, r.rows[0].id, egenTur]),
      ),
    )
    await forvantaFel(
      som(PD, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [r.rows[0].id, david, egenTur])),
    )
    expect((await status(sovsack, david)).rows).toHaveLength(1)
  })

  it('en läsare tar bort sin egen bock men inte någon annans', async () => {
    await som(PD, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [talt, david, tur]))
    const egen = await som(PD, (tx) => tx.query('delete from public.packstatus where packrad_id = $1 and deltagare_id = $2', [talt, david]))
    expect(egen.affectedRows).toBe(1)
    const annans = await som(PD, (tx) => tx.query('delete from public.packstatus where packrad_id = $1 and deltagare_id = $2', [sovsack, cilla]))
    expect(annans.affectedRows).toBe(0)
  })

  it('en läsare kan inte ändra packraderna', async () => {
    const r = await som(PD, (tx) => tx.query(`update public.packrader set vikt_g = 1 where id = $1`, [talt]))
    expect(r.affectedRows).toBe(0)
    await forvantaFel(som(PD, (tx) => tx.query(`insert into public.packrader (tur_id, namn) values ($1, 'Läsarens sak')`, [tur])))
  })

  it('en redigerare ändrar allas rader och bockar', async () => {
    await som(PC, (tx) => tx.query(`update public.packrader set bars_av = $2 where id = $1`, [talt, cilla]))
    await som(PC, (tx) => tx.query(`update public.packstatus set namn = 'Lånad sovsäck', vikt_g = 1200 where packrad_id = $1 and deltagare_id = $2`, [sovsack, david]))
    expect((await status(sovsack, david)).rows[0]).toMatchObject({ namn: 'Lånad sovsäck', vikt_g: 1200 })
  })

  it('vem som helst i turen, även en läsare, tar på sig en gemensam sak som ingen bär, och släpper den igen', async () => {
    const k = await som(PA, (tx) =>
      tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn, kategori, gemensam) values ($1, 'Kök', 'kok', true) returning id`, [tur]),
    )
    const kok = k.rows[0].id
    const rad = async () =>
      (await db.query<{ bars_av: string | null; namn: string; gemensam: boolean; dubblett_ok: boolean }>(
        'select bars_av, namn, gemensam, dubblett_ok from public.packrader where id = $1',
        [kok],
      )).rows[0]

    await som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [kok]))
    expect(await rad()).toEqual({ bars_av: david, namn: 'Kök', gemensam: true, dubblett_ok: false })
    // Att trycka igen ger inget fel.
    await som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [kok]))
    // Ingen kan ta en sak som någon annan redan tar med, eller släppa någon annans.
    await expect(som(PC, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [kok]))).rejects.toThrow(/tar redan med/)
    await expect(som(PC, (tx) => tx.query('select public.ta_med_gemensam($1, false)', [kok]))).rejects.toThrow(/tar inte med/)
    expect((await rad()).bars_av).toBe(david)

    await som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, false)', [kok]))
    expect((await rad()).bars_av).toBeNull()
    // Att släppa något som ingen bär går inte.
    await expect(som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, false)', [kok]))).rejects.toThrow(/tar inte med/)
  })

  it('funktionen rör inte rader som inte är gemensamma, och fungerar inte för den som står utanför', async () => {
    const r = await som(PA, (tx) => tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn) values ($1, 'Annas pannlampa') returning id`, [tur]))
    await expect(som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [r.rows[0].id]))).rejects.toThrow(/är inte gemensam/)
    // En läsare som bär en rad som inte är gemensam kan inte släppa den.
    await som(PA, (tx) => tx.query('update public.packrader set bars_av = $2 where id = $1', [r.rows[0].id, david]))
    await expect(som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, false)', [r.rows[0].id]))).rejects.toThrow(/är inte gemensam/)

    const g = await som(PA, (tx) =>
      tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn, gemensam) values ($1, 'Karta', true) returning id`, [tur]),
    )
    // Den som står utanför får samma svar för en rad som finns som för en som inte finns.
    await expect(som(PB, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [g.rows[0].id]))).rejects.toThrow(/finns inte eller är inte gemensam/)
    await expect(som(PB, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [crypto.randomUUID()]))).rejects.toThrow(
      /finns inte eller är inte gemensam/,
    )
    await forvantaFel(somAnon((tx) => tx.query('select public.ta_med_gemensam($1, true)', [g.rows[0].id])))
    const b = await db.query<{ bars_av: string | null }>('select bars_av from public.packrader where id = $1', [g.rows[0].id])
    expect(b.rows[0].bars_av).toBeNull()
    gemensamKarta = g.rows[0].id
  })

  it('en läsare kan inte svara på frågan om dubbletter, men en redigerare kan', async () => {
    const r = await som(PD, (tx) => tx.query(`update public.packrader set dubblett_ok = true where id = $1`, [talt]))
    expect(r.affectedRows).toBe(0)
    await som(PC, (tx) => tx.query(`update public.packrader set dubblett_ok = true where id = $1`, [talt]))
    const d = await db.query<{ dubblett_ok: boolean }>('select dubblett_ok from public.packrader where id = $1', [talt])
    expect(d.rows[0].dubblett_ok).toBe(true)
  })

  it('den som inte är med i turen och den som inte är inloggad ser ingenting', async () => {
    const rader = await som(PB, (tx) => tx.query('select id from public.packrader where tur_id = $1', [tur]))
    expect(rader.rows).toHaveLength(0)
    const bockar = await som(PB, (tx) => tx.query('select packrad_id from public.packstatus where tur_id = $1', [tur]))
    expect(bockar.rows).toHaveLength(0)
    const andrat = await som(PB, (tx) => tx.query(`update public.packstatus set packad = false where tur_id = $1`, [tur]))
    expect(andrat.affectedRows).toBe(0)
    await forvantaFel(somAnon((tx) => tx.query('select id from public.packrader')))
    await forvantaFel(somAnon((tx) => tx.query('select packrad_id from public.packstatus')))
  })

  it('en borttagen deltagare förlorar åtkomsten, och hens bockar försvinner', async () => {
    await som(PA, (tx) => tx.query('delete from public.deltagare where id = $1', [david]))
    const rader = await som(PD, (tx) => tx.query('select id from public.packrader where tur_id = $1', [tur]))
    expect(rader.rows).toHaveLength(0)
    expect((await status(sovsack, david)).rows).toHaveLength(0)
    await forvantaFel(som(PD, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [sovsack, david, tur])))
    await expect(som(PD, (tx) => tx.query('select public.ta_med_gemensam($1, true)', [gemensamKarta]))).rejects.toThrow(/finns inte eller är inte gemensam/)
  })

  it('när den som bär en rad tas bort finns raden kvar utan bärare', async () => {
    await som(PA, (tx) => tx.query('delete from public.deltagare where id = $1', [cilla]))
    const r = await db.query<{ bars_av: string | null; tur_id: string }>('select bars_av, tur_id from public.packrader where id = $1', [talt])
    expect(r.rows[0]).toEqual({ bars_av: null, tur_id: tur })
  })

  it('när en packrad tas bort försvinner dess bockar, och turen går att radera med allt i den', async () => {
    await som(PA, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id, packad) values ($1, $2, $3, true)', [talt, anna, tur]))
    await som(PA, (tx) => tx.query('delete from public.packrader where id = $1', [talt]))
    expect((await status(talt, anna)).rows).toHaveLength(0)

    const k = await som(PA, (tx) => tx.query<{ id: string }>(`insert into public.packrader (tur_id, namn, bars_av) values ($1, 'Kök', $2) returning id`, [tur, anna]))
    await som(PA, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, tur_id) values ($1, $2, $3)', [k.rows[0].id, anna, tur]))
    await som(PA, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    const kvar = await db.query('select id from public.packrader where tur_id = $1', [tur])
    expect(kvar.rows).toHaveLength(0)
    const bockar = await db.query('select packrad_id from public.packstatus where tur_id = $1', [tur])
    expect(bockar.rows).toHaveLength(0)
  })
})

describe('packlistans migrering mot befintliga rader', () => {
  const packlista = fs.readdirSync(path.join(import.meta.dirname, 'migrations')).find((f) => f.endsWith('_packlista.sql'))!
  let gammal: PGlite
  const T1 = '00000000-0000-0000-0000-0000000000d1'
  const T2 = '00000000-0000-0000-0000-0000000000d2'

  const rad = async (namn: string) =>
    (await gammal.query<{ kategori: string; bars_av: string | null; vikt_g: number | null }>(
      'select kategori, bars_av, vikt_g from public.packrader where namn = $1',
      [namn],
    )).rows[0]

  beforeAll(async () => {
    gammal = await nyDatabas((f) => f < packlista)
    // Rader som det gamla schemat släppte igenom: kategorier som fri text, en bärare och en bock från en annan tur,
    // ett tomt namn och en orimlig vikt.
    await gammal.exec(`
      insert into auth.users (id, email) values ('${A}', 'anna@exempel.se');
      insert into public.turer (id, namn, skapad_av) values ('${T1}', 'Tur ett', '${A}'), ('${T2}', 'Tur två', '${A}');
      insert into public.packrader (tur_id, namn, kategori, vikt_g) values
        ('${T1}', 'Sovsäck', 'Sova', 900),
        ('${T1}', 'Kåsa', 'kok', 50),
        ('${T1}', 'Tält', 'Tält och vindskydd', 1800),
        ('${T1}', 'Grej', 'Skräp', 200000),
        ('${T1}', '   ', 'Övrigt', null);
      insert into public.packrader (tur_id, namn, bars_av) values
        ('${T1}', 'Kök', (select id from public.deltagare where tur_id = '${T2}'));
      insert into public.packstatus (packrad_id, deltagare_id, packad) values
        ((select id from public.packrader where namn = 'Sovsäck'), (select id from public.deltagare where tur_id = '${T1}'), true),
        ((select id from public.packrader where namn = 'Kåsa'), (select id from public.deltagare where tur_id = '${T2}'), true);
    `)
    await korMigreringar(gammal, (f) => f >= packlista)
  })

  it('behåller kategorier skrivna som i förrådet och gör resten till Övrigt', async () => {
    expect((await rad('Sovsäck')).kategori).toBe('sova')
    expect((await rad('Kåsa')).kategori).toBe('kok')
    expect((await rad('Tält')).kategori).toBe('talt')
    expect((await rad('Grej')).kategori).toBe('ovrigt')
  })

  it('rättar tomma namn och orimliga vikter i stället för att stoppa', async () => {
    expect(await rad('Namnlös')).toMatchObject({ kategori: 'ovrigt' })
    expect((await rad('Grej')).vikt_g).toBeNull()
  })

  it('tar bort bärare och bockar från en annan tur, och ger bockarna turen', async () => {
    expect((await rad('Kök')).bars_av).toBeNull()
    const bockar = await gammal.query<{ tur_id: string }>('select tur_id from public.packstatus')
    expect(bockar.rows).toEqual([{ tur_id: T1 }])
  })
})

describe('dagsetapper', () => {
  // Egna användare, så att försöken att gå med i de andra testerna inte räknas mot spärren här.
  const EA = '00000000-0000-0000-0000-0000000000e1'
  const EB = '00000000-0000-0000-0000-0000000000e2'
  const EC = '00000000-0000-0000-0000-0000000000e3'
  const ED = '00000000-0000-0000-0000-0000000000e4'
  let tur: string
  let annanTur: string
  let dag1: string
  let davidsRad: string

  const etapp = (vem: string, turId: string, dag: number, ovrigt = `'Abisko', 'Abiskojaure', 15`) =>
    som(vem, (tx) =>
      tx.query<{ id: string }>(`insert into public.etapper (tur_id, dag, fran, till, km) values ($1, $2, ${ovrigt}) returning id`, [turId, dag]),
    ).then((r) => r.rows[0].id)
  const synliga = (vem: string, turId: string) => som(vem, (tx) => tx.query('select id from public.etapper where tur_id = $1', [turId])).then((r) => r.rows.length)

  beforeAll(async () => {
    await db.exec(
      `insert into auth.users (id, email) values ('${EA}', 'ea@exempel.se'), ('${EB}', 'eb@exempel.se'), ('${EC}', 'ec@exempel.se'), ('${ED}', 'ed@exempel.se');`,
    )
    tur = await skapaTur(EA, 'Etapptur')
    const kod = await kodFor(tur)
    await som(EC, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(ED, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const d = await db.query<{ id: string; user_id: string }>('select id, user_id from public.deltagare where tur_id = $1 and user_id = $2', [tur, ED])
    davidsRad = d.rows[0].id
    await som(EA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [davidsRad]))
    annanTur = await skapaTur(EB, 'Någon annans etapper')
    dag1 = await etapp(EA, tur, 1)
  })

  it('ägaren och redigeraren lägger till och ändrar etapper', async () => {
    const dag2 = await etapp(EC, tur, 2, `'Abiskojaure', 'Alesjaure', 20.5`)
    const r = await som(EC, (tx) => tx.query(`update public.etapper set natt = 'Alesjaure fjällstuga', boende = 'stuga', bokad = true where id = $1`, [dag2]))
    expect(r.affectedRows).toBe(1)
    const ny = await db.query<{ km: string; bokad: boolean }>('select km, bokad from public.etapper where id = $1', [dag2])
    expect(ny.rows[0]).toEqual({ km: '20.5', bokad: true })
  })

  it('läsaren ser etapperna men kan inte ändra dem', async () => {
    expect(await synliga(ED, tur)).toBeGreaterThan(0)
    await forvantaFel(etapp(ED, tur, 3))
    const andrad = await som(ED, (tx) => tx.query(`update public.etapper set km = 1 where id = $1`, [dag1]))
    expect(andrad.affectedRows).toBe(0)
    const borta = await som(ED, (tx) => tx.query('delete from public.etapper where id = $1', [dag1]))
    expect(borta.affectedRows).toBe(0)
  })

  it('den som inte är med i turen ser och ändrar ingenting', async () => {
    expect(await synliga(EB, tur)).toBe(0)
    await forvantaFel(etapp(EB, tur, 4))
    const andrad = await som(EB, (tx) => tx.query(`update public.etapper set km = 1 where id = $1`, [dag1]))
    expect(andrad.affectedRows).toBe(0)
    const borta = await som(EB, (tx) => tx.query('delete from public.etapper where id = $1', [dag1]))
    expect(borta.affectedRows).toBe(0)
    await forvantaFel(somAnon((tx) => tx.query('select id from public.etapper')))
    await forvantaFel(somAnon((tx) => tx.query(`insert into public.etapper (tur_id, dag) values ($1, 9)`, [tur])))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.etapper')))
  })

  it('ingen kan flytta en etapp till en tur där hen inte får ändra', async () => {
    await forvantaFel(som(EA, (tx) => tx.query('update public.etapper set tur_id = $1 where id = $2', [annanTur, dag1])))
  })

  it('en dag har bara en etapp, och dagen ligger mellan 1 och 30', async () => {
    await forvantaFel(etapp(EA, tur, 1))
    await forvantaFel(etapp(EA, tur, 0))
    await forvantaFel(etapp(EA, tur, 31))
  })

  it('fälten har gränser, och bara stugor och annat boende kan vara bokade', async () => {
    await forvantaFel(etapp(EA, tur, 5, `'  ', 'Till', 10`))
    await forvantaFel(etapp(EA, tur, 5, `'Från', 'Till', 0`))
    await forvantaFel(etapp(EA, tur, 5, `'Från', 'Till', 100`))
    await forvantaFel(etapp(EA, tur, 5, `'${'x'.repeat(81)}', 'Till', 10`))
    await forvantaFel(som(EA, (tx) => tx.query(`insert into public.etapper (tur_id, dag, boende, bokad) values ($1, 6, 'talt', true)`, [tur])))
    await forvantaFel(som(EA, (tx) => tx.query(`insert into public.etapper (tur_id, dag, boende) values ($1, 6, 'hotell')`, [tur])))
    await forvantaFel(som(EA, (tx) => tx.query(`insert into public.etapper (tur_id, dag, bokad) values ($1, 7, true)`, [tur])))
    await som(EA, (tx) => tx.query(`insert into public.etapper (tur_id, dag, boende, bokad) values ($1, 6, 'annat', true)`, [tur]))
  })

  it('en borttagen deltagare ser inte längre etapperna, och en borttagen redigerare ändrar dem inte', async () => {
    await som(EA, (tx) => tx.query('delete from public.deltagare where id = $1', [davidsRad]))
    expect(await synliga(ED, tur)).toBe(0)
    const ecRad = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [tur, EC])).rows[0].id
    await som(EA, (tx) => tx.query('delete from public.deltagare where id = $1', [ecRad]))
    expect(await synliga(EC, tur)).toBe(0)
    await forvantaFel(etapp(EC, tur, 8))
    expect((await som(EC, (tx) => tx.query('update public.etapper set km = 1 where id = $1', [dag1]))).affectedRows).toBe(0)
    expect((await som(EC, (tx) => tx.query('delete from public.etapper where id = $1', [dag1]))).affectedRows).toBe(0)
  })

  it('etapperna försvinner med turen', async () => {
    await som(EA, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    const r = await db.query('select 1 from public.etapper where tur_id = $1', [tur])
    expect(r.rows).toHaveLength(0)
  })
})

describe('längdgränser på textkolumnerna', () => {
  // Egna användare, så att namnen och turerna inte påverkar de andra testerna.
  const LA = '00000000-0000-0000-0000-00000000aa01'
  const LB = '00000000-0000-0000-0000-00000000aa02'
  const LC = '00000000-0000-0000-0000-00000000aa03'
  const LD = '00000000-0000-0000-0000-00000000aa04'
  const LE = '00000000-0000-0000-0000-00000000aa05'
  let tur: string
  const text = (n: number) => 'x'.repeat(n)
  /** Stoppas av en längdgräns, och inte av något annat. Gränserna heter <tabell>_<kolumn>_langd. */
  const forvantaLangd = (p: Promise<unknown>) => expect(p).rejects.toThrow(/_langd/)
  const profilnamn = async (id: string) => (await db.query<{ namn: string }>('select namn from public.profiler where id = $1', [id])).rows[0]?.namn

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${LA}', 'la@exempel.se', '{"namn": "Lova"}')`)
    tur = await skapaTur(LA, 'Tur med gränser')
  })

  it('turens namn, destination och startpunkt får vara högst 80 tecken', async () => {
    await som(LA, (tx) => tx.query('update public.turer set namn = $2, destination = $2, startpunkt = $2 where id = $1', [tur, text(80)]))
    for (const kolumn of ['namn', 'destination', 'startpunkt']) {
      await forvantaLangd(som(LA, (tx) => tx.query(`update public.turer set ${kolumn} = $2 where id = $1`, [tur, text(81)])))
    }
    await forvantaLangd(som(LA, (tx) => tx.query('insert into public.turer (id, namn) values ($1, $2)', [crypto.randomUUID(), text(81)])))
  })

  it('profilens och deltagarens namn får vara högst 40 tecken', async () => {
    await forvantaLangd(som(LA, (tx) => tx.query('update public.profiler set namn = $2 where id = $1', [LA, text(41)])))
    await som(LA, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, $2, 'person')`, [tur, text(40)]))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, $2, 'person')`, [tur, text(41)])))
  })

  it('ett profilnamn på 40 tecken följer med till deltagaren, både när profilen ändras och vid ga_med', async () => {
    await som(LA, (tx) => tx.query('update public.profiler set namn = $2 where id = $1', [LA, 'L'.repeat(40)]))
    const egen = await db.query<{ namn: string }>('select namn from public.deltagare where user_id = $1 and tur_id = $2', [LA, tur])
    expect(egen.rows).toEqual([{ namn: 'L'.repeat(40) }])

    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [LE, 'le@exempel.se', JSON.stringify({ namn: 'E'.repeat(40) })])
    const kod = await kodFor(tur)
    await som(LE, (tx) => tx.query('select public.ga_med($1)', [kod]))
    const ny = await db.query<{ namn: string }>('select namn from public.deltagare where user_id = $1 and tur_id = $2', [LE, tur])
    expect(ny.rows).toEqual([{ namn: 'E'.repeat(40) }])
  })

  it('ett nytt konto får ett kortat namn i stället för att stoppas, från mejladressen och från formuläret', async () => {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [LB, `${'a'.repeat(60)}@exempel.se`])
    expect(await profilnamn(LB)).toBe('a'.repeat(40))
    // Mellanslag före och efter tas bort, också där namnet kortas.
    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [LC, 'lc@exempel.se', JSON.stringify({ namn: `  ${'b'.repeat(39)} ccc` })])
    expect(await profilnamn(LC)).toBe('b'.repeat(39))
    await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)', [LD, 'ld@exempel.se', JSON.stringify({ namn: '  Doris  ' })])
    expect(await profilnamn(LD)).toBe('Doris')
  })

  it('rättens och varans namn och varans kategori får vara högst 80 tecken, varans anteckning högst 300', async () => {
    await som(LA, (tx) => tx.query('insert into public.ratter (tur_id, namn) values ($1, $2)', [tur, text(80)]))
    await forvantaLangd(som(LA, (tx) => tx.query('insert into public.ratter (tur_id, namn) values ($1, $2)', [tur, text(81)])))
    await som(LA, (tx) => tx.query('insert into public.varor (tur_id, namn, kategori, notering) values ($1, $2, $2, $3)', [tur, text(80), text(300)]))
    await forvantaLangd(som(LA, (tx) => tx.query('insert into public.varor (tur_id, namn) values ($1, $2)', [tur, text(81)])))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.varor (tur_id, namn, kategori) values ($1, 'Vara 2', $2)`, [tur, text(81)])))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.varor (tur_id, namn, notering) values ($1, 'Vara 3', $2)`, [tur, text(301)])))
  })

  it('anteckningen på en packrad och namnet och anteckningen på en sak i förrådet har sina gränser', async () => {
    await som(LA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, notering) values ($1, 'Kåsa', $2)`, [tur, text(300)]))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.packrader (tur_id, namn, notering) values ($1, 'Kåsa 2', $2)`, [tur, text(301)])))
    await som(LA, (tx) => tx.query(`insert into public.forradssaker (namn, kategori, notering) values ($1, 'ovrigt', $2)`, [text(80), text(300)]))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.forradssaker (namn, kategori) values ($1, 'ovrigt')`, [text(81)])))
    await forvantaLangd(som(LA, (tx) => tx.query(`insert into public.forradssaker (namn, kategori, notering) values ('Spork', 'ovrigt', $1)`, [text(301)])))
  })

  it('en påse i katalogen har märke och namn på högst 80 tecken tillsammans, så att den ryms som rätt', async () => {
    expect((await db.query('select 1 from public.matprodukter where char_length(marke) + 1 + char_length(namn) > 80')).rows).toHaveLength(0)
    await forvantaLangd(
      db.query(`insert into public.matprodukter (marke, namn, maltid, vikt_torr_g, kcal, kalla) values ($1, $2, 'lunch_middag', 150, 600, 'https://exempel.se')`, [
        'M'.repeat(20),
        'N'.repeat(60),
      ]),
    )
  })
})

describe('anteckningar och lärdomar', () => {
  // Egna användare: NA äger turen, NB är redigerare, NC läsare och ND är inte med.
  const NA = '00000000-0000-0000-0000-0000000000f1'
  const NB = '00000000-0000-0000-0000-0000000000f2'
  const NC = '00000000-0000-0000-0000-0000000000f3'
  const ND = '00000000-0000-0000-0000-0000000000f4'
  let tur: string
  let annanTur: string
  let ncRad: string

  const anteckna = (vem: string, turId: string, text: string, privat = false) =>
    som(vem, (tx) =>
      tx.query<{ id: string }>('insert into public.anteckningar (tur_id, text, privat) values ($1, $2, $3) returning id', [turId, text, privat]),
    ).then((r) => r.rows[0].id)
  const synligaAnteckningar = (vem: string, turId: string) =>
    som(vem, (tx) => tx.query<{ text: string }>('select text from public.anteckningar where tur_id = $1 order by text', [turId])).then((r) =>
      r.rows.map((x) => x.text),
    )
  const lardom = (vem: string, turId: string | null, text: string, amne = 'mat') =>
    som(vem, (tx) =>
      tx.query<{ id: string }>('insert into public.lardomar (tur_id, amne, text) values ($1, $2, $3) returning id', [turId, amne, text]),
    ).then((r) => r.rows[0].id)
  const minaLardomar = (vem: string) =>
    som(vem, (tx) => tx.query<{ text: string; tur_namn: string | null }>('select text, tur_namn from public.lardomar order by text')).then((r) => r.rows)

  beforeAll(async () => {
    await db.exec(
      `insert into auth.users (id, email) values ('${NA}', 'na@exempel.se'), ('${NB}', 'nb@exempel.se'), ('${NC}', 'nc@exempel.se'), ('${ND}', 'nd@exempel.se');`,
    )
    tur = await skapaTur(NA, 'Anteckningstur')
    const kod = await kodFor(tur)
    await som(NB, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(NC, (tx) => tx.query('select public.ga_med($1)', [kod]))
    ncRad = (await db.query<{ id: string }>('select id from public.deltagare where tur_id = $1 and user_id = $2', [tur, NC])).rows[0].id
    await som(NA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where id = $1`, [ncRad]))
    annanTur = await skapaTur(ND, 'Någon annans tur')
  })

  describe('anteckningar', () => {
    it('alla i turen, även läsaren, skriver egna, och delade syns för alla i turen', async () => {
      await anteckna(NA, tur, 'Ägarens delade')
      await anteckna(NC, tur, 'Läsarens delade')
      for (const vem of [NA, NB, NC]) expect(await synligaAnteckningar(vem, tur)).toEqual(['Läsarens delade', 'Ägarens delade'])
    })

    it('en privat anteckning syns bara för den som skrev den', async () => {
      await anteckna(NB, tur, 'Redigerarens privata', true)
      expect(await synligaAnteckningar(NB, tur)).toContain('Redigerarens privata')
      expect(await synligaAnteckningar(NA, tur)).not.toContain('Redigerarens privata')
      expect(await synligaAnteckningar(NC, tur)).not.toContain('Redigerarens privata')
    })

    it('ingen skriver en anteckning i någon annans namn eller sätter tiderna själv', async () => {
      await forvantaFel(som(NB, (tx) => tx.query('insert into public.anteckningar (tur_id, user_id, text) values ($1, $2, $3)', [tur, NA, 'Falsk'])))
      await forvantaFel(som(NB, (tx) => tx.query(`insert into public.anteckningar (tur_id, text, skapad) values ($1, 'Gammal', '2020-01-01')`, [tur])))
    })

    it('man ändrar bara sina egna, och anteckningen kan inte flyttas', async () => {
      const id = await anteckna(NC, tur, 'Ska ändras')
      expect((await som(NA, (tx) => tx.query(`update public.anteckningar set text = 'Ägaren ändrade' where id = $1`, [id]))).affectedRows).toBe(0)
      expect((await som(NB, (tx) => tx.query(`update public.anteckningar set text = 'Redigeraren ändrade' where id = $1`, [id]))).affectedRows).toBe(0)
      expect((await som(NC, (tx) => tx.query(`update public.anteckningar set text = 'Ändrad', privat = true where id = $1`, [id]))).affectedRows).toBe(1)
      await forvantaFel(som(NC, (tx) => tx.query('update public.anteckningar set tur_id = $1 where id = $2', [annanTur, id])))
      await forvantaFel(som(NC, (tx) => tx.query('update public.anteckningar set user_id = $1 where id = $2', [NA, id])))
      const r = await db.query<{ text: string; privat: boolean; nyare: boolean }>('select text, privat, andrad > skapad as nyare from public.anteckningar where id = $1', [id])
      expect(r.rows[0]).toEqual({ text: 'Ändrad', privat: true, nyare: true })
      await forvantaFel(som(NC, (tx) => tx.query(`update public.anteckningar set andrad = now(), skapad = now() where id = $1`, [id])))
      expect((await som(NA, (tx) => tx.query('update public.anteckningar set privat = false where id = $1', [id]))).affectedRows).toBe(0)
    })

    it('tabellen skickar ändringar till appen', async () => {
      const r = await db.query(`select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'anteckningar'`)
      expect(r.rows).toHaveLength(1)
    })

    it('ägaren tar bort andras delade men inte privata, och redigeraren och läsaren bara sina egna', async () => {
      const delad = await anteckna(NB, tur, 'Delad att ta bort')
      const privat = await anteckna(NB, tur, 'Privat att behålla', true)
      const lasarens = await anteckna(NC, tur, 'Läsarens att behålla')
      expect((await som(NC, (tx) => tx.query('delete from public.anteckningar where id = $1', [delad]))).affectedRows).toBe(0)
      expect((await som(NB, (tx) => tx.query('delete from public.anteckningar where id = $1', [lasarens]))).affectedRows).toBe(0)
      expect((await som(NA, (tx) => tx.query('delete from public.anteckningar where id = $1', [privat]))).affectedRows).toBe(0)
      expect((await som(NA, (tx) => tx.query('delete from public.anteckningar where id = $1', [delad]))).affectedRows).toBe(1)
      expect((await som(NB, (tx) => tx.query('delete from public.anteckningar where id = $1', [privat]))).affectedRows).toBe(1)
    })

    it('den som inte är med i turen ser och ändrar ingenting, och anon når ingenting', async () => {
      const id = await anteckna(NA, tur, 'Bara för gruppen')
      expect(await synligaAnteckningar(ND, tur)).toEqual([])
      await forvantaFel(anteckna(ND, tur, 'Utifrån'))
      expect((await som(ND, (tx) => tx.query(`update public.anteckningar set text = 'x' where id = $1`, [id]))).affectedRows).toBe(0)
      expect((await som(ND, (tx) => tx.query('delete from public.anteckningar where id = $1', [id]))).affectedRows).toBe(0)
      await forvantaFel(somAnon((tx) => tx.query('select id from public.anteckningar')))
      await forvantaFel(somAnon((tx) => tx.query(`insert into public.anteckningar (tur_id, text) values ($1, 'x')`, [tur])))
      await forvantaFel(somAnon((tx) => tx.query(`update public.anteckningar set text = 'x'`)))
      await forvantaFel(somAnon((tx) => tx.query('delete from public.anteckningar')))
    })

    it('fälten har gränser', async () => {
      await forvantaFel(anteckna(NA, tur, '   '))
      await forvantaFel(anteckna(NA, tur, 'x'.repeat(2001)))
    })
  })

  describe('lärdomar', () => {
    it('är personliga, även när man delar en tur', async () => {
      await lardom(NA, tur, 'Ägarens lärdom')
      await lardom(NB, null, 'Redigerarens lärdom utan tur', 'packning')
      expect((await minaLardomar(NA)).map((l) => l.text)).toEqual(['Ägarens lärdom'])
      expect((await minaLardomar(NB)).map((l) => l.text)).toEqual(['Redigerarens lärdom utan tur'])
      expect(await minaLardomar(NC)).toEqual([])
      const id = (await db.query<{ id: string }>(`select id from public.lardomar where text = 'Ägarens lärdom'`)).rows[0].id
      expect((await som(NB, (tx) => tx.query(`update public.lardomar set text = 'x' where id = $1`, [id]))).affectedRows).toBe(0)
      expect((await som(NB, (tx) => tx.query('delete from public.lardomar where id = $1', [id]))).affectedRows).toBe(0)
      await forvantaFel(somAnon((tx) => tx.query('select id from public.lardomar')))
      await forvantaFel(somAnon((tx) => tx.query(`insert into public.lardomar (amne, text) values ('mat', 'x')`)))
      await forvantaFel(somAnon((tx) => tx.query(`update public.lardomar set text = 'x'`)))
      await forvantaFel(somAnon((tx) => tx.query('delete from public.lardomar')))
    })

    it('ägaren ändrar och tar bort sina egna, men byter inte ägare', async () => {
      const id = await lardom(NB, null, 'Att ändra')
      expect((await som(NB, (tx) => tx.query(`update public.lardomar set text = 'Ändrad', amne = 'sova' where id = $1`, [id]))).affectedRows).toBe(1)
      await forvantaFel(som(NB, (tx) => tx.query('update public.lardomar set user_id = $1 where id = $2', [NA, id])))
      expect((await som(NB, (tx) => tx.query('delete from public.lardomar where id = $1', [id]))).affectedRows).toBe(1)
    })

    it('turens namn sätts av databasen och går inte att skriva', async () => {
      await lardom(NC, tur, 'Läsarens lärdom')
      expect(await minaLardomar(NC)).toEqual([{ text: 'Läsarens lärdom', tur_namn: 'Anteckningstur' }])
      await forvantaFel(som(NC, (tx) => tx.query(`insert into public.lardomar (amne, text, tur_namn) values ('mat', 'x', 'Påhittad')`)))
      await forvantaFel(som(NC, (tx) => tx.query(`update public.lardomar set tur_namn = 'Påhittad'`)))
    })

    it('en lärdom kan bara knytas till en tur man är med i, och inte i någon annans namn', async () => {
      await forvantaFel(lardom(NA, annanTur, 'Fel tur'))
      await forvantaFel(som(NA, (tx) => tx.query(`insert into public.lardomar (user_id, amne, text) values ($1, 'mat', 'x')`, [NB])))
      await forvantaFel(som(NA, (tx) => tx.query(`update public.lardomar set tur_id = $1`, [annanTur])))
    })

    it('ämnet och texten har gränser, och ämnena är desamma som i src/lib/lardomar.ts', async () => {
      await forvantaFel(lardom(NA, null, 'x', 'hund'))
      await forvantaFel(lardom(NA, null, '  '))
      await forvantaFel(lardom(NA, null, 'x'.repeat(301)))
      const r = await db.query<{ def: string }>(
        `select pg_get_constraintdef(c.oid) as def from pg_constraint c where c.conrelid = 'public.lardomar'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) like '%amne%'`,
      )
      expect([...r.rows[0].def.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1])).toEqual(AMNEN.map((a) => a.nyckel))
    })
  })

  it('en borttagen deltagare ser inte längre turens anteckningar, förlorar sina privata men behåller sina lärdomar', async () => {
    const delad = await anteckna(NC, tur, 'Läsarens delade som blir kvar')
    await anteckna(NC, tur, 'Läsarens privata som försvinner', true)
    await som(NA, (tx) => tx.query('delete from public.deltagare where id = $1', [ncRad]))
    expect(await synligaAnteckningar(NC, tur)).toEqual([])
    await forvantaFel(anteckna(NC, tur, 'Efteråt'))
    await forvantaFel(lardom(NC, tur, 'Efteråt'))
    expect((await som(NC, (tx) => tx.query(`update public.anteckningar set text = 'x' where id = $1`, [delad]))).affectedRows).toBe(0)
    expect((await som(NC, (tx) => tx.query('delete from public.anteckningar where id = $1', [delad]))).affectedRows).toBe(0)
    const kvar = await db.query<{ text: string }>('select text from public.anteckningar where tur_id = $1 and user_id = $2 order by text', [tur, NC])
    expect(kvar.rows.map((r) => r.text)).not.toContain('Läsarens privata som försvinner')
    expect(kvar.rows.map((r) => r.text)).toContain('Läsarens delade som blir kvar')
    expect((await minaLardomar(NC)).map((l) => l.text)).toEqual(['Läsarens lärdom'])
  })

  it('anteckningarna försvinner med turen, och lärdomarna blir kvar med turens namn', async () => {
    await som(NA, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect((await db.query('select 1 from public.anteckningar where tur_id = $1', [tur])).rows).toHaveLength(0)
    const r = await db.query<{ tur_id: string | null; tur_namn: string }>(`select tur_id, tur_namn from public.lardomar where text = 'Ägarens lärdom'`)
    expect(r.rows[0]).toEqual({ tur_id: null, tur_namn: 'Anteckningstur' })
  })
})

describe('notiser', () => {
  // Egna användare, så att försöken att gå med i de andra testerna inte räknas mot spärren här.
  // Ola äger turen, Rut är redigerare, Lis är läsare, Max går med via länken och Tim är inte med.
  const OLA = '00000000-0000-0000-0000-0000000001a1'
  const RUT = '00000000-0000-0000-0000-0000000001a2'
  const LIS = '00000000-0000-0000-0000-0000000001a3'
  const MAX = '00000000-0000-0000-0000-0000000001a4'
  const TIM = '00000000-0000-0000-0000-0000000001a5'
  let tur: string
  let kod: string

  interface Rad {
    id: string
    typ: string
    text: string
    lank: string
    fran_user_id: string | null
    last: string | null
  }
  const notiser = (vem: string, t = tur) =>
    som(vem, (tx) =>
      tx.query<Rad>('select id, typ, text, lank, fran_user_id, last from public.notiser where tur_id = $1 order by skapad', [t]),
    ).then((r) => r.rows)
  const mottagare = (t = tur) =>
    db.query<{ user_id: string }>('select user_id from public.notiser where tur_id = $1', [t]).then((r) => r.rows.map((x) => x.user_id).sort())

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values
      ('${OLA}', 'ola@exempel.se'), ('${RUT}', 'rut@exempel.se'), ('${LIS}', 'lis@exempel.se'), ('${MAX}', 'max@exempel.se'), ('${TIM}', 'tim@exempel.se')`)
    await db.query(`update public.profiler set namn = 'Max' where id = '${MAX}'`)
    tur = await skapaTur(OLA, 'Notistur')
    kod = await kodFor(tur)
    await som(RUT, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(LIS, (tx) => tx.query('select public.ga_med($1)', [kod]))
    await som(OLA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where tur_id = $1 and user_id = $2`, [tur, LIS]))
    await db.query('delete from public.notiser where tur_id = $1', [tur])
  })

  it('ägaren och redigeraren får en notis när någon går med via länken, inte läsaren eller den som går med', async () => {
    await som(MAX, (tx) => tx.query('select public.ga_med($1)', [kod]))
    expect(await mottagare()).toEqual([OLA, RUT].sort())
    const [n] = await notiser(OLA)
    expect(n).toMatchObject({ typ: 'gick_med', text: 'Max gick med i Notistur', lank: `/tur/${tur}#deltagare`, fran_user_id: MAX, last: null })
    expect(await notiser(LIS)).toEqual([])
    expect(await notiser(MAX)).toEqual([])
  })

  it('ger ingen ny notis när samma person öppnar länken igen, och ingen när en tur skapas', async () => {
    await som(MAX, (tx) => tx.query('select public.ga_med($1)', [kod]))
    expect(await mottagare()).toHaveLength(2)
    const egen = await skapaTur(TIM, 'Tims egen tur')
    expect(await mottagare(egen)).toEqual([])
  })

  it('den som lämnar och går med igen samma dygn ger ingen ny notis', async () => {
    await som(MAX, (tx) => tx.query('delete from public.deltagare where tur_id = $1 and user_id = $2', [tur, MAX]))
    await db.query(`update public.profiler set namn = 'Annat namn' where id = '${MAX}'`)
    await som(MAX, (tx) => tx.query('select public.ga_med($1)', [kod]))
    expect(await mottagare()).toEqual([OLA, RUT].sort())
    expect((await notiser(OLA)).map((n) => n.text)).toEqual(['Max gick med i Notistur'])
    await db.query(`update public.profiler set namn = 'Max' where id = '${MAX}'`)
  })

  it('ger ingen notis när en redigerare lägger till en person utan konto eller när någon får en ny roll', async () => {
    await som(RUT, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ, sortering) values ($1, 'Utan konto', 'person', 9)`, [tur]))
    await som(OLA, (tx) => tx.query(`update public.deltagare set roll = 'editor' where tur_id = $1 and user_id = $2`, [tur, LIS]))
    await som(OLA, (tx) => tx.query(`update public.deltagare set roll = 'viewer' where tur_id = $1 and user_id = $2`, [tur, LIS]))
    expect(await mottagare()).toEqual([OLA, RUT].sort())
  })

  it('ger en notis när någon tar över en person utan konto, men inte när ägaren lägger till en person utan konto', async () => {
    const t = await skapaTur(OLA, 'Tur med platshållare för notiser')
    const k = await kodFor(t)
    const r = await som(OLA, (tx) =>
      tx.query<{ id: string }>(`insert into public.deltagare (tur_id, namn, typ, sortering) values ($1, 'Tim', 'person', 1) returning id`, [t]),
    )
    expect(await mottagare(t)).toEqual([])
    await db.query(`update public.profiler set namn = 'Tim' where id = '${TIM}'`)
    await som(TIM, (tx) => tx.query('select public.ga_med($1, $2)', [k, r.rows[0].id]))
    expect(await mottagare(t)).toEqual([OLA])
    expect((await notiser(OLA, t))[0]).toMatchObject({ text: 'Tim gick med i Tur med platshållare för notiser', lank: `/tur/${t}#deltagare`, fran_user_id: TIM })
  })

  it('en annan användare ser, ändrar och tar inte bort notiserna', async () => {
    const [n] = await notiser(OLA)
    for (const vem of [RUT, TIM]) {
      const r = await som(vem, (tx) => tx.query('select id from public.notiser where id = $1', [n.id]))
      expect(r.rows, vem).toHaveLength(0)
      const u = await som(vem, (tx) => tx.query('update public.notiser set last = now() where id = $1', [n.id]))
      expect(u.affectedRows, vem).toBe(0)
      const d = await som(vem, (tx) => tx.query('delete from public.notiser where id = $1', [n.id]))
      expect(d.affectedRows, vem).toBe(0)
    }
    expect((await notiser(OLA))[0].last).toBeNull()
  })

  it('ingen kan skapa en notis, och bara last går att ändra', async () => {
    await forvantaFel(som(OLA, (tx) => tx.query(`insert into public.notiser (user_id, typ, text) values ($1, 'gick_med', 'Falsk')`, [OLA])))
    await forvantaFel(som(OLA, (tx) => tx.query(`insert into public.notiser (user_id, typ, text) values ($1, 'gick_med', 'Falsk')`, [RUT])))
    const [n] = await notiser(OLA)
    await forvantaFel(som(OLA, (tx) => tx.query(`update public.notiser set text = 'Ändrad' where id = $1`, [n.id])))
    await forvantaFel(som(OLA, (tx) => tx.query('update public.notiser set user_id = $2 where id = $1', [n.id, RUT])))
    await forvantaFel(som(OLA, (tx) => tx.query(`update public.notiser set lank = '/hem' where id = $1`, [n.id])))
    await forvantaFel(som(OLA, (tx) => tx.query(`update public.notiser set typ = 'gick_med' where id = $1`, [n.id])))
    await forvantaFel(som(OLA, (tx) => tx.query('update public.notiser set tur_id = null where id = $1', [n.id])))
    await forvantaFel(som(OLA, (tx) => tx.query('update public.notiser set fran_user_id = $2 where id = $1', [n.id, OLA])))
    await forvantaFel(som(OLA, (tx) => tx.query('update public.notiser set skapad = now() where id = $1', [n.id])))
  })

  it('man markerar sina egna som lästa och tar bort sina egna', async () => {
    const u = await som(OLA, (tx) => tx.query('update public.notiser set last = now() where last is null'))
    expect(u.affectedRows).toBeGreaterThan(0)
    expect((await notiser(OLA)).every((n) => n.last !== null)).toBe(true)
    // Redigerarens notis är fortfarande oläst.
    expect((await notiser(RUT))[0].last).toBeNull()
    const [n] = await notiser(OLA)
    const d = await som(OLA, (tx) => tx.query('delete from public.notiser where id = $1', [n.id]))
    expect(d.affectedRows).toBe(1)
  })

  it('anon når ingenting', async () => {
    await forvantaFel(somAnon((tx) => tx.query('select id from public.notiser')))
    await forvantaFel(somAnon((tx) => tx.query('delete from public.notiser')))
    await forvantaFel(somAnon((tx) => tx.query('update public.notiser set last = now()')))
  })

  it('ligger i Realtime med replica identity default, så att en borttagning bara skickar id', async () => {
    const p = await db.query(`select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notiser'`)
    expect(p.rows).toHaveLength(1)
    const r = await db.query<{ r: string }>(`select relreplident as r from pg_class where oid = 'public.notiser'::regclass`)
    expect(r.rows[0].r).toBe('d')
  })

  it('en sökväg till en annan webbplats och en okänd sort stoppas, och sorterna är desamma som i src/lib/notiser.ts', async () => {
    await forvantaFel(db.query(`insert into public.notiser (user_id, typ, text, lank) values ($1, 'gick_med', 'x', '//annan.se')`, [OLA]))
    await forvantaFel(db.query(`insert into public.notiser (user_id, typ, text, lank) values ($1, 'gick_med', 'x', 'https://annan.se')`, [OLA]))
    await forvantaFel(db.query(`insert into public.notiser (user_id, typ, text) values ($1, 'okand', 'x')`, [OLA]))
    const r = await db.query<{ def: string }>(
      `select pg_get_constraintdef(c.oid) as def from pg_constraint c where c.conrelid = 'public.notiser'::regclass and c.contype = 'c' and pg_get_constraintdef(c.oid) like '%typ%'`,
    )
    expect([...r.rows[0].def.matchAll(/'([a-z_]+)'::text/g)].map((m) => m[1])).toEqual([...NOTISTYPER])
  })

  it('den som lämnar turen eller tas bort förlorar sina notiser om turen, men de andras ligger kvar', async () => {
    expect(await notiser(RUT)).toHaveLength(1)
    const ola = (await notiser(OLA)).length
    await som(RUT, (tx) => tx.query('delete from public.deltagare where tur_id = $1 and user_id = $2', [tur, RUT]))
    expect(await mottagare()).not.toContain(RUT)
    expect(await notiser(OLA)).toHaveLength(ola)
    await som(OLA, (tx) => tx.query(`update public.deltagare set roll = 'editor' where tur_id = $1 and user_id = $2`, [tur, LIS]))
    await som(RUT, (tx) => tx.query('select public.ga_med($1)', [kod]))
    expect(await notiser(LIS)).toHaveLength(1)
    await som(OLA, (tx) => tx.query('delete from public.deltagare where tur_id = $1 and user_id = $2', [tur, LIS]))
    expect(await mottagare()).not.toContain(LIS)
    expect(await mottagare()).toContain(OLA)
  })

  it('notiserna försvinner med turen', async () => {
    expect(await mottagare()).not.toEqual([])
    await som(OLA, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect(await mottagare()).toEqual([])
  })

  it('notiserna försvinner med mottagarens konto, och notiserna från en person när hen raderar sitt konto', async () => {
    const t = await skapaTur(OLA, 'Tur före kontoradering')
    const k = await kodFor(t)
    await som(MAX, (tx) => tx.query('select public.ga_med($1)', [k]))
    await som(TIM, (tx) => tx.query('select public.ga_med($1)', [k]))
    // Max är redigerare och får också en notis när Tim går med.
    expect(await mottagare(t)).toEqual([MAX, OLA, OLA].sort())
    await db.query('delete from auth.users where id = $1', [MAX])
    expect((await notiser(OLA, t)).map((n) => n.fran_user_id)).toEqual([TIM])
    await db.query('delete from auth.users where id = $1', [OLA])
    expect((await db.query('select 1 from public.notiser where user_id = $1', [OLA])).rows).toHaveLength(0)
  })
})

describe('egna rätter hemma och favoritrecept', () => {
  // Egna användare: Siv och Tage delar en tur. Det ska inte ge Tage någon åtkomst till Sivs rader.
  const SIV = '00000000-0000-0000-0000-000000000051'
  const TAGE = '00000000-0000-0000-0000-000000000052'
  let sivsRecept: string
  let tagesRecept: string
  let sivsRatt: string

  beforeAll(async () => {
    await db.query(`insert into auth.users (id, email) values ('${SIV}', 'siv@exempel.se'), ('${TAGE}', 'tage@exempel.se')`)
    const tur = await skapaTur(SIV, 'Tur med hemmarätter')
    const kod = await kodFor(tur)
    await som(TAGE, (tx) => tx.query('select public.ga_med($1)', [kod]))
    sivsRecept = (await som(SIV, (tx) => tx.query<{ id: string }>(`insert into public.recept (namn) values ('Korvstroganoff') returning id`))).rows[0].id
    tagesRecept = (await som(TAGE, (tx) => tx.query<{ id: string }>(`insert into public.recept (namn) values ('Tages gryta') returning id`))).rows[0].id
    sivsRatt = (
      await som(SIV, (tx) =>
        tx.query<{ id: string }>(
          `insert into public.skafferiratter (namn, portioner, bast_fore, recept_id) values ('Mammas korvstroganoff', 5, '2027-03-01', $1) returning id`,
          [sivsRecept],
        ),
      )
    ).rows[0].id
    await som(SIV, (tx) => tx.query(`insert into public.receptfavoriter (receptkatalog_id) values ('aprikosgrot')`))
    await som(SIV, (tx) => tx.query('insert into public.receptfavoriter (recept_id) values ($1)', [sivsRecept]))
    // Tage har en stjärna och en rätt kopplad till sitt eget recept, så att raderingen av kontot prövar båda.
    await som(TAGE, (tx) => tx.query('insert into public.receptfavoriter (recept_id) values ($1)', [tagesRecept]))
    await som(TAGE, (tx) => tx.query(`insert into public.skafferiratter (namn, recept_id) values ('Tages gryta hemma', $1)`, [tagesRecept]))
  })

  it('raderna blir ens egna utan att user_id anges, och ägaren ändrar och tar bort', async () => {
    const r = await som(SIV, (tx) => tx.query<{ namn: string; portioner: number; user_id: string }>('select namn, portioner, user_id from public.skafferiratter'))
    expect(r.rows).toEqual([{ namn: 'Mammas korvstroganoff', portioner: 5, user_id: SIV }])
    expect((await som(SIV, (tx) => tx.query('select id from public.receptfavoriter'))).rows).toHaveLength(2)
    expect((await som(SIV, (tx) => tx.query('update public.skafferiratter set portioner = 4, bast_fore = null where id = $1', [sivsRatt]))).affectedRows).toBe(1)
    const ny = await som(SIV, (tx) => tx.query<{ id: string }>(`insert into public.skafferiratter (namn, receptkatalog_id) values ('Torkad gröt', 'aprikosgrot') returning id`))
    expect((await som(SIV, (tx) => tx.query('delete from public.skafferiratter where id = $1', [ny.rows[0].id]))).affectedRows).toBe(1)
  })

  it('någon annan ser inte, ändrar inte och tar inte bort raderna, inte ens i samma tur', async () => {
    for (const vem of [TAGE, C]) {
      expect((await som(vem, (tx) => tx.query(`select id from public.skafferiratter where user_id = '${SIV}'`))).rows).toHaveLength(0)
      expect((await som(vem, (tx) => tx.query(`select id from public.receptfavoriter where user_id = '${SIV}'`))).rows).toHaveLength(0)
    }
    // Tage ser bara sina egna rader.
    const tages = await som(TAGE, (tx) => tx.query<{ user_id: string }>('select user_id from public.skafferiratter'))
    expect(tages.rows.every((x) => x.user_id === TAGE)).toBe(true)
    expect((await som(TAGE, (tx) => tx.query('update public.skafferiratter set portioner = 99 where id = $1', [sivsRatt]))).affectedRows).toBe(0)
    expect((await som(TAGE, (tx) => tx.query('delete from public.skafferiratter where id = $1', [sivsRatt]))).affectedRows).toBe(0)
    expect((await som(TAGE, (tx) => tx.query(`delete from public.receptfavoriter where user_id = '${SIV}'`))).affectedRows).toBe(0)
    expect((await db.query<{ portioner: number }>('select portioner from public.skafferiratter where id = $1', [sivsRatt])).rows).toEqual([{ portioner: 4 }])
  })

  it('man kan inte lägga något hos någon annan, ge bort sina rader eller koppla till någon annans recept', async () => {
    const rls = /row-level security/
    await expect(som(TAGE, (tx) => tx.query(`insert into public.skafferiratter (namn, user_id) values ('Smyg', '${SIV}')`))).rejects.toThrow(rls)
    await expect(som(TAGE, (tx) => tx.query(`insert into public.receptfavoriter (receptkatalog_id, user_id) values ('aprikosgrot', '${SIV}')`))).rejects.toThrow(rls)
    await expect(som(SIV, (tx) => tx.query(`update public.skafferiratter set user_id = '${TAGE}' where id = $1`, [sivsRatt]))).rejects.toThrow(rls)
    // Ett eget recept måste ha samma ägare som raden.
    await forvantaFel(som(SIV, (tx) => tx.query(`insert into public.skafferiratter (namn, recept_id) values ('Lånad', $1)`, [tagesRecept])))
    await forvantaFel(som(SIV, (tx) => tx.query('insert into public.receptfavoriter (recept_id) values ($1)', [tagesRecept])))
    await forvantaFel(som(SIV, (tx) => tx.query('update public.skafferiratter set recept_id = $1 where id = $2', [tagesRecept, sivsRatt])))
    // En stjärna ändras inte, den läggs till eller tas bort.
    await forvantaFel(som(SIV, (tx) => tx.query(`update public.receptfavoriter set receptkatalog_id = 'havregryta'`)))
    // Åt andra hållet: Tage kan inte koppla en rätt eller en stjärna till Sivs recept.
    await forvantaFel(som(TAGE, (tx) => tx.query(`insert into public.skafferiratter (namn, recept_id) values ('Lånad', $1)`, [sivsRecept])))
    await forvantaFel(som(TAGE, (tx) => tx.query('insert into public.receptfavoriter (recept_id) values ($1)', [sivsRecept])))
  })

  it('går inte att nå utan inloggning, och har bara de avsedda rättigheterna', async () => {
    const har = async (roll: string, t: string, r: string) => (await db.query<{ ok: boolean }>('select has_table_privilege($1, $2, $3) as ok', [roll, t, r])).rows[0].ok
    for (const t of ['public.skafferiratter', 'public.receptfavoriter']) {
      await forvantaFel(somAnon((tx) => tx.query(`select 1 from ${t}`)))
      await forvantaFel(somAnon((tx) => tx.query(`delete from ${t}`)))
      for (const r of ['select', 'insert', 'update', 'delete']) {
        expect(await har('anon', t, r), `anon ${t} ${r}`).toBe(false)
        expect(await har('public', t, r), `public ${t} ${r}`).toBe(false)
      }
      for (const r of ['select', 'insert', 'delete']) expect(await har('authenticated', t, r), `authenticated ${t} ${r}`).toBe(true)
      const rls = await db.query('select relrowsecurity from pg_class where oid = $1::regclass', [t])
      expect(rls.rows).toEqual([{ relrowsecurity: true }])
    }
    expect(await har('authenticated', 'public.receptfavoriter', 'update')).toBe(false)
    expect(await har('authenticated', 'public.skafferiratter', 'update')).toBe(true)
  })

  it('kräver portioner 1 till 999, ett namn, högst ett recept och ett unikt namn per person', async () => {
    for (const fel of [
      `insert into public.skafferiratter (namn, portioner) values ('Noll', 0)`,
      `insert into public.skafferiratter (namn, portioner) values ('Tusen', 1000)`,
      `insert into public.skafferiratter (namn) values ('')`,
      `insert into public.skafferiratter (namn) values (' Mellanslag')`,
      `insert into public.skafferiratter (namn, recept_id, receptkatalog_id) values ('Båda', '${sivsRecept}', 'aprikosgrot')`,
      `insert into public.skafferiratter (namn) values ('MAMMAS KORVSTROGANOFF')`,
      `insert into public.receptfavoriter (recept_id) values (null)`,
      `insert into public.receptfavoriter (recept_id, receptkatalog_id) values ('${sivsRecept}', 'aprikosgrot')`,
      `insert into public.receptfavoriter (receptkatalog_id) values ('aprikosgrot')`,
      `insert into public.receptfavoriter (receptkatalog_id) values ('finns-inte')`,
    ])
      await forvantaFel(som(SIV, (tx) => tx.query(fel)))
    expect((await som(SIV, (tx) => tx.query('update public.skafferiratter set portioner = 999 where id = $1', [sivsRatt]))).affectedRows).toBe(1)
    // Tage får ha en rätt med samma namn.
    expect((await som(TAGE, (tx) => tx.query(`insert into public.skafferiratter (namn) values ('Mammas korvstroganoff')`))).affectedRows).toBe(1)
  })

  it('när receptet tas bort finns rätten kvar utan koppling, och stjärnan försvinner', async () => {
    await som(SIV, (tx) => tx.query('delete from public.recept where id = $1', [sivsRecept]))
    const r = await db.query<{ recept_id: string | null; user_id: string }>('select recept_id, user_id from public.skafferiratter where id = $1', [sivsRatt])
    expect(r.rows).toEqual([{ recept_id: null, user_id: SIV }])
    expect((await db.query('select 1 from public.receptfavoriter where user_id = $1 and recept_id is not null', [SIV])).rows).toHaveLength(0)
  })

  it('när ett av MinVandrings recept tas bort finns rätten kvar utan koppling, och stjärnan försvinner', async () => {
    await db.query(
      "insert into public.receptkatalog (id, namn, maltid, portioner, kok_kravs, torkning_hemma, beskrivning, mangder, inspirerat_av, inspirerat_av_url, status) values ('skafferitest', 'Test', 'middag', 1, true, false, 'Text', 'egna', 'Någon', 'https://x.se', 'otestat')",
    )
    const ratt = await som(SIV, (tx) => tx.query<{ id: string }>(`insert into public.skafferiratter (namn, receptkatalog_id) values ('Från katalogen', 'skafferitest') returning id`))
    await som(SIV, (tx) => tx.query(`insert into public.receptfavoriter (receptkatalog_id) values ('skafferitest')`))
    await db.query(`delete from public.receptkatalog where id = 'skafferitest'`)
    const r = await db.query('select receptkatalog_id from public.skafferiratter where id = $1', [ratt.rows[0].id])
    expect(r.rows).toEqual([{ receptkatalog_id: null }])
    expect((await db.query(`select 1 from public.receptfavoriter where receptkatalog_id = 'skafferitest'`)).rows).toHaveLength(0)
  })

  it('försvinner med kontot', async () => {
    await db.query(`delete from auth.users where id = '${TAGE}'`)
    expect((await db.query(`select 1 from public.skafferiratter where user_id = '${TAGE}'`)).rows).toHaveLength(0)
    expect((await db.query(`select 1 from public.receptfavoriter where user_id = '${TAGE}'`)).rows).toHaveLength(0)
    expect((await db.query('select 1 from public.recept where id = $1', [tagesRecept])).rows).toHaveLength(0)
  })
})
