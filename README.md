# Bill Tracker — plain-English federal bills with evidence

Federal bills only. Recent **roll-call votes**, simplified with pinpoint citations, references with context. Clear, concise, accurate.

## Live demo (after you create the repo + enable Pages)
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

## Deploy to GitHub Pages (new repo)
1. Create new repo `bill-tracker`, copy the **contents** of this `bill-tracker/` folder to the repo root (so `package.json`, `vite.config.js`, `.github/` are top-level).
2. Set `vite.config.js base` to `/bill-tracker/` (already set).
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Add Secrets: `CONGRESS_API_KEY`, `LLM_API_KEY` (+ optional `LLM_BASE_URL`, `LLM_MODEL`).
5. Push to `main` or run the workflow manually. Nightly cron refreshes data at 06:00 UTC.

## Caching
- Build-time `public/data/*.json` (checked in as sample, refreshed nightly).
- Runtime `localStorage` 24h TTL + `force-cache` fetch. No login needed.
