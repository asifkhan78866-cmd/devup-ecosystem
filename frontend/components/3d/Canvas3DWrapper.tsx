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
  // Instead of unmounting the canvas (which causes WebGL context loss on Safari/iOS),
  // we just pause the rendering loop when out of view.
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

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <Canvas
        {...canvasProps}
        frameloop={isVisible ? 'always' : 'never'}
        onCreated={(state) => {
          // Listen for context loss to prevent React tree crash
          state.gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault()
              console.warn('WebGL context lost — R3F will attempt to restore')
            },
            false
          )
          // Forward to consumer's onCreated if provided
          canvasProps.onCreated?.(state)
        }}
      >
        <Suspense fallback={fallback || null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
