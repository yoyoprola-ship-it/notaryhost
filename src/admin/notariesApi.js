import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

const notariesRef = collection(db, 'notaries')

export const PRODUCT_OPTIONS = [
  { value: 'website', label: 'Website + dashboard ($64/mo)' },
  { value: 'booking', label: 'Booking system ($19/mo)' },
  { value: 'ivr', label: 'Phone robot / IVR ($25/mo)' },
]

export const STATUS_OPTIONS = ['lead', 'contacted', 'onboarding', 'active', 'paused', 'cancelled']

export async function listNotaries() {
  const snap = await getDocs(query(notariesRef, orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getNotary(id) {
  const snap = await getDoc(doc(db, 'notaries', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createNotary(data) {
  const docRef = await addDoc(notariesRef, {
    ...data,
    stripeCustomerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateNotary(id, data) {
  await updateDoc(doc(db, 'notaries', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteNotary(id) {
  await deleteDoc(doc(db, 'notaries', id))
}
