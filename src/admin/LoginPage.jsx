import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from './AuthContext'

const ERROR_MESSAGES = {
  rate_limited: 'Too many attempts right now. Try again in a bit.',
  invalid_code: 'Incorrect code.',
  expired_or_locked: 'That code expired or too many wrong attempts were made. Start over.',
}

async function postJson(path, body) {
  const res = await fetch(`/api/admin-login/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(ERROR_MESSAGES[data.error] || 'Something went wrong.')
  }
  return data
}

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState('request')
  const [sessionId, setSessionId] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/admin" replace />

  async function handleRequestCode() {
    setError('')
    setSubmitting(true)
    try {
      const { sessionId: id } = await postJson('start', {})
      setSessionId(id)
      setStage('phone')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyPhone(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await postJson('verify-phone', { sessionId, code })
      setCode('')
      setStage('email')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyEmail(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { token } = await postJson('verify-email', { sessionId, code })
      await signInWithCustomToken(auth, token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth__card">
        <h1>NotaryHost Admin</h1>

        {stage === 'request' && (
          <>
            <p className="admin-auth__hint">
              We'll text a code to your phone, then email a second code.
            </p>
            <button onClick={handleRequestCode} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send code to my phone'}
            </button>
          </>
        )}

        {stage === 'phone' && (
          <form onSubmit={handleVerifyPhone}>
            <label>
              Code sent to your phone
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}

        {stage === 'email' && (
          <form onSubmit={handleVerifyEmail}>
            <label>
              Code sent to your email
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {error && <p className="admin-auth__error">{error}</p>}
      </div>
    </div>
  )
}
