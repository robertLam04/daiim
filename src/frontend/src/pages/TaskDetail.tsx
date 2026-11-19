import { Link, useNavigate, useParams } from 'react-router-dom'
import { PROVIDERS } from '../data'
import { emptyDraft, useStore } from '../store'
import { useModal } from '../modals/useModal'

export function exampleCsv(fields: string[], values?: number[]): string {
  const row = values ?? fields.map((_, i) => [2.41, 18, 64, 12][i % 4])
  return `${fields.join(',')}\n${row.join(',')}\n`
}

export function downloadFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

// 09 Task details.
export default function TaskDetail() {
  const { id } = useParams()
  const { state, task, setState } = useStore()
  const { open } = useModal()
  const navigate = useNavigate()
  const t = task(id)

  if (!t) {
    return (
      <main className="page">
        <p>That task doesn’t exist. <Link to="/marketplace">Back to marketplace</Link></p>
      </main>
    )
  }

  const providers = PROVIDERS.flatMap((p) => p.tasks.filter((pt) => pt.taskId === t.id).map((pt) => ({ p, pt })))

  const request = () => {
    if (!state.signedIn) {
      open('signin', { next: `/requests` })
      setState((s) => ({ ...s, draft: { ...emptyDraft, taskId: t.id } }))
      return
    }
    setState((s) => ({ ...s, draft: { ...emptyDraft, taskId: t.id } }))
    navigate('/requests')
  }

  return (
    <main className="page">
      <div className="row" style={{ gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px' }}>
          <Link to="/marketplace" className="small">← Back to marketplace</Link>
          <h1 style={{ fontSize: 26, margin: '10px 0 8px' }}>{t.id} · {t.name}</h1>
          <p className="muted">{t.detail}</p>
          <h3 style={{ fontSize: 15, margin: '18px 0 8px' }}>Input your data must follow</h3>
          <div className="card small" style={{ background: 'var(--purple-soft)', border: 0, lineHeight: 1.7, fontFamily: 'ui-monospace, monospace' }}>
            {t.inputs.map((f) => <div key={f.name}>{f.name}: {f.type}</div>)}
          </div>
          <button className="linklike small" style={{ marginTop: 10 }} onClick={() => downloadFile(`${t.id}-example.csv`, exampleCsv(t.inputs.map((f) => f.name)))}>
            Download example file
          </button>
          <h3 style={{ fontSize: 15, margin: '18px 0 6px' }}>Output</h3>
          <p className="small muted">{t.outputLabel} ({t.outputUnit}), plus the lowest and highest provider prediction</p>
          <h3 style={{ fontSize: 15, margin: '18px 0 6px' }}>Registered providers ({t.registeredProviders})</h3>
          <table style={{ maxWidth: 300 }}>
            <thead><tr><th>Provider</th><th>Reputation</th><th>Model</th></tr></thead>
            <tbody>
              {providers.map(({ p, pt }) => (
                <tr key={p.id}>
                  <td><Link to={`/marketplace/providers/${p.id}`}>{p.name}</Link></td>
                  <td>{pt.reputation}</td>
                  <td>{pt.model}</td>
                </tr>
              ))}
              {t.registeredProviders > providers.length && (
                <tr><td colSpan={3} className="small" style={{ color: 'var(--purple)' }}>+ {t.registeredProviders - providers.length} more</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <aside className="card" style={{ flex: '0 0 300px' }}>
          <div className="small muted">Minimum payment</div>
          <div style={{ fontSize: 28, fontWeight: 700, margin: '4px 0 10px' }}>${t.minPayment.toFixed(2)} CAD</div>
          <div className="small muted">Min. providers per request: {t.minProviders}</div>
          <div className="small muted" style={{ margin: '6px 0 12px' }}>Usual delivery: {t.usualDelivery}</div>
          <button className="btn primary block" onClick={request}>Request this task</button>
          <p className="tiny muted" style={{ marginTop: 8 }}>Opens My requests with this task already selected.</p>
        </aside>
      </div>
    </main>
  )
}
