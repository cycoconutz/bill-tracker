import { useEffect, useMemo, useState } from 'react'
import SearchBar from './components/SearchBar.jsx'
import RecentVotes from './components/RecentVotes.jsx'
import BillDetail from './components/BillDetail.jsx'
import KeySettings from './components/KeySettings.jsx'
import { fetchStaticJson } from './lib/cache.js'
import { fetchBillLive, parseBillQuery } from './lib/congress.js'

function routeFromHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [path, query] = h.split('?')
  return { path: path || '', query: new URLSearchParams(query || '') }
}

export default function App() {
  const [votes, setVotes] = useState([])
  const [bills, setBills] = useState({})
  const [filter, setFilter] = useState('')
  const [route, setRoute] = useState(routeFromHash())
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        const v = await fetchStaticJson('recent-votes.json')
        setVotes(v.votes || [])
        // Preload bill detail JSONs referenced by votes (best-effort)
        const unique = [...new Set((v.votes || []).map((x) => x.billKey).filter(Boolean))]
        const loaded = {}
        await Promise.all(unique.slice(0, 30).map(async (k) => {
          try { loaded[k] = await fetchStaticJson(`bills/${k}.json`) } catch {}
        }))
        setBills(loaded)
      } catch (e) { setError(String(e.message || e)) }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return votes
    return votes.filter((v) => [v.bill, v.billTitle, v.question, v.result, v.tally].join(' ').toLowerCase().includes(q))
  }, [votes, filter])

  async function liveLookup(q, parsed) {
    setError(''); setLive(null)
    const p = parsed || parseBillQuery(q)
    if (!p) { setError('Type a bill like "hr 6955" for live lookup, or use the cached search above.'); return }
    try {
      const j = await fetchBillLive(p)
      const b = j.bill || {}
      setLive({
        bill: `${(p.type || '').toUpperCase()} ${p.number}`, congress: p.congress,
        title: b.title || `${p.type.toUpperCase()} ${p.number}`,
        status: b.latestAction?.text || 'Unknown',
        sourceUrl: `https://www.congress.gov/bill/${p.congress}th-congress/${p.type}/${p.number}`,
        crsSummary: (j.summaries || [])[0]?.text || b.summaries?.[0]?.text,
        voteHistory: (j.actions || []).slice(0, 10).map((a) => ({ date: a.actionDate, text: a.text })),
        simplification: null, references: [],
      })
      window.location.hash = '#/live'
    } catch (e) { setError(String(e.message || e)) }
  }

  function openVote(v) {
    const detail = bills[v.billKey]
    if (detail) { window.location.hash = `#/bill/${v.billKey}` }
    else window.open(v.billUrl, '_blank')
  }

  const billKey = route.path.startsWith('bill/') ? route.path.slice(5) : null

  return (
    <div className="wrap">
      <header className="top">
        <h1 style={{ margin: 0 }}>Bill Tracker</h1>
        <span className="muted">Plain-English federal bills · roll-call votes only · with evidence</span>
      </header>

      <nav className="tabs">
        <a href="#/">Recent votes</a>
        <a href="#/search">Search</a>
        <button className="ghost" onClick={() => setShowSettings((s) => !s)}>Settings</button>
      </nav>

      {showSettings && <KeySettings />}
      {error && <div className="card" style={{ borderColor: '#fca5a5' }}>{error}</div>}

      {billKey ? (
        <BillDetail bill={bills[billKey]} onBack={() => (window.location.hash = '#/')} />
      ) : route.path === 'live' && live ? (
        <BillDetail bill={live} onBack={() => (window.location.hash = '#/')} />
      ) : (
        <>
          <SearchBar onSearch={setFilter} onLiveLookup={liveLookup} />
          <h2>Most recent roll-call votes</h2>
          <p className="small muted">From House &amp; Senate roll calls (build-time cache, refreshed nightly). No API key needed to browse.</p>
          <RecentVotes votes={filtered} onOpen={openVote} />
        </>
      )}

      <footer className="muted small">
        <p>Federal bills only. Sources: api.congress.gov, clerk.house.gov, govinfo.gov, uscode.house.gov. Summaries are informational, not legal advice.</p>
        <p>Deployed via GitHub Pages. This site ships <b>no API keys</b> — live lookups use a key you optionally save in your own browser.</p>
      </footer>
    </div>
  )
}
