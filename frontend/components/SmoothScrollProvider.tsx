'use client'
import { ReactLenis } from 'lenis/react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const lenisRef = useRef<any>(null)

  // Reset scroll position on route change —
  // prevents Lenis from holding stale scroll state
  // tied to the previous page's DOM height
  useEffect(() => {
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true })
  }, [pathname])

  return (
    <ReactLenis
      ref={lenisRef}
      root
      options={{
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        // CRITICAL: `root` mode applies scroll to <html> directly —
        // no wrapper/content divs are injected around children.
        // This prevents the insertBefore/removeChild errors that
        // occur when Lenis wrapper divs conflict with Next.js
        // App Router's child reconciliation during navigation.
      }}
    >
      {children}
    </ReactLenis>
  )
}
