// Testar åtkomstkontrollen (RLS) mot en riktig Postgres som körs i minnet (PGlite).
// Migrationerna i supabase/migrations körs i ordning, och Supabase-delarna de behöver (auth.users, auth.uid(),
// rollerna anon och authenticated) skapas som enkla kopior här. Inget skickas till den riktiga databasen.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'

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
  const r = await db.query<{ inbjudningskod: string }>('select inbjudningskod from public.turer where id = $1', [turId])
  return r.rows[0].inbjudningskod
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    grant usage on schema public to authenticated, anon;
    create publication supabase_realtime;
  `)
  const mapp = path.join(import.meta.dirname, 'migrations')
  for (const fil of fs.readdirSync(mapp).sort()) {
    await db.exec(fs.readFileSync(path.join(mapp, fil), 'utf8'))
  }
  await db.exec(`
    insert into auth.users (id, email) values
      ('${A}', 'anna@exempel.se'), ('${B}', 'bertil@exempel.se'), ('${C}', 'cilla@exempel.se');
  `)
}, 60_000)

describe('profiler', () => {
  it('skapas automatiskt för nya användare', async () => {
    const r = await db.query('select id from public.profiler')
    expect(r.rows).toHaveLength(3)
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
    await forvantaFel(som(B, (tx) => tx.query(`select public.ga_med('FELKOD')`)))
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
