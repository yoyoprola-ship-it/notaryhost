import { Router } from 'express'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const router = Router()

async function requireAdmin(req, res, next) {
  const authHeader = req.get('authorization') || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return res.status(401).json({ error: 'missing_token' })
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    if (decoded.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'not_admin' })
    }
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}

// Firestore Timestamps don't survive res.json() as anything useful —
// convert any value with a toDate() to an ISO string, recursively.
function serialize(value) {
  if (value === null || value === undefined) return value
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(serialize)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]))
  }
  return value
}

function docsOf(snap) {
  return snap.docs.map((d) => serialize({ id: d.id, ...d.data() }))
}

async function getNotaryConfigOr404(notaryId, res) {
  const snap = await adminDb.doc(`notaries/${notaryId}`).get()
  if (!snap.exists) {
    res.status(404).json({ error: 'notary_not_found' })
    return null
  }
  const { collectionPrefix, twilioPhoneNumber, products, firstPaymentDate } = snap.data()
  if (!collectionPrefix) {
    res.status(409).json({ error: 'not_configured' })
    return null
  }
  return {
    prefix: collectionPrefix,
    twilioPhoneNumber: twilioPhoneNumber || '',
    products: products || [],
    firstPaymentDate: firstPaymentDate || null,
  }
}

// ─── Pricing — must match the plan cards on notaryhost.com and Terms ────
const PRICING = {
  website: { base: 64 },
  booking: { base: 19, included: 40, rate: 0.52 },
  ivr: { base: 25, included: 50, rate: 0.59 },
  bundleAll: 99, // website + booking + ivr together
}

// Computes what a notary actually owes for a period: base subscription
// fee for whichever packages they have (bundle price if they have all
// three), plus overage only for usage beyond each package's included
// allotment. Previously this just multiplied total bookings/minutes by
// the per-unit rate with no base fee and no included allotment at all.
function computeBill(products, bookings, minutes) {
  const has = (p) => products.includes(p)
  const hasAll = has('website') && has('booking') && has('ivr')

  let baseFee = 0
  if (hasAll) {
    baseFee = PRICING.bundleAll
  } else {
    if (has('website')) baseFee += PRICING.website.base
    if (has('booking')) baseFee += PRICING.booking.base
    if (has('ivr')) baseFee += PRICING.ivr.base
  }

  const includedBookings = has('booking') ? PRICING.booking.included : 0
  const extraBookings = has('booking') ? Math.max(0, bookings - includedBookings) : 0
  const bookingFee = parseFloat((extraBookings * PRICING.booking.rate).toFixed(2))

  const includedMinutes = has('ivr') ? PRICING.ivr.included : 0
  const extraMinutes = has('ivr') ? Math.max(0, minutes - includedMinutes) : 0
  const minutesFee = parseFloat((extraMinutes * PRICING.ivr.rate).toFixed(2))

  const total = parseFloat((baseFee + bookingFee + minutesFee).toFixed(2))

  return {
    baseFee, includedBookings, extraBookings, bookingFee,
    includedMinutes, extraMinutes, minutesFee, total,
  }
}

// Every notary clone (e.g. notarygarcia) is its own independent App Hosting
// backend, but shares this Firestore project and this Twilio number, and
// prefixes its own collections with its own slug. All reads/writes below go
// through the Admin SDK, which bypasses security rules entirely — the
// central admin doesn't need per-notary client rules to see or change this.

// ─── Monthly stats + bill autosave (mirrors each clone's own
// /api/admin/stats, so bills keep getting generated even though nobody
// visits a notary's own dashboard anymore) ──────────────────────────────

// Clamps to the last day of the target month so e.g. a billing day of 31
// doesn't roll over into the following month when that month is shorter.
function clampedMonthDate(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  return new Date(year, monthIndex, Math.min(day, lastDay))
}

