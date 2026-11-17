import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { money, USER } from '../data'
import { useNow, useStore } from '../store'
import { useModal } from './useModal'

function Overlay({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      {children}
    </div>
  )
}

// ---------- 02 Sign in – choose a method ----------
function SignInModal() {
  const { open, close } = useModal()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const continueEmail = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address, like you@email.com.')
      return
    }
    open('code', { to: email })
  }

  return (
    <Overlay onClose={close}>
      <div className="modal purple center" role="dialog" aria-label="Sign in to DAIIM">
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        <h2 style={{ fontSize: 22 }}>Sign in to DAIIM</h2>
        <p className="small" style={{ margin: '6px 0 16px', opacity: 0.85 }}>New here? This also creates your account.</p>
        <button className="btn block" onClick={() => open('setup', { via: 'google' })}>Continue with Google</button>
        <div style={{ height: 10 }} />
        <button className="btn block" onClick={() => open('code', { to: 'your phone (•••) •••-0142' })}>Continue with phone</button>
        <div className="field" style={{ textAlign: 'left', marginTop: 14 }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && continueEmail()}
          />
          {error && <span className="small" style={{ color: '#ffd2d2' }}>{error}</span>}
        </div>
        <button className="btn ghost block" onClick={continueEmail}>Continue with email</button>
        <p className="tiny" style={{ marginTop: 14 }}>
          <span style={{ textDecoration: 'underline' }}>Secured by MetaMask</span> ·{' '}
          <button className="linklike tiny" onClick={() => open('own-wallet')}>Use my own wallet instead</button>
        </p>
      </div>
    </Overlay>
  )
}

// ---------- Own-wallet path (not in Figma yet) ----------
function OwnWalletModal() {
  const { open, close } = useModal()
  const [wallet, setWallet] = useState<string | null>(null)
  const [rejected, setRejected] = useState(false)

  return (
    <Overlay onClose={close}>
      <div className="modal white" role="dialog" aria-label="Use my own wallet">
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        <p className="kicker">Not in Figma yet · placeholder</p>
        {!wallet ? (
          <>
            <h2 style={{ fontSize: 20, margin: '6px 0 14px' }}>Connect a wallet you already use</h2>
            {['MetaMask', 'Phantom'].map((w) => (
              <button key={w} className="option" onClick={() => { setWallet(w); setRejected(false) }}>
                <span className="avatar" /> <strong>{w}</strong>
              </button>
            ))}
            <button className="linklike small" onClick={() => open('signin')}>← Back to other sign-in options</button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, margin: '6px 0 6px' }}>{wallet} · Signature request</h2>
            <p className="small muted">This happens inside your wallet, not on DAIIM.</p>
            <div className="card small" style={{ margin: '12px 0', background: 'var(--purple-tint)' }}>
              Sign in to DAIIM<br />Nonce: 8f3a91c2<br />
              <span className="muted">Signing is free. No money moves.</span>
            </div>
            {rejected && (
              <div className="banner red small" style={{ marginBottom: 12 }}>
                <strong>Sign-in cancelled.</strong> You rejected the request in your wallet. Try again, or choose another sign-in option.
              </div>
            )}
            <div className="row">
              <button className="btn primary" onClick={() => open('setup', { via: 'wallet' })}>Approve</button>
              <button className="btn" onClick={() => setRejected(true)}>Reject</button>
            </div>
          </>
        )}
      </div>
    </Overlay>
  )
}

