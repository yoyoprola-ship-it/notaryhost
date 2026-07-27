import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PRODUCT_OPTIONS, STATUS_OPTIONS, createNotary, getNotary, updateNotary } from './notariesApi'

const emptyForm = {
  businessName: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  products: [],
  subdomainSlug: '',
  description: '',
  status: 'lead',
  notes: '',
  collectionPrefix: '',
  twilioPhoneNumber: '',
  businessAddress: '',
  location: '',
  photoUrl: '',
}

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

const ERROR_MESSAGES = {
  slug_taken: 'That subdomain is already used by another notary.',
}

export default function NotaryFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getNotary(id)
      .then((n) => {
        if (n) setForm({ ...emptyForm, ...n })
      })
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function toggleProduct(value) {
    setForm((f) => ({
      ...f,
      products: f.products.includes(value)
        ? f.products.filter((p) => p !== value)
        : [...f.products, value],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.subdomainSlug && !SLUG_PATTERN.test(form.subdomainSlug)) {
      setError('Subdomain can only use lowercase letters, numbers, and hyphens.')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateNotary(id, form)
        navigate(`/admin/notaries/${id}`)
      } else {
        const newId = await createNotary(form)
        navigate(`/admin/notaries/${newId}`)
      }
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] || 'Could not save. Please try again.')
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-shell">Loading…</div>

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>{isEdit ? 'Edit notary' : 'Add notary'}</h1>
        <Link className="admin-btn" to={isEdit ? `/admin/notaries/${id}` : '/admin'}>
          Cancel
        </Link>
      </header>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Business name
          <input
            required
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          />
        </label>

        <div className="admin-form__row">
          <label>
            Owner name
            <input
              required
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </label>
          <label>
            Owner email
            <input
              type="email"
              required
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
            />
          </label>
          <label>
            Owner phone
            <input
              value={form.ownerPhone}
              onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
            />
          </label>
        </div>

        <fieldset className="admin-form__fieldset">
          <legend>Products</legend>
          {PRODUCT_OPTIONS.map((opt) => (
            <label key={opt.value} className="admin-form__checkbox">
              <input
                type="checkbox"
                checked={form.products.includes(opt.value)}
                onChange={() => toggleProduct(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>

        <div className="admin-form__row">
          <label>
            Subdomain
            <input
              placeholder="e.g. smithnotary"
              value={form.subdomainSlug}
              onChange={(e) => setForm({ ...form, subdomainSlug: e.target.value.toLowerCase() })}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-form__row">
          <label>
            Data collection prefix
            <input
              placeholder="e.g. notarygarcia — only if this notary has its own App Hosting backend"
              value={form.collectionPrefix}
              onChange={(e) => setForm({ ...form, collectionPrefix: e.target.value.toLowerCase() })}
            />
          </label>
          <label>
            Twilio phone number
            <input
              placeholder="+1XXXXXXXXXX — this notary's own IVR/SMS number"
              value={form.twilioPhoneNumber}
              onChange={(e) => setForm({ ...form, twilioPhoneNumber: e.target.value })}
            />
          </label>
        </div>

        <label>
          Business address
          <input
            placeholder="e.g. 100 Eva Dr, Lafayette LA — shown in appointment reminder texts"
            value={form.businessAddress}
            onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
          />
        </label>

        <div className="admin-form__row">
          <label>
            Location (city, state)
            <input
              placeholder="e.g. Lafayette, LA — shown first in the notary directory"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label>
            Photo URL
            <input
              placeholder="Link to a photo of the notary, shown in the directory"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </label>
        </div>

        <label>
          Public description
          <textarea
            rows={3}
            placeholder="Shown on this notary's public subdomain page and in the directory, if a subdomain is set."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <label>
          Notes
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
