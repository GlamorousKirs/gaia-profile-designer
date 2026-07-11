import { useEffect } from "react"
import { useLocation } from "react-router"
import Lenis from "lenis"
import "lenis/dist/lenis.css"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const isStudio = location.pathname === "/studio"

    useEffect(() => {
        if (isStudio || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return
        }

        const lenis = new Lenis({
            autoRaf: true,
            lerp: 0.1,
            duration: 1.2,
            smoothWheel: true,
            touchMultiplier: 0,
        })

        window.lenisInstance = lenis

        return () => {
            window.lenisInstance = undefined
            lenis.destroy()
        }
    }, [isStudio])

    return <>{children}</>
}

declare global {
  interface Window {
    lenisInstance?: any;
  }
}