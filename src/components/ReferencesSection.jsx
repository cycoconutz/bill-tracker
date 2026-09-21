export default function ReferencesSection({ references }) {
  if (!references?.length) return null
  const dedup = [...new Map(references.map((r) => [r.title + r.url, r])).values()]
  return (
    <div className="card">
      <h3>References</h3>
      <p className="small muted">Materials cited by the bill, with why each matters in context.</p>
      <ul>
        {dedup.map((r, i) => (
          <li key={i} className="small">
            <a href={r.url} target="_blank" rel="noreferrer">{r.title}</a>
            <span className="muted"> — {r.whyCited}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
