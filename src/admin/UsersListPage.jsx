import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, deleteUser } from './usersApi'
import { listNotaries } from './notariesApi'
import { ADMIN_EMAIL } from './session'

const ADMIN_ROW = {
  id: 'admin',
  role: 'admin',
  displayName: 'Admin',
  contact: ADMIN_EMAIL,
  notaryName: '—',
}

export default function UsersListPage() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setRows(null)
    Promise.all([listUsers(), listNotaries()])
      .then(([users, notaries]) => {
        const notaryById = Object.fromEntries(notaries.map((n) => [n.id, n]))
        const userRows = users.map((u) => ({
          id: u.id,
          role: u.role,
          displayName: u.displayName,
          contact: u.phoneNumber,
          notaryName: notaryById[u.notaryId]?.businessName || '—',
        }))
        setRows([ADMIN_ROW, ...userRows])
      })
      .catch(() => setError('Could not load users.'))
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this user? They will no longer be able to sign in.')) return
    setDeletingId(id)
    try {
      await deleteUser(id)
      load()
    } catch {
      setError('Could not delete that user.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Users</h1>
        <div className="admin-shell__actions">
          <Link className="admin-btn admin-btn--primary" to="/admin/users/new">
            + Add user
          </Link>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {!rows && !error && <p className="admin-muted">Loading…</p>}

      {rows && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Notary</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.displayName}</td>
                <td>{row.contact}</td>
                <td>
                  <span className={`admin-status admin-status--${row.role}`}>{row.role}</span>
                </td>
                <td>{row.notaryName}</td>
                <td>
                  {row.role === 'notary_owner' && (
                    <button
                      className="admin-btn admin-btn--danger"
                      onClick={() => handleDelete(row.id)}
                      disabled={deletingId === row.id}
                    >
                      {deletingId === row.id ? 'Removing…' : 'Remove'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
