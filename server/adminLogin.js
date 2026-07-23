import { Router } from 'express'
import twilio from 'twilio'
import { randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'
import { sendOtpEmail, ADMIN_EMAIL } from './mailer.js'

const ADMIN_UID = 'admin-owner'
const CODE_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const THROTTLE_COOLDOWN_MS = 30 * 1000
const THROTTLE_DAILY_CAP = 20

const router = Router()

function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

function hashCode(code) {
  return createHmac('sha256', process.env.ADMIN_LOGIN_OTP_PEPPER).update(code).digest('hex')
}

function codesMatch(candidate, storedHash) {
  const a = Buffer.from(hashCode(candidate), 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function sendOtpSms(code) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  await client.messages.create({
    to: process.env.ADMIN_PHONE_NUMBER,
    from: process.env.TWILIO_PHONE_NUMBER,
    body: `Your NotaryHost admin sign-in code is ${code}. It expires in 10 minutes.`,
  })
}

async function reserveThrottleSlot() {
  const ref = adminDb.doc('adminLoginThrottle/global')
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const data = snap.exists ? snap.data() : {}
    const todayKey = new Date().toISOString().slice(0, 10)

    if (data.lastSmsAt && now - data.lastSmsAt.toMillis() < THROTTLE_COOLDOWN_MS) {
      throw Object.assign(new Error('cooldown'), { rateLimited: true })
    }
    const dailyCount = data.dayKey === todayKey ? data.dailyCount || 0 : 0
    if (dailyCount >= THROTTLE_DAILY_CAP) {
      throw Object.assign(new Error('daily_cap'), { rateLimited: true })
    }

    tx.set(ref, { lastSmsAt: Timestamp.now(), dayKey: todayKey, dailyCount: dailyCount + 1 })
  })
}

router.post('/start', async (req, res) => {
  try {
    await reserveThrottleSlot()
  } catch (err) {
    if (err.rateLimited) return res.status(429).json({ error: 'rate_limited' })
    throw err
  }

  const sessionId = randomUUID()
  const code = generateCode()
  const now = Date.now()

  await adminDb.doc(`adminLoginAttempts/${sessionId}`).set({
    phase: 'phone_pending',
    phoneCodeHash: hashCode(code),
    phoneCodeExpiresAt: Timestamp.fromMillis(now + CODE_TTL_MS),
    phoneAttempts: 0,
    phoneVerifiedAt: null,
    emailCodeHash: null,
    emailCodeExpiresAt: null,
    emailAttempts: 0,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(now + 60 * 60 * 1000),
  })

  await sendOtpSms(code)
  res.json({ sessionId })
})

router.post('/verify-phone', async (req, res) => {
  const { sessionId, code } = req.body
  if (!sessionId || !code) return res.status(400).json({ error: 'missing_fields' })

  const ref = adminDb.doc(`adminLoginAttempts/${sessionId}`)
  const snap = await ref.get()
  if (!snap.exists) return res.status(410).json({ error: 'expired_or_locked' })
  const data = snap.data()

  if (data.phase !== 'phone_pending') return res.status(410).json({ error: 'expired_or_locked' })
  if (data.phoneCodeExpiresAt.toMillis() < Date.now()) {
    await ref.delete()
    return res.status(410).json({ error: 'expired_or_locked' })
  }

  if (!codesMatch(code, data.phoneCodeHash)) {
    const attempts = (data.phoneAttempts || 0) + 1
    if (attempts >= MAX_ATTEMPTS) {
      await ref.delete()
      return res.status(410).json({ error: 'expired_or_locked' })
    }
    await ref.update({ phoneAttempts: attempts })
    return res.status(401).json({ error: 'invalid_code' })
  }

  const emailCode = generateCode()
  const now = Date.now()
  await ref.update({
    phase: 'email_pending',
    phoneVerifiedAt: Timestamp.now(),
    emailCodeHash: hashCode(emailCode),
    emailCodeExpiresAt: Timestamp.fromMillis(now + CODE_TTL_MS),
    emailAttempts: 0,
  })

  await sendOtpEmail(emailCode)
  res.json({})
})

router.post('/verify-email', async (req, res) => {
  const { sessionId, code } = req.body
  if (!sessionId || !code) return res.status(400).json({ error: 'missing_fields' })

  const ref = adminDb.doc(`adminLoginAttempts/${sessionId}`)
  const snap = await ref.get()
  if (!snap.exists) return res.status(410).json({ error: 'expired_or_locked' })
  const data = snap.data()

  if (data.phase !== 'email_pending') return res.status(410).json({ error: 'expired_or_locked' })
  if (data.emailCodeExpiresAt.toMillis() < Date.now()) {
    await ref.delete()
    return res.status(410).json({ error: 'expired_or_locked' })
  }

  if (!codesMatch(code, data.emailCodeHash)) {
    const attempts = (data.emailAttempts || 0) + 1
    if (attempts >= MAX_ATTEMPTS) {
      await ref.delete()
      return res.status(410).json({ error: 'expired_or_locked' })
    }
    await ref.update({ emailAttempts: attempts })
    return res.status(401).json({ error: 'invalid_code' })
  }

  await ref.delete()

  try {
    await adminAuth.createUser({ uid: ADMIN_UID, email: ADMIN_EMAIL, emailVerified: true })
  } catch (err) {
    if (err.code !== 'auth/uid-already-exists') throw err
  }

  const token = await adminAuth.createCustomToken(ADMIN_UID)
  res.json({ token })
})

export default router
