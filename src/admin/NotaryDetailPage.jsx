import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteNotary, getNotary } from './notariesApi'

export default function NotaryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notary, setNotary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getNotary(id)
      .then(setNotary)
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!window.confirm(`Delete ${notary.businessName}? This cannot be undone.`)) return
    setDeleting(true)
    await deleteNotary(id)
    navigate('/admin')
  }

  if (loading) return <div className="admin-shell">Loading…</div>
  if (!notary) return <div className="admin-shell">Notary not found.</div>

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>{notary.businessName}</h1>
        <div className="admin-shell__actions">
          <Link className="admin-btn" to="/admin">
            ← Back
          </Link>
          <Link className="admin-btn" to={`/admin/notaries/${id}/edit`}>
            Edit
          </Link>
          <button className="admin-btn admin-btn--danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </header>

      <dl className="admin-detail">
        <dt>Status</dt>
        <dd>
          <span className={`admin-status admin-status--${notary.status}`}>{notary.status}</span>
        </dd>

        <dt>Owner</dt>
        <dd>
          {notary.ownerName} — {notary.ownerEmail}
          {notary.ownerPhone ? ` — ${notary.ownerPhone}` : ''}
        </dd>

        <dt>Products</dt>
        <dd>{notary.products?.length === 3 ? 'Bundle (all three)' : notary.products?.join(', ') || '—'}</dd>

        <dt>Reserved subdomain</dt>
        <dd>{notary.subdomainSlug || '—'}</dd>

        <dt>Stripe customer</dt>
        <dd>{notary.stripeCustomerId || 'Not connected yet'}</dd>

        <dt>Notes</dt>
        <dd className="admin-detail__notes">{notary.notes || '—'}</dd>
      </dl>
    </div>
  )
}
