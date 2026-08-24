import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

// US #10 envelope: 9.5in x 4.125in, landscape — 72pt per inch.
const ENVELOPE_WIDTH = 9.5 * 72
const ENVELOPE_HEIGHT = 4.125 * 72

// The "TO:" block used to have 4 ruled lines to write on; now that the
// address is always machine-printed (never handwritten), the lines were
// removed from the artwork and the 3 lines of text (name, street,
// city/state/zip) are spaced evenly across that same block instead —
// x runs 5.7in–7.85in (measured off the original ruled lines), and the
// 3 rows split that same top-to-bottom span into two equal gaps.
const ADDRESS_LEFT = 5.7 * 72
const ADDRESS_RIGHT = 7.85 * 72
const ADDRESS_MAX_WIDTH = ADDRESS_RIGHT - ADDRESS_LEFT
const ADDRESS_TOP = 1.608 * 72
const ADDRESS_BOTTOM = 0.768 * 72
const LINE_Y = [ADDRESS_TOP, (ADDRESS_TOP + ADDRESS_BOTTOM) / 2, ADDRESS_BOTTOM]

async function fetchBytes(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url}`)
  return res.arrayBuffer()
}

// Splits a single-line address like "9420 Cullen Blvd, Houston, TX 77051"
// into a street line and a city/state/zip line for the two lines below
// the name.
function splitAddress(address) {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 1) return [address, '']
  return [parts[0], parts.slice(1).join(', ')]
}

function fitFontSize(font, text, maxWidth, startSize = 11, minSize = 7) {
  let size = startSize
  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5
  }
  return size
}

// One page per recipient, sized exactly to a #10 envelope, using the
// real envelope artwork as the background with the name/address set in
// Montserrat in the "TO:" block.
export async function generateEnvelopePdf(recipients) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)

  const [fontBytes, templateBytes] = await Promise.all([
    fetchBytes('/fonts/Montserrat-SemiBold.woff'),
    fetchBytes('/envelope-template.png'),
  ])
  const font = await pdf.embedFont(fontBytes)
  const template = await pdf.embedPng(templateBytes)

  for (const { name, address } of recipients) {
    const page = pdf.addPage([ENVELOPE_WIDTH, ENVELOPE_HEIGHT])
    page.drawImage(template, { x: 0, y: 0, width: ENVELOPE_WIDTH, height: ENVELOPE_HEIGHT })

    const [street, cityStateZip] = splitAddress(address)
    const lines = [name, street, cityStateZip].filter(Boolean)

    lines.forEach((line, i) => {
      const size = fitFontSize(font, line, ADDRESS_MAX_WIDTH)
      page.drawText(line, {
        x: ADDRESS_LEFT,
        y: LINE_Y[i],
        size,
        font,
        color: rgb(0, 0, 0),
      })
    })
  }

  const bytes = await pdf.save()
  return new Blob([bytes], { type: 'application/pdf' })
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
