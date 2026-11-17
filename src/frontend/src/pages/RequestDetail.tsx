import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import RequestsLayout from '../components/RequestsLayout'
import { money } from '../data'
import { emptyDraft, STAGES, useNow, useStore, viewRequest } from '../store'

function ago(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s} sec ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ${s % 60} sec ago`
  const d = Math.floor(m / 1440)
  return d >= 1 ? `${d} day${d > 1 ? 's' : ''} ago` : `${Math.floor(m / 60)} h ago`
}

// 17 In progress, 18 Result, 19 Cancelled and refunded.
export default function RequestDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { state, task, setState } = useStore()
  const now = useNow()
  const navigate = useNavigate()
  const r = state.requests.find((x) => x.id === id)

  if (!r) {
    return (
      <RequestsLayout>
        <p>We couldn’t find request {id}. Pick one from Recents, or start a new request.</p>
      </RequestsLayout>
    )
  }

  const t = task(r.taskId)!
  const v = viewRequest(r, now)

  const header = (sub: string, pill?: string) => (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="row" style={{ alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: 20 }}>{r.id} · task information</h2>
        {pill && <span className={`pill ${pill}`}>{pill}</span>}
      </div>
      <div className="small muted" style={{ marginTop: 4 }}>{t.name} · {sub}</div>
    </div>
  )

  if (v.status === 'cancelled') {
    const tryAgain = () => {
      setState((s) => ({ ...s, draft: { ...emptyDraft, taskId: r.taskId, amount: (r.amount + 1).toFixed(2) } }))
      navigate('/requests')
    }
    return (
      <RequestsLayout>
        {header(`cancelled ${ago(v.elapsedMs)}`, 'cancelled')}
        <div className="card">
          <h3 style={{ fontSize: 17 }}>Not enough providers answered</h3>
          <p className="small muted">Only {r.joined ?? 2} providers joined and {t.minProviders} were needed, so the request was cancelled.</p>
          <div className="banner green small" style={{ margin: '12px 0' }}>
            {money(r.amount)} was returned to your available funds. Your uploaded data was deleted.
          </div>
          <div className="row">
            <button className="btn primary" onClick={tryAgain}>Try again with a higher amount</button>
            <button className="btn" onClick={() => navigate('/marketplace')}>Choose another task</button>
          </div>
        </div>
      </RequestsLayout>
    )
  }

  if (v.status === 'complete') {
    const res = t.sampleResult
    const lo = res.low - (res.high - res.low) * 0.6
    const hi = res.high + (res.high - res.low) * 0.6
    const pos = (x: number) => `${((x - lo) / (hi - lo)) * 100}%`
    const fmt = (x: number) => (t.outputUnit === '$' ? `$${x.toFixed(2)}` : `${x} ${t.outputUnit}`)
    return (
      <RequestsLayout>
        {header('completed')}
        <div className="row wrap" style={{ alignItems: 'flex-start' }}>
          <div className="card result-card" style={{ flex: '1 1 380px' }}>
            <div className="small muted">Result</div>
            <div className="result-value">{fmt(res.value)}</div>
            <div className="small muted">{t.outputLabel}</div>
            <div className="range" aria-label={`Providers predicted between ${fmt(res.low)} and ${fmt(res.high)}`}>
              <div className="range-fill" style={{ left: pos(res.low), width: `calc(${pos(res.high)} - ${pos(res.low)})` }} />
              <div className="range-mark" style={{ left: pos(res.value) }} />
            </div>
            <div className="row tiny muted" style={{ justifyContent: 'space-between' }}>
              <span>Lowest prediction {fmt(res.low)}</span>
              <span>Highest {fmt(res.high)}</span>
            </div>
            <p className="small" style={{ color: 'var(--purple)', marginBottom: 0 }}>
              Aggregation of 4 providers in {r.fixed ? '9 min 42 s' : '19 s'}
            </p>
          </div>
          <div className="card" style={{ flex: '0 0 220px' }}>
            <div className="small muted">Paid</div>
            <div style={{ fontWeight: 700, fontSize: 17, margin: '4px 0 8px' }}>{money(r.amount)} CAD</div>
            <div className="small muted">Proof of payment</div>
            <a href="#" className="small" onClick={(e) => e.preventDefault()} title="Prototype: would open the Solana explorer">View on blockchain ↗</a>
          </div>
        </div>
        <div className="banner orange small" style={{ marginTop: 18 }}>
          Combined forecasts can still be wrong. Check this result against your own information before acting on it.
        </div>
      </RequestsLayout>
    )
  }

  // In progress (including the first few seconds while the payment confirms).
  const joined = v.stage <= 1 ? 2 : 4
  const predicted = v.stage === 2 ? 2 : v.stage > 2 ? 4 : 0
  const sub: Record<number, string> = {
    0: v.status === 'confirming' ? 'Confirming payment…' : '',
    1: `${joined} joined (${t.minProviders} needed)`,
    2: v.stage >= 2 ? `${predicted} of 4 done` : '',
  }

  return (
    <RequestsLayout>
      {params.get('sent') && (
        <div className="banner green small" style={{ marginBottom: 16 }}>
          Request {r.id} sent. {money(r.amount)} moved to held funds.
        </div>
      )}
      {header(`submitted ${ago(v.elapsedMs)}`)}
      <ol className="timeline">
        {STAGES.map((name, i) => {
          const st = i < v.stage ? 'done' : i === v.stage ? 'active' : 'todo'
          return (
            <li key={name} className={st}>
              <span className={`tl-dot ${st}`}>{st === 'done' ? '✓' : st === 'active' ? '…' : ''}</span>
              {name}
              {sub[i] && st !== 'todo' && <span className="small muted" style={{ fontWeight: 400 }}>{sub[i]}</span>}
            </li>
          )
        })}
      </ol>
      <div className="card" style={{ borderStyle: 'dashed', display: 'inline-block', color: 'var(--faint)', fontWeight: 600 }}>
        Result: waiting for providers…
      </div>
      <p className="small muted">You can leave this page. {r.id} keeps running and stays in Recents. <Link to="/">Go home</Link></p>
    </RequestsLayout>
  )
}
