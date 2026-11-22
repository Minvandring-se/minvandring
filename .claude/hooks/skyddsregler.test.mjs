import { describe, expect, it } from 'vitest'
import { delaKommando, franRot, granskaFilandring, granskaKommando } from './skyddsregler.mjs'

const rot = 'C:/Users/test/minvandring'
const MERGAD = '20261108000000_grund.sql'

function fakta(over = {}) {
  return {
    migreringarPaMain: () => [MERGAD, '20261109000000_roller.sql'],
    finnsPaDisk: () => true,
    arMapp: (s) => ['src', 'src/lib', 'supabase', 'supabase/katalog', 'supabase/migrations', 'Claude outputs'].includes(s),
    katalogenHarAndringar: () => false,
    aktuellBranch: () => 'min-branch',
    koadeFiler: () => [],
    ...over,
  }
}

const kor = (kommando, over) => granskaKommando(kommando, rot, rot, fakta(over))
const stoppas = (kommando, over) => expect(kor(kommando, over), kommando).toEqual(expect.any(String))
const slapps = (kommando, over) => expect(kor(kommando, over), kommando).toBeNull()

describe('franRot', () => {
  it('förstår Windows, Git Bash och relativa sökvägar', () => {
    expect(franRot('C:\\Users\\test\\minvandring\\src\\a.ts', rot, rot)).toBe('src/a.ts')
    expect(franRot('/c/Users/test/minvandring/src/a.ts', rot, rot)).toBe('src/a.ts')
    expect(franRot('../lib/a.ts', `${rot}/src/x`, rot)).toBe('src/lib/a.ts')
    expect(franRot('.', rot, rot)).toBe('')
    expect(franRot('C:/Annat/a.ts', rot, rot)).toBeNull()
    expect(franRot('/home/a/repo/src/a.ts', '/home/a/repo', '/home/a/repo')).toBe('src/a.ts')
  })
})

describe('delaKommando', () => {
  it('delar i led och håller ihop citat', () => {
    expect(delaKommando('cd x && git commit -m "a; b && c" ; ls | wc')).toEqual([
      ['cd', 'x'],
      ['git', 'commit', '-m', 'a; b && c'],
      ['ls'],
      ['wc'],
    ])
    expect(delaKommando('npm test 2>&1')).toEqual([['npm', 'test', '2>&1']])
  })
})

describe('migreringar', () => {
  const fil = (namn) => `supabase/migrations/${namn}`

  it('stoppar ändring av en migrering som finns på origin/main', () => {
    expect(granskaFilandring(fil(MERGAD), fakta())).toMatch(/origin\/main/)
    expect(granskaFilandring(fil(MERGAD.toUpperCase()), fakta())).toMatch(/origin\/main/)
  })

  it('släpper igenom en ny migrering, också när den rättas', () => {
    expect(granskaFilandring(fil('20261122000000_ny.sql'), fakta())).toBeNull()
  })

  it('släpper igenom andra filer', () => {
    expect(granskaFilandring('src/lib/vikt.ts', fakta())).toBeNull()
    expect(granskaFilandring('supabase/rls.test.ts', fakta())).toBeNull()
    expect(granskaFilandring(null, fakta())).toBeNull()
  })

  it('stoppar en befintlig fil men inte en ny när origin/main inte går att läsa', () => {
    const utanGit = { migreringarPaMain: () => null }
    expect(granskaFilandring(fil(MERGAD), fakta(utanGit))).toMatch(/git fetch/)
    expect(granskaFilandring(fil('ny.sql'), fakta({ ...utanGit, finnsPaDisk: () => false }))).toBeNull()
  })

  it('stoppar skalkommandon som ändrar en mergad migrering', () => {
    stoppas(`rm ${fil(MERGAD)}`)
    stoppas(`git rm ${fil(MERGAD)}`)
    stoppas(`mv ${fil(MERGAD)} ${fil('annat.sql')}`)
    stoppas(`sed -i 's/a/b/' ${fil(MERGAD)}`)
    stoppas(`echo "drop table turer;" >> ${fil(MERGAD)}`)
    stoppas(`echo x >${fil(MERGAD)}`)
    stoppas(`Remove-Item supabase\\migrations\\${MERGAD}`)
    stoppas(`Set-Content -Path ${fil(MERGAD)} -Value x`)
    stoppas('rm supabase/migrations/*.sql')
    stoppas('rm -r supabase/migrations')
  })

  it('släpper igenom läsning och arbete med en ny migrering', () => {
    slapps(`cat ${fil(MERGAD)}`)
    slapps(`cat ${fil(MERGAD)} 2>&1`)
    slapps(`grep -n policy ${fil(MERGAD)} > ut.txt`)
    slapps(`git diff origin/main -- ${fil(MERGAD)}`)
    slapps(`rm ${fil('20261122000000_ny.sql')}`)
    slapps(`mv ${fil('20261122000000_ny.sql')} ${fil('20261122000001_ny.sql')}`)
    slapps('ls supabase/migrations')
  })
})

