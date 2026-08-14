import { useEffect, useState } from 'react'
import {
  addEnvelopeRecipient,
  deleteEnvelopeRecipient,
  getCurrentPromotion,
  listEnvelopeRecipients,
  markPromotionSent,
  startNextPromotion,
} from './envelopesApi'
import { downloadBlob, generateEnvelopePdf } from './generateEnvelopePdf'

const ERROR_MESSAGES = {
  duplicate_address: 'That address is already in the list.',
  name_required: 'Enter a name.',
  address_required: 'Enter an address.',
}

export default function EnvelopesPage() {
  const [recipients, setRecipients] = useState(null)
  const [promotion, setPromotion] = useState(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  // ids included in the PDF last generated, awaiting "confirm sent"
  const [pendingIds, setPendingIds] = useState(null)

  function load() {
    return Promise.all([listEnvelopeRecipients(), getCurrentPromotion()])
      .then(([r, p]) => {
        setRecipients(r)
        setPromotion(p.promotion)
      })
      .catch(() => setError('Could not load the list.'))
  }

  useEffect(() => {
    load()
  }, [])

  const eligible = recipients && promotion != null
    ? recipients.filter((r) => !r.promotionsSent?.includes(promotion))
    : []
  const alreadySent = recipients && promotion != null
    ? recipients.filter((r) => r.promotionsSent?.includes(promotion))
    : []

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addEnvelopeRecipient(name, address)
      setName('')
      setAddress('')
      setPendingIds(null)
      await load()
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Could not add this recipient.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await deleteEnvelopeRecipient(id)
    setPendingIds(null)
    await load()
  }

  async function handleGeneratePdf() {
    if (eligible.length === 0) return
    setGenerating(true)
    try {
      const blob = await generateEnvelopePdf(eligible)
      downloadBlob(blob, `envelopes-promo-${promotion}.pdf`)
      setPendingIds(eligible.map((r) => r.id))
    } finally {
      setGenerating(false)
    }
  }

  async function handleConfirmSent() {
    if (!pendingIds || pendingIds.length === 0) return
    setConfirming(true)
    try {
      await markPromotionSent(pendingIds)
      setPendingIds(null)
      await load()
    } finally {
      setConfirming(false)
    }
  }

  async function handleNextPromotion() {
    if (!window.confirm(`Start promotion #${(promotion || 1) + 1}? Every notary will become eligible again for this new promotion.`)) return
    setAdvancing(true)
    try {
      const res = await startNextPromotion()
      setPromotion(res.promotion)
      setPendingIds(null)
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Envelopes</h1>
        <div className="admin-shell__actions">
          <button className="admin-btn" onClick={handleNextPromotion} disabled={advancing || promotion == null}>
            {advancing ? 'Starting…' : `Start promotion #${(promotion || 1) + 1}`}
          </button>
        </div>
      </header>

      {promotion != null && (
        <p className="admin-muted" style={{ marginBottom: 20 }}>
          Current promotion: <strong>#{promotion}</strong> — {eligible.length} not sent yet, {alreadySent.length} already sent.
        </p>
      )}

      <form className="admin-form" onSubmit={handleAdd}>
        <div className="admin-form__row">
          <label>
            Notary name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Address
            <input
              required
              placeholder="123 Main St, Lafayette, LA 70508"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
        </div>
        {error && <p className="admin-error">{error}</p>}
        <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : '+ Add to list'}
        </button>
      </form>

      <div className="admin-shell__actions" style={{ margin: '24px 0' }}>
        <button
          className="admin-btn admin-btn--primary"
          onClick={handleGeneratePdf}
          disabled={eligible.length === 0 || generating}
        >
          {generating ? 'Generating…' : `Generate PDF for promotion #${promotion} (${eligible.length})`}
        </button>
        {pendingIds && pendingIds.length > 0 && (
          <button className="admin-btn" onClick={handleConfirmSent} disabled={confirming}>
            {confirming ? 'Confirming…' : `Confirm ${pendingIds.length} went out OK`}
          </button>
        )}
      </div>

      <h2 className="admin-section-title">Recipients</h2>

      {!recipients && <p className="admin-muted">Loading…</p>}
      {recipients && recipients.length === 0 && (
        <p className="admin-muted">No recipients yet — add your first one above.</p>
      )}

      {recipients && recipients.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Promotions sent</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.address}</td>
                <td>
                  {r.promotionsSent && r.promotionsSent.length > 0
                    ? r.promotionsSent.slice().sort((a, b) => a - b).join(', ')
                    : <span className="admin-muted">—</span>}
                </td>
                <td>
                  <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(r.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
