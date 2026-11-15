// Testar åtkomstkontrollen (RLS) mot en riktig Postgres som körs i minnet (PGlite).
// Migrationerna i supabase/migrations körs i ordning, och Supabase-delarna de behöver (auth.users, auth.uid(),
// rollerna anon och authenticated) skapas som enkla kopior här. Inget skickas till den riktiga databasen.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { beforeAll, describe, expect, it } from 'vitest'

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'
const D = '00000000-0000-0000-0000-00000000000d'

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

async function skapaTur(agare: string, namn: string): Promise<string> {
  return som(agare, async (tx) => {
    const r = await tx.query<{ id: string }>('insert into public.turer (namn) values ($1) returning id', [namn])
    return r.rows[0].id
  })
}

async function kodFor(turId: string) {
  const r = await db.query<{ kod: string }>('select kod from public.inbjudningar where tur_id = $1', [turId])
  return r.rows[0].kod
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } })
  await db.exec(`
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
    -- Som i Supabase: nya funktioner i public får execute för anon och authenticated.
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    -- Supabase skapar rls_auto_enable själv (automatisk RLS). En kopia utan search_path, som i ett nytt projekt.
    create function public.rls_auto_enable() returns event_trigger language plpgsql security definer as $$ begin end $$;
  `)
  const mapp = path.join(import.meta.dirname, 'migrations')
  for (const fil of fs.readdirSync(mapp).sort()) {
    await db.exec(fs.readFileSync(path.join(mapp, fil), 'utf8'))
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${A}', 'anna@exempel.se'), ('${B}', 'bertil@exempel.se'), ('${C}', 'cilla@exempel.se'),
      ('${D}', 'david@exempel.se');
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
  ]
  const forInloggade = [
    'public.ar_medlem(uuid)',
    'public.kan_andra(uuid)',
    'public.ar_agare(uuid)',
    'public.ga_med(text)',
    'public.ny_inbjudningskod(uuid)',
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
    expect(r.rows).toHaveLength(4)
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
    await forvantaFel(som(C, (tx) => tx.query(`update public.deltagare set roll = 'owner' where id = $1`, [cillasDeltagare])))
  })

  it('editor kan lägga till en hund men inte en annan användare', async () => {
    await som(C, (tx) => tx.query(`insert into public.deltagare (tur_id, namn, typ) values ($1, 'Bamse', 'hund')`, [tur]))
    await forvantaFel(
      som(C, (tx) => tx.query(`insert into public.deltagare (tur_id, user_id, namn) values ($1, '${B}', 'Bertil')`, [tur])),
    )
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
      tx.query('insert into public.packstatus (packrad_id, deltagare_id, packad) values ($1, $2, true)', [packrad, cillasDeltagare]),
    )
    await forvantaFel(
      som(C, (tx) =>
        tx.query('insert into public.packstatus (packrad_id, deltagare_id, packad) values ($1, $2, true)', [packrad, annasDeltagare]),
      ),
    )
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

  it('owner kan radera turen, och då försvinner allt i den', async () => {
    await som(A, (tx) => tx.query('delete from public.turer where id = $1', [tur]))
    expect(await turnamn(tur)).toBeUndefined()
    const d = await db.query('select id from public.deltagare where tur_id = $1', [tur])
    expect(d.rows).toHaveLength(0)
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
