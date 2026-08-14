import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// US #10 envelope: 9.5in x 4.125in, landscape — 72pt per inch.
const ENVELOPE_WIDTH = 9.5 * 72
const ENVELOPE_HEIGHT = 4.125 * 72

// One page per recipient, sized exactly to a #10 envelope. Placement is
// intentionally plain (name + address block, roughly where a recipient
// address goes) — the visual design gets refined later; this just proves
// the page size and per-recipient iteration are correct.
export async function generateEnvelopePdf(recipients) {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontSize = 12
  const lineHeight = fontSize * 1.4

  for (const { name, address } of recipients) {
    const page = pdf.addPage([ENVELOPE_WIDTH, ENVELOPE_HEIGHT])
    const lines = [name, address]
    const startX = ENVELOPE_WIDTH * 0.52
    const startY = ENVELOPE_HEIGHT * 0.58

    lines.forEach((line, i) => {
      page.drawText(line, {
        x: startX,
        y: startY - i * lineHeight,
        size: fontSize,
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
