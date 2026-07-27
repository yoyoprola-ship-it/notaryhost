import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import twilio from 'twilio'
import adminLoginRouter from './server/adminLogin.js'
import adminNotaryDataRouter from './server/adminNotaryData.js'
import cronRemindersRouter from './server/cronReminders.js'
import queueRouter from './server/queue.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { VoiceResponse } = twilio.twiml

const PORT = process.env.PORT || 8080
const BOOKING_URL = process.env.BOOKING_URL || 'https://notaryhost.com'
const TRANSFER_PHONE_NUMBER = process.env.TRANSFER_PHONE_NUMBER || ''
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER_HOST || ''

const voiceFor = (lang) =>
  lang === 'es' ? { voice: 'Polly.Lupe', language: 'es-MX' } : { voice: 'Polly.Joanna' }

function twilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
}

const app = express()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.post('/voice/incoming', (req, res) => {
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    action: '/voice/menu',
    method: 'POST',
    timeout: 6,
  })
  gather.say(voiceFor('en'), 'For English, press 1.')
  gather.say(voiceFor('es'), 'Para español, presione 2.')
  twiml.redirect('/voice/incoming')
  res.type('text/xml').send(twiml.toString())
})

app.post('/voice/menu', (req, res) => {
  const lang = req.body.Digits === '2' ? 'es' : 'en'
  const twiml = new VoiceResponse()
  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    action: `/voice/action?lang=${lang}`,
    method: 'POST',
    timeout: 8,
  })
  gather.say(
    voiceFor(lang),
    lang === 'es'
      ? `Para agendar una cita, presione 1 y le enviaremos el enlace por mensaje de texto. Para dejar un mensaje de voz, presione 2. Para hablar con alguien, presione 3.`
      : `To book an appointment, press 1 and we will text you the link. To leave a voice message, press 2. To speak with someone, press 3.`
  )
  res.type('text/xml').send(twiml.toString())
})

app.post('/voice/action', async (req, res) => {
  const lang = req.query.lang === 'es' ? 'es' : 'en'
  const digit = req.body.Digits
  const twiml = new VoiceResponse()

  if (digit === '1') {
    const client = twilioClient()
    if (client && TWILIO_PHONE_NUMBER) {
      try {
        await client.messages.create({
          to: req.body.From,
          from: TWILIO_PHONE_NUMBER,
          body:
            lang === 'es'
              ? `Agenda tu cita aquí: ${BOOKING_URL}`
              : `Book your appointment here: ${BOOKING_URL}`,
        })
      } catch (err) {
        console.error('Failed to send booking SMS', err)
      }
    } else {
      console.warn('Twilio credentials not configured, skipping booking SMS')
    }
    twiml.say(
      voiceFor(lang),
      lang === 'es'
        ? 'Le hemos enviado un mensaje de texto con el enlace. ¡Gracias!'
        : "We've sent you a text with the link. Thank you!"
    )
    twiml.hangup()
  } else if (digit === '2') {
    twiml.say(
      voiceFor(lang),
      lang === 'es' ? 'Por favor deje su mensaje después del tono.' : 'Please leave your message after the tone.'
    )
    twiml.record({
      action: `/voice/recording?lang=${lang}`,
      method: 'POST',
      maxLength: 120,
      playBeep: true,
    })
  } else if (digit === '3' && TRANSFER_PHONE_NUMBER) {
    twiml.say(voiceFor(lang), lang === 'es' ? 'Le comunicamos ahora.' : 'Connecting you now.')
    twiml.dial(TRANSFER_PHONE_NUMBER)
  } else {
    twiml.redirect('/voice/incoming')
  }

  res.type('text/xml').send(twiml.toString())
})

app.post('/voice/recording', (req, res) => {
  const lang = req.query.lang === 'es' ? 'es' : 'en'
  console.log('Voicemail received:', req.body.RecordingUrl)
  const twiml = new VoiceResponse()
  twiml.say(
    voiceFor(lang),
    lang === 'es' ? 'Gracias, hemos guardado su mensaje.' : 'Thank you, your message has been saved.'
  )
  twiml.hangup()
  res.type('text/xml').send(twiml.toString())
})

app.use('/api/admin-login', adminLoginRouter)
app.use('/api/admin/notaries', adminNotaryDataRouter)
app.use('/api/cron', cronRemindersRouter)
app.use('/api/queue', queueRouter)

// Hashed filenames change on every build, so they're safe to cache forever;
// index.html/the SPA fallback must never be cached, or a browser/CDN can keep
// serving an old index.html that points at an asset a later deploy deleted.
app.use(
  express.static(path.join(__dirname, 'dist'), {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'no-store')
      }
    },
  })
)
app.get(/.*/, (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
