import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { matchScreen, ROWS, SCREENS, type Screen } from '../screens'
import { preset, useNow, useStore, viewRequest } from '../store'
import { downloadFile, exampleCsv } from '../pages/TaskDetail'

const HIDE_KEY = 'daiim-walkthrough-hidden'

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

// Facilitator tool: jump to any Figma frame, read its walkthrough note,
// and trigger the forced error. Hide it when testing with participants.
export default function WalkthroughPanel() {
  const store = useStore()
  const { state, setState, balances, finishAll } = store
  const now = useNow()
  const loc = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(readHidden)

  // Alt+Shift+H shows or hides the panel button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyH') {
        setHidden((h) => {
          try { localStorage.setItem(HIDE_KEY, h ? '0' : '1') } catch { /* ignore */ }
          return !h
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const reqId = loc.pathname.startsWith('/requests/') ? loc.pathname.split('/')[2] : null
  const req = reqId ? state.requests.find((r) => r.id === reqId) : undefined
  const draftOverFunds = !!state.draft.data && Number(state.draft.amount) > balances(now).available
  const current = matchScreen(loc.pathname, params, state.signedIn, {
    draftHasUploadError: !!state.draft.uploadError,
    draftOverFunds,
    reqStatus: req ? viewRequest(req, now).status : undefined,
  })

  const jump = (s: Screen) => {
    setState(() => s.setup())
    navigate(s.path)
  }

  const idx = current ? SCREENS.indexOf(current) : -1

  if (hidden) return null

  return (
    <>
      <button className="wt-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Close' : `Walkthrough${current ? ` · ${current.id}` : ''}`}
      </button>
      {open && (
        <div className="wt-panel" role="complementary" aria-label="Walkthrough controls">
          <h4 style={{ marginTop: 0 }}>Current screen</h4>
          {current ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{current.id} · {current.name}</div>
              <div className="wt-note">{current.note}</div>
              <div style={{ marginTop: 6 }}>
                <button className="wt-btn" disabled={idx <= 0} onClick={() => jump(SCREENS[idx - 1])}>← Prev screen</button>
                <button className="wt-btn" disabled={idx >= SCREENS.length - 1} onClick={() => jump(SCREENS[idx + 1])}>Next screen →</button>
              </div>
            </>
          ) : (
            <div className="wt-note">This view isn’t one of the Figma frames.</div>
          )}

          <h4>Test controls</h4>
          <label>
            <input
              type="checkbox"
              checked={state.forceFailNext}
              onChange={(e) => setState((s) => ({ ...s, forceFailNext: e.target.checked }))}
            />
            Force next payment to fail (screen 16)
          </label>
          <div>
            <button className="wt-btn" onClick={finishAll}>Finish running requests now</button>
            <button className="wt-btn" onClick={() => { setState(() => preset('signedOut')); navigate('/') }}>Reset to signed out</button>
          </div>
          <div style={{ marginTop: 6 }}>
            Sample files for T1:{' '}
            <button className="wt-btn" onClick={() => downloadFile('readings.csv', exampleCsv(['river_level_m', 'rainfall_24h_mm', 'upstream_flow_m3s']))}>correct</button>
            <button className="wt-btn" onClick={() => downloadFile('readings-wrong.csv', exampleCsv(['river_level_m', 'rainfall_mm'], [2.41, 18]))}>wrong columns</button>
          </div>
          <div style={{ marginTop: 6, color: '#aaa' }}>Wrong sign-in code: 000000. Alt+Shift+H hides this panel.</div>

          {ROWS.map((row) => (
            <div key={row}>
              <h4>{row}</h4>
              {SCREENS.filter((s) => s.row === row).map((s) => (
                <button key={s.id} className={`wt-link${current?.id === s.id ? ' current' : ''}`} onClick={() => jump(s)}>
                  {s.id} · {s.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
