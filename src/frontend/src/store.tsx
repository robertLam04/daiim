import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TASKS, type Task } from './data'

// ---------- Types ----------

export interface Req {
  id: string
  taskId: string
  amount: number
  createdAt: number
  dateLabel: string
  // Seeded requests keep a fixed status; live ones derive it from time.
  fixed?: 'complete' | 'cancelled' | 'pending'
  fixedStage?: number
  // How long the payment stays "confirming" (used for the log-out warning).
  confirmMs?: number
  joined?: number
}

export interface Deposit {
  id: string
  amount: number
  method: 'card' | 'crypto'
  dateLabel: string
  ts: number
  proof: string
}

export interface FailedAttempt {
  label: string
  dateLabel: string
  ts: number
}

export interface UploadError {
  title: string
  detail: string
  fix: string
}

export interface Draft {
  taskId: string | null
  data: null | { source: 'file' | 'typed'; fileName?: string; values: Record<string, number> }
  uploadError: UploadError | null
  amount: string
}

export interface State {
  signedIn: boolean
  deposits: Deposit[]
  requests: Req[]
  failedAttempts: FailedAttempt[]
  createdTasks: Task[]
  draft: Draft
  forceFailNext: boolean
}

// ---------- Request timeline ----------

export const STAGES = ['Task submitted', 'Finding providers', 'Getting predictions', 'Aggregating results', 'Finalizing']
// Milliseconds spent in each stage for live requests (kept short for walkthroughs).
const STAGE_MS = [4000, 4000, 6000, 3000, 2000]
const TOTAL_MS = STAGE_MS.reduce((a, b) => a + b, 0)

export type ReqStatus = 'confirming' | 'pending' | 'complete' | 'cancelled'

export interface ReqView {
  status: ReqStatus
  stage: number // index into STAGES of the active stage; STAGES.length when done
  elapsedMs: number
}

export function viewRequest(r: Req, now: number): ReqView {
  const elapsedMs = Math.max(0, now - r.createdAt)
  if (r.fixed === 'complete') return { status: 'complete', stage: STAGES.length, elapsedMs }
  if (r.fixed === 'cancelled') return { status: 'cancelled', stage: 1, elapsedMs }
  if (r.fixed === 'pending') return { status: 'pending', stage: r.fixedStage ?? 1, elapsedMs }
  const confirmMs = r.confirmMs ?? STAGE_MS[0]
  if (elapsedMs < confirmMs) return { status: 'confirming', stage: 0, elapsedMs }
  let t = elapsedMs - confirmMs
  for (let i = 1; i < STAGE_MS.length; i++) {
    if (t < STAGE_MS[i]) return { status: 'pending', stage: i, elapsedMs }
    t -= STAGE_MS[i]
  }
  return { status: 'complete', stage: STAGES.length, elapsedMs }
}

// ---------- Presets ----------

const emptyDraft: Draft = { taskId: null, data: null, uploadError: null, amount: '' }

const base: State = {
  signedIn: false,
  deposits: [],
  requests: [],
  failedAttempts: [],
  createdTasks: [],
  draft: emptyDraft,
  forceFailNext: false,
}

// A returning user whose numbers match the Figma frames:
// available $13.39, held $2.62, requests R1–R4.
function returningUser(): State {
  const at = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m).getTime()
  return {
    ...base,
    signedIn: true,
    deposits: [{ id: 'D1', amount: 25, method: 'card', dateLabel: 'Nov 5, 8:40 AM', ts: at(5, 8, 40), proof: '9Hc2…kL4p' }],
    requests: [
      { id: 'R1', taskId: 'T1', amount: 6.37, createdAt: at(5, 10, 2), dateLabel: 'Nov 5, 10:02 AM', fixed: 'complete' },
      { id: 'R2', taskId: 'T1', amount: 2.62, createdAt: at(6, 9, 5), dateLabel: 'Nov 6, 9:05 AM', fixed: 'complete' },
      { id: 'R3', taskId: 'T2', amount: 2.0, createdAt: at(7, 14, 1), dateLabel: 'Nov 7, 2:01 PM', fixed: 'cancelled', joined: 2 },
      { id: 'R4', taskId: 'T1', amount: 2.62, createdAt: at(8, 9, 15), dateLabel: 'Nov 8, 9:15 AM', fixed: 'pending', fixedStage: 1 },
    ],
  }
}

export type PresetName = 'signedOut' | 'newUser' | 'returning'

