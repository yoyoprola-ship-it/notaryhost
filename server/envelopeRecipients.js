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
    createdAt: FieldValue.serverTimestamp(),
  })
  res.json({ id: ref.id, name, address })
})

router.delete('/:id', async (req, res) => {
  await adminDb.collection('envelopeRecipients').doc(req.params.id).delete()
  res.json({ ok: true })
})

export default router
