// Nightly: fetch latest House roll-call votes (roll-call only by construction),
// join each to its bill, write public/data/recent-votes.json.
// Auth: process.env.CONGRESS_API_KEY only (GitHub Secret). Never commit the key.
import { writeFile, mkdir } from 'node:fs/promises'

const API = 'https://api.congress.gov/v3'
const CONGRESS = process.env.CONGRESS || '119'
const SESSION = process.env.SESSION || '2'
const LIMIT = Number(process.env.VOTE_LIMIT || 30)
const KEY = process.env.CONGRESS_API_KEY

async function get(path) {
  const url = `${API}${path}${path.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(KEY)}&format=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`)
  return r.json()
}

function voteUrl(chamber, congress, session, voteNumber) {
  return chamber === 'House'
    ? `https://www.congress.gov/votes/house/${congress}th-congress/${session}nd-session`
    : `https://www.senate.gov/legislative/LIS/roll_call_lists/vote_menu_${congress}_${session}.htm`
}

async function main() {
  if (!KEY) {
    console.log('No CONGRESS_API_KEY — writing placeholder recent-votes.json (cached sample stays).')
    return
  }
  await mkdir(new URL('../public/data/', import.meta.url), { recursive: true })
  const house = await get(`/house-vote/${CONGRESS}/${SESSION}?limit=${LIMIT}&sort=updateDate+desc`)
  const votes = []
  for (const hv of house.houseRollCallVotes || house.houseVotes || []) {
    const bill = hv.bill || hv.legislation || {}
    const type = (bill.type || '').toLowerCase()
    const number = bill.number
    if (!type || !number) continue // skip non-bill votes (quorum, rules) for bill-tracker focus
    votes.push({
      chamber: 'House',
      congress: CONGRESS,
      session: SESSION,
      voteNumber: hv.voteNumber ?? hv.rollNumber,
      date: hv.date || hv.updateDate,
      question: hv.question,
      voteType: hv.voteType,
      result: hv.result,
      tally: `${hv.yeaTotal ?? '?'}–${hv.nayTotal ?? '?'}`,
      bill: `${type.toUpperCase()} ${number}`,
      billTitle: bill.title,
      billKey: `${type}${number}-${CONGRESS}`.replace(/\./g, ''),
      billUrl: hv.billUrl || `https://www.congress.gov/bill/${CONGRESS}th-congress/${type}/${number}`,
      voteUrl: voteUrl('House', CONGRESS, SESSION, hv.voteNumber),
    })
  }
  // Senate: try senate-vote endpoint, fall back gracefully
  try {
    const sen = await get(`/senate-vote/${CONGRESS}/${SESSION}?limit=${LIMIT}&sort=updateDate+desc`)
    for (const sv of sen.senateRollCallVotes || sen.senateVotes || []) {
      votes.push({ chamber: 'Senate', congress: CONGRESS, session: SESSION, ...sv })
    }
  } catch (e) { console.log('Senate endpoint unavailable, House-only this run:', e.message) }

  votes.sort((a, b) => String(b.date).localeCompare(String(a.date)))
  const out = { updatedAt: new Date().toISOString(), congress: CONGRESS, session: SESSION, votes: votes.slice(0, LIMIT) }
  await writeFile(new URL('../public/data/recent-votes.json', import.meta.url), JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.votes.length} roll-call votes.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
