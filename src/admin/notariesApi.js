import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'

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

export async function deleteNotary(id) {
  const notaryRef = doc(db, 'notaries', id)
  const current = await getDoc(notaryRef)
  const slug = current.exists() ? current.data().subdomainSlug : null

  const batch = writeBatch(db)
  batch.delete(notaryRef)
  if (slug) batch.delete(doc(db, 'publicNotaryProfiles', slug))
  await batch.commit()
}
