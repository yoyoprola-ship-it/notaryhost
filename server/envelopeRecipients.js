import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
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

// Collapse whitespace/case so "123 Main St, Apt 4" and "123  main st, apt 4"
// are recognized as the same address.
function normalizeAddress(address) {
  return address.trim().toLowerCase().replace(/\s+/g, ' ')
}

const SETTINGS_REF = adminDb.doc('envelopeSettings/current')

async function getCurrentPromotion() {
  const snap = await SETTINGS_REF.get()
  return snap.exists ? snap.data().promotion || 1 : 1
}

router.get('/settings', async (req, res) => {
  res.json({ promotion: await getCurrentPromotion() })
})

// Manually advance to the next promotion number. Nothing else changes —
// recipients already keep a full history of which promotion numbers
// they've received, so past records aren't touched.
router.post('/settings/next-promotion', async (req, res) => {
  const current = await getCurrentPromotion()
  const next = current + 1
  await SETTINGS_REF.set({ promotion: next }, { merge: true })
  res.json({ promotion: next })
})

router.get('/', async (req, res) => {
  const snap = await adminDb.collection('envelopeRecipients').orderBy('createdAt', 'asc').get()
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
})

router.post('/', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 200) : ''
  const address = typeof req.body?.address === 'string' ? req.body.address.trim().slice(0, 400) : ''
  if (!name) return res.status(400).json({ error: 'name_required' })
  if (!address) return res.status(400).json({ error: 'address_required' })

  const addressNormalized = normalizeAddress(address)
  const existing = await adminDb
    .collection('envelopeRecipients')
    .where('addressNormalized', '==', addressNormalized)
    .limit(1)
    .get()
  if (!existing.empty) {
    return res.status(409).json({ error: 'duplicate_address' })
  }

  const ref = await adminDb.collection('envelopeRecipients').add({
    name,
    address,
    addressNormalized,
    promotionsSent: [],
    language: 'en',
    createdAt: FieldValue.serverTimestamp(),
  })
  res.json({ id: ref.id, name, address, promotionsSent: [], language: 'en' })
})

router.delete('/:id', async (req, res) => {
  await adminDb.collection('envelopeRecipients').doc(req.params.id).delete()
  res.json({ ok: true })
})

router.post('/:id/language', async (req, res) => {
  const language = req.body?.language === 'es' ? 'es' : 'en'
  await adminDb.collection('envelopeRecipients').doc(req.params.id).update({ language })
  res.json({ ok: true, language })
})

// Bulk-confirms that the current promotion's mailing actually went out for
// these recipients — called once the admin has generated the PDF and
// checked it printed correctly. Records the current promotion number on
// each one so they're excluded next time this same promotion is generated.
router.post('/mark-sent', async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => typeof id === 'string') : []
  if (ids.length === 0) return res.status(400).json({ error: 'ids_required' })

  const promotion = await getCurrentPromotion()
  const batch = adminDb.batch()
  for (const id of ids) {
    batch.update(adminDb.collection('envelopeRecipients').doc(id), {
      promotionsSent: FieldValue.arrayUnion(promotion),
    })
  }
  await batch.commit()
  res.json({ ok: true, promotion, count: ids.length })
})

export default router
