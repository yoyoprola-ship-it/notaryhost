import { auth } from '../firebase'

export async function adminFetch(path, { method = 'POST', body } = {}) {
  // Force a refresh, not the cached token: the admin-login flow mutates the
  // user's email server-side mid-flow (downgrade-then-restore), which bumps
  // Firebase's tokensValidAfterTime and invalidates any ID token minted
  // before that change — a cached token here would 401 on the very next call.
  const idToken = await auth.currentUser.getIdToken(true)
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
