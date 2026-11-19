import { useState } from 'react'
import { Link } from 'react-router-dom'
import { money } from '../data'
import { useNow, useStore, viewRequest } from '../store'

type Kind = 'Deposits' | 'Payments' | 'Refunds'
interface Row { ts: number; date: string; desc: string; amount: number; status: string; proof: string | null; kind: Kind; link?: string }

// 22 Transaction history.
export default function History() {
  const { state, task } = useStore()
  const now = useNow()
  const [filter, setFilter] = useState<'All' | Kind>('All')

  const rows: Row[] = []
  for (const d of state.deposits) {
    rows.push({ ts: d.ts, date: d.dateLabel, desc: `Deposit · ${d.method === 'card' ? 'card' : 'crypto wallet'}`, amount: d.amount, status: 'complete', proof: d.proof, kind: 'Deposits' })
  }
  for (const r of state.requests) {
    const v = viewRequest(r, now)
    const name = task(r.taskId)?.shortName ?? ''
    const held = v.status === 'pending' || v.status === 'confirming'
    rows.push({
      ts: r.createdAt,
      date: r.dateLabel,
      desc: `${held ? 'Payment held' : 'Payment'} · ${r.id} ${name}`,
      amount: -r.amount,
      status: v.status === 'confirming' ? 'confirming' : held ? 'held' : v.status === 'cancelled' ? 'refunded' : 'complete',
      proof: v.status === 'confirming' ? null : `${r.id}x…7Wq2`,
      kind: 'Payments',
      link: `/requests/${r.id}`,
    })
    if (v.status === 'cancelled') {
      rows.push({ ts: r.createdAt + 30 * 60 * 1000, date: 'Nov 7, 2:31 PM', desc: `Refund · ${r.id} cancelled`, amount: r.amount, status: 'complete', proof: `${r.id}r…2bNe`, kind: 'Refunds', link: `/requests/${r.id}` })
    }
  }
  for (const f of state.failedAttempts) {
    rows.push({ ts: f.ts, date: f.dateLabel, desc: `Payment attempt · ${f.label}`, amount: 0, status: 'failed, not charged', proof: null, kind: 'Payments' })
  }
  rows.sort((a, b) => b.ts - a.ts)
  const shown = rows.filter((r) => filter === 'All' || r.kind === filter)

  const pillClass = (s: string) => (s.startsWith('failed') ? 'failed' : s === 'refunded' ? 'cancelled' : s === 'confirming' ? 'pending' : s)

  return (
    <main className="page">
      <div className="row wrap" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ fontSize: 24 }}>Transaction history</h1>
        <div className="row" style={{ gap: 8 }}>
          {(['All', 'Deposits', 'Payments', 'Refunds'] as const).map((f) => (
            <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="card" style={{ overflowX: 'auto' }}>
        {shown.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>No transactions yet. Deposits, payments and refunds will appear here.</p>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Proof</th></tr></thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={i}>
                  <td className="muted">{r.date}</td>
                  <td>{r.link ? <Link to={r.link} style={{ color: 'inherit' }}>{r.desc}</Link> : r.desc}</td>
                  <td style={{ color: r.amount > 0 ? 'var(--green)' : undefined }}>{r.amount > 0 ? '+' : ''}{money(r.amount)}</td>
                  <td><span className={`pill ${pillClass(r.status)}`}>{r.status}</span></td>
                  <td>{r.proof ? <a href="#" onClick={(e) => e.preventDefault()} title={r.proof}>View ↗</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>
        Held funds go to providers when a result is delivered, or come back to you if a request is cancelled.
      </p>
    </main>
  )
}