describe('git add och commit', () => {
  it('stoppar allt som lägger till mer än utpekade filer', () => {
    stoppas('git add .')
    stoppas('git add -A')
    stoppas('git add --all')
    stoppas('git add -u')
    stoppas('git add *')
    stoppas('git add src')
    stoppas('git add src/lib/')
    stoppas('git add "Claude outputs"')
    stoppas('git add src/*.ts')
    stoppas('cd src && git add . && git commit -m x')
    stoppas('git -C . add -A')
    stoppas('git commit -am "allt"')
    stoppas('git commit -a -m "allt"')
    stoppas('git commit --all -m "allt"')
  })

  it('stoppar .env.local', () => {
    stoppas('git add -f .env.local')
    stoppas('git add .env')
    stoppas('git commit -m "x"', { koadeFiler: () => ['src/a.ts', '.env.local'] })
  })

  it('släpper igenom exakta sökvägar och vanliga commits', () => {
    slapps('git add src/lib/vikt.ts src/lib/vikt.test.ts')
    slapps('git add .env.example')
    slapps('git add -p src/lib/vikt.ts')
    slapps('git commit -m "Viktberäkning: basvikt och total startvikt"')
    slapps('git commit --amend -m "Rättar git add . i texten"')
    slapps('git status && git diff')
  })
})

describe('git push', () => {
  it('stoppar push till main', () => {
    stoppas('git push origin main')
    stoppas('git push origin HEAD:main')
    stoppas('git push -f origin +min-branch:refs/heads/main')
    stoppas('git push --all origin')
    stoppas('git push', { aktuellBranch: () => 'main' })
    stoppas('git push origin HEAD', { aktuellBranch: () => 'main' })
  })

  it('släpper igenom push av en egen branch', () => {
    slapps('git push -u origin min-branch')
    slapps('git push')
    slapps('git push origin HEAD')
    slapps('git push origin main-meny')
  })
})

describe('katalogen', () => {
  const andrad = { katalogenHarAndringar: () => true }

  it('stoppar restore och checkout som pekar in i katalogen', () => {
    stoppas('git restore supabase/katalog/talt-och-vindskydd.csv')
    stoppas('git restore .')
    stoppas('git restore supabase')
    stoppas('git checkout -- supabase/katalog/talt-och-vindskydd.csv')
    stoppas('git checkout origin/main -- supabase/katalog')
    stoppas('git checkout .')
  })

  it('stoppar stash, branchbyte, reset --hard och clean när katalogen har ändringar', () => {
    stoppas('git stash', andrad)
    stoppas('git stash push -u', andrad)
    stoppas('git checkout main', andrad)
    stoppas('git switch main', andrad)
    stoppas('git reset --hard origin/main', andrad)
    stoppas('git clean -fd', andrad)
  })

  it('släpper igenom samma kommandon när katalogen är orörd', () => {
    slapps('git stash')
    slapps('git checkout main')
    slapps('git switch -')
    slapps('git reset --hard origin/main')
  })

  it('släpper igenom det som inte skriver över något', () => {
    slapps('git checkout -b ny-branch', andrad)
    slapps('git switch -c ny-branch', andrad)
    slapps('git stash list', andrad)
    slapps('git restore --staged supabase/katalog/talt-och-vindskydd.csv', andrad)
    slapps('git restore src/lib/vikt.ts', andrad)
    slapps('git checkout -- src/lib/vikt.ts', andrad)
    slapps('git clean -n', andrad)
    slapps('git add supabase/katalog/talt-och-vindskydd.csv', andrad)
    slapps('npm run katalog', andrad)
  })
})
