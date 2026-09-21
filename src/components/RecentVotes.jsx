export default function RecentVotes({ votes, onOpen }) {
  if (!votes?.length) return <div className="card">No roll-call votes in cache yet. Run the nightly Action to populate <code>public/data/recent-votes.json</code>.</div>
  return (
    <div>
      {votes.map((v) => (
        <div className="card" key={`${v.chamber}-${v.voteNumber}-${v.date}`}>
          <div className="row">
            <span className={`badge ${v.chamber.toLowerCase()}`}>{v.chamber}</span>
            <span className={`badge ${/pass|agree/i.test(v.result || '') ? 'passed' : 'failed'}`}>{v.result}</span>
            <span className="small muted">{v.date} · Roll no. {v.voteNumber} · {v.voteType}</span>
          </div>
          <h3 style={{ margin: '8px 0' }}>{v.billTitle || v.bill}</h3>
          <p className="small muted">{v.question} — {v.tally}</p>
          <div className="row">
            <button onClick={() => onOpen(v)}>Plain-English summary</button>
            <a className="small" href={v.voteUrl} target="_blank" rel="noreferrer">Vote proof</a>
            <a className="small" href={v.billUrl} target="_blank" rel="noreferrer">Bill on congress.gov</a>
          </div>
        </div>
      ))}
    </div>
  )
}
