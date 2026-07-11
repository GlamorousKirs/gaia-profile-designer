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

        const colorCache: Record<string, string> = {}

        const updateCachedColors = () => {
            const rootStyles = getComputedStyle(document.documentElement)
            colorKeys.forEach((key) => {
                colorCache[key] = rootStyles.getPropertyValue(key).trim() || "#6366f1"
            })
        }
        updateCachedColors()

        const observer = new MutationObserver(updateCachedColors)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "data-theme"],
        })

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1
            const width = window.innerWidth
            const height = window.innerHeight

            canvas.width = width * dpr
            canvas.height = height * dpr

            ctx.scale(dpr, dpr)
        }

        let resizeTimeout: NodeJS.Timeout
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(resizeCanvas, 100)
        }

        window.addEventListener("resize", handleResize)
        resizeCanvas()

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

        const animate = () => {
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
                ctx.fillStyle = colorCache[p.colorKey]
                ctx.fill()
                ctx.restore()
            })

            animationFrameId = requestAnimationFrame(animate)
        }

        animate()

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
                className="fixed inset-0 w-full h-full -z-10 pointer-events-none will-change-transform"
            />
            <div className="relative z-10">{children}</div>
        </div>
    )
}