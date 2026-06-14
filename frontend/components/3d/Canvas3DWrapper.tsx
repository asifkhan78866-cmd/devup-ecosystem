'use client'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { Suspense, useRef, useEffect, useState } from 'react'

interface Props extends Omit<CanvasProps, 'children'> {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function Canvas3DWrapper({
  children, fallback, className, style, ...canvasProps
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Only mount canvas when scrolled into view —
  // and unmount (releasing WebGL context) when far out of view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        {fallback || null}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {isVisible && (
        <Canvas
          {...canvasProps}
          onCreated={({ gl }) => {
            // Listen for context loss — recover gracefully
            // instead of letting it crash the React tree
            gl.domElement.addEventListener(
              'webglcontextlost',
              (e) => {
                e.preventDefault()
                console.warn('WebGL context lost — will not crash')
                setHasError(true)
              },
              false
            )
            // Forward to consumer's onCreated if provided
            canvasProps.onCreated?.({ gl } as any)
          }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
