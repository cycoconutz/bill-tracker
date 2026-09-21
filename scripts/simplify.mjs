// Build-time simplification with evidence (runs in GitHub Actions only).
// Reads public/data/bills/*.json, calls an OpenAI-compatible chat API,
// writes back { simplification } with strict JSON schema.
// Secrets: LLM_API_KEY (+ optional LLM_BASE_URL, LLM_MODEL). Never in frontend.
import { readdir, readFile, writeFile } from 'node:fs/promises'

const BASE = process.env.LLM_BASE_URL || 'https://api.openai.com/v1'
const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini'
const KEY = process.env.LLM_API_KEY

const SYSTEM = `You simplify US federal bills for voters. Rules:
- Clear, concise, accurate. No partisan spin. No legal advice.
- Every section summary MUST cite the bill: {"heading","plainEnglish","citations":[{"section":"Sec. 2(b)","quote":"short verbatim quote under 25 words"}]}
- Keep quotes verbatim from the provided text. Never invent section numbers.
- references: [{title, url, whyCited}] only for materials actually cited.
- If text is truncated, say so in timeline. Output STRICT JSON, no markdown.`

function promptFor(bill) {
  return `Bill: ${bill.bill} (${bill.congress}th Congress) — ${bill.title}
Status: ${bill.status}
CRS summary: ${(bill.crsSummary || '').slice(0, 2000)}
Bill text (may be truncated):
${(bill.fullText || '').slice(0, 14000)}
Return JSON: {"tldr":[3 strings],"whatChanges":"...","whoAffected":"...","costs":"...","timeline":"...","sections":[{"heading":"...","plainEnglish":"...","citations":[{"section":"...","quote":"..."}]}],"references":[{"title":"...","url":"...","whyCited":"..."}]}`
}

async function simplifyOne(bill) {
  const r = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, temperature: 0.2, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: promptFor(bill) }],
    }),
  })
  if (!r.ok) throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0, 300)}`)
  const j = await r.json()
  return JSON.parse(j.choices[0].message.content)
}

async function main() {
  if (!KEY) { console.log('No LLM_API_KEY — skipping simplification (summaries fall back to CRS text).'); return }
  const dir = new URL('../public/data/bills/', import.meta.url)
  let files = []
  try { files = await readdir(dir) } catch { console.log('No bills dir yet.'); return }
  for (const f of files.filter((x) => x.endsWith('.json'))) {
    const p = new URL(`../public/data/bills/${f}`, import.meta.url)
    const bill = JSON.parse(await readFile(p, 'utf8'))
    if (bill.simplification?.tldr?.length) { console.log('Skip (already simplified)', f); continue }
    try {
      bill.simplification = await simplifyOne(bill)
      await writeFile(p, JSON.stringify(bill, null, 2))
      console.log('Simplified', f)
    } catch (e) { console.log('LLM skip', f, e.message) }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
