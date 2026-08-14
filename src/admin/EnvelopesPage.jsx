import { useEffect, useState } from 'react'
import { addEnvelopeRecipient, deleteEnvelopeRecipient, listEnvelopeRecipients } from './envelopesApi'
import { downloadBlob, generateEnvelopePdf } from './generateEnvelopePdf'

const ERROR_MESSAGES = {
  duplicate_address: 'That address is already in the list.',
  name_required: 'Enter a name.',
  address_required: 'Enter an address.',
}

export default function EnvelopesPage() {
  const [recipients, setRecipients] = useState(null)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  function load() {
    return listEnvelopeRecipients()
      .then(setRecipients)
      .catch(() => setError('Could not load the list.'))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await addEnvelopeRecipient(name, address)
      setName('')
      setAddress('')
      await load()
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Could not add this recipient.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await deleteEnvelopeRecipient(id)
    await load()
  }

  async function handleGeneratePdf() {
    if (!recipients || recipients.length === 0) return
    setGenerating(true)
    try {
      const blob = await generateEnvelopePdf(recipients)
      downloadBlob(blob, 'envelopes.pdf')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>Envelopes</h1>
        <div className="admin-shell__actions">
          <button
            className="admin-btn admin-btn--primary"
            onClick={handleGeneratePdf}
            disabled={!recipients || recipients.length === 0 || generating}
          >
            {generating ? 'Generating…' : `Generate PDF (${recipients?.length || 0})`}
          </button>
        </div>
      </header>

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
        </div>
        <label>
          Address
          <textarea
            required
            rows={3}
            placeholder={'123 Main St\nLafayette, LA 70508'}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button className="admin-btn admin-btn--primary" type="submit" disabled={saving}>
          {saving ? 'Adding…' : '+ Add to list'}
        </button>
      </form>

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td style={{ whiteSpace: 'pre-line' }}>{r.address}</td>
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
