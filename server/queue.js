import { Router } from 'express'
import { Resend } from 'resend'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const router = Router()

const VALID_PRODUCTS = ['website', 'booking', 'ivr']

// Must stay word-for-word identical to the copy in src/sections/Cta.jsx —
// this is the canonical text recorded as consent evidence, not whatever
// the client happens to send, so it can't be tampered with in the request.
const SMS_CONSENT_TEXT =
  'I agree to receive SMS text messages from NotaryHost about my account, appointments, and services. Message & data rates may apply. Reply STOP to opt out.'

function formatPhone(e164) {
  const d = (e164 || '').replace(/\D/g, '').slice(-10)
  if (d.length !== 10) return e164
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const PRODUCT_LABELS = { website: 'website', booking: 'booking system', ivr: 'phone robot (IVR)' }

// Best-effort — a notification failure should never block the signup itself.
async function notifyAdminSms(ownerName, phone, wants) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER_HOST
  const to = process.env.NEXT_PUBLIC_ADMIN_PHONE
  if (!accountSid || !authToken || !from || !to) return

  const who = ownerName ? `${ownerName} (${formatPhone(phone)})` : formatPhone(phone)
  const body = `New build-queue signup: ${who} — wants ${wants}.`

  try {
    const params = new URLSearchParams({ To: to, From: from, Body: body })
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      },
      body: params.toString(),
    })
  } catch {
    // ignore — don't fail the signup over a notification hiccup
  }
}

async function notifyAdminEmail(ownerName, phone, wants) {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.NEXT_PUBLIC_ADMIN_EMAIL
  if (!apiKey || !to) return

  const who = ownerName || 'Someone'
  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: 'queue@notaryhost.com',
      to,
      subject: `New build-queue signup: ${who}`,
      text: `${who} (${formatPhone(phone)}) just joined the build queue.\n\nWants: ${wants}`,
    })
    if (error) console.error('[queue] admin email failed:', error)
  } catch (err) {
    console.error('[queue] admin email failed:', err)
  }
}

async function notifyAdmin(ownerName, phone, products) {
  const wants = products.map((p) => PRODUCT_LABELS[p] || p).join(', ')
  await Promise.all([
    notifyAdminSms(ownerName, phone, wants),
    notifyAdminEmail(ownerName, phone, wants),
  ])
}

// Public — anyone with a phone-verified Firebase ID token (from the
// website's "reserve your spot" form) can join the build queue. Not
// admin-gated on purpose: this is how prospective notaries sign up.
router.post('/', async (req, res) => {
  const authHeader = req.get('authorization') || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return res.status(401).json({ error: 'missing_token' })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(idToken)
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const phone = decoded.phone_number
  if (!phone) return res.status(400).json({ error: 'no_phone_on_token' })

  const products = Array.isArray(req.body?.products)
    ? req.body.products.filter((p) => VALID_PRODUCTS.includes(p))
    : []
  if (products.length === 0) return res.status(400).json({ error: 'no_products' })

  const ownerName = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : ''

  if (req.body?.smsConsent !== true) {
    return res.status(400).json({ error: 'sms_consent_required' })
  }

  // Don't create a second lead for the same phone number if they already
  // submitted the form.
  const existing = await adminDb.collection('notaries').where('ownerPhone', '==', phone).limit(1).get()
  if (!existing.empty) {
    return res.json({ ok: true, alreadyQueued: true })
  }

  // Consent evidence for SMS marketing (TCPA) — phone comes from the
  // Firebase-verified token and the timestamp from the server, so neither
  // can be spoofed by the client. If this is ever disputed, this record is
  // the entire defense: who consented, to what exact text, and when.
  await adminDb.collection('notaries').add({
    businessName: ownerName ? `New lead — ${ownerName}` : `New lead — ${formatPhone(phone)}`,
    ownerName,
    ownerEmail: '',
    ownerPhone: phone,
    products,
    subdomainSlug: '',
    description: '',
    status: 'lead',
    notes: 'Joined the build queue from the website — phone-verified, no other details yet.',
    smsConsent: {
      text: SMS_CONSENT_TEXT,
      phone,
      consentedAt: FieldValue.serverTimestamp(),
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  notifyAdmin(ownerName, phone, products)

  res.json({ ok: true })
})

export default router
