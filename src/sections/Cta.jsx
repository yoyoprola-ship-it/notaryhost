import { useEffect, useState } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../firebase'
import Icon from '../components/Icon'
import Reveal from '../components/Reveal'

const SERVICES = [
  { value: 'website', label: 'Website + dashboard', price: 64 },
  { value: 'booking', label: 'Booking system', price: 19 },
  { value: 'ivr', label: 'Phone robot (IVR)', price: 25 },
  { value: 'urgent', label: 'Urgent service', price: 15 },
  { value: 'mobile', label: 'Mobile dispatch', price: 19 },
]

// The bundle only covers the four universal services — mobile dispatch is
// a mobile-notary-only add-on, priced separately even when the bundle
// applies (matches the Pricing/Comparison sections).
const CORE_SERVICES = ['website', 'booking', 'ivr', 'urgent']

// 10% off the sum of the four core services, rounded: (64+19+25+15) * 0.9
// = 110.7 → 111.
const BUNDLE_PRICE = 111

// Must stay word-for-word identical to the copy in server/queue.js — the
// server records this exact string as the consent evidence, so what's
// stored has to match what the person actually saw and checked.
const SMS_CONSENT_TEXT =
  'I agree to receive SMS text messages from NotaryHost about my account, appointments, and services. Message & data rates may apply. Reply STOP to opt out.'

function monthlyTotal(products) {
  const hasAllCore = CORE_SERVICES.every((v) => products.includes(v))
  const coreTotal = hasAllCore
    ? BUNDLE_PRICE
    : SERVICES.filter((s) => CORE_SERVICES.includes(s.value) && products.includes(s.value)).reduce((sum, s) => sum + s.price, 0)
  const mobileTotal = products.includes('mobile') ? SERVICES.find((s) => s.value === 'mobile').price : 0
  return coreTotal + mobileTotal
}

export default function Cta() {
  const [products, setProducts] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [code, setCode] = useState('')
  const [step, setStep] = useState('form') // form | verify | done
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [referralCode, setReferralCode] = useState('')
  const [referrerName, setReferrerName] = useState('')

  // ?ref=<code> on the URL — the notary's own permanent referral link.
  // Resolved against the server (not stored client-side) so a random
  // string in the URL can't fake a referrer's name.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (!ref) return
    setReferralCode(ref)
    fetch(`/api/queue/referral/${encodeURIComponent(ref)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.businessName) setReferrerName(data.businessName) })
      .catch(() => {})
  }, [])

  function toggleProduct(value) {
    setProducts((p) => (p.includes(value) ? p.filter((x) => x !== value) : [...p, value]))
  }

  async function handleSendCode(e) {
    e.preventDefault()
    setError('')
    if (products.length === 0) { setError('Pick at least one service.'); return }
    if (!name.trim()) { setError('Enter your name.'); return }
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Enter a valid 10-digit US phone number.'); return }
    if (!smsConsent) { setError('Please agree to receive SMS messages to continue.'); return }

    setLoading(true)
    try {
      if (window.ctaRecaptcha) {
        try { window.ctaRecaptcha.clear() } catch { /* ignore */ }
      }
      window.ctaRecaptcha = new RecaptchaVerifier(auth, 'cta-recaptcha', { size: 'invisible' })
      const result = await signInWithPhoneNumber(auth, `+1${digits}`, window.ctaRecaptcha)
      setConfirmation(result)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmCode(e) {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code.'); return }

    setLoading(true)
    try {
      const cred = await confirmation.confirm(code)
      const idToken = await cred.user.getIdToken()
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ products, name: name.trim(), smsConsent, referralCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not join the queue.')
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="cta" id="contact">
      <div className="cta__glow" />
      <div className="cta__blob" />
      <div className="section-inner cta__inner">
        <Reveal>
          <span className="brand__mark brand__mark--lg">
            <Icon name="seal" size={28} />
          </span>
          <h2 className="cta__title">
            Want your notary practice to run like this?
          </h2>
          <p className="cta__subtitle">Reserve your spot in the build queue.</p>

          {referrerName && (
            <div className="cta__notice cta__notice--referral">
              <Icon name="seal" size={16} />
              <span>
                You were referred by <strong>{referrerName}</strong> — they&rsquo;ll get a
                free month once your site is live and you&rsquo;re paying.
              </span>
            </div>
          )}

          <div className="cta__notice">
            <Icon name="shield" size={16} />
            <span>
              You won&rsquo;t be charged a cent until your website, booking system, and phone
              line are 100% live and working.
            </span>
          </div>

          {step === 'form' && (
            <form className="cta__form" onSubmit={handleSendCode}>
              <div className="cta__services">
                {SERVICES.map((s) => (
                  <label key={s.value} className="cta__service">
                    <input
                      type="checkbox"
                      checked={products.includes(s.value)}
                      onChange={() => toggleProduct(s.value)}
                    />
                    {s.label}
                    <span className="cta__service-price">${s.price}/mo</span>
                  </label>
                ))}
              </div>
              {products.length > 0 && (
                <p className="cta__bill">
                  Estimated monthly bill: <strong>${monthlyTotal(products)}/mo</strong>
                  {CORE_SERVICES.every((v) => products.includes(v)) && ' (bundle discount applied)'}
                </p>
              )}
              <input
                type="text"
                className="cta__name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
              <input
                type="tel"
                className="cta__phone"
                placeholder="(337) 555-0100"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={14}
              />
              <label className="cta__consent">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                />
                <span>{SMS_CONSENT_TEXT}</span>
              </label>
              <button className="btn btn--primary cta__submit" type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Verify phone to schedule'}
              </button>
              {error && <p className="cta__error">{error}</p>}
              <div id="cta-recaptcha" />
            </form>
          )}

          {step === 'verify' && (
            <form className="cta__form" onSubmit={handleConfirmCode}>
              <p className="cta__hint">Enter the 6-digit code we just texted you.</p>
              <div className="cta__phone-row">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
                <button className="btn btn--primary" type="submit" disabled={loading}>
                  {loading ? 'Confirming…' : 'Confirm'}
                </button>
              </div>
              {error && <p className="cta__error">{error}</p>}
            </form>
          )}

          {step === 'done' && (
            <p className="cta__success">
              You&rsquo;re in the queue! We&rsquo;ll text you to get started.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
