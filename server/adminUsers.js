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
    req.decodedToken = decoded
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}

router.post('/', requireAdmin, async (req, res) => {
  const { phoneNumber, displayName, notaryId } = req.body
  if (!phoneNumber || !displayName || !notaryId) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  const notaryRef = adminDb.doc(`notaries/${notaryId}`)
  const notarySnap = await notaryRef.get()
  if (!notarySnap.exists) return res.status(404).json({ error: 'notary_not_found' })
  if (notarySnap.data().ownerUid) {
    return res.status(409).json({ error: 'notary_already_has_owner' })
  }

  let uid
  try {
    const userRecord = await adminAuth.createUser({ phoneNumber, displayName })
    uid = userRecord.uid
  } catch (err) {
    if (err.code === 'auth/phone-number-already-exists') {
      return res.status(409).json({ error: 'phone_already_exists' })
    }
    if (err.code === 'auth/invalid-phone-number') {
      return res.status(400).json({ error: 'invalid_phone_number' })
    }
    throw err
  }

  try {
    const batch = adminDb.batch()
    batch.set(adminDb.doc(`users/${uid}`), {
      role: 'notary_owner',
      notaryId,
      phoneNumber,
      displayName,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'admin',
    })
    batch.update(notaryRef, { ownerUid: uid })
    await batch.commit()
  } catch (err) {
    await adminAuth.deleteUser(uid).catch(() => {})
    throw err
  }

  res.json({ uid })
})

router.delete('/:uid', requireAdmin, async (req, res) => {
  const { uid } = req.params

  const userRef = adminDb.doc(`users/${uid}`)
  const userSnap = await userRef.get()
  if (!userSnap.exists) return res.status(404).json({ error: 'user_not_found' })
  const { notaryId } = userSnap.data()

  try {
    await adminAuth.deleteUser(uid)
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
  }

  await adminDb.runTransaction(async (tx) => {
    const notaryRef = adminDb.doc(`notaries/${notaryId}`)
    const notarySnap = await tx.get(notaryRef)
    if (notarySnap.exists && notarySnap.data().ownerUid === uid) {
      tx.update(notaryRef, { ownerUid: null })
    }
    tx.delete(userRef)
  })

  res.json({})
})

export default router
