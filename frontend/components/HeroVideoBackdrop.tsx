'use client'
import { useEffect, useRef, useState } from 'react'

export default function HeroVideoBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    // Respect users with reduced-motion preference — 
    // show the static poster instead of autoplaying video
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause()
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }
    )

    const heroSection = video.closest('section')
    if (heroSection) observer.observe(heroSection)

    return () => observer.disconnect()
  }, [])

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      zIndex: 0,
    }}>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster="/video/hero-space-poster.jpg"
        onLoadedData={() => setLoaded(true)}
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'translate(-50%, -50%) scale(1.35)',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1.2s ease',
          // Desaturate + darken toward the site palette via filter —
          // raw space footage is too bright/colorful for this dark UI
          filter: 'brightness(0.45) saturate(0.55) contrast(1.05)',
        }}
      >
        <source src="/video/hero-space-trimmed.webm" type="video/webm" />
        <source src="/video/hero-space-trimmed.mp4" type="video/mp4" />
      </video>

      {/* Vignette + color-match overlay — pulls the video toward
          the site's near-black background at the edges so it blends
          into surrounding sections instead of having a hard video-rect
          boundary visible */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 100% 100% at 50% 0%, 
            transparent 0%, transparent 50%, rgba(10,10,10,0.95) 100%),
          linear-gradient(to bottom, 
            transparent 0%, transparent 70%, 
            rgba(10,10,10,1) 100%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Lime tint wash — ties the cold space footage back into
          your brand color so it doesn't feel like a stock asset
          dropped in unrelated to the rest of the site */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(200,241,53,0.025)',
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }} />
    </div>
  )
}
