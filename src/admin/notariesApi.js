import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

// Short, permanent, and never regenerated once set — this is what goes in
// a notary's referral link (?ref=<code>), so it has to stay stable forever.
function generateReferralCode() {
  return (
    Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)
  )
}

const notariesRef = collection(db, 'notaries')

export const PRODUCT_OPTIONS = [
  { value: 'website', label: 'Website + dashboard ($64/mo)' },
  { value: 'booking', label: 'Booking system ($19/mo)' },
  { value: 'ivr', label: 'Phone robot / IVR ($25/mo)' },
]

export const STATUS_OPTIONS = ['lead', 'contacted', 'onboarding', 'active', 'paused', 'cancelled']

function publicProfileFields(notaryId, data) {
  return {
    businessName: data.businessName,
    description: data.description || '',
    ownerPhone: data.ownerPhone,
    ownerEmail: data.ownerEmail,
    location: data.location || '',
    photoUrl: data.photoUrl || '',
    photoCropX: data.photoCropX ?? 0.5,
    photoCropY: data.photoCropY ?? 0.5,
    photoCropZoom: data.photoCropZoom ?? 1,
    status: data.status || '',
    notaryId,
  }
}

async function assertSlugAvailable(slug, notaryId) {
  if (!slug) return
  const snap = await getDoc(doc(db, 'publicNotaryProfiles', slug))
  if (snap.exists() && snap.data().notaryId !== notaryId) {
    throw new Error('slug_taken')
  }
}

export async function listNotaries() {
  const snap = await getDocs(query(notariesRef, orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getNotary(id) {
  const snap = await getDoc(doc(db, 'notaries', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createNotary(data) {
  const notaryRef = doc(notariesRef)
  await assertSlugAvailable(data.subdomainSlug, notaryRef.id)

  const batch = writeBatch(db)
  batch.set(notaryRef, {
    ...data,
    referralCode: data.referralCode || generateReferralCode(),
    stripeCustomerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  if (data.subdomainSlug) {
    batch.set(doc(db, 'publicNotaryProfiles', data.subdomainSlug), publicProfileFields(notaryRef.id, data))
  }
  await batch.commit()
  return notaryRef.id
}

export async function updateNotary(id, data) {
  const notaryRef = doc(db, 'notaries', id)
  const current = await getDoc(notaryRef)
  const oldSlug = current.exists() ? current.data().subdomainSlug : null
  const newSlug = data.subdomainSlug

  await assertSlugAvailable(newSlug, id)

  const batch = writeBatch(db)
  batch.update(notaryRef, { ...data, updatedAt: serverTimestamp() })

  if (oldSlug && oldSlug !== newSlug) {
    batch.delete(doc(db, 'publicNotaryProfiles', oldSlug))
  }
  if (newSlug) {
    batch.set(doc(db, 'publicNotaryProfiles', newSlug), publicProfileFields(id, data))
  }

  await batch.commit()
}

// Lazily backfills a referral code for notaries created before this
// feature existed — generated once, then permanent like any other.
export async function ensureReferralCode(id, currentCode) {
  if (currentCode) return currentCode
  const code = generateReferralCode()
  await updateDoc(doc(db, 'notaries', id), { referralCode: code })
  return code
}

// Most recent period this notary's own bills collection shows as paid —
// used on a referrer's page to show "paid through {period}" for each
// confirmed referral, straight from the same bill records the billing
// tab already saves, not a separate duplicated ledger.
export async function getLastPaidBillPeriod(prefix) {
  if (!prefix) return null
  const snap = await getDocs(
    query(
      collection(db, `${prefix}_bills`),
      where('status', '==', 'paid'),
      orderBy('period', 'desc'),
      limit(1)
    )
  )
  return snap.empty ? null : snap.docs[0].data().period
}

export async function deleteNotary(id) {
  const notaryRef = doc(db, 'notaries', id)
  const current = await getDoc(notaryRef)
  const slug = current.exists() ? current.data().subdomainSlug : null

  const batch = writeBatch(db)
  batch.delete(notaryRef)
  if (slug) batch.delete(doc(db, 'publicNotaryProfiles', slug))
  await batch.commit()
}
