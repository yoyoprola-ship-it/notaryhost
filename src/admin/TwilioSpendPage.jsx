import { useEffect, useState } from 'react'
import { getTwilioSpend } from './twilioSpendApi'

function money(n) {
  return `$${(n ?? 0).toFixed(2)}`
}

function TotalsCard({ title, totals, platform, tracked }) {
  return (
    <div className="admin-stats">
      <div className="admin-stat-card admin-stat-card--accent">
        <p className="admin-stat-card__label">{title} — tracked total</p>
        <p className="admin-stat-card__value">{money(tracked)}</p>
      </div>
      <div className="admin-stat-card">
        <p className="admin-stat-card__label">{title} — notaries</p>
        <p className="admin-stat-card__value">{money(totals.total)}</p>
        <p className="admin-muted">{money(totals.smsCost)} messages · {money(totals.callCost)} calls</p>
      </div>
      <div className="admin-stat-card">
        <p className="admin-stat-card__label">{title} — platform (NotaryHost)</p>
        <p className="admin-stat-card__value">{money(platform.total)}</p>
        <p className="admin-muted">{money(platform.smsCost)} messages · {money(platform.callCost)} calls</p>
      </div>
    </div>
  )
}

function UsageTable({ label, usage }) {
  return (
    <>
      <h3 className="admin-phone-subtitle">{label}</h3>
      {usage.length === 0 ? (
        <p className="admin-muted">No usage recorded.</p>
      ) : (
        <table className="admin-table" style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u) => (
              <tr key={u.category}>
                <td>{u.description || u.category}</td>
                <td>{u.count} {u.countUnit}</td>
                <td>{money(u.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}

export default function TwilioSpendPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getTwilioSpend()
      .then(setData)
      .catch(() => setError('Could not load Twilio spend.'))
  }, [])

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Twilio spend</h1>
      </header>

      <p className="admin-muted" style={{ marginBottom: 20 }}>
        Real cost Twilio has billed — summed directly from Twilio's own records
        (per-message/per-call price, current balance, and their own usage
        categories), not estimated. Twilio doesn't expose real credit-card
        charge history over the API — that's Console-only, under Billing →
        Payment History.
      </p>

      {error && <p className="admin-error">{error}</p>}
      {!data && !error && <p className="admin-muted">Loading…</p>}

      {data && (
        <>
          {data.balance && (
            <div className="admin-stats" style={{ marginBottom: 8 }}>
              <div className="admin-stat-card">
                <p className="admin-stat-card__label">Twilio account balance (live)</p>
                <p className="admin-stat-card__value">${data.balance.balance.toFixed(2)} {data.balance.currency}</p>
              </div>
            </div>
          )}

          <h2 className="admin-section-title">{data.lastMonthLabel} (last month)</h2>
          <TotalsCard
            title={data.lastMonthLabel}
            totals={data.totals.lastMonth}
            platform={data.platformSpend.lastMonth}
            tracked={data.trackedTotal.lastMonth}
          />

          <h2 className="admin-section-title">{data.thisMonthLabel} (current month)</h2>
          <TotalsCard
            title={data.thisMonthLabel}
            totals={data.totals.thisMonth}
            platform={data.platformSpend.thisMonth}
            tracked={data.trackedTotal.thisMonth}
          />

          <h2 className="admin-section-title">By notary</h2>

          {data.notaries.length === 0 && (
            <p className="admin-muted">No notary has a Twilio phone number configured yet.</p>
          )}

          {data.notaries.length > 0 && (
            <table className="admin-table" style={{ marginBottom: 24 }}>
              <thead>
                <tr>
                  <th>Notary</th>
                  <th>Phone number</th>
                  <th>{data.lastMonthLabel} — messages</th>
                  <th>{data.lastMonthLabel} — calls</th>
                  <th>{data.lastMonthLabel} — total</th>
                  <th>{data.thisMonthLabel} — messages</th>
                  <th>{data.thisMonthLabel} — calls</th>
                  <th>{data.thisMonthLabel} — total</th>
                </tr>
              </thead>
              <tbody>
                {data.notaries.map((n) => (
                  <tr key={n.notaryId}>
                    <td>{n.businessName}</td>
                    <td>{n.phoneNumber}</td>
                    <td>
                      {money(n.lastMonth.smsCost)}
                      <br />
                      <span className="admin-muted">{n.lastMonth.smsCount} msgs</span>
                    </td>
                    <td>
                      {money(n.lastMonth.callCost)}
                      <br />
                      <span className="admin-muted">
                        {n.lastMonth.callCount} calls · {n.lastMonth.callMinutes} min
                      </span>
                    </td>
                    <td>
                      <strong>{money(n.lastMonth.total)}</strong>
                    </td>
                    <td>
                      {money(n.thisMonth.smsCost)}
                      <br />
                      <span className="admin-muted">{n.thisMonth.smsCount} msgs</span>
                    </td>
                    <td>
                      {money(n.thisMonth.callCost)}
                      <br />
                      <span className="admin-muted">
                        {n.thisMonth.callCount} calls · {n.thisMonth.callMinutes} min
                      </span>
                    </td>
                    <td>
                      <strong>{money(n.thisMonth.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="admin-phone-header">
            <h2 className="admin-section-title" style={{ margin: 0 }}>Why — Twilio's own category breakdown</h2>
          </div>
          <p className="admin-muted" style={{ marginBottom: 12 }}>
            Straight from Twilio's Usage Records, account-wide (both numbers combined) — for context, not summed into the totals above.
          </p>
          <UsageTable label={data.lastMonthLabel} usage={data.usage.lastMonth} />
          <UsageTable label={data.thisMonthLabel} usage={data.usage.thisMonth} />
        </>
      )}
    </div>
  )
}
