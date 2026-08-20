import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getNotary } from './notariesApi'
import {
  cancelBooking,
  getNotaryDashboard,
  getNotaryPhoneLog,
  markBillPaid,
  saveHours,
  saveIvrConfig,
  sendNotaryPhoneReply,
} from './notaryDataApi'

const DAYS = [
  { dow: 0, label: 'Sunday' },
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
  { dow: 6, label: 'Saturday' },
]

const ALL_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

const TABS = [
  ['overview', 'Overview'],
  ['bookings', 'Bookings'],
  ['billing', 'Billing'],
  ['consultations', 'Consultations'],
  ['phone', 'Phone'],
  ['visits', 'Visits'],
  ['hours', 'Hours'],
  ['ivr', 'IVR script'],
]

const POLLY_VOICES = {
  en: [
    ['Polly.Joanna', 'Joanna — Female (US English)'],
    ['Polly.Matthew', 'Matthew — Male (US English)'],
    ['Polly.Ivy', 'Ivy — Female, child (US English)'],
    ['Polly.Justin', 'Justin — Male, child (US English)'],
    ['Polly.Kendra', 'Kendra — Female (US English)'],
    ['Polly.Kimberly', 'Kimberly — Female (US English)'],
    ['Polly.Salli', 'Salli — Female (US English)'],
    ['Polly.Joey', 'Joey — Male (US English)'],
  ],
  es: [
    ['Polly.Miguel', 'Miguel — Male (US Spanish)'],
    ['Polly.Mia', 'Mia — Female (Mexican Spanish)'],
    ['Polly.Conchita', 'Conchita — Female (Castilian Spanish)'],
    ['Polly.Enrique', 'Enrique — Male (Castilian Spanish)'],
    ['Polly.Lucia', 'Lucia — Female (Castilian Spanish)'],
  ],
}

