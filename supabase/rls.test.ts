// Testar åtkomstkontrollen (RLS) mot en riktig Postgres som körs i minnet (PGlite).
// Migrationerna i supabase/migrations körs i ordning, och Supabase-delarna de behöver (auth.users, auth.uid(),
// rollerna anon och authenticated) skapas som enkla kopior här. Inget skickas till den riktiga databasen.
import fs from 'node:fs'
import path from 'node:path'
import { PGlite, type Transaction } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { KATEGORIER } from '../src/lib/forrad'
import { godkanda, importera } from '../src/lib/katalogimport'

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
  const mapp = path.join(import.meta.dirname, 'migrations')
  for (const fil of fs.readdirSync(mapp).sort()) {
    await db.exec(fs.readFileSync(path.join(mapp, fil), 'utf8'))
  }
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
  ]
  const forInloggade = [
    'public.ar_medlem(uuid)',
    'public.kan_andra(uuid)',
    'public.ar_agare(uuid)',
    'public.ga_med(text, uuid)',
    'public.inbjudan(text)',
    'public.ny_inbjudningskod(uuid)',
    'public.delar_tur(uuid)',
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
    await som(A, (tx) => tx.query('insert into public.packstatus (packrad_id, deltagare_id, packad) values ($1, $2, true)', [packrad, pichi]))
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
      `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, kontrollerad, egenskaper)
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
          `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, kontrollerad)
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
        `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, kontrollerad)
         values ('TESTMÄRKE', 'testtält 2', 'talt', 'talt', 2500, 'https://exempel.se/igen', '2026-11-19')`,
      ),
    )
  })

  it('kräver en vikt, en källa och egenskaper som ett objekt', async () => {
    const lagg = (kolumner: string, varden: string) =>
      db.query(
        `insert into public.produkter (marke, modell, kontrollerad, kategori, underkategori, ${kolumner})
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
        `insert into public.produkter (marke, modell, kontrollerad, packvikt_g, kalla, kategori, underkategori)
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
  const iKatalogen = (() => {
    const mapp = path.join(import.meta.dirname, 'katalog')
    return fs.readdirSync(mapp).filter((f) => f.endsWith('.csv')).flatMap((f) => godkanda(importera(fs.readFileSync(path.join(mapp, f), 'utf8')))).length
  })()
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
    expect(ogranskade.rows.length).toBeGreaterThanOrEqual(iKatalogen)
    const id = ogranskade.rows[0].id
    await forvantaFel(som(A, (tx) => tx.query(`update public.produkter set kontrollerad = '2026-11-20' where id = $1`, [id])))
    await forvantaFel(som(A, (tx) => tx.query('update public.produkter set packvikt_g = 1 where id = $1', [id])))
    await forvantaFel(som(A, (tx) => tx.query('delete from public.produkter where id = $1', [id])))
    await forvantaFel(somAnon((tx) => tx.query('select id from public.produkter where kontrollerad is null')))
    const kvar = await db.query<{ n: number }>('select count(*)::int as n from public.produkter where kontrollerad is not null and marke <> $1 and marke <> $2', ['Testmärke', 'M'])
    expect(kvar.rows[0].n).toBe(0)
  })

  it('en produkt får sakna kontrollerad, och den går att sätta senare', async () => {
    const r = await db.query<{ n: number }>('select count(*)::int as n from public.produkter where kontrollerad is null')
    expect(r.rows[0].n).toBeGreaterThan(0)
    await db.query(`update public.produkter set kontrollerad = '2026-11-20' where modell = 'Soulo'`)
    await db.query(`update public.produkter set kontrollerad = null where modell = 'Soulo'`)
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
      `insert into public.produkter (marke, modell, kategori, underkategori, packvikt_g, kalla, kontrollerad)
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
