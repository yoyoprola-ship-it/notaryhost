import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUser } from './usersApi'
import { listNotaries } from './notariesApi'

const ERROR_MESSAGES = {
  missing_fields: 'Fill in all fields.',
  notary_not_found: 'That notary no longer exists.',
  notary_already_has_owner: 'That notary already has an owner account.',
  phone_already_exists: 'That phone number is already registered to another account.',
  email_already_exists: 'That email is already registered to another account.',
  invalid_phone_number: 'Enter a valid phone number, e.g. +13375551234.',
  invalid_email: 'Enter a valid email address.',
}

export default function UserFormPage() {
  const navigate = useNavigate()
  const [notaries, setNotaries] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [notaryId, setNotaryId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listNotaries()
      .then((all) => setNotaries(all.filter((n) => !n.ownerUid)))
      .catch(() => setError('Could not load notaries.'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createUser({ displayName, phoneNumber, email, notaryId })
      navigate('/admin/users')
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Add user</h1>
        <Link className="admin-btn" to="/admin/users">
          Cancel
        </Link>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label>
          Phone number
          <input
            type="tel"
            placeholder="+13375551234"
            required
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            placeholder="owner@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Notary
          <select required value={notaryId} onChange={(e) => setNotaryId(e.target.value)}>
            <option value="" disabled>
              Select a notary…
            </option>
            {notaries?.map((n) => (
              <option key={n.id} value={n.id}>
                {n.businessName}
              </option>
            ))}
          </select>
        </label>

        {notaries && notaries.length === 0 && (
          <p className="admin-muted">
            Every notary already has an owner account. Add a new notary first.
          </p>
        )}

        {error && <p className="admin-error">{error}</p>}

        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={saving || !notaries?.length}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
