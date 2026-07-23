import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { listNotaries } from './notariesApi'

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
          <button className="admin-btn" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </header>

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
