// Every frame in the Figma file "DAIIM Requester UI – Cognitive Walkthrough",
// with its walkthrough note and the state needed to jump straight to it.
import { preset, STAGE_MS, type Draft, type State } from './store'

export interface Screen {
  id: string
  name: string
  row: string
  path: string
  note: string
  setup: () => State
}

const okData: Draft['data'] = {
  source: 'file',
  fileName: 'readings.csv',
  values: { river_level_m: 2.41, rainfall_24h_mm: 18, upstream_flow_m3s: 64 },
}

function returningWith(patch: Partial<State> = {}): State {
  return { ...preset('returning'), ...patch }
}

const NOV8_410 = new Date(2026, 10, 8, 16, 10).getTime()
const NOV8_412 = new Date(2026, 10, 8, 16, 12).getTime()

function withR5(mode: 'progress' | 'complete' | 'held'): State {
  const s = preset('returning')
  const now = Date.now()
  const createdAt = mode === 'progress' ? now - (STAGE_MS[0] + STAGE_MS[1] + 1500) : NOV8_412
  return {
    ...s,
    failedAttempts: mode === 'held' ? [{ label: 'R5', dateLabel: 'Nov 8, 4:10 PM', ts: NOV8_410 }] : [],
    requests: [
      ...s.requests,
      {
        id: 'R5',
        taskId: 'T1',
        amount: 2.5,
        createdAt,
        dateLabel: 'Nov 8, 4:12 PM',
        ...(mode === 'complete' ? { fixed: 'complete' as const } : {}),
        ...(mode === 'held' ? { fixed: 'pending' as const, fixedStage: 2 } : {}),
      },
    ],
  }
}

export const ROWS = [
  'Row 1 · Sign in and account',
  'Row 2 · Marketplace and tasks',
  'Row 3 · Submit a request',
  'Row 4 · Funds, history and log out',
]

