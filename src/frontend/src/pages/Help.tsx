import { useState } from 'react'

const FAQ = [
  ['What are held funds and available funds?', 'Available funds can be spent. Held funds are set aside for requests in progress; they go to providers when your result is ready, or come back to you if a request is cancelled.'],
  ['What happens if my request is cancelled?', 'If not enough providers join or answer in time, DAIIM cancels the request automatically. Your full payment returns to your available funds and your uploaded data is deleted. You can try again with a higher amount, or choose another task.'],
  ['How is the result calculated, and how much should I trust it?', 'Several independent providers each make a prediction. DAIIM combines them into one result, giving more weight to providers with a strong track record. The lowest and highest predictions show how much they agreed: a narrow range means strong agreement. Combined forecasts can still be wrong, so check the result before acting on it.'],
  ['Who can see the data I upload?', 'Only the providers who accept your request can read your data, and it is deleted after your request finishes. Payments and results are recorded publicly, but your data is not.'],
  ['What am I paying for?', 'Your payment goes to the providers who answer your request. It is held until your result is ready, and returned if the request is cancelled. There is no network fee during the test.'],
]

const STEPS = [
  ['1 Deposit', 'Add funds to your account.'],
  ['2 Pick a task', 'Find one in the Marketplace.'],
  ['3 Submit', 'Upload data and set your payment.'],
  ['4 Get your result', 'Track it in My requests.'],
]

// 07 Help.
export default function Help() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)
  return (
    <main className="page" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 24, marginBottom: 14 }}>How do I get started?</h1>
      <div className="row wrap" style={{ gap: 12, marginBottom: 32 }}>
        {STEPS.map(([t, b]) => (
          <div className="step-card" key={t}>
            <strong style={{ color: 'var(--purple)' }}>{t}</strong>
            <span className="tiny muted">{b}</span>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Common questions</h2>
      {FAQ.map(([q, a], i) => (
        <div key={q} className="card" style={{ marginBottom: 8, padding: '12px 16px' }}>
          <button className="linklike" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 600, textAlign: 'left' }} onClick={() => setOpenIdx(openIdx === i ? null : i)} aria-expanded={openIdx === i}>
            {openIdx === i ? '▾' : '▸'} {q}
          </button>
          {openIdx === i && <p className="small muted" style={{ margin: '8px 0 0 18px', lineHeight: 1.55 }}>{a}</p>}
        </div>
      ))}
    </main>
  )
}
