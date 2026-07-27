import { useRef } from 'react'

// Drag-to-pan + zoom cropper. Doesn't touch the source image at all — it
// just saves a position/zoom (x, y, zoom) applied via CSS object-position
// and transform:scale wherever the directory card renders this photo. The
// notary's own subdomain reads the original photo file directly and never
// sees these values, so this can't affect it.
export default function PhotoCropper({ src, x = 0.5, y = 0.5, zoom = 1, onChange }) {
  const boxRef = useRef(null)
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  function startDrag(clientX, clientY) {
    dragging.current = true
    last.current = { x: clientX, y: clientY }
  }

  function moveDrag(clientX, clientY) {
    if (!dragging.current || !boxRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const dx = (clientX - last.current.x) / rect.width
    const dy = (clientY - last.current.y) / rect.height
    last.current = { x: clientX, y: clientY }
    const nx = Math.min(1, Math.max(0, x - dx / zoom))
    const ny = Math.min(1, Math.max(0, y - dy / zoom))
    onChange({ x: nx, y: ny, zoom })
  }

  function endDrag() {
    dragging.current = false
  }

  if (!src) return null

  return (
    <div className="photo-cropper-wrap">
      <div
        ref={boxRef}
        className="photo-cropper"
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            objectFit: 'cover',
            objectPosition: `${x * 100}% ${y * 100}%`,
            transform: `scale(${zoom})`,
          }}
        />
      </div>
      <label className="photo-cropper__zoom">
        Zoom
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(e) => onChange({ x, y, zoom: parseFloat(e.target.value) })}
        />
      </label>
      <p className="photo-cropper__hint">
        Drag the photo to reposition it. This only changes how it looks in the notary directory —
        the photo on the notary&rsquo;s own site is untouched.
      </p>
    </div>
  )
}
