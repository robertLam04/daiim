import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import RequestsLayout from '../components/RequestsLayout'
import { money } from '../data'
import { emptyDraft, useNow, useStore, type UploadError } from '../store'
import { useModal } from '../modals/useModal'
import { downloadFile, exampleCsv } from './TaskDetail'

function Step({ n, title, state, children }: { n: number; title: string; state: 'done' | 'active' | 'locked'; children: ReactNode }) {
  return (
    <section className={`fstep ${state}`}>
      <div className="fstep-head">
        <span className={`fstep-num ${state}`}>{state === 'done' ? '✓' : n}</span>
        {title}
      </div>
      <div className="fstep-body">{children}</div>
    </section>
  )
}

// 12 New request form, 13 upload rejected, 14 not enough funds.
export default function NewRequest() {
  const { state, allTasks, task, updateDraft, balances } = useStore()
  const { open } = useModal()
  const now = useNow()
  const fileRef = useRef<HTMLInputElement>(null)
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState<Record<string, string>>({})

  const draft = state.draft
  const t = task(draft.taskId)
  const { available } = balances(now)

  const amount = Number(draft.amount)
  const amountEntered = draft.amount.trim() !== ''
  let amountError: UploadError | null = null
  if (t && amountEntered) {
    if (!Number.isFinite(amount) || amount <= t.minPayment) {
      amountError = {
        title: 'Amount too low',
        detail: `Payments for this task must be more than ${money(t.minPayment)}.`,
        fix: `Enter ${money(t.minPayment + 0.01)} or more. Suggested: $2.50.`,
      }
    } else if (amount > available) {
      amountError = {
        title: 'Not enough funds',
        detail: `This request costs ${money(amount)}, but you have ${money(available)} available.`,
        fix: 'Deposit more into your account, or lower the amount.',
      }
    }
  }

  const step1Done = !!t
  const step2Done = step1Done && !!draft.data
  const step3Done = step2Done && amountEntered && !amountError

  const chooseTask = (id: string) => {
    updateDraft({ ...emptyDraft, taskId: id || null })
    setTyping(false)
    setTyped({})
  }

  const onFile = async (file: File) => {
    if (!t) return
    const text = await file.text()
    const lines = text.trim().split(/\r?\n/)
    const header = (lines[0] || '').split(',').map((h) => h.trim())
    const required = t.inputs.map((f) => f.name)
    const missing = required.filter((r) => !header.includes(r))
    const extra = header.filter((h) => h && !required.includes(h))
    const fix = 'Download the example file from the task page, or type the values instead.'
    if (missing.length || extra.length) {
      const parts = []
      if (missing.length) parts.push(`Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`)
      if (extra.length) parts.push(`Unexpected column${extra.length > 1 ? 's' : ''}: ${extra.join(', ')}.`)
      updateDraft({ data: null, uploadError: { title: 'Data doesn’t match this task', detail: `Input data must match the stated input schema exactly. ${parts.join(' ')}`, fix } })
      return
    }
    const row = (lines[1] || '').split(',').map((v) => v.trim())
    const values: Record<string, number> = {}
    for (const r of required) {
      const v = Number(row[header.indexOf(r)])
      if (row[header.indexOf(r)] === undefined || row[header.indexOf(r)] === '' || !Number.isFinite(v)) {
        updateDraft({ data: null, uploadError: { title: 'Data doesn’t match this task', detail: `“${r}” needs a number, but the file has “${row[header.indexOf(r)] ?? 'nothing'}”.`, fix } })
        return
      }
      values[r] = v
    }
    updateDraft({ data: { source: 'file', fileName: file.name, values }, uploadError: null })
  }

  const useTyped = () => {
    if (!t) return
    const values: Record<string, number> = {}
    for (const f of t.inputs) values[f.name] = Number(typed[f.name])
    updateDraft({ data: { source: 'typed', values }, uploadError: null })
    setTyping(false)
  }
  const typedValid = !!t && t.inputs.every((f) => typed[f.name]?.trim() && Number.isFinite(Number(typed[f.name])))

  const nextHint = !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : null

  return (
    <RequestsLayout>
      <Step n={1} title="Select the task" state={step1Done ? 'done' : 'active'}>
        <select className="input" style={{ maxWidth: 320 }} value={draft.taskId ?? ''} onChange={(e) => chooseTask(e.target.value)} aria-label="Select the task">
          <option value="">🔍 Search tasks</option>
          {allTasks.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.name}</option>)}
        </select>
        {!step1Done && (
          <p className="small muted" style={{ marginTop: 8 }}>
            If your desired task is not listed, you can <Link to="/tasks/new">create a new task in the Marketplace</Link>.
          </p>
        )}
      </Step>

      <Step n={2} title="Input your data" state={step2Done ? 'done' : step1Done ? 'active' : 'locked'}>
        {draft.data ? (
          <p className="small" style={{ color: 'var(--green)', margin: 0 }}>
            {draft.data.source === 'file' ? draft.data.fileName : 'Typed values'} · {Object.keys(draft.data.values).length} values ✓ matches the task{' '}
            <button className="linklike small" onClick={() => updateDraft({ data: null })}>Change</button>
          </p>
        ) : (
          <>
            <div className="row" style={{ alignItems: 'center', gap: 12 }}>
              <button className="btn" disabled={!step1Done} style={!step1Done ? { borderStyle: 'dashed' } : undefined} onClick={() => fileRef.current?.click()}>
                + Upload data
              </button>
              {step1Done && <button className="linklike small" onClick={() => setTyping(!typing)}>or type values instead</button>}
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onFile(f)
                  e.target.value = ''
                }}
              />
            </div>
            {draft.uploadError && (
              <div className="banner red small" style={{ marginTop: 12, maxWidth: 520 }}>
                <strong>{draft.uploadError.title}</strong>
                <div style={{ margin: '4px 0' }}>{draft.uploadError.detail}</div>
                <div>
                  {draft.uploadError.fix}{' '}
                  {t && (
                    <button className="linklike small" onClick={() => downloadFile(`${t.id}-example.csv`, exampleCsv(t.inputs.map((f) => f.name)))}>
                      Download example file
                    </button>
                  )}
                </div>
              </div>
            )}
            {typing && t && (
              <div className="card" style={{ marginTop: 12, maxWidth: 420 }}>
                {t.inputs.map((f) => (
                  <div className="field" key={f.name}>
                    <label htmlFor={f.name}>{f.name}</label>
                    <input id={f.name} className="input" inputMode="decimal" value={typed[f.name] ?? ''} onChange={(e) => setTyped({ ...typed, [f.name]: e.target.value })} />
                  </div>
                ))}
                <button className="btn primary" disabled={!typedValid} onClick={useTyped}>Use these values</button>
              </div>
            )}
            <p className="small muted" style={{ marginTop: 8 }}>Input data must follow the task’s input format.</p>
          </>
        )}
      </Step>

      <Step n={3} title="Enter payment amount" state={step3Done ? 'done' : step2Done ? 'active' : 'locked'}>
        <div className="row" style={{ alignItems: 'center', gap: 10 }}>
          <input
            className={`input${amountError ? ' invalid' : ''}`}
            style={{ maxWidth: 200 }}
            disabled={!step2Done}
            inputMode="decimal"
            placeholder={t ? `min $${t.minPayment.toFixed(2)}` : 'min $_.__'}
            value={draft.amount}
            onChange={(e) => updateDraft({ amount: e.target.value.replace(/[^0-9.]/g, '') })}
            aria-label="Payment amount in CAD"
          />
          {step2Done && t && <span className="small muted">min ${t.minPayment.toFixed(2)} · <button className="linklike small" onClick={() => updateDraft({ amount: '2.50' })}>suggested $2.50</button></span>}
        </div>
        {amountError && (
          <div className="banner red small" style={{ marginTop: 10, maxWidth: 520 }}>
            <strong>{amountError.title}</strong>
            <div style={{ margin: '4px 0' }}>{amountError.detail}</div>
            <div>
              {amountError.fix}{' '}
              {amountError.title === 'Not enough funds' && <button className="btn primary" style={{ marginLeft: 6, padding: '4px 10px' }} onClick={() => open('deposit')}>Deposit</button>}
            </div>
          </div>
        )}
        {step2Done && !amountError && (
          <p className="small muted" style={{ marginTop: 8 }}>If you have insufficient funds, you may deposit more into your account.</p>
        )}
      </Step>

      <Step n={4} title="Review the details of your request" state={step3Done ? 'active' : 'locked'}>
        {step3Done && t ? (
          <div className="small" style={{ lineHeight: 1.8, marginBottom: 10 }}>
            Task: {t.id} · {t.name}<br />
            Input data: {draft.data?.source === 'file' ? draft.data.fileName : 'typed values'}<br />
            Payment amount: {money(amount)}<br />
            Estimated delivery time: {t.usualDelivery}
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: 0 }}>Task · Input data · Payment amount · Estimated delivery time</p>
        )}
        <button className="btn primary" disabled={!step3Done} onClick={() => open('confirm')}>Confirm payment and submit request</button>
        {nextHint && step1Done && <p className="small muted">Finish step {nextHint} to continue.</p>}
      </Step>
    </RequestsLayout>
  )
}
