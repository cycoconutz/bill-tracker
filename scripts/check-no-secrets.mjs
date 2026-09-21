// Fail the build if a secret-looking key got bundled into dist/ or committed config.
// Run after `npm run build` in CI and in run-data.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['dist', 'src', 'public/data'].filter(existsSync)
// Build patterns dynamically so this checker file doesn't match itself.
const FORBIDDEN = [
  new RegExp('VITE_' + 'CONGRESS', 'i'),
  // generic: a long api_key value bundled into frontend output
  /api_key=\s*[A-Za-z0-9]{24,}/,
]
let hits = []
function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (/\.(map|png|jpg|woff2?)$/i.test(p)) continue
    let s = ''
    try { s = readFileSync(p, 'utf8') } catch { continue }
    for (const re of FORBIDDEN) if (re.test(s)) hits.push(`${p} matches ${re}`)
  }
}
roots.forEach(walk)
if (hits.length) { console.error('SECRET CHECK FAILED:\n' + hits.join('\n')); process.exit(1) }
console.log('Secret check passed: no bundled API keys found.')
