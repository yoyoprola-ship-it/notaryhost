import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

// US #10 envelope: 9.5in x 4.125in, landscape — 72pt per inch.
const ENVELOPE_WIDTH = 9.5 * 72
const ENVELOPE_HEIGHT = 4.125 * 72

// The "TO:" block used to have 4 ruled lines to write on; now that the
// address is always machine-printed (never handwritten), the lines were
// removed from the artwork. The 3 lines of text (name, street,
// city/state/zip) sit close together like a normal address block,
// vertically centered on the old lines' midpoint rather than stretched
// across their full span — x runs 5.7in–7.85in (measured off the
// original ruled lines).
const ADDRESS_LEFT = 5.7 * 72
const ADDRESS_RIGHT = 7.85 * 72
const ADDRESS_MAX_WIDTH = ADDRESS_RIGHT - ADDRESS_LEFT
const ADDRESS_CENTER_Y = ((1.608 + 0.768) / 2) * 72
const LINE_GAP = 0.26 * 72
const LINE_Y = [ADDRESS_CENTER_Y + LINE_GAP, ADDRESS_CENTER_Y, ADDRESS_CENTER_Y - LINE_GAP]

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

// Names/addresses are arbitrary recipient data we don't control, and
// pdf-lib's custom-font text shaping silently corrupts "fi"/"fl"/"ff"
// ligatures into stray characters once a document accumulates enough
// pages (seen for real on generated batches — "Fiscales" -> "'scales",
// "Office" -> "of'ce"). Ligatures are a pure cosmetic nicety here, so
// instead of drawing a line in one call (letting the font fuse those
// letter pairs), each piece between ligature-forming pairs is drawn as
// its own call — the shaper never sees "f" next to "i/l/f" in the same
// run, so it can't form the glyph that was corrupting.
const LIGATURE_SPLIT = /(?<=f)(?=[fil])/g

function drawTextNoLigatures(page, text, { x, y, size, font, color }) {
  let cursorX = x
  for (const piece of text.split(LIGATURE_SPLIT)) {
    if (piece === '') continue
    page.drawText(piece, { x: cursorX, y, size, font, color })
    cursorX += font.widthOfTextAtSize(piece, size)
  }
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
      drawTextNoLigatures(page, line, { x: ADDRESS_LEFT, y: LINE_Y[i], size, font, color: rgb(0, 0, 0) })
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
