export default function EvidenceBlock({ heading, text, citations }) {
  return (
    <div className="card">
      <b>{heading}</b>
      <p>{text}</p>
      {(citations || []).map((c, i) => (
        <div className="evidence small" key={i}>
          <div><b>[{c.section}]</b> “{c.quote}”</div>
        </div>
      ))}
    </div>
  )
}