// ---------- 03 Sign in – enter code ----------
function CodeModal() {
  const { params, open, close } = useModal()
  const to = params.get('to') || USER.email
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(false)
  const [resent, setResent] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length > 1) {
      // Pasted a whole code.
      const next = d.slice(0, 6).split('')
      setDigits([...next, ...Array(6 - next.length).fill('')])
      refs.current[Math.min(next.length, 5)]?.focus()
    } else {
      const next = [...digits]
      next[i] = d
      setDigits(next)
      if (d && i < 5) refs.current[i + 1]?.focus()
    }
    setError(false)
  }

  const code = digits.join('')
  const verify = () => {
    if (code === '000000') {
      setError(true)
      return
    }
    open('setup', { via: to.includes('@') ? 'email' : 'phone' })
  }

  return (
    <Overlay>
      <div className="modal purple center" role="dialog" aria-label="Enter your code">
        <h2 style={{ fontSize: 22 }}>Enter your code</h2>
        <p className="small" style={{ marginTop: 8, opacity: 0.85 }}>We sent a 6-digit code to {to}</p>
        <div className="code-boxes">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              value={d}
              inputMode="numeric"
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
                if (e.key === 'Enter' && code.length === 6) verify()
              }}
            />
          ))}
        </div>
        {error && (
          <div className="banner red small" style={{ textAlign: 'left', marginBottom: 12 }}>
            <strong>Wrong code.</strong> That code doesn’t match the one we sent. Check your latest message, or resend the code.
          </div>
        )}
        {resent && !error && <p className="small">A new code is on its way.</p>}
        <button className="btn block" disabled={code.length < 6} onClick={verify}>Verify</button>
        <p className="tiny" style={{ marginTop: 14 }}>
          Didn’t get it? <button className="linklike tiny" onClick={() => { setResent(true); setError(false) }}>Resend code</button> ·{' '}
          <button className="linklike tiny" onClick={close}>Cancel</button>
        </p>
      </div>
    </Overlay>
  )
}

// ---------- 04 Sign in – setting up account ----------
function SetupModal() {
  const { params } = useModal()
  const { signIn } = useStore()
  const navigate = useNavigate()
  const via = params.get('via') || 'email'
  const nextPath = params.get('next')
  const [step, setStep] = useState(0)

  const first = via === 'google' ? 'Google account confirmed' : via === 'phone' ? 'Phone number confirmed' : via === 'wallet' ? 'Wallet connected' : 'Email confirmed'
  const second = via === 'wallet' ? 'Wallet signature verified' : 'Secure wallet created'

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => {
        signIn()
        navigate(nextPath ? decodeURIComponent(nextPath) : '/', { replace: true })
      }, 2800),
    ]
    return () => timers.forEach(clearTimeout)
    // Run once when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const line = (done: boolean, text: string) => (
    <div style={{ opacity: done ? 1 : 0.55 }}>{done ? '✓' : '…'} {text}</div>
  )

  return (
    <Overlay>
      <div className="modal purple" role="dialog" aria-label="Setting up your account">
        <h2 style={{ fontSize: 22, marginBottom: 14 }}>Setting up your account</h2>
        <div style={{ lineHeight: 1.9 }}>
          {line(step >= 1, first)}
          {line(step >= 2, second)}
          {line(false, 'Opening DAIIM')}
        </div>
        <p className="small" style={{ marginTop: 14, opacity: 0.85 }}>
          Your wallet holds your funds. Only you can approve payments from it.
        </p>
      </div>
    </Overlay>
  )
}

