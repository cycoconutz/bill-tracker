// Helpers for api.congress.gov. Frontend must NEVER embed a shared key.
// Two modes:
//  1) Static cached JSON from ./data/*.json (default, no key needed)
//  2) Live BYOK: visitor pastes their own free key in Settings -> localStorage,
//     requests go directly from their browser to api.congress.gov.

export const API_ROOT = 'https://api.congress.gov/v3'
export const BYOK_KEY = 'byok-congress-key'

export function getByokKey() {
  try { return localStorage.getItem(BYOK_KEY) || '' } catch { return '' }
}
export function setByokKey(k) {
  try { localStorage.setItem(BYOK_KEY, k) } catch {}
}

export function billId({ congress, type, number }) {
  return `${String(type).toLowerCase()}${number}-${congress}`.replace(/\./g, '')
}

export function parseBillQuery(q) {
  // Accepts "hr 6955", "H.R. 6955", "hr6955-119", congress.gov URLs.
  const s = (q || '').trim()
  const url = s.match(/congress\.gov\/bill\/(\d+)[a-z-]*congress\/([a-z-]+)\/(\d+)/i)
  if (url) {
    return { congress: url[1], type: url[2].replace(/-/g, ''), number: url[3] }
  }
  const m = s.match(/([a-z.]+)\s*(\d+)(?:\s*[- ]\s*(\d{3,4}))?/i)
  if (!m) return null
  const rawType = m[1].toLowerCase().replace(/\./g, '')
  const typeMap = { hr: 'hr', s: 's', hjres: 'hjres', sjres: 'sjres', hconres: 'hconres', sconres: 'sconres', hres: 'hres', sres: 'sres' }
  const type = typeMap[rawType]
  if (!type) return null
  return { congress: m[3] || '119', type, number: m[2] }
}

export async function fetchBillLive({ congress, type, number }, apiKey) {
  const key = apiKey || getByokKey()
  if (!key) throw new Error('No API key. Add your free api.congress.gov key in Settings (stored only in your browser).')
  const url = `${API_ROOT}/bill/${congress}/${type}/${number}?embed=text,actions,summaries,titles&api_key=${encodeURIComponent(key)}&format=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Congress API ${r.status}`)
  return r.json()
}

export async function searchBillsLive(query, apiKey) {
  const key = apiKey || getByokKey()
  if (!key) throw new Error('No API key. Add your free api.congress.gov key in Settings.')
  const parsed = parseBillQuery(query)
  if (parsed) return fetchBillLive(parsed, key)
  const url = `${API_ROOT}/bill?query=${encodeURIComponent(query)}&limit=20&api_key=${encodeURIComponent(key)}&format=json`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`Congress API ${r.status}`)
  return r.json()
}
