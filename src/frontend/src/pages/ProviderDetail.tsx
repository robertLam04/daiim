import { Link, useParams } from 'react-router-dom'
import { PROVIDERS } from '../data'
import { useStore } from '../store'

// 10 Provider details.
export default function ProviderDetail() {
  const { id } = useParams()
  const { task } = useStore()
  const p = PROVIDERS.find((x) => x.id === id)

  if (!p) {
    return (
      <main className="page">
        <p>That provider doesn’t exist. <Link to="/marketplace">Back to marketplace</Link></p>
      </main>
    )
  }

  return (
    <main className="page" style={{ maxWidth: 820 }}>
      <Link to="/marketplace" className="small">← Back to marketplace</Link>
      <div className="row" style={{ alignItems: 'center', margin: '16px 0 24px' }}>
        <span className="avatar" style={{ width: 52, height: 52, background: 'var(--purple-soft)' }} />
        <div>
          <h1 style={{ fontSize: 24 }}>{p.name}</h1>
          <div className="small muted">Joined {p.joined} · shows only what this provider agreed to make public</div>
        </div>
      </div>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>Tasks and reputation</h3>
      <table>
        <thead><tr><th>Task</th><th>Reputation</th><th>Model</th><th>Requests answered</th></tr></thead>
        <tbody>
          {p.tasks.map((pt) => (
            <tr key={pt.taskId}>
              <td><Link to={`/marketplace/tasks/${pt.taskId}`}>{pt.taskId} · {task(pt.taskId)?.shortName}</Link></td>
              <td>{pt.reputation} / 100</td>
              <td>{pt.model}</td>
              <td>{pt.answered}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card" style={{ marginTop: 24, background: 'var(--purple-soft)', border: 0 }}>
        <h3>How reputation works</h3>
        <p className="small muted" style={{ margin: 0 }}>
          Reputation rises when this provider’s predictions are close to the combined result, and falls when they are far off.
          Higher-reputation providers count more in the final result.
        </p>
      </div>
    </main>
  )
}
