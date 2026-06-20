// components/AnimatedBackground.tsx
import { useEffect, useRef } from "react"

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    const colorKeys = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]
    
    // Cache object to prevent layout thrashing inside animate()
    const colorCache: Record<string, string> = {}

    // 1. Efficiently update colors only when theme changes
    const updateCachedColors = () => {
      const rootStyles = getComputedStyle(document.documentElement)
      colorKeys.forEach((key) => {
        colorCache[key] = rootStyles.getPropertyValue(key).trim() || "#6366f1"
      })
    }
    updateCachedColors()

    // Listen for dark mode toggle on <html> or <body>
    const observer = new MutationObserver(updateCachedColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    })

    // 2. High-DPI (Retina) Canvas Resizing
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      
      // Scale context back down so drawing coordinates match CSS pixels
      ctx.scale(dpr, dpr)
    }

    // Simple resize debounce/throttle wrapper
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }
    
    window.addEventListener("resize", handleResize)
    resizeCanvas()

    // 3. Particle Configuration
    const particles: Array<{
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      alpha: number
      colorKey: string
    }> = []

    const particleCount = 50
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.5 + 0.8,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.4 + 0.2,
        colorKey: colorKeys[i % colorKeys.length],
      })
    }

    // 4. Ultra-Optimized Animation Loop
    const animate = () => {
      // Use window bounds instead of canvas bounds because canvas width is multiplied by DPR
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        
        ctx.save()
        ctx.globalAlpha = p.alpha
        // Fast instant read from local JS object cache
        ctx.fillStyle = colorCache[p.colorKey] 
        ctx.fill()
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(resizeTimeout)
      observer.disconnect()
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        // will-change-transform tells browser to layer-optimize this element
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none will-change-transform"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}