import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { emptyDraft, useNow, useStore, viewRequest } from '../store'

// Sidebar shared by the request form (12–16) and request pages (17–19).
export default function RequestsLayout({ children }: { children: ReactNode }) {
  const { state, setState } = useStore()
  const now = useNow()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const recents = [...state.requests].reverse()

  const newRequest = () => {
    setState((s) => ({ ...s, draft: emptyDraft }))
    navigate('/requests')
  }

  return (
    <div className="req-layout" style={collapsed ? { gridTemplateColumns: '56px 1fr' } : undefined}>
      <aside className="sidebar">
        <div className="row small muted" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {!collapsed && <span>Requests</span>}
          <button className="linklike" style={{ textDecoration: 'none' }} onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar">
            {collapsed ? '⇥' : '⇤'}
          </button>
        </div>
        {!collapsed && (
          <>
            <button className="btn block" style={{ marginTop: 12 }} onClick={newRequest}>+ New request</button>
            <h4>Recents</h4>
            {recents.length === 0 && <p className="small muted">No requests yet.</p>}
            {recents.map((r) => {
              const st = viewRequest(r, now).status
              const label = st === 'confirming' ? 'pending' : st
              return (
                <NavLink key={r.id} to={`/requests/${r.id}`} className={({ isActive }) => `recent${isActive ? ' active' : ''}`}>
                  <span>{r.id}</span>
                  <span className={`pill ${label}`}>{label}</span>
                </NavLink>
              )
            })}
          </>
        )}
      </aside>
      <div className="req-main">{children}</div>
    </div>
  )
}
