// localStorage cache with TTL (runtime cache for Pages static app).
const PREFIX = 'billcache:v1:'
const TTL_MS = 24 * 60 * 60 * 1000

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { ts, value } = JSON.parse(raw)
    if (Date.now() - ts > TTL_MS) { localStorage.removeItem(PREFIX + key); return null }
    return value
  } catch { return null }
}

export function cacheSet(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify({ ts: Date.now(), value })) } catch {}
}

export async function fetchStaticJson(path) {
  const cached = cacheGet('static:' + path)
  if (cached) return cached
  const r = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { cache: 'force-cache' })
  if (!r.ok) throw new Error(`Missing static data: data/${path}`)
  const j = await r.json()
  cacheSet('static:' + path, j)
  return j
}
