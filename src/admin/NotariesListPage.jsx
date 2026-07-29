import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listNotaries } from './notariesApi'
import { getSiteVisits } from './notaryDataApi'

function SiteVisitsCard() {
  const [visits, setVisits] = useState(null)

  useEffect(() => {
    getSiteVisits().then(setVisits).catch(() => {})
  }, [])

  if (!visits) return null

  return (
    <>
      <h2 className="admin-section-title">notaryhost.com visits</h2>
      <div className="admin-stats">
        <div className="admin-stat-card"><p className="admin-stat-card__label">Today</p><p className="admin-stat-card__value">{visits.today}</p></div>
        <div className="admin-stat-card admin-stat-card--accent"><p className="admin-stat-card__label">Last 7 days</p><p className="admin-stat-card__value">{visits.last7}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Last 30 days</p><p className="admin-stat-card__value">{visits.last30}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Last 90 days</p><p className="admin-stat-card__value">{visits.total}</p></div>
      </div>
    </>
  )
}

export default function NotariesListPage() {
  const [notaries, setNotaries] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listNotaries()
      .then(setNotaries)
      .catch(() => setError('Could not load notaries.'))
  }, [])

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Notaries</h1>
        <div className="admin-shell__actions">
          <Link className="admin-btn admin-btn--primary" to="/admin/notaries/new">
            + Add notary
          </Link>
        </div>
      </header>

      <SiteVisitsCard />

      {error && <p className="admin-error">{error}</p>}

      {!notaries && !error && <p className="admin-muted">Loading…</p>}

      {notaries && notaries.length === 0 && (
        <p className="admin-muted">No notaries yet — add your first one.</p>
      )}

      {notaries && notaries.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Owner</th>
              <th>Products</th>
              <th>Status</th>
              <th>Subdomain</th>
            </tr>
          </thead>
          <tbody>
            {notaries.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link to={`/admin/notaries/${n.id}`}>{n.businessName}</Link>
                </td>
                <td>
                  {n.ownerName}
                  <br />
                  <span className="admin-muted">{n.ownerEmail}</span>
                </td>
                <td>{n.products?.length === 3 ? 'Bundle' : n.products?.join(', ') || '—'}</td>
                <td>
                  <span className={`admin-status admin-status--${n.status}`}>{n.status}</span>
                </td>
                <td>{n.subdomainSlug || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
