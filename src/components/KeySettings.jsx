import { useState, useEffect } from 'react'
import { getByokKey, setByokKey } from '../lib/congress.js'

export default function KeySettings() {
  const [k, setK] = useState('')
  const [saved, setSaved] = useState(false)
  useEffect(() => { setK(getByokKey()); setSaved(!!getByokKey()) }, [])
  return (
    <div className="card">
      <h3>Settings — your API key (optional)</h3>
      <p className="small muted">
        The deployed site ships <b>no API key</b>. Cached votes work for everyone.
        For live lookups, paste your <b>free</b> key from <a href="https://api.congress.gov/sign-up/" target="_blank" rel="noreferrer">api.congress.gov/sign-up</a>.
        It stays in <code>localStorage</code> on your device only.
      </p>
      <div className="row">
        <input type="password" style={{ flex: 1, minWidth: 220 }} placeholder="paste api.congress.gov key" value={k} onChange={(e) => setK(e.target.value)} />
        <button onClick={() => { setByokKey(k.trim()); setSaved(!!k.trim()) }}>Save locally</button>
        <button className="ghost" onClick={() => { setByokKey(''); setK(''); setSaved(false) }}>Clear</button>
      </div>
      {saved && <p className="small">Key saved in this browser only. Rotate it anytime at api.data.gov.</p>}
    </div>
  )
}
