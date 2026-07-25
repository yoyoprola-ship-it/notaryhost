import { Router } from 'express'
import { adminDb } from './firebaseAdmin.js'

const router = Router()

function todayCT() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function formatHour(h) {
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:00 ${suffix}`
}

function toE164(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  return digits.length === 10 ? `+1${digits}` : `+${digits}`
}

async function sendSms(accountSid, authToken, from, to, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams({ To: to, From: from, Body: body })
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    },
    body: params.toString(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Twilio error ${res.status}: ${err?.code ?? ''}`)
  }
}

// One central job (instead of one per notary) checks every registered
// notary's own bookings and sends today's reminders — reads live via the
// Admin SDK against each notary's ${prefix}_bookings, using that notary's
// own Twilio number as the sender.
router.get('/reminders', async (req, res) => {
  const authHeader = req.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token || token !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    return res.status(500).json({ error: 'twilio_not_configured' })
  }

  const today = todayCT()
  const notariesSnap = await adminDb.collection('notaries').get()
  const notaries = notariesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((n) => n.collectionPrefix && n.twilioPhoneNumber)

  let sent = 0
  let errors = 0
  const perNotary = []

  for (const notary of notaries) {
    const from = notary.twilioPhoneNumber
    let notarySent = 0
    let notaryErrors = 0

    const snap = await adminDb
      .collection(`${notary.collectionPrefix}_bookings`)
      .where('slotDate', '==', today)
      .where('status', '==', 'confirmed')
      .get()

    for (const doc of snap.docs) {
      const b = doc.data()
      if (b.reminderSent) continue

      const phone = toE164(b.customerPhone)
      const firstName = (b.customerName || '').split(' ')[0] || 'there'
      const time = formatHour(b.slotHour)
      const addressLine = notary.businessAddress ? `\n${notary.businessAddress}` : ''

      try {
        await sendSms(
          accountSid, authToken, from, phone,
          `Hi ${firstName}, reminder: your appointment with ${notary.ownerName || notary.businessName} is TODAY at ${time}.${addressLine}\n\n` +
          `Hola ${firstName}, recordatorio: su cita con ${notary.ownerName || notary.businessName} es HOY a las ${time}.${addressLine}`,
        )
        await doc.ref.update({ reminderSent: true })
        sent++
        notarySent++
      } catch {
        errors++
        notaryErrors++
      }
    }

    perNotary.push({ notaryId: notary.id, businessName: notary.businessName, sent: notarySent, errors: notaryErrors })
  }

  res.json({ ok: true, today, notariesChecked: notaries.length, sent, errors, perNotary })
})

export default router