// ---------- 20 Deposit funds ----------
function DepositModal() {
  const { open, close } = useModal()
  const { balances, deposit } = useStore()
  const now = useNow()
  const [choice, setChoice] = useState<number | 'other'>(25)
  const [other, setOther] = useState('')
  const [method, setMethod] = useState<'card' | 'crypto'>('card')
  const [busy, setBusy] = useState(false)

  const amount = choice === 'other' ? Number(other) : choice
  const valid = amount > 0 && amount <= 1000
  const { available } = balances(now)

  const submit = () => {
    setBusy(true)
    setTimeout(() => {
      const d = deposit(amount, method)
      open('deposit-done', { amount: String(amount), proof: d.proof })
    }, 1200)
  }

  return (
    <Overlay onClose={close}>
      <div className="modal white" role="dialog" aria-label="Deposit funds" style={{ width: 460 }}>
        <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Deposit funds</h2>
        <div className="small" style={{ marginBottom: 8 }}>Amount (CAD)</div>
        <div className="row" style={{ gap: 8, marginBottom: 14 }}>
          {[10, 25, 50].map((n) => (
            <button key={n} className={`btn${choice === n ? ' primary' : ''}`} onClick={() => setChoice(n)}>${n}</button>
          ))}
          <button className={`btn${choice === 'other' ? ' primary' : ''}`} onClick={() => setChoice('other')}>Other</button>
        </div>
        {choice === 'other' && (
          <div className="field">
            <input className="input" autoFocus inputMode="decimal" placeholder="Amount, e.g. 15.00" value={other} onChange={(e) => setOther(e.target.value)} />
            {other && !valid && <span className="err-text">Enter an amount between $0.01 and $1,000.</span>}
          </div>
        )}
        <div className="small" style={{ marginBottom: 8 }}>Pay with</div>
        <button className={`option${method === 'card' ? ' selected' : ''}`} onClick={() => setMethod('card')}>
          <span>▭</span><span><strong>Credit or debit card</strong><br /><span className="tiny muted">Visa, Mastercard</span></span>
        </button>
        <button className={`option${method === 'crypto' ? ' selected' : ''}`} onClick={() => setMethod('crypto')}>
          <span>⇄</span><span><strong>From another crypto wallet</strong><br /><span className="tiny muted">Show my address and QR code</span></span>
        </button>
        {method === 'crypto' && (
          <div className="card small" style={{ background: 'var(--purple-tint)', marginBottom: 10 }}>
            Send USDC on Solana to <strong>{USER.wallet}</strong>
            <div style={{ width: 84, height: 84, margin: '8px 0', background: 'repeating-conic-gradient(#222 0 25%, #fff 0 50%) 0 0/12px 12px', border: '4px solid #fff', outline: '1px solid var(--line)' }} aria-label="QR code placeholder" />
            <span className="muted tiny">Prototype: click Deposit to simulate the transfer arriving.</span>
          </div>
        )}
        <div className="row small" style={{ justifyContent: 'space-between', margin: '12px 0' }}>
          <span className="muted">Fee $0.00</span>
          <strong>New available funds: {money(available + (valid ? amount : 0))}</strong>
        </div>
        <button className="btn primary block" disabled={!valid || busy} onClick={submit}>
          {busy ? 'Processing…' : `Deposit ${valid ? money(amount) : ''}`}
        </button>
        <p className="tiny" style={{ color: 'var(--orange)', marginTop: 12, textAlign: 'center' }}>
          Test mode on devnet: deposits are practice money with no real value.
        </p>
      </div>
    </Overlay>
  )
}

// ---------- 21 Deposit complete ----------
function DepositDoneModal() {
  const { params, close } = useModal()
  const { state, balances } = useStore()
  const now = useNow()
  const navigate = useNavigate()
  const amount = Number(params.get('amount') || 0)
  const proof = params.get('proof') || ''
  const hasDraft = !!state.draft.taskId

  return (
    <Overlay onClose={close}>
      <div className="modal white" role="dialog" aria-label="Deposit complete">
        <h2 style={{ fontSize: 22, color: 'var(--green)' }}>✓ {money(amount)} deposited</h2>
        <p className="small" style={{ margin: '12px 0' }}>
          Your available funds are now {money(balances(now).available)} CAD. This deposit appears in your transaction history.
        </p>
        <p className="small">Proof of deposit: <a href="#" onClick={(e) => e.preventDefault()}>{proof} ↗</a></p>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={() => (hasDraft ? navigate('/requests') : close())}>
            {hasDraft ? 'Back to my request' : 'Done'}
          </button>
          <button className="btn" onClick={() => navigate('/history')}>View history</button>
        </div>
      </div>
    </Overlay>
  )
}

