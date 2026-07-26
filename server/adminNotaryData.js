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
  const { collectionPrefix, twilioPhoneNumber } = snap.data()
  if (!collectionPrefix) {
    res.status(409).json({ error: 'not_configured' })
    return null
  }
  return { prefix: collectionPrefix, twilioPhoneNumber: twilioPhoneNumber || '' }
}

// Every notary clone (e.g. notarygarcia) is its own independent App Hosting
// backend, but shares this Firestore project and this Twilio number, and
// prefixes its own collections with its own slug. All reads/writes below go
// through the Admin SDK, which bypasses security rules entirely — the
// central admin doesn't need per-notary client rules to see or change this.

// ─── Monthly stats + bill autosave (mirrors each clone's own
// /api/admin/stats, so bills keep getting generated even though nobody
// visits a notary's own dashboard anymore) ──────────────────────────────

function monthBounds(offset) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + offset
  const start = Timestamp.fromDate(new Date(y, m, 1))
  const end = Timestamp.fromDate(new Date(y, m + 1, 1))
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(y, m, 1))
  const period = `${y}-${String(m + 1).padStart(2, '0')}`
  const startStr = `${period}-01`
  const endStr = new Date(y, m + 1, 0).toISOString().slice(0, 10)
  const dueD = new Date(y, m + 2, 5)
  const dueDate = `${dueD.getFullYear()}-${String(dueD.getMonth() + 1).padStart(2, '0')}-05`
  return { start, end, label, period, startStr, endStr, dueDate }
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

async function saveBill(prefix, period, label, bookings, minutes, dueDate) {
  const bookingFee = parseFloat((bookings * 0.52).toFixed(2))
  const minutesFee = parseFloat((minutes * 0.59).toFixed(2))
  const total = parseFloat((bookingFee + minutesFee).toFixed(2))
  const ref = adminDb.collection(`${prefix}_bills`).doc(period)
  const snap = await ref.get()
  if (snap.exists && snap.data()?.status === 'paid') return
  const existing = snap.data() ?? {}
  await ref.set({
    period, label, bookings, minutes, bookingFee, minutesFee, total, dueDate,
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
  const { prefix, twilioPhoneNumber } = cfg

  void grantAdminAccess(prefix).catch(() => {})

  const cur = monthBounds(0)
  const prev = monthBounds(-1)

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
    saveBill(prefix, cur.period, cur.label, bookingsCur, twilioCur.minutes, cur.dueDate),
    saveBill(prefix, prev.period, prev.label, bookingsPrev, twilioPrev.minutes, prev.dueDate),
  ]).catch(() => {})

  res.json({
    configured: true,
    stats: {
      current: { label: cur.label, bookings: bookingsCur, calls: twilioCur.calls, consults: consultsCur, minutes: twilioCur.minutes, dueDate: cur.dueDate },
      previous: { label: prev.label, bookings: bookingsPrev, calls: twilioPrev.calls, consults: consultsPrev, minutes: twilioPrev.minutes, dueDate: prev.dueDate },
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
  const { prefix } = cfg
  await adminDb.doc(`${prefix}_bills/${req.params.period}`).update({
    status: 'paid',
    paidAt: FieldValue.serverTimestamp(),
  })
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
