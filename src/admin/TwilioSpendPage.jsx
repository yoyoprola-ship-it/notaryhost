import { useEffect, useState } from 'react'
import { getTwilioSpend } from './twilioSpendApi'

function money(n) {
  return `$${(n ?? 0).toFixed(2)}`
}

function TotalsCard({ title, totals }) {
  return (
    <div className="admin-stats">
      <div className="admin-stat-card admin-stat-card--accent">
        <p className="admin-stat-card__label">{title} — total</p>
        <p className="admin-stat-card__value">{money(totals.total)}</p>
      </div>
      <div className="admin-stat-card">
        <p className="admin-stat-card__label">{title} — messages</p>
        <p className="admin-stat-card__value">{money(totals.smsCost)}</p>
      </div>
      <div className="admin-stat-card">
        <p className="admin-stat-card__label">{title} — calls</p>
        <p className="admin-stat-card__value">{money(totals.callCost)}</p>
      </div>
    </div>
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
        Real cost Twilio has billed per notary phone number — summed directly
        from Twilio's own records, not estimated.
      </p>

      {error && <p className="admin-error">{error}</p>}
      {!data && !error && <p className="admin-muted">Loading…</p>}

      {data && (
        <>
          <h2 className="admin-section-title">{data.lastMonthLabel} (last month)</h2>
          <TotalsCard title={data.lastMonthLabel} totals={data.totals.lastMonth} />

          <h2 className="admin-section-title">{data.thisMonthLabel} (current month)</h2>
          <TotalsCard title={data.thisMonthLabel} totals={data.totals.thisMonth} />

          <h2 className="admin-section-title">By notary</h2>

          {data.notaries.length === 0 && (
            <p className="admin-muted">No notary has a Twilio phone number configured yet.</p>
          )}

          {data.notaries.length > 0 && (
            <table className="admin-table">
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
        </>
      )}
    </div>
  )
}