// ---------- 23 Log out – payment still confirming ----------
function LogoutModal() {
  const { close } = useModal()
  const { hasConfirmingPayment, signOut } = useStore()
  const now = useNow()
  const navigate = useNavigate()
  const pending = hasConfirmingPayment(now)

  return (
    <Overlay onClose={close}>
      <div className="modal white" role="dialog" aria-label="A payment is still confirming" style={{ width: 460 }}>
        <h2 style={{ fontSize: 20 }}>A payment is still confirming</h2>
        <p className="small" style={{ margin: '12px 0' }}>
          {pending
            ? `Your ${money(pending.amount)} payment for ${pending.id} is still being confirmed.`
            : 'Your payment has now been confirmed.'}{' '}
          Logging out won’t cancel it, but you won’t see updates until you log back in.
        </p>
        <p className="small muted">This usually takes under a minute.</p>
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={close}>Stay logged in</button>
          <button className="btn" onClick={() => { signOut(); navigate('/') }}>Log out anyway</button>
        </div>
      </div>
    </Overlay>
  )
}

// ---------- 15 Confirm payment ----------
function ConfirmPaymentModal() {
  const { open, close } = useModal()
  const { state, task, submitRequest } = useStore()
  const navigate = useNavigate()
  const t = task(state.draft.taskId)

  if (!t) {
    // Nothing to confirm (e.g. after a refresh): drop back to the form.
    return null
  }

  const confirm = () => {
    const res = submitRequest()
    if (res.ok) navigate(`/requests/${res.id}?sent=1`)
    else open('payment-failed')
  }

  return (
    <Overlay onClose={close}>
      <div className="modal purple" role="dialog" aria-label="Confirm payment" style={{ width: 480 }}>
        <h2 style={{ fontSize: 19, marginBottom: 14 }}>Please confirm and approve the transfer of funds</h2>
        <div className="modal-box">
          Task: {t.name}<br />
          Payment: {money(Number(state.draft.amount))} CAD<br />
          Estimated delivery: {t.usualDelivery}
        </div>
        <p className="small" style={{ margin: '14px 0', opacity: 0.9 }}>
          Funds will be held until your request is complete. Funds are returned if the request fails.
        </p>
        <div className="row">
          <button className="btn green-outline" style={{ background: '#fff' }} onClick={confirm}>Confirm</button>
          <button className="btn red-outline" style={{ background: '#fff' }} onClick={close}>Cancel</button>
        </div>
      </div>
    </Overlay>
  )
}

// ---------- 16 Payment failed ----------
function PaymentFailedModal() {
  const { close } = useModal()
  const { state, submitRequest } = useStore()
  const navigate = useNavigate()

  const retry = () => {
    const res = submitRequest()
    if (res.ok) navigate(`/requests/${res.id}?sent=1`)
  }

  return (
    <Overlay onClose={close}>
      <div className="modal purple" role="dialog" aria-label="Payment not completed" style={{ width: 480 }}>
        <h2 style={{ fontSize: 20 }}>⚠ Payment not completed</h2>
        <p className="small" style={{ margin: '12px 0' }}>
          The network didn’t confirm your payment in time. No money was taken and your request wasn’t sent.
        </p>
        <p className="small" style={{ opacity: 0.9 }}>Try again. If it keeps happening, wait a minute and retry.</p>
        <div className="row" style={{ margin: '16px 0 10px' }}>
          <button className="btn" onClick={retry} disabled={!state.draft.taskId}>Try again</button>
          <button className="btn ghost" onClick={close}>Back to form</button>
        </div>
        <p className="tiny" style={{ opacity: 0.8 }}>Your task, data and amount are saved. Code: TX-TIMEOUT</p>
      </div>
    </Overlay>
  )
}

export default function ModalHost() {
  const { name } = useModal()
  const { state } = useStore()

  switch (name) {
    case 'signin': return state.signedIn ? null : <SignInModal />
    case 'own-wallet': return <OwnWalletModal />
    case 'code': return <CodeModal />
    case 'setup': return <SetupModal />
    case 'deposit': return state.signedIn ? <DepositModal /> : null
    case 'deposit-done': return state.signedIn ? <DepositDoneModal /> : null
    case 'logout': return state.signedIn ? <LogoutModal /> : null
    case 'confirm': return <ConfirmPaymentModal />
    case 'payment-failed': return <PaymentFailedModal />
    default: return null
  }
}
