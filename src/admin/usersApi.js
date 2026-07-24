import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { adminFetch } from './apiClient'

const usersRef = collection(db, 'users')

export async function listUsers() {
  const snap = await getDocs(query(usersRef, orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function createUser({ phoneNumber, displayName, notaryId }) {
  const { uid } = await adminFetch('/api/admin/users', {
    method: 'POST',
    body: { phoneNumber, displayName, notaryId },
  })
  return uid
}

export async function deleteUser(uid) {
  await adminFetch(`/api/admin/users/${uid}`, { method: 'DELETE' })
}
