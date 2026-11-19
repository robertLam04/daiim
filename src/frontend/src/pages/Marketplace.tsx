import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PROVIDERS, type Provider, type Task } from '../data'
import { useStore } from '../store'
import { useModal } from '../modals/useModal'

type Filter = 'All' | 'Tasks' | 'Providers'

// 08 Marketplace (signed out and signed in).
export default function Marketplace() {
  const { state, allTasks } = useStore()
  const { open } = useModal()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('All')
  const [q, setQ] = useState('')

  const match = (text: string) => text.toLowerCase().includes(q.trim().toLowerCase())
  const tasks = filter === 'Providers' ? [] : allTasks.filter((t) => match(`${t.id} ${t.name} ${t.description}`))
  const providers = filter === 'Tasks' ? [] : PROVIDERS.filter((p) => match(p.name))

  // Interleave like the Figma grid: task, provider, task, ...
  const cards: ({ kind: 'task'; t: Task } | { kind: 'provider'; p: Provider })[] = []
  for (let i = 0, ti = 0, pi = 0; ti < tasks.length || pi < providers.length; i++) {
    const wantProvider = i % 3 === 1
    if ((wantProvider && pi < providers.length) || ti >= tasks.length) cards.push({ kind: 'provider', p: providers[pi++] })
    else cards.push({ kind: 'task', t: tasks[ti++] })
  }

  return (
    <main className="page">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <input className="input" style={{ flex: 1 }} placeholder="🔍 Search marketplace…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div style={{ textAlign: 'center' }}>
          {state.signedIn ? (
            <button className="btn primary" onClick={() => navigate('/tasks/new')}>+ New task</button>
          ) : (
            <>
              <button className="btn" style={{ opacity: 0.5 }} onClick={() => open('signin', { next: '/tasks/new' })}>+ New task</button>
              <div className="tiny" style={{ color: 'var(--purple)', marginTop: 4, fontWeight: 600 }}>Sign in to create</div>
            </>
          )}
        </div>
      </div>
      <div className="row" style={{ gap: 8, margin: '14px 0 20px' }}>
        {(['All', 'Tasks', 'Providers'] as Filter[]).map((f) => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {cards.length === 0 && <p className="muted">Nothing matches “{q}”. Try a different word, or create a new task.</p>}
      <div className="grid3">
        {cards.map((c) =>
          c.kind === 'task' ? (
            <Link key={c.t.id} to={`/marketplace/tasks/${c.t.id}`} className="card" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="kicker">Task</div>
              <h3 style={{ fontSize: 16, margin: '4px 0 8px' }}>{c.t.id} · {c.t.name}</h3>
              <p className="small muted" style={{ margin: '0 0 8px' }}>{c.t.description}</p>
              <div className="tiny muted">Min provider stake: ${c.t.minStake.toFixed(2)}</div>
              <div className="tiny muted" style={{ marginTop: 4 }}>Registered providers: {c.t.registeredProviders}</div>
            </Link>
          ) : (
            <div key={c.p.id} className="card">
              <div className="kicker">Provider</div>
              <h3 style={{ fontSize: 16, margin: '4px 0 8px' }}>
                <Link to={`/marketplace/providers/${c.p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.p.name}</Link>
              </h3>
              <table>
                <thead><tr><th>Task</th><th>Reputation</th><th>Model</th></tr></thead>
                <tbody>
                  {c.p.tasks.map((pt) => (
                    <tr key={pt.taskId}>
                      <td><Link to={`/marketplace/tasks/${pt.taskId}`}>{pt.taskId}</Link></td>
                      <td>{pt.reputation}</td>
                      <td>{pt.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        )}
      </div>
    </main>
  )
}