export function preset(name: PresetName): State {
  if (name === 'signedOut') return { ...base }
  if (name === 'newUser') return { ...base, signedIn: true }
  return returningUser()
}

// ---------- Persistence (per tab, so refresh keeps your place) ----------

const KEY = 'daiim-prototype-state'

function load(): State {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...base, ...JSON.parse(raw) }
  } catch {
    // Storage unavailable: start fresh.
  }
  return { ...base }
}

function save(s: State) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Ignore: the prototype still works without persistence.
  }
}

// ---------- Context ----------

function nowLabel(): string {
  return new Date().toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function fakeProof(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'
  const pick = (n: number) => Array.from({ length: n }, () => c[Math.floor(Math.random() * c.length)]).join('')
  return `${pick(4)}…${pick(4)}`
}

interface Store {
  state: State
  setState: (fn: (s: State) => State) => void
  allTasks: Task[]
  task: (id: string | null | undefined) => Task | undefined
  balances: (now: number) => { available: number; held: number }
  hasConfirmingPayment: (now: number) => Req | undefined
  signIn: () => void
  signOut: () => void
  deposit: (amount: number, method: 'card' | 'crypto') => Deposit
  updateDraft: (patch: Partial<Draft>) => void
  submitRequest: () => { ok: true; id: string } | { ok: false }
  createTask: (t: Omit<Task, 'id'>) => Task
  finishAll: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<State>(load)

  useEffect(() => save(state), [state])

  const setState = useCallback((fn: (s: State) => State) => setRaw(fn), [])

  const store = useMemo<Store>(() => {
    const allTasks = [...TASKS, ...state.createdTasks]
    const task = (id: string | null | undefined) => allTasks.find((t) => t.id === id)

    const balances = (now: number) => {
      const deposited = state.deposits.reduce((a, d) => a + d.amount, 0)
      let spent = 0
      let held = 0
      for (const r of state.requests) {
        const v = viewRequest(r, now)
        if (v.status === 'cancelled') continue
        spent += r.amount
        if (v.status !== 'complete') held += r.amount
      }
      return { available: deposited - spent, held }
    }

    return {
      state,
      setState,
      allTasks,
      task,
      balances,
      hasConfirmingPayment: (now) => state.requests.find((r) => viewRequest(r, now).status === 'confirming'),
      // Keep a task the user picked while signed out.
      signIn: () => setRaw((s) => ({ ...preset('newUser'), draft: s.draft, createdTasks: s.createdTasks })),
      signOut: () => setRaw(() => preset('signedOut')),
      deposit: (amount, method) => {
        const d: Deposit = { id: `D${state.deposits.length + 1}`, amount, method, dateLabel: nowLabel(), ts: Date.now(), proof: fakeProof() }
        setRaw((s) => ({ ...s, deposits: [...s.deposits, d] }))
        return d
      },
      updateDraft: (patch) => setRaw((s) => ({ ...s, draft: { ...s.draft, ...patch } })),
      submitRequest: () => {
        const nextNum = state.requests.reduce((m, r) => Math.max(m, Number(r.id.slice(1))), 0) + 1
        const id = `R${nextNum}`
        if (state.forceFailNext) {
          // Forced error for usability task 3: nothing is charged.
          setRaw((s) => ({ ...s, forceFailNext: false, failedAttempts: [{ label: id, dateLabel: nowLabel(), ts: Date.now() }, ...s.failedAttempts] }))
          return { ok: false }
        }
        const amount = Number(state.draft.amount)
        const r: Req = { id, taskId: state.draft.taskId!, amount, createdAt: Date.now(), dateLabel: nowLabel() }
        setRaw((s) => ({ ...s, requests: [...s.requests, r], draft: emptyDraft }))
        return { ok: true, id }
      },
      createTask: (t) => {
        const created: Task = { ...t, id: `T${TASKS.length + state.createdTasks.length + 1}` }
        setRaw((s) => ({ ...s, createdTasks: [...s.createdTasks, created] }))
        return created
      },
      finishAll: () =>
        setRaw((s) => ({
          ...s,
          requests: s.requests.map((r) => (r.fixed ? r : { ...r, createdAt: Date.now() - TOTAL_MS - (r.confirmMs ?? 0) - 1000 })),
        })),
    }
  }, [state, setState])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}

// Re-renders every half second so progress and balances update live.
export function useNow(): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])
  return now
}

export { emptyDraft, STAGE_MS }
