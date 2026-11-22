// PreToolUse-hook för Claude Code. Stoppar det som aldrig får hända i repot:
// ändring av en mergad migrering, git add av allt, commit av .env.local,
// push direkt till main och kommandon som skriver över ocommittat i supabase/katalog.
//
// Claude Code skickar verktygsanropet som JSON på stdin. Avslutas skriptet med kod 2
// stoppas anropet och texten på stderr visas för Claude. Reglerna står i skyddsregler.mjs.

import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { franRot, granskaFilandring, granskaKommando } from './skyddsregler.mjs'

const rot = path.resolve(import.meta.dirname, '..', '..')

function git(...arg) {
  return execFileSync('git', arg, { cwd: rot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}
const rader = (text) => text.split('\n').map((r) => r.trim()).filter(Boolean)
const forsok = (f, annars) => {
  try {
    return f()
  } catch {
    return annars
  }
}

const fakta = {
  migreringarPaMain: () =>
    forsok(() => rader(git('ls-tree', '--name-only', 'origin/main', 'supabase/migrations/')).map((r) => r.split('/').pop()), null),
  finnsPaDisk: (s) => existsSync(path.join(rot, s)),
  arMapp: (s) => forsok(() => statSync(path.join(rot, s)).isDirectory(), false),
  // Går det inte att fråga git räknas katalogen som ändrad, så att kommandot stoppas.
  katalogenHarAndringar: () => forsok(() => git('status', '--porcelain', '--', 'supabase/katalog').trim() !== '', true),
  aktuellBranch: () => forsok(() => git('rev-parse', '--abbrev-ref', 'HEAD').trim(), ''),
  koadeFiler: () => forsok(() => rader(git('diff', '--cached', '--name-only')), []),
}

function granska(anrop) {
  const indata = anrop.tool_input ?? {}
  const cwd = anrop.cwd || rot
  if (['Bash', 'PowerShell'].includes(anrop.tool_name)) {
    return typeof indata.command === 'string' ? granskaKommando(indata.command, cwd, rot, fakta) : null
  }
  if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(anrop.tool_name)) {
    const fil = indata.file_path ?? indata.notebook_path
    return typeof fil === 'string' ? granskaFilandring(franRot(fil, cwd, rot), fakta) : null
  }
  return null
}

let text = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (bit) => (text += bit))
process.stdin.on('end', () => {
  let skal = null
  try {
    skal = granska(JSON.parse(text))
  } catch (fel) {
    // Ett fel i hooken ska inte stoppa arbetet, men det ska synas.
    console.error(`skydd.mjs kunde inte granska anropet: ${fel.message}`)
    process.exit(1)
  }
  if (skal) {
    console.error(`Stoppat av .claude/hooks/skydd.mjs: ${skal}`)
    process.exit(2)
  }
})
