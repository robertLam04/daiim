import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { emptyDraft, useStore } from '../store'
import type { Task } from '../data'

const CATEGORIES = ['Hydrology', 'Emergency management', 'Finance', 'Health', 'Other']
const JOIN_TIMES = ['2 minutes', '5 minutes', '10 minutes', '30 minutes']

// 11 Create a task. The review and success steps are prototype additions (not in Figma).
export default function CreateTask() {
  const { createTask, setState } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [what, setWhat] = useState('')
  const [category, setCategory] = useState('Hydrology')
  const [unit, setUnit] = useState('')
  const [inputs, setInputs] = useState<string[]>([''])
  const [minP, setMinP] = useState('3')
  const [maxP, setMaxP] = useState('7')
  const [join, setJoin] = useState('5 minutes')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [phase, setPhase] = useState<'form' | 'review' | 'saving' | 'done'>('form')
  const [created, setCreated] = useState<Task | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Give the task a name, e.g. “River level forecast”.'
    if (!what.trim()) e.what = 'Describe what should be predicted, in one sentence.'
    if (!unit.trim()) e.unit = 'Add the unit of the predicted number, e.g. m or m³/s.'
    const clean = inputs.map((i) => i.trim()).filter(Boolean)
    if (clean.length === 0) e.inputs = 'Add at least one input that requesters will provide.'
    else if (new Set(clean).size !== clean.length) e.inputs = 'Each input needs a different name.'
    const mn = Number(minP)
    const mx = Number(maxP)
    if (!Number.isInteger(mn) || mn < 2) e.minP = 'Min providers must be at least 2, so no single provider decides the result.'
    if (!Number.isInteger(mx) || mx < mn) e.maxP = 'Max providers must be a whole number at least as large as min providers.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = () => {
    setPhase('saving')
    setTimeout(() => {
      const t = createTask({
        name: name.trim(),
        shortName: name.trim(),
        description: what.trim(),
        detail: what.trim(),
        category,
        inputs: inputs.map((i) => i.trim()).filter(Boolean).map((n) => ({ name: n, type: 'number' as const })),
        outputLabel: what.trim(),
        outputUnit: unit.trim(),
        minStake: 20,
        registeredProviders: 0,
        minPayment: 1.5,
        minProviders: Number(minP),
        maxProviders: Number(maxP),
        usualDelivery: 'about 10 min',
        joinTime: join,
        sampleResult: { value: 12.4, low: 11.1, high: 13.8 },
      })
      setCreated(t)
      setPhase('done')
    }, 1400)
  }

  const err = (k: string) => errors[k] && <span className="err-text">{errors[k]}</span>

  if (phase === 'done' && created) {
    return (
      <main className="page" style={{ maxWidth: 640 }}>
        <p className="kicker">Prototype addition · not in Figma</p>
        <div className="card" style={{ marginTop: 8 }}>
          <h2 style={{ fontSize: 22, color: 'var(--green)' }}>✓ Task created</h2>
          <p className="small" style={{ margin: '10px 0' }}>
            “{created.name}” ({created.id}) is now listed in the Marketplace. Providers can register for it, and you can send requests once at least {created.minProviders} have joined.
          </p>
          <p className="small">Proof: <a href="#" onClick={(e) => e.preventDefault()}>4kTz…Qm8r ↗</a></p>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={() => navigate(`/marketplace/tasks/${created.id}`)}>View task</button>
            <button className="btn" onClick={() => { setState((s) => ({ ...s, draft: { ...emptyDraft, taskId: created.id } })); navigate('/requests') }}>Request this task</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="row wrap" style={{ gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h1 style={{ fontSize: 26, marginBottom: 18 }}>Create a new task</h1>
          <div className="field">
            <label htmlFor="tname">Task name</label>
            <input id="tname" className={`input${errors.name ? ' invalid' : ''}`} placeholder="Snowmelt streamflow forecast" value={name} onChange={(e) => setName(e.target.value)} />
            {err('name')}
          </div>
          <div className="field">
            <label htmlFor="twhat">What should be predicted?</label>
            <input id="twhat" className={`input${errors.what ? ' invalid' : ''}`} placeholder="Streamflow in 48 h for a mountain river during spring melt" value={what} onChange={(e) => setWhat(e.target.value)} />
            {err('what')}
          </div>
          <div className="field">
            <label htmlFor="tcat">Category</label>
            <select id="tcat" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="tunit">Output</label>
            <div className="row" style={{ alignItems: 'center', gap: 8 }}>
              <span className="small muted" style={{ whiteSpace: 'nowrap' }}>One number · unit</span>
              <input id="tunit" className={`input${errors.unit ? ' invalid' : ''}`} placeholder="m³/s" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            {err('unit')}
          </div>
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <h3 style={{ fontSize: 15, marginBottom: 10 }}>Inputs requesters will provide</h3>
          {inputs.map((v, i) => (
            <div className="row" key={i} style={{ marginBottom: 8, gap: 8, alignItems: 'center' }}>
              <input className="input" placeholder={i === 0 ? 'snowpack_cm' : 'temp_avg_c'} value={v} onChange={(e) => setInputs(inputs.map((x, j) => (j === i ? e.target.value : x)))} aria-label={`Input ${i + 1} name`} />
              <span className="small muted">number</span>
              {inputs.length > 1 && <button className="linklike small" onClick={() => setInputs(inputs.filter((_, j) => j !== i))} aria-label={`Remove input ${i + 1}`}>✕</button>}
            </div>
          ))}
          <button className="linklike small" onClick={() => setInputs([...inputs, ''])}>+ Add input</button>
          {errors.inputs && <div>{err('inputs')}</div>}
          <div className="row" style={{ marginTop: 14 }}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="tmin">Min providers</label>
              <input id="tmin" className={`input${errors.minP ? ' invalid' : ''}`} inputMode="numeric" value={minP} onChange={(e) => setMinP(e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="tmax">Max providers</label>
              <input id="tmax" className={`input${errors.maxP ? ' invalid' : ''}`} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} />
            </div>
          </div>
          {err('minP')} {err('maxP')}
          <div className="field">
            <label htmlFor="tjoin">Time for providers to join</label>
            <select id="tjoin" className="input" value={join} onChange={(e) => setJoin(e.target.value)}>
              {JOIN_TIMES.map((j) => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => validate() && setPhase('review')}>Review and create</button>
            <button className="btn" onClick={() => navigate(-1)}>Cancel</button>
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            Creating a task is recorded publicly and can’t be deleted. Min providers must be at least 2.
          </p>
        </div>
      </div>

      {(phase === 'review' || phase === 'saving') && (
        <div className="overlay">
          <div className="modal purple" role="dialog" aria-label="Confirm new task" style={{ width: 480 }}>
            <p className="tiny" style={{ opacity: 0.7, margin: '0 0 6px' }}>PROTOTYPE ADDITION · NOT IN FIGMA</p>
            <h2 style={{ fontSize: 19, marginBottom: 14 }}>Please confirm your new task</h2>
            <div className="modal-box">
              Task: {name}<br />
              Predicts: {what} ({unit})<br />
              Inputs: {inputs.filter((x) => x.trim()).join(', ')}<br />
              Providers: {minP}–{maxP} · {join} to join<br />
              Cost: $0.00 · Network fee covered by DAIIM
            </div>
            <p className="small" style={{ margin: '14px 0', opacity: 0.9 }}>
              This task will be recorded publicly and can’t be deleted.
            </p>
            <div className="row">
              <button className="btn green-outline" style={{ background: '#fff' }} disabled={phase === 'saving'} onClick={save}>
                {phase === 'saving' ? 'Recording…' : 'Confirm'}
              </button>
              <button className="btn red-outline" style={{ background: '#fff' }} disabled={phase === 'saving'} onClick={() => setPhase('form')}>Back</button>
            </div>
          </div>
        </div>
      )}
      <p className="small" style={{ marginTop: 24 }}><Link to="/marketplace">← Back to marketplace</Link></p>
    </main>
  )
}
