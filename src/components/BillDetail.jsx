import EvidenceBlock from './EvidenceBlock.jsx'
import ReferencesSection from './ReferencesSection.jsx'

export default function BillDetail({ bill, onBack }) {
  if (!bill) return null
  const s = bill.simplification
  return (
    <div>
      <button className="ghost" onClick={onBack}>← Back to votes</button>
      <h2>{bill.title}</h2>
      <p className="muted small">{bill.bill} · {bill.congress}th Congress · {bill.status} · <a href={bill.sourceUrl} target="_blank" rel="noreferrer">source</a></p>

      <div className="card">
        <h3>TL;DR</h3>
        <ul>{(s?.tldr || [bill.crsSummary || 'Summary pending.']).map((t, i) => <li key={i}>{t}</li>)}</ul>
        <div className="row small">
          <span><b>Changes:</b> {s?.whatChanges || '—'}</span>
        </div>
        <p className="small"><b>Who's affected:</b> {s?.whoAffected || '—'}</p>
        <p className="small"><b>Cost / timeline:</b> {s?.costs || '—'} · {s?.timeline || ''}</p>
      </div>

      <h3>What it does (with evidence)</h3>
      {(s?.sections || []).map((sec, i) => (
        <EvidenceBlock key={i} heading={sec.heading} text={sec.plainEnglish} citations={sec.citations} />
      ))}
      {(!s?.sections?.length) && <div className="card small muted">Section-by-section simplification not yet generated for this bill. The nightly Action generates it at build time.</div>}

      <ReferencesSection references={[...(s?.references || []), ...(bill.references || [])]} />

      <div className="card">
        <h3>Appendix (everything else)</h3>
        <p className="small muted">Sponsor: {bill.sponsor || '—'} · Committees: {(bill.committees || []).join(', ') || '—'}</p>
        <h4>Vote / action history</h4>
        <ul className="small">{(bill.voteHistory || []).map((a, i) => <li key={i}>{a.date} — {a.text} {a.voteNumber ? `(Roll no. ${a.voteNumber})` : ''}</li>)}</ul>
        <p className="small muted">Disclaimer: plain-English summaries are informational, not legal advice. Verify against the official bill text and CRS/CBO sources linked above.</p>
      </div>
    </div>
  )
}
