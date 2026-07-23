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
  status: 'lead',
  notes: '',
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
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await updateNotary(id, form)
        navigate(`/admin/notaries/${id}`)
      } else {
        const newId = await createNotary(form)
        navigate(`/admin/notaries/${newId}`)
      }
    } catch {
      setError('Could not save. Please try again.')
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
            Reserved subdomain
            <input
              placeholder="e.g. smithnotary"
              value={form.subdomainSlug}
              onChange={(e) => setForm({ ...form, subdomainSlug: e.target.value })}
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
