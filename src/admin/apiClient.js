import { auth } from '../firebase'

export async function adminFetch(path, { method = 'POST', body } = {}) {
  const idToken = await auth.currentUser.getIdToken()
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || 'request_failed')
    error.code = data.error
    throw error
  }
  return data
}
