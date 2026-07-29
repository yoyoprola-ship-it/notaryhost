import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const router = Router()

function ctDateStr(ms = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(ms))
}

// Public — fired once per real homepage load from the client (see
// src/pages/MarketingPage.jsx). Same trust model as any page-view beacon:
// no auth, best-effort, one doc per day keyed by date in America/Chicago.
router.post('/track', async (req, res) => {
  try {
    const today = ctDateStr()
    await adminDb.doc(`siteVisits/${today}`).set(
      { date: today, count: FieldValue.increment(1) },
      { merge: true }
    )
  } catch (err) {
    console.error('[siteVisits] track failed:', err)
  }
  res.json({ ok: true })
})

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

router.get('/', requireAdmin, async (req, res) => {
  const snap = await adminDb.collection('siteVisits').orderBy('date', 'desc').limit(90).get()
  const daily = snap.docs.map((d) => ({ date: d.data().date, count: d.data().count || 0 })).reverse()

  const todayStr = ctDateStr()
  const last7Str = ctDateStr(Date.now() - 6 * 24 * 60 * 60 * 1000)
  const last30Str = ctDateStr(Date.now() - 29 * 24 * 60 * 60 * 1000)

  res.json({
    today: daily.find((d) => d.date === todayStr)?.count ?? 0,
    last7: daily.filter((d) => d.date >= last7Str).reduce((s, d) => s + d.count, 0),
    last30: daily.filter((d) => d.date >= last30Str).reduce((s, d) => s + d.count, 0),
    total: daily.reduce((s, d) => s + d.count, 0),
    daily,
  })
})

export default router
