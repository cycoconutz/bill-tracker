// Orchestrator: votes -> bills -> simplify. Safe to run without keys (no-ops with notice).
import { execSync } from 'node:child_process'
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
run('node scripts/fetch-votes.mjs')
run('node scripts/fetch-bills.mjs')
run('node scripts/simplify.mjs')
run('node scripts/check-no-secrets.mjs')