// billingDay = the day-of-month a notary's first payment was made — bills
// recur due on that same day every month. Defaults to the 5th for notaries
// who haven't made a first payment yet (nothing to anchor to).
function monthBounds(offset, billingDay = 5) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + offset
  const start = Timestamp.fromDate(new Date(y, m, 1))
  const end = Timestamp.fromDate(new Date(y, m + 1, 1))
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(y, m, 1))
  const period = `${y}-${String(m + 1).padStart(2, '0')}`
  const startStr = `${period}-01`
  const endStr = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  const dueD = clampedMonthDate(y, m + 2, billingDay)
  const dueDate = `${dueD.getFullYear()}-${String(dueD.getMonth() + 1).padStart(2, '0')}-${String(dueD.getDate()).padStart(2, '0')}`
  return { start, end, label, period, startStr, endStr, dueDate }
}

function billingDayFor(firstPaymentDate) {
  if (!firstPaymentDate) return 5
  const d = new Date(`${firstPaymentDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? 5 : d.getDate()
}

async function countBetween(col, start, end) {
  const snap = await adminDb.collection(col).where('createdAt', '>=', start).where('createdAt', '<', end).select().get()
  return snap.size
}

async function getTwilioStats(startDate, endDate, rawPhone) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken || !rawPhone) {
    console.warn('[getTwilioStats] missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN or this notary has no twilioPhoneNumber set', {
      hasSid: !!accountSid, hasToken: !!authToken, hasPhone: !!rawPhone,
    })
    return { calls: 0, minutes: 0 }
  }

  const digits = rawPhone.replace(/\D/g, '')
  const phone = digits.length === 10 ? `+1${digits}` : `+${digits}`
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  let totalSeconds = 0
  let totalCalls = 0
  let pageUrl =
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json` +
    `?To=${encodeURIComponent(phone)}&StartTime>=${startDate}&StartTime<=${endDate}&PageSize=100`

  try {
    while (pageUrl) {
      const res = await fetch(pageUrl, { headers: { Authorization: `Basic ${creds}` } })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error('[getTwilioStats] Twilio API error', { status: res.status, body: body.slice(0, 500) })
        break
      }
      const data = await res.json()
      for (const call of data.calls ?? []) {
        if (call.direction === 'inbound') {
          totalCalls++
          totalSeconds += parseInt(call.duration ?? '0', 10)
        }
      }
      pageUrl = data.next_page_uri ? `https://api.twilio.com${data.next_page_uri}` : null
    }
  } catch (err) {
    console.error('[getTwilioStats] fetch failed', err)
    return { calls: 0, minutes: 0 }
  }

  return { calls: totalCalls, minutes: Math.round((totalSeconds / 60) * 10) / 10 }
}

// ─── Phone manager — calls + SMS for one notary's Twilio number, grouped
// by the other party's number ("threads"), plus a reply-by-SMS action ──────

const PHONE_LOOKBACK_DAYS = 180

async function fetchAllTwilioPages(firstUrl, creds) {
  const pages = []
  let pageUrl = firstUrl
  while (pageUrl) {
    const res = await fetch(pageUrl, { headers: { Authorization: `Basic ${creds}` } })
    if (!res.ok) {
      console.error('[phone] Twilio API error', { url: pageUrl, status: res.status })
      break
    }
    const data = await res.json()
    pages.push(data)
    pageUrl = data.next_page_uri ? `https://api.twilio.com${data.next_page_uri}` : null
  }
  return pages
}

