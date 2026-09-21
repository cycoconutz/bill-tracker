// For each bill in recent-votes.json, fetch bill metadata + latest text (TXT).
// Writes public/data/bills/<billKey>.json. Key: CONGRESS_API_KEY only.
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const API = 'https://api.congress.gov/v3'
const KEY = process.env.CONGRESS_API_KEY

async function get(path) {
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(KEY)}&format=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`)
  return r.json()
}

async function fetchText(url) {
  if (!url) return ''
  const r = await fetch(url)
  if (!r.ok) return ''
  const t = await r.text()
  return t.slice(0, 120000) // cap for build-time LLM step
}

async function main() {
  if (!KEY) { console.log('No CONGRESS_API_KEY — skipping bill fetch.'); return }
  const votes = JSON.parse(await readFile(new URL('../public/data/recent-votes.json', import.meta.url), 'utf8'))
  await mkdir(new URL('../public/data/bills/', import.meta.url), { recursive: true })
  for (const v of votes.votes || []) {
    const [type, number] = v.bill.split(' ')
    const congress = v.congress
    try {
      const j = await get(`/bill/${congress}/${type.toLowerCase()}/${number}?embed=text,actions,summaries,titles,committees,relatedBills`)
      const b = j.bill || {}
      const texts = j.textVersions || b.textVersions || []
      const latest = texts[texts.length - 1] || texts[0] || {}
      const txtUrl = (latest.formats || []).find((f) => f.type === 'TXT')?.url || latest.txtUrl
      const fullText = await fetchText(txtUrl)
      const out = {
        bill: v.bill, billKey: v.billKey, congress, title: b.title || v.billTitle,
        status: b.latestAction?.text || '', sponsor: b.sponsors?.[0]?.fullName || b.sponsor?.fullName || '',
        committees: (b.committees || []).map((c) => c.name || c),
        crsSummary: (j.summaries || b.summaries || [])[0]?.text || '',
        sourceUrl: `https://www.congress.gov/bill/${congress}th-congress/${type.toLowerCase()}/${number}`,
        voteHistory: (j.actions || b.actions || []).slice(0, 15).map((a) => ({ date: a.actionDate, text: a.text, voteNumber: (a.text || '').match(/Roll no\.?\s*(\d+)/i)?.[1] || (a.text || '').match(/Record Vote Number:?\s*(\d+)/i)?.[1] || null })),
        relatedBills: (j.relatedBills || b.relatedBills || []).slice(0, 10),
        fullText: fullText.slice(0, 60000),
      }
      await writeFile(new URL(`../public/data/bills/${v.billKey}.json`, import.meta.url), JSON.stringify(out, null, 2))
      console.log('Wrote', v.billKey)
    } catch (e) { console.log('Skip', v.bill, e.message) }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
