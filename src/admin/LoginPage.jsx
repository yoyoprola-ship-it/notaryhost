import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from './AuthContext'
import { isAdminSession } from './session'

const SERVER_ERROR_MESSAGES = {
  rate_limited: 'Too many attempts right now. Try again in a bit.',
  not_admin: "That phone number isn't authorized for this account.",
  invalid_code: 'Incorrect code.',
  expired_or_locked: 'That code expired or too many wrong attempts were made. Start over.',
}

const AUTH_ERROR_MESSAGES = {
  'auth/invalid-phone-number': 'Enter a valid phone number, e.g. +13375551234.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/invalid-verification-code': 'Incorrect code.',
  'auth/code-expired': 'That code expired. Request a new one.',
}

async function postJson(path, body) {
  const idToken = await auth.currentUser.getIdToken()
  const res = await fetch(`/api/admin-login/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(SERVER_ERROR_MESSAGES[data.error] || 'Something went wrong.')
  }
  return data
}

export default function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [stage, setStage] = useState('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const recaptchaRef = useRef(null)
  const confirmationRef = useRef(null)
  const requestedEmailCodeRef = useRef(false)

  useEffect(() => {
    if (loading) return

    if (isAdminSession(user)) {
      navigate('/admin', { replace: true })
      return
    }

    if (user && !requestedEmailCodeRef.current) {
      // Phone step already done in a previous visit (or earlier in this
      // session) but email step wasn't finished — resume there instead of
      // making them redo phone verification.
      requestedEmailCodeRef.current = true
      setStage('email-code')
      postJson('request-email-code', {}).catch((err) => setError(err.message))
    }
  }, [user, loading, navigate])

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
    }
  }, [])

  function getOrCreateVerifier() {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
    }
    return recaptchaRef.current
  }

  async function handleSendPhoneCode(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const verifier = getOrCreateVerifier()
      confirmationRef.current = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      setStage('phone-code')
    } catch (err) {
      recaptchaRef.current?.clear()
      recaptchaRef.current = null
      setError(AUTH_ERROR_MESSAGES[err.code] || 'Could not send the code. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyPhoneCode(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await confirmationRef.current.confirm(phoneCode)
      // onIdTokenChanged (AuthContext) picks up the new phone-only session;
      // the effect above advances to the email stage automatically.
    } catch (err) {
      setError(AUTH_ERROR_MESSAGES[err.code] || 'Incorrect code.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyEmailCode(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await postJson('verify-email', { code: emailCode })
      await auth.currentUser.getIdToken(true)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  async function handleStartOver() {
    await signOut(auth)
    requestedEmailCodeRef.current = false
    confirmationRef.current = null
    setStage('phone')
    setPhoneNumber('')
    setPhoneCode('')
    setEmailCode('')
    setError('')
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth__card">
        <h1>NotaryHost Admin</h1>
        <div id="recaptcha-container" />

        {stage === 'phone' && (
          <form onSubmit={handleSendPhoneCode}>
            <label>
              Phone number
              <input
                type="tel"
                placeholder="+13375551234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {stage === 'phone-code' && (
          <form onSubmit={handleVerifyPhoneCode}>
            <label>
              Code sent to your phone
              <input
                inputMode="numeric"
                maxLength={6}
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}

        {stage === 'email-code' && (
          <form onSubmit={handleVerifyEmailCode}>
            <label>
              Code sent to your email
              <input
                inputMode="numeric"
                maxLength={6}
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
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

        {stage === 'email-code' && (
          <button type="button" className="admin-auth__link" onClick={handleStartOver}>
            Not you? Sign out and try again
          </button>
        )}
      </div>
    </div>
  )
}
