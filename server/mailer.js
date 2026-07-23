import nodemailer from 'nodemailer'

const ADMIN_EMAIL = 'yoyoprola@gmail.com'

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: ADMIN_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export async function sendOtpEmail(code) {
  await getTransporter().sendMail({
    from: ADMIN_EMAIL,
    to: ADMIN_EMAIL,
    subject: `NotaryHost admin login code: ${code}`,
    text: `Your NotaryHost admin sign-in code is ${code}. It expires in 10 minutes.`,
  })
}

export { ADMIN_EMAIL }