// Groups a list of { counterpart, ...item } records into per-number threads,
// each sorted most-recent-first, then sorts the thread list the same way.
function groupByCounterpart(records) {
  const threads = new Map()
  for (const r of records) {
    const key = r.counterpart.replace(/\D/g, '').slice(-10) || r.counterpart
    let t = threads.get(key)
    if (!t) {
      t = { phone: r.counterpart, items: [] }
      threads.set(key, t)
    }
    t.items.push(r.item)
  }
  const out = Array.from(threads.values()).map((t) => {
    t.items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    return { phone: t.phone, items: t.items, lastAt: t.items[0]?.at ?? null }
  })
  out.sort((a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime())
  return out
}

// Always scoped to ONE specific notary's own Twilio number — this account
// has more than one number (e.g. NotaryHost's own build-queue number), and
// mixing them would show a notary calls/texts that aren't theirs.
async function getPhoneLog(rawPhone) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken || !rawPhone) return { messageThreads: [], callThreads: [] }

  const digits = rawPhone.replace(/\D/g, '')
  const phone = digits.length === 10 ? `+1${digits}` : `+${digits}`
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const since = new Date(Date.now() - PHONE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [msgsFrom, msgsTo, callsFrom, callsTo] = await Promise.all([
    fetchAllTwilioPages(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?From=${encodeURIComponent(phone)}&DateSent>=${since}&PageSize=200`, creds),
    fetchAllTwilioPages(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?To=${encodeURIComponent(phone)}&DateSent>=${since}&PageSize=200`, creds),
    fetchAllTwilioPages(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?From=${encodeURIComponent(phone)}&StartTime>=${since}&PageSize=200`, creds),
    fetchAllTwilioPages(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?To=${encodeURIComponent(phone)}&StartTime>=${since}&PageSize=200`, creds),
  ])

  const messageRecords = []
  for (const page of [...msgsFrom, ...msgsTo]) {
    for (const m of page.messages ?? []) {
      messageRecords.push({
        counterpart: m.from === phone ? m.to : m.from,
        item: {
          sid: m.sid,
          direction: m.from === phone ? 'outbound' : 'inbound',
          body: m.body,
          status: m.status,
          at: m.date_sent,
        },
      })
    }
  }

  const callRecords = []
  for (const page of [...callsFrom, ...callsTo]) {
    for (const c of page.calls ?? []) {
      callRecords.push({
        counterpart: c.from === phone ? c.to : c.from,
        item: {
          sid: c.sid,
          direction: c.from === phone ? 'outbound' : 'inbound',
          duration: parseInt(c.duration ?? '0', 10) || 0,
          status: c.status,
          at: c.start_time,
        },
      })
    }
  }

  return {
    messageThreads: groupByCounterpart(messageRecords),
    callThreads: groupByCounterpart(callRecords),
  }
}

router.get('/:notaryId/phone', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const log = await getPhoneLog(cfg.twilioPhoneNumber)
  res.json({ phoneNumber: cfg.twilioPhoneNumber, ...log })
})

