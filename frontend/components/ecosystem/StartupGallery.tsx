import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function StartupGallery({ images }: { images: string[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [selectedIndex])

  if (!images || images.length === 0) return null

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={{ fontFamily: 'var(--font-syne), sans-serif', fontSize: 20, color: '#fff', marginBottom: 24 }}>
        Product Screenshots
      </h3>
      
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 16 
      }}>
        {images.map((src, i) => (
          <div 
            key={i}
            onClick={() => setSelectedIndex(i)}
            style={{
              width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden',
              cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative'
            }}
          >
            <img 
              src={src} alt={`Screenshot ${i + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div 
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <button 
            onClick={() => setSelectedIndex(null)}
            style={{
              position: 'absolute', top: 24, right: 24, background: 'none', border: 'none',
              color: '#fff', cursor: 'pointer', zIndex: 10
            }}
          >
            <X size={32} />
          </button>
          
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', width: '100%', maxWidth: 1200, aspectRatio: '16/9', background: '#000', borderRadius: 8, overflow: 'hidden' }}
          >
            <img 
              src={images[selectedIndex]} 
              alt={`Screenshot ${selectedIndex + 1}`} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
            
            {selectedIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1) }}
                style={{
                  position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                  width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={32} />
              </button>
            )}
            
            {selectedIndex < images.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1) }}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                  width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
