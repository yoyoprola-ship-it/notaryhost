import { Router } from 'express'
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

router.use(requireAdmin)

function round2(n) {
  return Math.round(n * 100) / 100
}

function round1(n) {
  return Math.round(n * 10) / 10
}

// UTC calendar months — matches how Twilio timestamps date_sent/start_time,
// so this lines up with what Twilio itself would show for "this month".
function monthRange(offset) {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + offset
  const start = new Date(Date.UTC(y, m, 1))
  const end = new Date(Date.UTC(y, m + 1, 1))
  const fmt = (d) => d.toISOString().slice(0, 10)
  const label = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(start)
  return { startStr: fmt(start), endStr: fmt(end), label }
}

async function fetchAllPages(firstUrl, creds) {
  const pages = []
  let pageUrl = firstUrl
  while (pageUrl) {
    const res = await fetch(pageUrl, { headers: { Authorization: `Basic ${creds}` } })
    if (!res.ok) {
      console.error('[twilio-spend] Twilio API error', { url: pageUrl, status: res.status })
      break
    }
    const data = await res.json()
    pages.push(data)
    pageUrl = data.next_page_uri ? `https://api.twilio.com${data.next_page_uri}` : null
  }
  return pages
}

// Sums the REAL, already-billed `price` Twilio reports on each message/call
// resource — not an estimate from a published rate card.
async function sumMessages(accountSid, creds, phone, param, startStr, endStr) {
  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json` +
    `?${param}=${encodeURIComponent(phone)}&DateSent>=${startStr}&DateSent<${endStr}&PageSize=200`
  const pages = await fetchAllPages(url, creds)
  let cost = 0
  let count = 0
  for (const page of pages) {
    for (const m of page.messages ?? []) {
      count++
      cost += Math.abs(parseFloat(m.price) || 0)
    }
  }
  return { cost, count }
}

async function sumCalls(accountSid, creds, phone, param, startStr, endStr) {
  const url =
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json` +
    `?${param}=${encodeURIComponent(phone)}&StartTime>=${startStr}&StartTime<${endStr}&PageSize=200`
  const pages = await fetchAllPages(url, creds)
  let cost = 0
  let count = 0
  let seconds = 0
  for (const page of pages) {
    for (const c of page.calls ?? []) {
      count++
      cost += Math.abs(parseFloat(c.price) || 0)
      seconds += parseInt(c.duration ?? '0', 10) || 0
    }
  }
  return { cost, count, seconds }
}

async function spendFor(accountSid, authToken, phone, startStr, endStr) {
  if (!accountSid || !authToken || !phone) {
    return { smsCost: 0, smsCount: 0, callCost: 0, callCount: 0, callMinutes: 0, total: 0 }
  }
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const [msgsFrom, msgsTo, callsFrom, callsTo] = await Promise.all([
    sumMessages(accountSid, creds, phone, 'From', startStr, endStr),
    sumMessages(accountSid, creds, phone, 'To', startStr, endStr),
    sumCalls(accountSid, creds, phone, 'From', startStr, endStr),
    sumCalls(accountSid, creds, phone, 'To', startStr, endStr),
  ])
  const smsCost = round2(msgsFrom.cost + msgsTo.cost)
  const callCost = round2(callsFrom.cost + callsTo.cost)
  return {
    smsCost,
    smsCount: msgsFrom.count + msgsTo.count,
    callCost,
    callCount: callsFrom.count + callsTo.count,
    callMinutes: round1((callsFrom.seconds + callsTo.seconds) / 60),
    total: round2(smsCost + callCost),
  }
}

// GET /api/admin/twilio-spend
// Real (not estimated) Twilio spend per notary phone number, for the
// current and previous calendar month — the actual `price` Twilio billed
// on every SMS/call, summed straight from their API.
router.get('/', async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    const snap = await adminDb.collection('notaries').get()
    const notaries = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((n) => n.twilioPhoneNumber)

    const cur = monthRange(0)
    const prev = monthRange(-1)

    const rows = await Promise.all(
      notaries.map(async (n) => {
        const [thisMonth, lastMonth] = await Promise.all([
          spendFor(accountSid, authToken, n.twilioPhoneNumber, cur.startStr, cur.endStr),
          spendFor(accountSid, authToken, n.twilioPhoneNumber, prev.startStr, prev.endStr),
        ])
        return {
          notaryId: n.id,
          businessName: n.businessName || n.id,
          phoneNumber: n.twilioPhoneNumber,
          thisMonth,
          lastMonth,
        }
      })
    )

    const totalsFor = (key) =>
      rows.reduce(
        (acc, r) => ({
          smsCost: round2(acc.smsCost + r[key].smsCost),
          callCost: round2(acc.callCost + r[key].callCost),
          total: round2(acc.total + r[key].total),
        }),
        { smsCost: 0, callCost: 0, total: 0 }
      )

    res.json({
      thisMonthLabel: cur.label,
      lastMonthLabel: prev.label,
      notaries: rows,
      totals: { thisMonth: totalsFor('thisMonth'), lastMonth: totalsFor('lastMonth') },
    })
  } catch (err) {
    console.error('[twilio-spend] failed:', err)
    res.status(500).json({ error: 'Could not load Twilio spend' })
  }
})

export default router
