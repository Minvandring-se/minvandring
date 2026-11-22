// Reglerna bakom hooken i skydd.mjs. Rena funktioner: allt som kräver git eller
// filsystemet kommer in genom `fakta`, så att reglerna går att testa utan ett repo.
//
// Varje funktion svarar med en text som förklarar varför något stoppas, eller null.
//
// fakta:
//   migreringarPaMain()      namnen på filerna i supabase/migrations på origin/main,
//                            eller null om det inte går att ta reda på
//   finnsPaDisk(sokvag)      om filen finns (sökväg från repots rot)
//   arMapp(sokvag)           om sökvägen är en mapp (sökväg från repots rot)
//   katalogenHarAndringar()  om supabase/katalog har ändringar som inte är committade
//   aktuellBranch()          namnet på den utcheckade branchen
//   koadeFiler()             filerna som ligger i kö för nästa commit

const MIGRERINGAR = 'supabase/migrations'
const KATALOG = 'supabase/katalog'

/** Gör om en sökväg till en sökväg från repots rot med snedstreck, eller null om den ligger utanför. */
export function franRot(sokvag, cwd, rot) {
  const norm = (s) => {
    let ut = String(s).replace(/\\/g, '/')
    // Git Bash skriver C:\ som /c/
    const m = ut.match(/^\/([a-zA-Z])\/(.*)$/)
    if (m) ut = `${m[1]}:/${m[2]}`
    return ut
  }
  const absolut = (s) => /^[a-zA-Z]:\//.test(s) || s.startsWith('/')
  const hopslagen = (bas, del) => {
    const delar = []
    for (const d of `${bas}/${del}`.split('/')) {
      if (d === '' || d === '.') continue
      if (d === '..') delar.pop()
      else delar.push(d)
    }
    return delar
  }
  const s = norm(sokvag)
  const full = absolut(s) ? hopslagen('', s) : hopslagen(norm(cwd), s)
  const rotdelar = hopslagen('', norm(rot))
  const lika = (a, b) => a.toLowerCase() === b.toLowerCase()
  if (full.length < rotdelar.length) return null
  if (!rotdelar.every((d, i) => lika(d, full[i]))) return null
  return full.slice(rotdelar.length).join('/')
}

const inuti = (sokvag, mapp) => sokvag.toLowerCase().startsWith(`${mapp}/`)
// Sant om sökvägen är mappen, ligger i den eller är en mapp ovanför den (till exempel "." eller "supabase").
const ror = (sokvag, mapp) => {
  const s = sokvag.toLowerCase()
  return s === '' || s === mapp || s.startsWith(`${mapp}/`) || mapp.startsWith(`${s}/`)
}

function skyddadMigrering(sokvagFranRot, fakta) {
  if (!inuti(sokvagFranRot, MIGRERINGAR)) return null
  const namn = sokvagFranRot.slice(MIGRERINGAR.length + 1)
  const paMain = fakta.migreringarPaMain()
  if (paMain === null) {
    // Går det inte att fråga git stoppas ändringar i filer som redan finns. Nya filer släpps igenom.
    return fakta.finnsPaDisk(sokvagFranRot)
      ? `Kunde inte läsa origin/main, så det går inte att avgöra om ${namn} redan är mergad. Kör git fetch origin och försök igen.`
      : null
  }
  return paMain.some((n) => n.toLowerCase() === namn.toLowerCase())
    ? `${namn} finns redan på origin/main. En migrering som är mergad ändras aldrig. Skriv en ny migrering i stället (skillen ny-migrering).`
    : null
}

/** Edit, Write och liknande verktyg. */
export function granskaFilandring(sokvagFranRot, fakta) {
  if (sokvagFranRot === null) return null
  return skyddadMigrering(sokvagFranRot, fakta)
}

/** Delar ett kommando i led (mellan &&, ||, ;, | och radbrytning) och varje led i ord. Citattecken respekteras. */
export function delaKommando(kommando) {
  const led = []
  let ord = []
  let nu = ''
  let harOrd = false
  let citat = null
  const slutOrd = () => {
    if (harOrd) ord.push(nu)
    nu = ''
    harOrd = false
  }
  const slutLed = () => {
    slutOrd()
    if (ord.length) led.push(ord)
    ord = []
  }
  for (let i = 0; i < kommando.length; i++) {
    const c = kommando[i]
    if (citat) {
      if (c === citat) citat = null
      else if (c === '\\' && citat === '"' && i + 1 < kommando.length && '"\\$`'.includes(kommando[i + 1])) nu += kommando[++i]
      else nu += c
    } else if (c === '"' || c === "'") {
      citat = c
      harOrd = true
    } else if (c === '&' && (nu.endsWith('>') || kommando[i + 1] === '>')) {
      // 2>&1 och &> är omdirigeringar, inte gränser mellan kommandon.
      nu += c
    } else if (c === '\n' || c === ';' || c === '|' || c === '&') {
      slutLed()
    } else if (c === '(' || c === ')' || c === '{' || c === '}') {
      // Underskal och block: börja ett nytt led så att kommandot inuti granskas för sig.
      slutLed()
    } else if (/\s/.test(c)) {
      slutOrd()
    } else {
      nu += c
      harOrd = true
    }
  }
  slutLed()
  return led
}

