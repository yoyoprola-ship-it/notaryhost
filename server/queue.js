import { Router } from 'express'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const router = Router()

const VALID_PRODUCTS = ['website', 'booking', 'ivr']

function formatPhone(e164) {
  const d = (e164 || '').replace(/\D/g, '').slice(-10)
  if (d.length !== 10) return e164
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

// Public — anyone with a phone-verified Firebase ID token (from the
// website's "reserve your spot" form) can join the build queue. Not
// admin-gated on purpose: this is how prospective notaries sign up.
router.post('/', async (req, res) => {
  const authHeader = req.get('authorization') || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return res.status(401).json({ error: 'missing_token' })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const phone = decoded.phone_number
  if (!phone) return res.status(400).json({ error: 'no_phone_on_token' })

  const products = Array.isArray(req.body?.products)
    ? req.body.products.filter((p) => VALID_PRODUCTS.includes(p))
    : []
  if (products.length === 0) return res.status(400).json({ error: 'no_products' })

  // Don't create a second lead for the same phone number if they already
  // submitted the form.
  const existing = await adminDb.collection('notaries').where('ownerPhone', '==', phone).limit(1).get()
  if (!existing.empty) {
    return res.json({ ok: true, alreadyQueued: true })
  }

  await adminDb.collection('notaries').add({
    businessName: `New lead — ${formatPhone(phone)}`,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: phone,
    products,
    subdomainSlug: '',
    description: '',
    status: 'lead',
    notes: 'Joined the build queue from the website — phone-verified, no other details yet.',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  res.json({ ok: true })
})

export default router
