import { useEffect, useMemo, useState } from 'react'
import {
  addEnvelopeRecipient,
  deleteEnvelopeRecipient,
  getCurrentPromotion,
  listEnvelopeRecipients,
  markPromotionSent,
  setEnvelopeRecipientLanguage,
  startNextPromotion,
} from './envelopesApi'
import { downloadBlob, generateEnvelopePdf } from './generateEnvelopePdf'

const ERROR_MESSAGES = {
  duplicate_address: 'That address is already in the list.',
  name_required: 'Enter a name.',
  address_required: 'Enter an address.',
}

const PAGE_SIZE = 20

export default function EnvelopesPage() {
  const [recipients, setRecipients] = useState(null)
  const [promotion, setPromotion] = useState(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [language, setLanguage] = useState('en')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatingId, setGeneratingId] = useState(null)
  const [settingLanguageId, setSettingLanguageId] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [advancing, setAdvancing] = useState(false)
  // ids included in a generated PDF (bulk or single), awaiting "confirm sent"
  const [pendingIds, setPendingIds] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

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

  useEffect(() => {
    setPage(1)
  }, [search])

  const eligible = recipients && promotion != null
    ? recipients.filter((r) => !r.promotionsSent?.includes(promotion))
    : []
  const alreadySent = recipients && promotion != null
    ? recipients.filter((r) => r.promotionsSent?.includes(promotion))
    : []

  const filtered = useMemo(() => {
    if (!recipients) return []
    const q = search.trim().toLowerCase()
    if (!q) return recipients
    return recipients.filter(
      (r) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q)
    )
  }, [recipients, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function mergePending(ids) {
    setPendingIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addEnvelopeRecipient(name, address, language)
      setName('')
      setAddress('')
      setLanguage('en')
      await load()
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Could not add this recipient.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await deleteEnvelopeRecipient(id)
    setPendingIds((prev) => prev.filter((pid) => pid !== id))
    await load()
  }

  async function handleGeneratePdf() {
    if (eligible.length === 0) return
    setGenerating(true)
    try {
      const blob = await generateEnvelopePdf(eligible)
      downloadBlob(blob, `envelopes-promo-${promotion}.pdf`)
      mergePending(eligible.map((r) => r.id))
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateOne(r) {
    setGeneratingId(r.id)
    try {
      const blob = await generateEnvelopePdf([r])
      const safeName = r.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      downloadBlob(blob, `envelope-${safeName}-promo-${promotion}.pdf`)
      mergePending([r.id])
    } finally {
      setGeneratingId(null)
    }
  }

  async function handleSetLanguage(id, language) {
    setSettingLanguageId(id)
    try {
      await setEnvelopeRecipientLanguage(id, language)
      setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, language } : r)))
    } finally {
      setSettingLanguageId(null)
    }
  }

  async function handleConfirmSent() {
    if (pendingIds.length === 0) return
    setConfirming(true)
    try {
      await markPromotionSent(pendingIds)
      setPendingIds([])
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
      setPendingIds([])
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
          <label>
            Language
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
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
        {pendingIds.length > 0 && (
          <button className="admin-btn" onClick={handleConfirmSent} disabled={confirming}>
            {confirming ? 'Confirming…' : `Confirm ${pendingIds.length} went out OK`}
          </button>
        )}
      </div>

      <h2 className="admin-section-title">Recipients</h2>

      <input
        type="search"
        placeholder="Search by name or address…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
      />

      {!recipients && <p className="admin-muted">Loading…</p>}
      {recipients && recipients.length === 0 && (
        <p className="admin-muted">No recipients yet — add your first one above.</p>
      )}
      {recipients && recipients.length > 0 && filtered.length === 0 && (
        <p className="admin-muted">No recipients match "{search}".</p>
      )}

      {totalPages > 1 && (
        <nav className="admin-tabs">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const start = (p - 1) * PAGE_SIZE + 1
            const end = Math.min(p * PAGE_SIZE, filtered.length)
            return (
              <button
                key={p}
                className={`admin-tabs__link${p === page ? ' admin-tabs__link--active' : ''}`}
                onClick={() => setPage(p)}
              >
                {start}–{end}
              </button>
            )
          })}
        </nav>
      )}

      {pageItems.length > 0 && (
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
            {pageItems.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.address}</td>
                <td>
                  {r.promotionsSent && r.promotionsSent.length > 0
                    ? r.promotionsSent.slice().sort((a, b) => a - b).join(', ')
                    : <span className="admin-muted">—</span>}
                </td>
                <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={r.language || 'en'}
                    onChange={(e) => handleSetLanguage(r.id, e.target.value)}
                    disabled={settingLanguageId === r.id}
                    title="Language"
                    style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                  <a
                    className="admin-btn"
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Map
                  </a>
                  <button
                    className="admin-btn"
                    onClick={() => handleGenerateOne(r)}
                    disabled={generatingId === r.id}
                  >
                    {generatingId === r.id ? 'Generating…' : 'Generate PDF'}
                  </button>
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