export const SCREENS: Screen[] = [
  {
    id: '01',
    name: 'Home (signed out)',
    row: ROWS[0],
    path: '/',
    setup: () => preset('signedOut'),
    note: 'Step 1.1 · Goal: start using DAIIM. Correct action: click "Sign up / Log in". Check: does the welcome text explain the value without crypto words? Is the sign-in button easy to find? Traces: UC1 steps 1–2, FR3, NFR4.',
  },
  {
    id: '02',
    name: 'Sign in – choose a method',
    row: ROWS[0],
    path: '/?modal=signin',
    setup: () => preset('signedOut'),
    note: 'Step 1.2 · Correct action: enter an email and click "Continue with email" (or use Google). Check: will Priya choose email/Google rather than "Use my own wallet"? Does "Secured by MetaMask" reassure or worry her? Traces: UC1 steps 3–5, FR1, FR2, NFR8, NFR18.',
  },
  {
    id: '03',
    name: 'Sign in – enter code',
    row: ROWS[0],
    path: '/?modal=code&to=priya%40riverbend.ca',
    setup: () => preset('signedOut'),
    note: 'Step 1.3 · Correct action: type the code and click "Verify". Check: is it clear where the code comes from? Wrong code → show the error and a resend option (UC1 alt 5b). Cancel returns to the public page (alt 5a). Traces: UC1, FR2, NFR5. (Prototype: code 000000 triggers the wrong-code error.)',
  },
  {
    id: '04',
    name: 'Sign in – setting up account',
    row: ROWS[0],
    path: '/?modal=setup&via=email',
    setup: () => preset('signedOut'),
    note: 'Step 1.4 · System shows progress while the embedded wallet is created in the background. Check: does the wallet step read as normal account setup? Survey Q1–Q2. Traces: FR2 (creation confirmation), NFR6.',
  },
  {
    id: '05',
    name: 'Home (signed in) – profile menu open',
    row: ROWS[0],
    path: '/?menu=open',
    setup: () => preset('newUser'),
    note: 'Step 1.5 · After sign-in the header shows held and available funds; the profile picture opens the menu (Profile, Transaction history, Help, Log out). Check: survey Q2, does the wallet explainer make sense? Does the checklist point to Deposit next? Is "Log out" findable within 2 clicks (NFR4)? Traces: UC1 postcondition, UC16, NFR4.',
  },
  {
    id: '06',
    name: 'Profile and settings',
    row: ROWS[0],
    path: '/profile',
    setup: () => returningWith(),
    note: 'Opens from "Profile" or the ⚙ icon in the profile menu. Technical wallet details sit under "Advanced" so Priya never needs them on the main path. Check: can she change her display name and notification preferences without seeing crypto terms? Traces: FR1 (same profile each sign-in), NFR13.',
  },
  {
    id: '07',
    name: 'Help',
    row: ROWS[0],
    path: '/help',
    setup: () => returningWith(),
    note: 'Opens from "Help" in the profile menu (VnV task 2: find the documentation). Expands the "How do I get started" section and answers the questions users are likely to have. Check: does it answer "what am I paying for?" (survey Q4) and "what are held funds?" in plain words? Traces: UC16, NFR3, NFR4.',
  },
  {
    id: '08a',
    name: 'Marketplace (signed out)',
    row: ROWS[1],
    path: '/marketplace',
    setup: () => preset('signedOut'),
    note: 'Step 2.1 · Correct action: click "Marketplace", then a task card (or a task link like T1 inside a provider card). "+ New task" requires sign-in; task links in provider cards are clickable. Check: can a non-expert judge a task from its name and description? Are All / Tasks / Providers filters understood? Traces: UC4, FR3, FR10, NFR4, NFR13.',
  },
  {
    id: '08b',
    name: 'Marketplace (signed in)',
    row: ROWS[1],
    path: '/marketplace',
    setup: () => returningWith(),
    note: 'Step 2.1 (signed in) · Same as 08, but "+ New task" is enabled. Check: is "+ New task" noticed as the way to create a task? Traces: UC4, UC5, FR10.',
  },
  {
    id: '09',
    name: 'Task details',
    row: ROWS[1],
    path: '/marketplace/tasks/T1',
    setup: () => returningWith(),
    note: 'Opens when a task card or task link is clicked. Shows the input format before the user uploads anything, which prevents the schema error on screen 13. Correct action: click "Request this task". Check: are the input names and units understandable? Is the minimum payment clear? Traces: FR6, FR7, FR10, UC4.',
  },
  {
    id: '10',
    name: 'Provider details',
    row: ROWS[1],
    path: '/marketplace/providers/P1',
    setup: () => returningWith(),
    note: 'Opens from a provider card. Lets requesters check who they are relying on (SR5, product vision: transparency). Check: is "reputation" understandable without the algorithm? Public info limited to what the provider consented to (NFR13). Traces: FR3, FR10, FR14, NFR13.',
  },
  {
    id: '11',
    name: 'Create a task',
    row: ROWS[1],
    path: '/tasks/new',
    setup: () => returningWith(),
    note: 'Opens from "+ New task" (only after sign-in; signed-out users are asked to sign in first). Also reachable from the request form when the needed task is missing (UC7 alt 2a). Check: are "min/max providers" and "time to join" understandable? Is the permanence warning noticed? Traces: UC5, FR5–FR9. (The Figma file has this frame twice; the confirm and success steps are prototype additions.)',
  },
  {
    id: '12',
    name: 'My requests – new request form',
    row: ROWS[2],
    path: '/requests',
    setup: () => returningWith(),
    note: 'Step 3.1 · Correct action: "+ New request" in the sidebar, then choose the task in step 1. Steps and buttons are greyed out until the previous step is filled in correctly. Check: do greyed steps make the order obvious? Is the "create a task" hint visible enough (UC7 alt 2a)? Traces: UC7 steps 1–2, FR17.',
  },
  {
    id: '13',
    name: 'New request – upload rejected',
    row: ROWS[2],
    path: '/requests',
    setup: () =>
      returningWith({
        draft: {
          taskId: 'T1',
          data: null,
          amount: '',
          uploadError: {
            title: 'Data doesn’t match this task',
            detail: 'Input data must match the stated input schema exactly. Missing column: upstream_flow_m3s.',
            fix: 'Download the example file from the task page, or type the values instead.',
          },
        },
      }),
    note: 'Shows the schema error from test ST-REQ-2. The error has a name, description and fix (NFR5), and nothing is charged. Check: does Priya know exactly what to change? Is "type values instead" a useful alternative to uploading a file? Traces: UC7 alt 4a, FR18, NFR5, NFR.SA.1.',
  },
  {
    id: '14',
    name: 'New request – not enough funds',
    row: ROWS[2],
    path: '/requests',
    setup: () => returningWith({ draft: { taskId: 'T1', data: okData, uploadError: null, amount: '20.00' } }),
    note: 'The amount is checked against available funds before any wallet prompt (FR.SA.2), and amounts at or below the minimum are rejected (ST-REQ-3). Check: is the link to Deposit obvious? Does "suggested" help Priya choose an amount? Traces: FR19, FR.SA.2, NFR5.',
  },
  {
    id: '15',
    name: 'Confirm payment modal',
    row: ROWS[2],
    path: '/requests?modal=confirm',
    setup: () => returningWith({ draft: { taskId: 'T1', data: okData, uploadError: null, amount: '2.50' } }),
    note: 'Step 3.2 · Correct action: review and click "Confirm". This is the app’s approval screen, shown before any wallet prompt (FR55). Check: survey Q4, does Priya know what she is paying for and that funds are held, not spent? If the wallet runs headless, this is the only approval; otherwise a MetaMask screen follows. Traces: UC7 steps 5–6, FR4, FR19, FR55, FR.SA.7.',
  },
  {
    id: '16',
    name: 'Payment failed (forced error)',
    row: ROWS[2],
    path: '/requests?modal=payment-failed',
    setup: () =>
      returningWith({
        draft: { taskId: 'T1', data: okData, uploadError: null, amount: '2.50' },
        failedAttempts: [{ label: 'R5', dateLabel: 'Nov 8, 4:10 PM', ts: NOV8_410 }],
      }),
    note: 'The error forced during task 3 of the usability study (NFR-USE-1). Correct action: click "Try again". Check: does the message have a name, description and fix (NFR5) and say nothing was charged? A retry must not double-charge (FR.SA.1, FR.SA.5). Traces: UC7 alt 7a, FR.SA.6, NFR5, NFR.SA.1. (Prototype: turn on "Force next payment to fail" to hit this naturally.)',
  },
  {
    id: '17',
    name: 'Request R5 – in progress',
    row: ROWS[2],
    path: '/requests/R5?sent=1',
    setup: () => withR5('progress'),
    note: 'Step 4.1 · R5 appears in Recents as "pending", held funds go up and available funds go down, and the stages show progress (Task submitted → Finding providers → Getting predictions → Aggregating → Finalizing). Check: survey Q6, can Priya tell the system is still working? Does she know she can leave? Traces: UC7 step 10, FR38, FR56, NFR6, NFR7.',
  },
  {
    id: '18',
    name: 'Request R5 – result',
    row: ROWS[2],
    path: '/requests/R5',
    setup: () => withR5('complete'),
    note: 'Step 4.2 · "Result" and "Aggregation of X providers in X time", with R5 changing to "complete" and balances updating (held funds go down when providers are paid). Also the range (lowest–highest, FR37), proof of payment (FR57) and the reliability caveat (SRS 2.3.3). Check: survey Q8 and SR5, can Priya judge how much to trust the number? Traces: FR36–FR38, FR57.',
  },
  {
    id: '19',
    name: 'Request R3 – cancelled and refunded',
    row: ROWS[2],
    path: '/requests/R3',
    setup: () => returningWith(),
    note: 'Explains a "cancelled" pill from the Recents list. Check: is it clear the refund was automatic and complete, and what to try next? Traces: UC13, UC7 alt 9a, FR23, FR31, FR61, NFR5, NFR7.',
  },
  {
    id: '20',
    name: 'Deposit funds',
    row: ROWS[3],
    path: '/?modal=deposit',
    setup: () => returningWith(),
    note: 'Opens from the Deposit button in the header (VnV task: add funds, UC3). On devnet this button should call the backend to mint test funds; card, bank and crypto options apply after launch. Check: does Priya understand fees and the new balance before confirming? Is "test money" clearly labelled? Traces: UC3, FR55, FR.SA.2.',
  },
  {
    id: '21',
    name: 'Deposit complete',
    row: ROWS[3],
    path: '/?modal=deposit-done&amount=25&proof=3Pq7%E2%80%A6aD2m',
    setup: () => {
      const s = preset('returning')
      return { ...s, deposits: [...s.deposits, { id: 'D2', amount: 25, method: 'card', dateLabel: 'Nov 8, 4:05 PM', ts: new Date(2026, 10, 8, 16, 5).getTime(), proof: '3Pq7…aD2m' }] }
    },
    note: 'Plain-language confirmation after the deposit (NFR7): what was recorded and the new balance, with the available funds in the header already updated. Check: survey Q7, does Priya understand what changed? Does "Back to my request" return her to an unfinished form? Traces: UC3 step 6, FR56, FR57, NFR7.',
  },
  {
    id: '22',
    name: 'Transaction history',
    row: ROWS[3],
    path: '/history',
    setup: () => withR5('held'),
    note: 'Opens from "Transaction history" in the profile menu (VnV task 4: find the payment). Plain descriptions come first; the transaction proof is one click away (SR7, FR57). The failed attempt from screen 16 shows as "not charged". Check: can Priya match the $2.50 to request R5, and tell held from completed payments? Traces: UC15, FR56, FR57, NFR4.',
  },
  {
    id: '23',
    name: 'Log out – payment still confirming',
    row: ROWS[3],
    path: '/?modal=logout',
    setup: () => {
      const s = preset('returning')
      return {
        ...s,
        requests: [
          ...s.requests,
          { id: 'R5', taskId: 'T1', amount: 2.5, createdAt: NOV8_412, dateLabel: 'Nov 8, 4:12 PM', fixed: 'complete' },
          { id: 'R6', taskId: 'T1', amount: 2.5, createdAt: Date.now(), dateLabel: 'Nov 8, 4:30 PM', confirmMs: 120000 },
        ],
      }
    },
    note: 'Shown when "Log out" is chosen from the profile menu while a transaction is pending (UC2 alt 2a). VnV task 5: sign out. Check: does Priya understand that logging out won’t cancel the payment, and how to get back to it? Traces: UC2, FR56, NFR6.',
  },
]