const IVR_FIELDS = [
  ['intro', 'Intro greeting'],
  ['langPrompt', 'Language prompt'],
  ['menu', 'Main menu'],
  ['bookConfirm', 'Booking confirmation'],
  ['bookBye', 'Booking goodbye'],
  ['consultPrompt', 'Voice consultation prompt'],
  ['consultNoRec', 'No recording received'],
  ['consultBye', 'Consultation goodbye'],
  ['directPrompt', 'Direct-call connecting'],
  ['directBusy', 'Direct-call unavailable'],
  ['retry', "Didn't understand selection"],
]

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function fmtMoney(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

export default function NotaryOperationsPage() {
  const { id } = useParams()
  const [notary, setNotary] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  function load() {
    setError('')
    return Promise.all([getNotary(id), getNotaryDashboard(id)])
      .then(([n, d]) => {
        setNotary(n)
        setData(d)
      })
      .catch(() => setError("Could not load this notary's operational data."))
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="admin-shell">Loading…</div>
  if (error) return <div className="admin-shell"><p className="admin-error">{error}</p></div>
  if (!notary) return <div className="admin-shell">Notary not found.</div>

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>{notary.businessName} — Operations</h1>
        <div className="admin-shell__actions">
          <Link className="admin-btn" to={`/admin/notaries/${id}`}>
            ← Back
          </Link>
        </div>
      </header>

      {!data.configured && (
        <p className="admin-muted">
          This notary has no data collection prefix set, so there's no operational backend
          linked yet. Set one in <Link to={`/admin/notaries/${id}/edit`}>Edit</Link> once its
          App Hosting backend exists.
        </p>
      )}

      {data.configured && (
        <>
          <nav className="admin-tabs">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                className={`admin-tabs__link${tab === key ? ' admin-tabs__link--active' : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === 'overview' && <MonthlyStats stats={data.stats} />}
          {tab === 'bookings' && <BookingsSection notaryId={id} bookings={data.bookings} onChange={load} />}
          {tab === 'billing' && <BillingSection notaryId={id} bills={data.bills} onChange={load} />}
          {tab === 'consultations' && <ConsultationsSection consultations={data.consultations} />}
          {tab === 'phone' && <PhoneSection notaryId={id} />}
          {tab === 'visits' && <VisitsSection visits={data.visits} />}
          {tab === 'hours' && <HoursSection notaryId={id} hours={data.hours} />}
          {tab === 'ivr' && <IvrSection notaryId={id} ivrConfig={data.ivrConfig} />}
        </>
      )}
    </div>
  )
}

function MonthlyStats({ stats }) {
  return (
    <>
      <h2 className="admin-section-title">Monthly activity</h2>
      <div className="admin-stats">
        <MonthCard m={stats.current} accent />
        <MonthCard m={stats.previous} />
      </div>
      <div className="admin-stats">
        <RevenueCard m={stats.current} accent />
        <RevenueCard m={stats.previous} />
      </div>
    </>
  )
}

function MonthCard({ m, accent }) {
  return (
    <div className={`admin-stat-card${accent ? ' admin-stat-card--accent' : ''}`}>
      <p className="admin-stat-card__label">{m.label}</p>
      <div className="admin-stat-card__grid">
        <div><span className="admin-stat-card__value">{m.bookings}</span><span className="admin-muted"> bookings</span></div>
        <div><span className="admin-stat-card__value">{m.calls}</span><span className="admin-muted"> calls</span></div>
        <div><span className="admin-stat-card__value">{m.consults}</span><span className="admin-muted"> consults</span></div>
        <div><span className="admin-stat-card__value">{m.minutes}</span><span className="admin-muted"> min</span></div>
      </div>
    </div>
  )
}

function RevenueCard({ m, accent }) {
  return (
    <div className={`admin-stat-card${accent ? ' admin-stat-card--accent' : ''}`}>
      <p className="admin-stat-card__label">{m.label} — Revenue</p>
      <p className="admin-muted">Base plan: {fmtMoney(m.baseFee)}</p>
      <p className="admin-muted">
        Bookings: {m.bookings} used
        {m.includedBookings > 0 ? ` (${m.includedBookings} included)` : ''}
        {m.extraBookings > 0 ? ` · ${m.extraBookings} extra × $0.52 = ${fmtMoney(m.bookingFee)}` : ''}
      </p>
      <p className="admin-muted">
        Minutes: {m.minutes} used
        {m.includedMinutes > 0 ? ` (${m.includedMinutes} included)` : ''}
        {m.extraMinutes > 0 ? ` · ${m.extraMinutes} extra × $0.59 = ${fmtMoney(m.minutesFee)}` : ''}
      </p>
      <p className="admin-stat-card__value">{fmtMoney(m.total)}</p>
    </div>
  )
}

function BookingsSection({ notaryId, bookings, onChange }) {
  const [busyId, setBusyId] = useState(null)

  async function handleCancel(b) {
    if (!window.confirm(`Cancel appointment for ${b.customerName} on ${b.slotDate}?`)) return
    setBusyId(b.id)
    try {
      await cancelBooking(notaryId, b.id)
      await onChange()
    } catch {
      window.alert('Could not cancel this booking.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <h2 className="admin-section-title">Bookings</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>When</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 && (
            <tr><td colSpan={5} className="admin-muted">No bookings yet.</td></tr>
          )}
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.customerName}</td>
              <td>{b.customerPhone}</td>
              <td>{b.slotDate} at {b.slotHour}:00</td>
              <td><span className={`admin-status admin-status--${b.status === 'confirmed' ? 'active' : 'cancelled'}`}>{b.status}</span></td>
              <td>
                {b.status === 'confirmed' && (
                  <button
                    className="admin-btn admin-btn--danger"
                    onClick={() => handleCancel(b)}
                    disabled={busyId === b.id}
                  >
                    {busyId === b.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function BillingSection({ notaryId, bills, onChange }) {
  const [busyPeriod, setBusyPeriod] = useState(null)

  async function handleMarkPaid(period) {
    setBusyPeriod(period)
    try {
      await markBillPaid(notaryId, period)
      await onChange()
    } catch {
      window.alert('Could not mark this bill as paid.')
    } finally {
      setBusyPeriod(null)
    }
  }

  const grandTotal = bills.reduce((s, b) => s + (b.total || 0), 0)
  const paidTotal = bills.filter((b) => b.status === 'paid').reduce((s, b) => s + (b.total || 0), 0)
  const pendingTotal = grandTotal - paidTotal

  return (
    <>
      <h2 className="admin-section-title">Billing</h2>
      <div className="admin-stats">
        <div className="admin-stat-card"><p className="admin-stat-card__label">All-time</p><p className="admin-stat-card__value">{fmtMoney(grandTotal)}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Paid</p><p className="admin-stat-card__value">{fmtMoney(paidTotal)}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Pending</p><p className="admin-stat-card__value">{fmtMoney(pendingTotal)}</p></div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Base plan</th>
            <th>Bookings</th>
            <th>Minutes</th>
            <th>Total</th>
            <th>Due</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bills.length === 0 && (
            <tr><td colSpan={8} className="admin-muted">No bills yet.</td></tr>
          )}
          {bills.map((b) => (
            <tr key={b.id}>
              <td>{b.label}</td>
              <td>{fmtMoney(b.baseFee)}</td>
              <td>
                {b.bookings}{b.includedBookings > 0 ? ` / ${b.includedBookings}` : ''}
                {b.extraBookings > 0 && (
                  <span className="admin-muted"> (+{b.extraBookings} = {fmtMoney(b.bookingFee)})</span>
                )}
              </td>
              <td>
                {b.minutes}{b.includedMinutes > 0 ? ` / ${b.includedMinutes}` : ''}
                {b.extraMinutes > 0 && (
                  <span className="admin-muted"> (+{b.extraMinutes} = {fmtMoney(b.minutesFee)})</span>
                )}
              </td>
              <td>{fmtMoney(b.total)}</td>
              <td>{b.dueDate}</td>
              <td><span className={`admin-status admin-status--${b.status === 'paid' ? 'active' : 'onboarding'}`}>{b.status}</span></td>
              <td>
                {b.status !== 'paid' && (
                  <button
                    className="admin-btn"
                    onClick={() => handleMarkPaid(b.period)}
                    disabled={busyPeriod === b.period}
                  >
                    {busyPeriod === b.period ? '…' : 'Mark paid'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function ConsultationsSection({ consultations }) {
  return (
    <>
      <h2 className="admin-section-title">Voice consultations</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Caller</th>
            <th>Lang</th>
            <th>Duration</th>
            <th>Received</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {consultations.length === 0 && (
            <tr><td colSpan={5} className="admin-muted">No voice consultations yet.</td></tr>
          )}
          {consultations.map((c) => (
            <tr key={c.id}>
              <td>{c.callerPhone}</td>
              <td>{(c.lang || '').toUpperCase()}</td>
              <td>{c.duration}s</td>
              <td>{fmtDate(c.createdAt)}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function formatPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(-10)
  if (d.length !== 10) return raw || '—'
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

function formatDuration(s) {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function PhoneSection({ notaryId }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  function load() {
    setError('')
    return getNotaryPhoneLog(notaryId)
      .then(setData)
      .catch(() => setError('Could not load calls and messages.'))
  }

  useEffect(() => {
    setData(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notaryId])

  return (
    <>
      <div className="admin-phone-header">
        <h2 className="admin-section-title" style={{ margin: 0 }}>Phone</h2>
        {data?.phoneNumber && <span className="admin-muted">{data.phoneNumber} · last 6 months</span>}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!data && !error && <p className="admin-muted">Loading…</p>}

      {data && (
        <>
          <h3 className="admin-phone-subtitle">Messages</h3>
          {data.messageThreads.length === 0 ? (
            <p className="admin-muted">No messages yet.</p>
          ) : (
            <div className="phone-log">
              {data.messageThreads.map((t) => (
                <PhoneThreadRow key={t.phone} t={t} notaryId={notaryId} kind="message" />
              ))}
            </div>
          )}

          <h3 className="admin-phone-subtitle">Calls</h3>
          {data.callThreads.length === 0 ? (
            <p className="admin-muted">No calls yet.</p>
          ) : (
            <div className="phone-log">
              {data.callThreads.map((t) => (
                <PhoneThreadRow key={t.phone} t={t} notaryId={notaryId} kind="call" />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

function previewFor(item, kind) {
  if (kind === 'call') {
    const dir = item.direction === 'inbound' ? 'Inbound' : 'Outbound'
    return `${dir} · ${item.status} · ${formatDuration(item.duration)}`
  }
  return item.body || ''
}

function PhoneThreadRow({ t, notaryId, kind }) {
  const [expanded, setExpanded] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [replyDone, setReplyDone] = useState(false)
  const [replyError, setReplyError] = useState('')

  async function sendReply() {
    if (replying || !replyText.trim()) return
    setReplying(true)
    setReplyError('')
    try {
      await sendNotaryPhoneReply(notaryId, t.phone, replyText.trim())
      setReplyDone(true)
      setReplyText('')
    } catch {
      setReplyError('Could not send this message.')
    } finally {
      setReplying(false)
    }
  }

  const last = t.items[0]

  return (
    <div className={`phone-log__row${expanded ? ' phone-log__row--open' : ''}`}>
      <button className="phone-log__summary" onClick={() => setExpanded((v) => !v)}>
        <span className="phone-log__main">
          <span className="phone-log__line1">
            <span className="phone-log__phone">{formatPhone(t.phone)}</span>
            <span className="admin-muted"> · {t.items.length} {kind === 'call' ? 'call' : 'message'}{t.items.length === 1 ? '' : 's'}</span>
          </span>
          <span className="phone-log__preview">{previewFor(last, kind)}</span>
        </span>
        <span className="phone-log__meta">
          <span className="admin-muted">{fmtDate(t.lastAt)}</span>
          <span className="phone-log__chevron">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>

      {expanded && (
        <div className="phone-log__detail">
          <ul className="phone-log__items">
            {t.items.map((item) => (
              <li key={item.sid}>
                <span className={`phone-log__dir${item.direction === 'inbound' ? ' phone-log__dir--in' : ''}`}>
                  {item.direction === 'inbound' ? '←' : '→'}
                </span>
                <span className="admin-muted">{fmtDate(item.at)}</span>
                <span>{previewFor(item, kind)}</span>
              </li>
            ))}
          </ul>

          <div className="phone-log__actions">
            <a className="admin-btn" href={`tel:${t.phone}`}>Call</a>
            {kind === 'message' && (
              replyDone ? (
                <span style={{ color: 'var(--admin-green)', fontWeight: 700, fontSize: '0.84rem' }}>Sent ✓</span>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Write a message…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    maxLength={320}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendReply() }}
                  />
                  <button className="admin-btn admin-btn--primary" onClick={sendReply} disabled={replying || !replyText.trim()}>
                    {replying ? '…' : 'Send'}
                  </button>
                </>
              )
            )}
          </div>
          {replyError && <p className="admin-error">{replyError}</p>}
        </div>
      )}
    </div>
  )
}

function VisitsSection({ visits }) {
  return (
    <>
      <h2 className="admin-section-title">Website visits</h2>
      <div className="admin-stats">
        <div className="admin-stat-card"><p className="admin-stat-card__label">Today</p><p className="admin-stat-card__value">{visits.today}</p></div>
        <div className="admin-stat-card admin-stat-card--accent"><p className="admin-stat-card__label">Last 7 days</p><p className="admin-stat-card__value">{visits.last7}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Last 30 days</p><p className="admin-stat-card__value">{visits.last30}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-card__label">Last 90 days</p><p className="admin-stat-card__value">{visits.total}</p></div>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Visits</th>
          </tr>
        </thead>
        <tbody>
          {visits.daily.length === 0 && (
            <tr><td colSpan={2} className="admin-muted">No visits recorded yet.</td></tr>
          )}
          {visits.daily.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function HoursSection({ notaryId, hours }) {
  const [config, setConfig] = useState(hours)
  const [blockDate, setBlockDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { setConfig(hours) }, [hours])

  function hoursFor(dow) {
    return config.hoursByDayOfWeek?.[dow] !== undefined
      ? config.hoursByDayOfWeek[dow]
      : ALL_HOURS.slice()
  }

  function toggleHour(dow, h) {
    const current = hoursFor(dow)
    const next = current.includes(h) ? current.filter((x) => x !== h) : [...current, h].sort((a, b) => a - b)
    setConfig({ ...config, hoursByDayOfWeek: { ...(config.hoursByDayOfWeek || {}), [dow]: next } })
    setSaved(false)
  }

  function toggleAll(dow, on) {
    setConfig({ ...config, hoursByDayOfWeek: { ...(config.hoursByDayOfWeek || {}), [dow]: on ? ALL_HOURS.slice() : [] } })
    setSaved(false)
  }

  function addBlockedDate() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(blockDate)) { setErr('Use YYYY-MM-DD format.'); return }
    setErr('')
    const list = config.blockedDates || []
    if (list.includes(blockDate)) return
    setConfig({ ...config, blockedDates: [...list, blockDate].sort() })
    setBlockDate('')
    setSaved(false)
  }

  function removeBlockedDate(d) {
    setConfig({ ...config, blockedDates: (config.blockedDates || []).filter((x) => x !== d) })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await saveHours(notaryId, config)
      setSaved(true)
    } catch {
      setErr('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h2 className="admin-section-title">Working hours</h2>
      {err && <p className="admin-error">{err}</p>}
      <table className="admin-table" style={{ marginBottom: 12 }}>
        <thead>
          <tr>
            <th>Day</th>
            <th colSpan={ALL_HOURS.length}>Hours (click to toggle)</th>
            <th>Bulk</th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const openSet = new Set(hoursFor(day.dow))
            return (
              <tr key={day.dow}>
                <td>{day.label}</td>
                {ALL_HOURS.map((h) => (
                  <td key={h} style={{ textAlign: 'center', padding: '6px 4px' }}>
                    <button
                      className="admin-btn"
                      style={openSet.has(h) ? { background: 'var(--gold-soft)', borderColor: 'var(--gold)' } : undefined}
                      onClick={() => toggleHour(day.dow, h)}
                    >
                      {h}
                    </button>
                  </td>
                ))}
                <td>
                  <button className="admin-btn" onClick={() => toggleAll(day.dow, true)}>All</button>{' '}
                  <button className="admin-btn" onClick={() => toggleAll(day.dow, false)}>Off</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="admin-raw" style={{ marginBottom: 12 }}>
        <p className="admin-stat-card__label" style={{ marginBottom: 10 }}>Blocked dates</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <button className="admin-btn" onClick={addBlockedDate}>+ Block</button>
        </div>
        {(config.blockedDates?.length || 0) === 0 ? (
          <p className="admin-muted">No blocked dates.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {config.blockedDates.map((d) => (
              <button key={d} className="admin-btn admin-btn--danger" onClick={() => removeBlockedDate(d)}>{d} ×</button>
            ))}
          </div>
        )}
      </div>

      <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save hours'}
      </button>
    </>
  )
}

function VoiceSelect({ lang, value, onChange }) {
  const options = POLLY_VOICES[lang]
  const known = options.some(([id]) => id === value)
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {!known && value && <option value={value}>{value} (current)</option>}
      {options.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
  )
}

function IvrSection({ notaryId, ivrConfig }) {
  const [config, setConfig] = useState(ivrConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { setConfig(ivrConfig) }, [ivrConfig])

  function setField(key, lang, value) {
    setConfig({ ...config, [key]: { ...config[key], [lang]: value } })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setErr('')
    try {
      await saveIvrConfig(notaryId, config)
      setSaved(true)
    } catch {
      setErr('Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h2 className="admin-section-title">IVR configuration (voice robot script)</h2>
      {err && <p className="admin-error">{err}</p>}
      <div className="admin-form" style={{ marginBottom: 16 }}>
        <div className="admin-ivr-field">
          <p className="admin-ivr-field__label">Voices (Twilio Polly)</p>
          <div className="admin-form__row">
            <label>
              English
              <VoiceSelect lang="en" value={config.voices?.en || ''} onChange={(v) => setField('voices', 'en', v)} />
            </label>
            <label>
              Español
              <VoiceSelect lang="es" value={config.voices?.es || ''} onChange={(v) => setField('voices', 'es', v)} />
            </label>
          </div>
        </div>

        {IVR_FIELDS.map(([key, label]) => (
          <div key={key} className="admin-ivr-field">
            <p className="admin-ivr-field__label">{label}</p>
            <div className="admin-form__row">
              <label>
                English
                <textarea rows={3} value={config[key]?.en || ''} onChange={(e) => setField(key, 'en', e.target.value)} />
              </label>
              <label>
                Español
                <textarea rows={3} value={config[key]?.es || ''} onChange={(e) => setField(key, 'es', e.target.value)} />
              </label>
            </div>
          </div>
        ))}
      </div>
      <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save IVR script'}
      </button>
    </>
  )
}
