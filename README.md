# Bill Tracker — plain-English federal bills with evidence

Federal bills only. Recent **roll-call votes**, simplified with pinpoint citations, references with context. Clear, concise, accurate.

## Live demo
`https://cycoconutz.github.io/bill-tracker/`

## Key safety (important)
- The deployed site ships **no API keys**. Browsing the cached votes works for everyone.
- The `CONGRESS_API_KEY` you use locally must be **rotated if ever pasted in chat** — treat any pasted key as compromised and get a new one at `api.congress.gov/sign-up`.
- Local dev: copy `.env.example` to `.env.local` (gitignored). Scripts read `process.env.*` only.
- CI: set GitHub Secrets `CONGRESS_API_KEY`, `LLM_API_KEY` (+ optional `LLM_BASE_URL`, `LLM_MODEL`). The nightly workflow uses them at build time to write `public/data/*.json`, then builds a static site with no keys in `dist/`.
- Never use `VITE_*` for secrets. CI runs `npm run check:no-secrets` to fail if a key leaks into the bundle.

## Develop
```bash
cd bill-tracker
npm install
npm run dev
```

## Data pipeline (all build-time, federal only)
```bash
npm run data:votes    # House roll-call votes -> public/data/recent-votes.json (needs CONGRESS_API_KEY)
npm run data:bills    # bill metadata + TXT -> public/data/bills/*.json
npm run data:simplify # LLM plain-English + evidence JSON (needs LLM_API_KEY, OpenAI-compatible)
npm run data          # all three + secret check
```

Roll-call only: the list starts from `/v3/house-vote/{congress}/{session}` (roll calls by definition) joined to `/v3/bill/...`, not from generic bill search. Senate tries `/v3/senate-vote/...` with fallback to `Record Vote Number` action scan.

## Deploy to GitHub Pages
The site builds and deploys automatically through the GitHub Actions workflows in `.github/workflows/` (nightly cron refreshes data at 06:00 UTC). The base path is already set in `vite.config.js`. The secrets `CONGRESS_API_KEY`, `LLM_API_KEY` (+ optional `LLM_BASE_URL`, `LLM_MODEL`) must be set as GitHub Secrets for the data pipeline.

## Caching
- Build-time `public/data/*.json` (checked in as sample, refreshed nightly).
- Runtime `localStorage` 24h TTL + `force-cache` fetch. No login needed.
