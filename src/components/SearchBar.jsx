import { useState } from 'react'
import { parseBillQuery } from '../lib/congress.js'

export default function SearchBar({ onSearch, onLiveLookup }) {
  const [q, setQ] = useState('')
  const parsed = parseBillQuery(q)
  return (
    <div className="card">
      <div className="row">
        <input
          style={{ flex: 1, minWidth: 220 }}
          placeholder='Search cached votes (e.g. "passage") or type a bill like "hr 6955"'
          value={q} onChange={(e) => { setQ(e.target.value); onSearch(e.target.value) }}
        />
        <button className="ghost" onClick={() => onLiveLookup(q, parsed)}>Live lookup</button>
      </div>
      {q && (
        <p className="small muted">
          {parsed
            ? `Looks like ${parsed.type.toUpperCase()} ${parsed.number} (${parsed.congress}th Congress). Live lookup needs your free API key in Settings.`
            : 'Tip: live full-text search needs your free api.congress.gov key (Settings, stored only in your browser).'}
        </p>
      )}
    </div>
  )
}