// Best guess at which Figma frame the current URL corresponds to,
// so the walkthrough panel can show the right note.
export function matchScreen(pathname: string, search: URLSearchParams, signedIn: boolean, ctx: { draftHasUploadError: boolean; draftOverFunds: boolean; reqStatus?: string }): Screen | undefined {
  const modal = search.get('modal')
  const byId = (id: string) => SCREENS.find((s) => s.id === id)
  if (modal === 'signin' || modal === 'own-wallet') return byId('02')
  if (modal === 'code') return byId('03')
  if (modal === 'setup') return byId('04')
  if (modal === 'deposit') return byId('20')
  if (modal === 'deposit-done') return byId('21')
  if (modal === 'logout') return byId('23')
  if (modal === 'confirm') return byId('15')
  if (modal === 'payment-failed') return byId('16')
  if (pathname === '/') return signedIn ? byId('05') : byId('01')
  if (pathname === '/profile') return byId('06')
  if (pathname === '/help') return byId('07')
  if (pathname === '/marketplace') return signedIn ? byId('08b') : byId('08a')
  if (pathname.startsWith('/marketplace/tasks/')) return byId('09')
  if (pathname.startsWith('/marketplace/providers/')) return byId('10')
  if (pathname.startsWith('/tasks/new')) return byId('11')
  if (pathname === '/history') return byId('22')
  if (pathname === '/requests') {
    if (ctx.draftHasUploadError) return byId('13')
    if (ctx.draftOverFunds) return byId('14')
    return byId('12')
  }
  if (pathname.startsWith('/requests/')) {
    if (ctx.reqStatus === 'cancelled') return byId('19')
    if (ctx.reqStatus === 'complete') return byId('18')
    return byId('17')
  }
  return undefined
}
