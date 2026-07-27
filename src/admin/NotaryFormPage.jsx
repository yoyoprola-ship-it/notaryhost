import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { PRODUCT_OPTIONS, STATUS_OPTIONS, createNotary, getNotary, updateNotary } from './notariesApi'
import PhotoCropper from './PhotoCropper'

const MAX_PHOTO_BYTES = 8 * 1024 * 1024

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
  firstPaymentDate: '',
  location: '',
  photoUrl: '',
  photoCropX: 0.5,
  photoCropY: 0.5,
  photoCropZoom: 1,
}

const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

// US-only service — every phone field is entered as bare 10 digits with a
// fixed "+1" shown next to the input, then stored as E.164 (+1XXXXXXXXXX)
// so it matches what Firebase Auth returns elsewhere (queue signups, SMS
// verification). No one should have to remember to type +1 themselves.
function phoneDigits(v) {
  return (v || '').replace(/\D/g, '').slice(-10)
}
function toE164(digits) {
  return digits.length === 10 ? `+1${digits}` : ''
}

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
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  async function handlePhotoFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError('')

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError('Image is too large (max 8MB).')
      return
    }

    setUploading(true)
    try {
      const path = `notaryPhotos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const storageRef = ref(getStorage(), path)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      setForm((f) => ({ ...f, photoUrl: url, photoCropX: 0.5, photoCropY: 0.5, photoCropZoom: 1 }))
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

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
            <div className="admin-phone-input">
              <span>+1</span>
              <input
                type="tel"
                placeholder="3375551234"
                value={phoneDigits(form.ownerPhone)}
                onChange={(e) => setForm({ ...form, ownerPhone: toE164(phoneDigits(e.target.value)) })}
                maxLength={10}
              />
            </div>
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
            <div className="admin-phone-input">
              <span>+1</span>
              <input
                type="tel"
                placeholder="3375551234 — this notary's own IVR/SMS number"
                value={phoneDigits(form.twilioPhoneNumber)}
                onChange={(e) => setForm({ ...form, twilioPhoneNumber: toE164(phoneDigits(e.target.value)) })}
                maxLength={10}
              />
            </div>
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

        <label>
          First payment date
          <input
            type="date"
            value={form.firstPaymentDate}
            onChange={(e) => setForm({ ...form, firstPaymentDate: e.target.value })}
          />
          <span className="admin-hint">
            Bills recur due on this same day every month. Set automatically the first time a
            bill is marked paid — only set this by hand to correct it.
          </span>
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
              placeholder="Link to a photo, or upload one below"
              value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
            />
          </label>
        </div>

        <label>
          Or upload a photo
          <input type="file" accept="image/*" onChange={handlePhotoFile} disabled={uploading} />
        </label>
        {uploading && <p className="admin-muted">Uploading…</p>}
        {uploadError && <p className="admin-error">{uploadError}</p>}

        {form.photoUrl && (
          <PhotoCropper
            src={form.photoUrl}
            x={form.photoCropX}
            y={form.photoCropY}
            zoom={form.photoCropZoom}
            onChange={({ x, y, zoom }) =>
              setForm({ ...form, photoCropX: x, photoCropY: y, photoCropZoom: zoom })
            }
          />
        )}

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
