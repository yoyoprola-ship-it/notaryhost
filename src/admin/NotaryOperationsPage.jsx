import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNotary } from './notariesApi'
import { getNotaryDashboard } from './notaryDataApi'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

export default function NotaryOperationsPage() {
  const { id } = useParams()
  const [notary, setNotary] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([getNotary(id), getNotaryDashboard(id)])
      .then(([n, d]) => {
        setNotary(n)
        setData(d)
      })
      .catch(() => setError('Could not load this notary\'s operational data.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="admin-shell">Loading…</div>
  if (error) return <div className="admin-shell"><p className="admin-error">{error}</p></div>
  if (!notary) return <div className="admin-shell">Notary not found.</div>

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>{notary.businessName} — Operations</h1>
        <div className="admin-shell__actions">
          <Link className="admin-btn" to={`/admin/notaries/${id}`}>
            ← Back
          </Link>
        </div>
      </header>

      {!data.configured && (
        <p className="admin-muted">
          This notary has no data collection prefix set, so there's no operational backend
          linked yet. Set one in <Link to={`/admin/notaries/${id}/edit`}>Edit</Link> once its
          App Hosting backend exists.
        </p>
      )}

      {data.configured && (
        <>
          <div className="admin-stats">
            <StatCard label="Bookings" value={data.bookings.length} hint="most recent 100" />
            <StatCard label="Consultations" value={data.consultations.length} hint="most recent 50" />
            <StatCard
              label="Pending bills"
              value={data.bills.filter((b) => b.status !== 'paid').length}
              hint={fmtMoney(
                data.bills.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + (b.total || 0), 0)
              )}
            />
          </div>

          <h2 className="admin-section-title">Bookings</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>When</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.bookings.length === 0 && (
                <tr><td colSpan={4} className="admin-muted">No bookings yet.</td></tr>
              )}
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customerName}</td>
                  <td>{b.customerPhone}</td>
                  <td>{b.slotDate} at {b.slotHour}:00</td>
                  <td><span className={`admin-status admin-status--${b.status === 'confirmed' ? 'active' : 'cancelled'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="admin-section-title">Billing</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Bookings</th>
                <th>Minutes</th>
                <th>Total</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.bills.length === 0 && (
                <tr><td colSpan={6} className="admin-muted">No bills yet.</td></tr>
              )}
              {data.bills.map((b) => (
                <tr key={b.id}>
                  <td>{b.label}</td>
                  <td>{b.bookings}</td>
                  <td>{b.minutes}</td>
                  <td>{fmtMoney(b.total)}</td>
                  <td>{b.dueDate}</td>
                  <td><span className={`admin-status admin-status--${b.status === 'paid' ? 'active' : 'onboarding'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="admin-section-title">Voice consultations</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Lang</th>
                <th>Duration</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.consultations.length === 0 && (
                <tr><td colSpan={5} className="admin-muted">No voice consultations yet.</td></tr>
              )}
              {data.consultations.map((c) => (
                <tr key={c.id}>
                  <td>{c.callerPhone}</td>
                  <td>{(c.lang || '').toUpperCase()}</td>
                  <td>{c.duration}s</td>
                  <td>{fmtDate(c.createdAt)}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="admin-section-title">Working hours</h2>
          <details className="admin-raw">
            <summary>{data.hours?.blockedDates?.length ? `${data.hours.blockedDates.length} blocked date(s)` : 'Default hours, no blocked dates'}</summary>
            <pre>{JSON.stringify(data.hours ?? { note: 'using defaults' }, null, 2)}</pre>
          </details>

          <h2 className="admin-section-title">IVR configuration</h2>
          <details className="admin-raw">
            <summary>View raw config</summary>
            <pre>{JSON.stringify(data.ivrConfig ?? { note: 'using defaults' }, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {hint && <p className="admin-muted">{hint}</p>}
    </div>
  )
}
