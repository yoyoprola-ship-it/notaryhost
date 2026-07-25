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

// Each notary clone (e.g. notarygarcia) is its own independent App Hosting
// backend, but shares this Firestore project and prefixes its collections
// with its own slug (notarygarcia_bookings, etc). This reads that operational
// data live via the Admin SDK — which bypasses security rules entirely — so
// the central admin can show it without needing per-notary client rules.
router.get('/:notaryId/dashboard', requireAdmin, async (req, res) => {
  const { notaryId } = req.params
  const notarySnap = await adminDb.doc(`notaries/${notaryId}`).get()
  if (!notarySnap.exists) return res.status(404).json({ error: 'notary_not_found' })

  const prefix = notarySnap.data().collectionPrefix
  if (!prefix) return res.json({ configured: false })

  const [bookingsSnap, billsSnap, hoursSnap, ivrSnap, consultsSnap] = await Promise.all([
    adminDb.collection(`${prefix}_bookings`).orderBy('slot', 'desc').limit(100).get(),
    adminDb.collection(`${prefix}_bills`).orderBy('period', 'desc').get(),
    adminDb.doc(`${prefix}_config/hours`).get(),
    adminDb.doc(`${prefix}_ivr_config/default`).get(),
    adminDb.collection(`${prefix}_consultations`).orderBy('createdAt', 'desc').limit(50).get(),
  ])

  res.json({
    configured: true,
    bookings: docsOf(bookingsSnap),
    bills: docsOf(billsSnap),
    hours: hoursSnap.exists ? serialize(hoursSnap.data()) : null,
    ivrConfig: ivrSnap.exists ? serialize(ivrSnap.data()) : null,
    consultations: docsOf(consultsSnap),
  })
})

export default router
