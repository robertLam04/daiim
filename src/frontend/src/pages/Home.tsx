import { Link, useNavigate } from 'react-router-dom'
import { USER } from '../data'
import { useStore } from '../store'
import { useModal } from '../modals/useModal'

const START_STEPS = [
  ['1 Create an account', 'Make an account associated with your email, phone number, or other.'],
  ['2 Deposit', 'Add funds to your account.'],
  ['3 Pick a task', 'Find one in the Marketplace.'],
  ['4 Submit', 'Upload data and set your payment.'],
  ['5 Get your result', 'Track it in My requests.'],
]

// 01 Home (signed out) and 05 Home (signed in).
export default function Home() {
  const { state } = useStore()
  return state.signedIn ? <SignedInHome /> : <SignedOutHome />
}

function SignedOutHome() {
  return (
    <main className="page center">
      <h1 className="hero-title">Welcome to DAIIM</h1>
      <p className="hero-sub">Your Decentralized Artificial Intelligence Inference Marketplace</p>
      <div className="card" style={{ textAlign: 'left', maxWidth: 650, margin: '0 auto 28px' }}>
        <h3 style={{ color: 'var(--purple)' }}>About</h3>
        <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
          Get one prediction from many independent AI models. DAIIM sends your data to several providers, combines their
          answers into one result, and shows how much they agree, so no single provider controls the outcome.
        </p>
      </div>
      <h3 style={{ marginBottom: 12 }}>How do I get started?</h3>
      <div className="steps">
        {START_STEPS.map(([title, body]) => (
          <div className="step-card" key={title} style={{ maxWidth: 180 }}>
            <strong style={{ color: 'var(--purple)' }}>{title}</strong>
            <span className="tiny muted">{body}</span>
          </div>
        ))}
      </div>
    </main>
  )
}

function SignedInHome() {
  const { state } = useStore()
  const { open } = useModal()
  const navigate = useNavigate()
  const deposited = state.deposits.length > 0
  const submitted = state.requests.length > 0

  // Checklist state follows what the user has actually done.
  const status = (done: boolean, isNext: boolean) => (done ? 'done' : isNext ? 'next' : 'then')
  const items = [
    { title: '1 Create account', s: 'done' },
    { title: '2 Deposit funds', s: status(deposited, true), action: () => open('deposit'), label: 'Deposit' },
    { title: '3 Pick a task', s: status(submitted, deposited), action: () => navigate('/marketplace'), label: 'Marketplace' },
    { title: '4 Submit a request', s: status(submitted, false), action: () => navigate('/requests'), label: 'New request' },
  ]

  return (
    <main className="page center">
      <h1 className="hero-title">Welcome to DAIIM, {USER.firstName}</h1>
      <p className="hero-sub">Your Decentralized Artificial Intelligence Inference Marketplace</p>
      <div className="card" style={{ textAlign: 'left', maxWidth: 610, margin: '0 auto 24px' }}>
        <h3>Your account is ready</h3>
        <p className="muted small" style={{ margin: 0 }}>
          We set up a secure wallet that holds your funds. You don’t need to manage it: DAIIM asks you to approve every payment.
        </p>
      </div>
      <div className="steps">
        {items.map((it) => (
          <div key={it.title} className={`step-card${it.s === 'next' ? ' next' : ''}`}>
            <span className={`label ${it.s}`}>{it.s === 'done' ? '✓ Done' : it.s === 'next' ? 'Next' : 'Then'}</span>
            <strong>{it.title}</strong>
            {it.s === 'next' && it.action && (
              <button className="btn primary" style={{ marginTop: 8 }} onClick={it.action}>{it.label}</button>
            )}
          </div>
        ))}
      </div>
      {submitted && (
        <p className="small" style={{ marginTop: 24 }}>
          <Link to="/requests">Go to My requests →</Link>
        </p>
      )}
    </main>
  )
}
