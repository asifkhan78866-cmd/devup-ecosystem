'use client'
import { useEffect, useRef } from 'react'

const SYMBOLS = [
  '🚀','💡','⚡','💰','🎯','📈','🏆','💻','🔗','🛠️',
  '🌐','👥','💎','🔥','⭐','🎓','📊','🤝','⚙️','🧠',
  '💼','🪙','📱','🌱','✦','◆','▸','⬡','✺','⊕',
  '$','€','%','@','#','→','↗','∞','≈','△','○','□',
  '🏗️','🎪','£','¥','&','*','+','⟶'
]

interface Symbol {
  x: number
  y: number
  symbol: string
  fontSize: number
  opacity: number
  maxOpacity: number
  speed: number
  drift: number
  phase: 'fadein' | 'visible' | 'fadeout'
  phaseProgress: number
  color: string
}

export default function FloatingSymbols({ 
  opacity = 1 
}: { 
  opacity?: number 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const symbolsRef = useRef<Symbol[]>([])
  const rafRef = useRef<number>(0)

  const COLORS = [
    'rgba(255,255,255,',
    'rgba(99,102,241,',
    'rgba(168,85,247,',
    'rgba(255,255,255,',
    'rgba(255,255,255,',
  ]

  function createSymbol(canvas: HTMLCanvasElement, startAtBottom = true): Symbol {
    return {
      x: Math.random() * canvas.width,
      y: startAtBottom 
        ? canvas.height + Math.random() * 100 
        : Math.random() * canvas.height,
      symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      fontSize: 10 + Math.random() * 10,
      opacity: 0,
      maxOpacity: (0.08 + Math.random() * 0.12) * opacity,
      speed: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      phase: 'fadein',
      phaseProgress: 0,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize symbols spread across screen
    symbolsRef.current = Array.from({ length: 90 }, () =>
      createSymbol(canvas, false)
    )

    function animate() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      symbolsRef.current = symbolsRef.current.map(sym => {
        const s = { ...sym }

        // Move upward + drift
        s.y -= s.speed
        s.x += s.drift
        s.phaseProgress += 0.008

        // Phase transitions
        if (s.phase === 'fadein') {
          s.opacity = Math.min(s.opacity + 0.003, s.maxOpacity)
          if (s.opacity >= s.maxOpacity) {
            s.phase = 'visible'
            s.phaseProgress = 0
          }
        } else if (s.phase === 'visible') {
          if (s.phaseProgress > 1.5) {
            s.phase = 'fadeout'
            s.phaseProgress = 0
          }
        } else if (s.phase === 'fadeout') {
          s.opacity = Math.max(s.opacity - 0.003, 0)
        }

        // Reset when off screen or fully faded
        if (s.y < -50 || (s.phase === 'fadeout' && s.opacity <= 0)) {
          return createSymbol(canvas, true)
        }

        // Draw
        ctx.save()
        ctx.globalAlpha = s.opacity
        ctx.font = `${s.fontSize}px Arial`
        ctx.fillStyle = `${s.color}${s.opacity})`
        ctx.fillText(s.symbol, s.x, s.y)
        ctx.restore()

        return s
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [opacity])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
