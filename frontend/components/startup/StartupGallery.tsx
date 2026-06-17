'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function StartupGallery({ images }: { images: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!images?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontFamily: 'Inter', fontSize: 14, color: '#6b6b6b' }}>
          No screenshots added yet.
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => setLightboxIndex(i)}
            style={{
              borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              aspectRatio: '16/10', border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <img src={src} alt={`Screenshot ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
              zIndex: 300, display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 40,
            }}
          >
            <img
              src={images[lightboxIndex]}
              alt=""
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