router.post('/:notaryId/phone/reply', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const digits = (req.body?.to ?? '').replace(/\D/g, '').slice(-10)
  const message = (req.body?.message ?? '').trim()
  if (digits.length !== 10) return res.status(400).json({ error: 'invalid_phone' })
  if (!message || message.length > 1600) return res.status(400).json({ error: 'invalid_message' })
  if (!accountSid || !authToken || !cfg.twilioPhoneNumber) {
    return res.status(409).json({ error: 'twilio_not_configured' })
  }

  const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const params = new URLSearchParams({ To: `+1${digits}`, From: cfg.twilioPhoneNumber, Body: message })
  const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${creds}`,
    },
    body: params.toString(),
  })
  if (!twRes.ok) {
    const body = await twRes.text().catch(() => '')
    console.error('[phone/reply] Twilio send failed', { status: twRes.status, body: body.slice(0, 500) })
    return res.status(502).json({ error: 'send_failed' })
  }
  res.json({ ok: true })
})

async function saveBill(prefix, products, period, label, bookings, minutes, dueDate) {
  const bill = computeBill(products, bookings, minutes)
  const ref = adminDb.collection(`${prefix}_bills`).doc(period)
  const snap = await ref.get()
  if (snap.exists && snap.data()?.status === 'paid') return
  const existing = snap.data() ?? {}
  await ref.set({
    period, label, bookings, minutes, dueDate, ...bill,
    status: existing.status ?? 'pending',
    paidAt: existing.paidAt ?? null,
    createdAt: existing.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
}

// ─── Give the central admin's own phone (same one used to sign into
// notaryhost.com/admin) admin access inside a notary's own clone too, so
// they can also log into its /owner or /admin panels with phone+SMS if
// ever needed. Firebase Auth users are project-scoped, so if the admin has
// already signed into notaryhost.com/admin with this phone, the Auth user
// already exists — we just look it up, no separate signup step. ─────────
async function grantAdminAccess(prefix) {
  const adminPhone = process.env.NEXT_PUBLIC_ADMIN_PHONE
  if (!adminPhone) return { granted: false, reason: 'admin_phone_not_configured' }
  let uid
  try {
    const user = await adminAuth.getUserByPhoneNumber(adminPhone)
    uid = user.uid
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return { granted: false, reason: 'admin_has_not_signed_in_yet' }
    }
    throw err
  }
  await adminDb.doc(`${prefix}_users/${uid}`).set(
    { phone: adminPhone, role: 'admin', createdAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
  return { granted: true }
}

router.post('/:notaryId/grant-admin-access', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  res.json(await grantAdminAccess(cfg.prefix))
})

router.get('/:notaryId/dashboard', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const { prefix, twilioPhoneNumber, products, firstPaymentDate } = cfg

  void grantAdminAccess(prefix).catch(() => {})

  const billingDay = billingDayFor(firstPaymentDate)
  const cur = monthBounds(0, billingDay)
  const prev = monthBounds(-1, billingDay)

  const [
    bookingsCur, bookingsPrev, consultsCur, consultsPrev, twilioCur, twilioPrev,
    bookingsSnap, billsSnap, hoursSnap, ivrSnap, consultsSnap, visitsSnap,
  ] = await Promise.all([
    countBetween(`${prefix}_bookings`, cur.start, cur.end),
    countBetween(`${prefix}_bookings`, prev.start, prev.end),
    countBetween(`${prefix}_consultations`, cur.start, cur.end),
    countBetween(`${prefix}_consultations`, prev.start, prev.end),
    getTwilioStats(cur.startStr, cur.endStr, twilioPhoneNumber),
    getTwilioStats(prev.startStr, prev.endStr, twilioPhoneNumber),
    adminDb.collection(`${prefix}_bookings`).orderBy('slot', 'desc').limit(100).get(),
    adminDb.collection(`${prefix}_bills`).orderBy('period', 'desc').get(),
    adminDb.doc(`${prefix}_config/hours`).get(),
    adminDb.doc(`${prefix}_ivr_config/default`).get(),
    adminDb.collection(`${prefix}_consultations`).orderBy('createdAt', 'desc').limit(50).get(),
    adminDb.collection(`${prefix}_visits`).orderBy('date', 'desc').limit(90).get(),
  ])

  const visitsDaily = visitsSnap.docs.map((d) => ({ date: d.data().date, count: d.data().count || 0 }))
  // Visit docs are keyed by date in America/Chicago (see notarygarcia's
  // trackVisit) — match that here instead of UTC so "today" lines up.
  const ctDate = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms))
  const todayStr = ctDate(Date.now())
  const last7Str = ctDate(Date.now() - 6 * 24 * 60 * 60 * 1000)
  const last30Str = ctDate(Date.now() - 29 * 24 * 60 * 60 * 1000)
  const visits = {
    today: visitsDaily.find((d) => d.date === todayStr)?.count ?? 0,
    last7: visitsDaily.filter((d) => d.date >= last7Str).reduce((s, d) => s + d.count, 0),
    last30: visitsDaily.filter((d) => d.date >= last30Str).reduce((s, d) => s + d.count, 0),
    total: visitsDaily.reduce((s, d) => s + d.count, 0),
    daily: visitsDaily,
  }

  void Promise.all([
    saveBill(prefix, products, cur.period, cur.label, bookingsCur, twilioCur.minutes, cur.dueDate),
    saveBill(prefix, products, prev.period, prev.label, bookingsPrev, twilioPrev.minutes, prev.dueDate),
  ]).catch(() => {})

  const curBill = computeBill(products, bookingsCur, twilioCur.minutes)
  const prevBill = computeBill(products, bookingsPrev, twilioPrev.minutes)

  res.json({
    configured: true,
    products,
    stats: {
      current: { label: cur.label, bookings: bookingsCur, calls: twilioCur.calls, consults: consultsCur, minutes: twilioCur.minutes, dueDate: cur.dueDate, ...curBill },
      previous: { label: prev.label, bookings: bookingsPrev, calls: twilioPrev.calls, consults: consultsPrev, minutes: twilioPrev.minutes, dueDate: prev.dueDate, ...prevBill },
    },
    bookings: docsOf(bookingsSnap),
    bills: docsOf(billsSnap),
    hours: hoursSnap.exists ? serialize(hoursSnap.data()) : { hoursByDayOfWeek: {}, blockedDates: [] },
    ivrConfig: { ...DEFAULT_IVR_CONFIG, ...(ivrSnap.exists ? serialize(ivrSnap.data()) : {}) },
    consultations: docsOf(consultsSnap),
    visits,
  })
})

router.patch('/:notaryId/bookings/:bookingId/cancel', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const { prefix } = cfg
  await adminDb.doc(`${prefix}_bookings/${req.params.bookingId}`).update({
    status: 'cancelled',
    cancelledAt: FieldValue.serverTimestamp(),
    cancelledBy: 'admin',
  })
  res.json({ ok: true })
})

router.patch('/:notaryId/bills/:period/paid', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const { prefix, firstPaymentDate } = cfg
  await adminDb.doc(`${prefix}_bills/${req.params.period}`).update({
    status: 'paid',
    paidAt: FieldValue.serverTimestamp(),
  })
  // First bill ever marked paid for this notary anchors their recurring
  // due date — same day-of-month, every month, from here on.
  if (!firstPaymentDate) {
    const today = new Date().toISOString().slice(0, 10)
    await adminDb.doc(`notaries/${req.params.notaryId}`).set({ firstPaymentDate: today }, { merge: true })
  }
  res.json({ ok: true })
})

router.put('/:notaryId/hours', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const { prefix } = cfg
  const { hoursByDayOfWeek, blockedDates } = req.body
  await adminDb.doc(`${prefix}_config/hours`).set(
    { hoursByDayOfWeek: hoursByDayOfWeek || {}, blockedDates: blockedDates || [], updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  )
  res.json({ ok: true })
})

const DEFAULT_IVR_CONFIG = {
  voices: { en: 'Polly.Matthew', es: 'Polly.Miguel' },
  intro: {
    en: 'Thank you for calling. I am Jose Garcia, notary public in Lafayette, Louisiana.',
    es: 'Gracias por llamar. Soy Jose Garcia, notario público en Lafayette, Luisiana.',
  },
  langPrompt: { en: 'Press 1 for English.', es: 'Para español, marque dos.' },
  menu: {
    en: 'Press 1 to book an appointment. Press 2 to leave a voice consultation. Press 3 to speak directly with the notary.',
    es: 'Marque uno para agendar una cita. Marque dos para dejar una consulta de voz. Marque tres para hablar directamente con el notario.',
  },
  bookConfirm: {
    en: 'Visit notarygarcia dot notaryhost dot com to book your appointment online. A text message with the link has been sent to your phone.',
    es: 'Visite notarygarcia dot notaryhost dot com para agendar su cita en línea. Se ha enviado un mensaje de texto con el enlace a su teléfono.',
  },
  bookBye: { en: 'Thank you. Goodbye!', es: '¡Gracias! ¡Hasta luego!' },
  consultPrompt: {
    en: 'Please leave your message after the beep. Press pound when you are finished.',
    es: 'Por favor deje su mensaje después del tono. Presione numeral cuando haya terminado.',
  },
  consultNoRec: {
    en: 'We did not receive a message. Please try again. Goodbye.',
    es: 'No recibimos su mensaje. Por favor intente de nuevo. Hasta luego.',
  },
  consultBye: {
    en: 'Your message has been saved. We will get back to you soon. Goodbye!',
    es: 'Su mensaje ha sido guardado. Nos comunicaremos pronto con usted. ¡Hasta luego!',
  },
  directPrompt: {
    en: 'Please hold while we connect you to the notary.',
    es: 'Por favor espere mientras lo conectamos con el notario.',
  },
  directBusy: {
    en: 'The notary is not available right now. Please call back later or press 2 to leave a voice message. Goodbye.',
    es: 'El notario no está disponible en este momento. Por favor llame más tarde o marque dos para dejar un mensaje de voz. Hasta luego.',
  },
  retry: { en: 'I did not understand your selection.', es: 'No entendí su selección.' },
}

router.put('/:notaryId/ivr', requireAdmin, async (req, res) => {
  const cfg = await getNotaryConfigOr404(req.params.notaryId, res)
  if (!cfg) return
  const { prefix } = cfg
  const body = req.body || {}
  const toSave = {}
  for (const key of Object.keys(DEFAULT_IVR_CONFIG)) {
    if (body[key]) toSave[key] = body[key]
  }
  await adminDb.doc(`${prefix}_ivr_config/default`).set(toSave)
  res.json({ ok: true })
})

export default router
