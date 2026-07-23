import { Router } from 'express'
import { Resend } from 'resend'
import { randomInt, createHmac, timingSafeEqual } from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const ADMIN_EMAIL = 'yoyoprola@gmail.com'
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

async function requireAuth(req, res, next) {
  const authHeader = req.get('authorization') || ''
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!idToken) return res.status(401).json({ error: 'missing_token' })
  try {
    req.decodedToken = await adminAuth.verifyIdToken(idToken)
    next()
  } catch {
    res.status(401).json({ error: 'invalid_token' })
  }
}

async function reserveThrottleSlot() {
  const ref = adminDb.doc('adminLoginThrottle/global')
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const data = snap.exists ? snap.data() : {}
    const todayKey = new Date().toISOString().slice(0, 10)

    if (data.lastEmailSentAt && now - data.lastEmailSentAt.toMillis() < THROTTLE_COOLDOWN_MS) {
      throw Object.assign(new Error('cooldown'), { rateLimited: true })
    }
    const dailyCount = data.dayKey === todayKey ? data.dailyCount || 0 : 0
    if (dailyCount >= THROTTLE_DAILY_CAP) {
      throw Object.assign(new Error('daily_cap'), { rateLimited: true })
    }

    tx.set(ref, { lastEmailSentAt: Timestamp.now(), dayKey: todayKey, dailyCount: dailyCount + 1 })
  })
}

async function sendOtpEmail(code) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: 'login@notaryhost.com',
    to: ADMIN_EMAIL,
    subject: `NotaryHost admin login code: ${code}`,
    text: `Your NotaryHost admin sign-in code is ${code}. It expires in 10 minutes.`,
  })
  if (error) throw new Error('resend_send_failed')
}

router.post('/request-email-code', requireAuth, async (req, res) => {
  const { uid, phone_number: phoneNumber } = req.decodedToken

  if (!phoneNumber || phoneNumber !== process.env.ADMIN_PHONE_NUMBER) {
    return res.status(403).json({ error: 'not_admin' })
  }

  // Admin SDK can't unset email once set, so every login explicitly downgrades
  // the account first — otherwise the email step becomes skippable after the
  // very first successful login ever (the stale claim would already verify).
  await adminAuth.updateUser(uid, {
    email: `pending-${uid}@notaryhost.invalid`,
    emailVerified: false,
  })

  try {
    await reserveThrottleSlot()
  } catch (err) {
    if (err.rateLimited) return res.status(429).json({ error: 'rate_limited' })
    throw err
  }

  const code = generateCode()
  const now = Date.now()

  await adminDb.doc(`adminLoginEmailCodes/${uid}`).set({
    emailCodeHash: hashCode(code),
    emailCodeExpiresAt: Timestamp.fromMillis(now + CODE_TTL_MS),
    attempts: 0,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(now + 60 * 60 * 1000),
  })

  await sendOtpEmail(code)
  res.json({})
})

router.post('/verify-email', requireAuth, async (req, res) => {
  const { uid } = req.decodedToken
  const { code } = req.body
  if (!code) return res.status(400).json({ error: 'missing_fields' })

  const ref = adminDb.doc(`adminLoginEmailCodes/${uid}`)
  const snap = await ref.get()
  if (!snap.exists) return res.status(410).json({ error: 'expired_or_locked' })
  const data = snap.data()

  if (data.emailCodeExpiresAt.toMillis() < Date.now()) {
    await ref.delete()
    return res.status(410).json({ error: 'expired_or_locked' })
  }

  if (!codesMatch(code, data.emailCodeHash)) {
    const attempts = (data.attempts || 0) + 1
    if (attempts >= MAX_ATTEMPTS) {
      await ref.delete()
      return res.status(410).json({ error: 'expired_or_locked' })
    }
    await ref.update({ attempts })
    return res.status(401).json({ error: 'invalid_code' })
  }

  await ref.delete()
  await adminAuth.updateUser(uid, { email: ADMIN_EMAIL, emailVerified: true })
  res.json({})
})

export default router