const kommandonamn = (ord) =>
  ord
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .toLowerCase()
    .replace(/\.(exe|cmd|bat)$/, '')

/** Hittar git-anropet i ett led: underkommandot och orden efter det. */
function gitAnrop(ord) {
  let i = 0
  while (i < ord.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(ord[i])) i++
  if (i >= ord.length || kommandonamn(ord[i]) !== 'git') return null
  i++
  while (i < ord.length && ord[i].startsWith('-')) {
    i += ord[i] === '-C' || ord[i] === '-c' ? 2 : 1
  }
  if (i >= ord.length) return null
  return { under: ord[i].toLowerCase(), arg: ord.slice(i + 1) }
}

const kortFlagga = (arg, bokstav) => arg.some((a) => /^-[A-Za-z]+$/.test(a) && a.includes(bokstav))
const langFlagga = (arg, ...namn) => arg.some((a) => namn.some((n) => a === n || a.startsWith(`${n}=`)))
const utanFlaggor = (arg) => arg.filter((a) => !a.startsWith('-'))
const arMiljofil = (a) => {
  const namn = a.replace(/\\/g, '/').split('/').pop().toLowerCase()
  return /^\.env(\..+)?$/.test(namn) && namn !== '.env.example'
}

function granskaAdd(arg, cwd, rot, fakta) {
  if (kortFlagga(arg, 'A') || kortFlagga(arg, 'u') || langFlagga(arg, '--all', '--update', '--no-ignore-removal')) {
    return 'git add med -A, --all eller -u lägger till allt som har ändrats. Lägg till filerna med exakta sökvägar.'
  }
  for (const a of utanFlaggor(arg)) {
    if (arMiljofil(a)) return `${a} får aldrig committas.`
    if (/[*?[]/.test(a)) return `git add ${a} lägger till flera filer på en gång. Lägg till filerna med exakta sökvägar.`
    const s = franRot(a, cwd, rot)
    if (s !== null && (s === '' || fakta.arMapp(s))) {
      return `git add ${a} lägger till en hel mapp. Flera personer lägger filer i repot samtidigt, så lägg till filerna med exakta sökvägar.`
    }
  }
  return null
}

function granskaCommit(arg, fakta) {
  if (kortFlagga(arg, 'a') || langFlagga(arg, '--all')) {
    return 'git commit -a tar med allt som har ändrats. Lägg till filerna med exakta sökvägar och committa sedan.'
  }
  const miljofil = [...utanFlaggor(arg), ...fakta.koadeFiler()].find(arMiljofil)
  return miljofil ? `${miljofil} får aldrig committas. Ta bort den ur kön med git restore --staged och försök igen.` : null
}

function granskaPush(arg, fakta) {
  const stopp = 'Direkt push till main är stoppad. Merge till main publiceras på www.minvandring.se. Pusha en egen branch och skapa en pull request, eller be användaren köra kommandot själv.'
  if (langFlagga(arg, '--all', '--mirror')) return stopp
  const mal = utanFlaggor(arg).slice(1)
  if (mal.length === 0) return fakta.aktuellBranch() === 'main' ? stopp : null
  for (const m of mal) {
    const delar = m.replace(/^\+/, '').split(':')
    let dit = delar[delar.length - 1].replace(/^refs\/heads\//, '')
    if (dit === 'HEAD' || dit === '@') dit = fakta.aktuellBranch()
    if (dit === 'main') return stopp
  }
  return null
}

const katalogstopp = (vad) =>
  `${vad} kan skriva över ändringar i ${KATALOG}/ som inte är committade. Fråga användaren först. Säger användaren ja kan hen köra kommandot själv med ! i prompten.`

function granskaKatalog(under, arg, cwd, rot, fakta) {
  const sokvagar = (lista) => lista.map((a) => franRot(a, cwd, rot)).filter((s) => s !== null)
  const rorKatalogen = (lista) => sokvagar(lista).some((s) => ror(s, KATALOG))
  const streck = arg.indexOf('--')

  if (under === 'restore') {
    if (kortFlagga(arg, 'S') || langFlagga(arg, '--staged')) {
      if (!kortFlagga(arg, 'W') && !langFlagga(arg, '--worktree')) return null
    }
    return rorKatalogen(utanFlaggor(arg)) ? katalogstopp('git restore') : null
  }
  if (under === 'checkout' || under === 'switch') {
    const efterStreck = streck >= 0 ? arg.slice(streck + 1) : []
    // Utan "--" kan ett ord vara både branch och sökväg. Det räknas som sökväg om det pekar in i katalogen.
    const mojligaSokvagar = streck >= 0 ? efterStreck : utanFlaggor(arg).filter((a) => a === '.' || /[\\/]/.test(a))
    if (under === 'checkout' && sokvagar(mojligaSokvagar).some((s) => ror(s, KATALOG) && (s === '' || fakta.finnsPaDisk(s)))) {
      return katalogstopp('git checkout med en sökväg')
    }
    const skaparBranch = kortFlagga(arg, 'b') || kortFlagga(arg, 'B') || kortFlagga(arg, 'c') || kortFlagga(arg, 'C') || langFlagga(arg, '--orphan', '--create', '--force-create')
    if (!skaparBranch && efterStreck.length === 0 && fakta.katalogenHarAndringar()) {
      return katalogstopp('Ett branchbyte')
    }
    return null
  }
  if (under === 'stash') {
    const forsta = utanFlaggor(arg)[0]
    const lasande = ['list', 'show', 'drop', 'clear', 'branch', 'create', 'store']
    if (forsta && lasande.includes(forsta)) return null
    return fakta.katalogenHarAndringar() ? katalogstopp(`git stash${forsta ? ` ${forsta}` : ''}`) : null
  }
  if (under === 'reset') {
    return langFlagga(arg, '--hard', '--merge', '--keep') && fakta.katalogenHarAndringar() ? katalogstopp('git reset --hard') : null
  }
  if (under === 'clean') {
    if (kortFlagga(arg, 'n') || langFlagga(arg, '--dry-run')) return null
    return fakta.katalogenHarAndringar() ? katalogstopp('git clean') : null
  }
  return null
}

// Kommandon som ändrar, flyttar eller tar bort filer.
const ANDRANDE = new Set([
  'rm', 'mv', 'cp', 'tee', 'truncate', 'dd', 'del', 'erase', 'move', 'ren', 'rename', 'copy',
  'remove-item', 'move-item', 'rename-item', 'copy-item', 'set-content', 'add-content', 'clear-content', 'out-file', 'new-item',
  'ri', 'mi', 'rni', 'sc', 'ac', 'clc',
])

function andrarFiler(ord) {
  const namn = kommandonamn(ord[0])
  if (ANDRANDE.has(namn)) return true
  if ((namn === 'sed' || namn === 'perl') && ord.some((a) => /^-[A-Za-z]*i/.test(a) || a.startsWith('--in-place'))) return true
  const git = gitAnrop(ord)
  return git !== null && ['rm', 'mv', 'checkout', 'restore'].includes(git.under)
}

/** Filerna som ett led skriver till med > eller >>. */
function skrivmal(ord) {
  const mal = []
  ord.forEach((a, i) => {
    const m = a.match(/^(.*?)>>?(.*)$/)
    if (!m) return
    const dit = m[2] !== '' ? m[2] : ord[i + 1]
    if (dit && !dit.startsWith('&')) mal.push(dit)
  })
  return mal
}

function granskaMigreringarISkalet(ord, cwd, rot, fakta) {
  const andrar = andrarFiler(ord)
  for (const a of andrar ? ord.slice(1) : skrivmal(ord)) {
    for (const bit of a.split('=')) {
      const s = franRot(bit, cwd, rot)
      if (s === null) continue
      const iMappen = inuti(s, MIGRERINGAR)
      if (andrar && (s.toLowerCase() === MIGRERINGAR || (iMappen && /[*?[]/.test(s)))) {
        return `${bit} träffar migreringar som redan finns på origin/main. En migrering som är mergad ändras aldrig. Ange filen med exakt sökväg.`
      }
      const skal = iMappen ? skyddadMigrering(s, fakta) : null
      if (skal) return skal
    }
  }
  return null
}

/** Bash och PowerShell. */
export function granskaKommando(kommando, cwd, rot, fakta) {
  for (const ord of delaKommando(kommando)) {
    const git = gitAnrop(ord)
    const skal =
      granskaMigreringarISkalet(ord, cwd, rot, fakta) ??
      (git &&
        ((git.under === 'add' && granskaAdd(git.arg, cwd, rot, fakta)) ||
          (git.under === 'commit' && granskaCommit(git.arg, fakta)) ||
          (git.under === 'push' && granskaPush(git.arg, fakta)) ||
          granskaKatalog(git.under, git.arg, cwd, rot, fakta)))
    if (skal) return skal
  }
  return null
}
