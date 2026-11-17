import { useState } from 'react'
import { Link } from 'react-router-dom'
import { USER } from '../data'

// 06 Profile and settings.
export default function Profile() {
  const [name, setName] = useState(USER.displayName)
  const [notifyResult, setNotifyResult] = useState(true)
  const [notifyCancel, setNotifyCancel] = useState(true)
  const [advanced, setAdvanced] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <main className="page" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32 }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <a href="#profile" className="menu-item" style={{ background: 'var(--purple-soft)', borderRadius: 8 }}>Profile</a>
        <a href="#notifications" className="menu-item">Notifications</a>
        <Link to="/history" className="menu-item">Transaction history</Link>
        <a href="#advanced" className="menu-item" onClick={() => setAdvanced(true)}>Security</a>
      </nav>
      <section>
        <h1 id="profile" style={{ fontSize: 24, marginBottom: 16 }}>Profile</h1>
        <div className="row wrap" style={{ gap: 24 }}>
          <div className="field" style={{ flex: '1 1 260px', maxWidth: 320 }}>
            <label htmlFor="dname">Display name</label>
            <input id="dname" className="input" value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
          </div>
          <div>
            <div className="small" style={{ fontWeight: 500, marginBottom: 6 }}>Signed in with</div>
            <div className="small muted">Email · {USER.email}</div>
          </div>
        </div>
        <h3 id="notifications" style={{ fontSize: 16, margin: '8px 0 10px' }}>Notifications</h3>
        <label className="row small" style={{ gap: 8, marginBottom: 10 }}>
          <input type="checkbox" checked={notifyResult} onChange={(e) => { setNotifyResult(e.target.checked); setSaved(false) }} />
          Email me when a result is ready
        </label>
        <label className="row small" style={{ gap: 8 }}>
          <input type="checkbox" checked={notifyCancel} onChange={(e) => { setNotifyCancel(e.target.checked); setSaved(false) }} />
          Email me when a request is cancelled and refunded
        </label>
        <div id="advanced" className="card" style={{ background: 'var(--purple-soft)', border: 0, margin: '18px 0' }}>
          <button className="linklike" style={{ textDecoration: 'none', fontWeight: 600 }} onClick={() => setAdvanced(!advanced)}>
            Advanced {advanced ? '▴' : '▾'}
          </button>
          {advanced && (
            <div className="small muted" style={{ marginTop: 8 }}>
              Wallet address {USER.wallet} · <button className="linklike small">Export wallet</button> ·{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>View on blockchain explorer</a>
            </div>
          )}
        </div>
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="btn primary" onClick={() => setSaved(true)}>Save changes</button>
          {saved && <span className="small" style={{ color: 'var(--green)' }}>✓ Changes saved</span>}
        </div>
      </section>
    </main>
  )
}
