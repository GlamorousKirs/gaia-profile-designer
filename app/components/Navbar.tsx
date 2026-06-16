import { useState, useEffect, useRef, memo, useTransition } from "react"
import { Link, useLocation } from "react-router"
import { Sparkles, Menu, X } from "lucide-react"
import { ThemePicker } from "@/components/ThemePicker"

const NAV_LINKS = [
  { name: "Home", to: "/" },
  { name: "Gallery", to: "/gallery" },
  { name: "Creators", to: "/creators" },
] as const

const MobileDropdown = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <div
    role="navigation"
    aria-label="Mobile navigation"
    data-lenis-prevent
    className={`absolute left-0 top-20 w-full bg-background/95 backdrop-blur-xl border-b border-border transition-all duration-200 ease-in-out origin-top lg:hidden ${isOpen
      ? "opacity-100 translate-y-0 pointer-events-auto visibility-visible"
      : "opacity-0 -translate-y-2 pointer-events-none visibility-hidden"
      }`}
    style={{ transitionProperty: "transform, opacity" }}
  >
    <div className="container mx-auto flex flex-col items-center gap-4 px-6 py-8">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          onClick={onClose}
          className="text-on-surface w-full py-4 text-center text-sm font-bold tracking-widest uppercase hover:text-primary block transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          {link.name}
        </Link>
      ))}
    </div>
  </div>
))
MobileDropdown.displayName = "MobileDropdown"

const MenuButton = memo(({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-surface rounded-xl border border-border p-2.5 lg:hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer touch-manipulation"
    aria-expanded={isOpen}
    aria-label={isOpen ? "Close main menu" : "Open main menu"}
  >
    {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
  </button>
))
MenuButton.displayName = "MenuButton"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [, startTransition] = useTransition()
  const location = useLocation()
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: [0], rootMargin: "-20px 0px 0px 0px" }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleToggle = () => {
    startTransition(() => {
      setIsOpen(prev => !prev)
    })
  }

  const handleClose = () => {
    startTransition(() => {
      setIsOpen(false)
    })
  }

  if (location.pathname === "/studio") return null

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 h-5 w-full pointer-events-none" />

      <nav className="fixed top-0 left-0 z-50 w-full will-change-transform" aria-label="Main navigation">
        <div
          className={`absolute inset-0 -z-10 transition-opacity duration-300 ${isScrolled || isOpen ? "bg-background/70 backdrop-blur-xl opacity-100" : "bg-transparent opacity-0"
            }`}
        />
        <div
          className={`absolute bottom-0 left-0 h-px w-full bg-border transition-opacity duration-300 ${isScrolled || isOpen ? "opacity-100" : "opacity-0"
            }`}
        />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex h-20 items-center justify-between">

            <Link to="/" className="group flex shrink-0 items-center gap-2.5 outline-hidden" aria-label="Gaia Profile Design Home">
              <div className="bg-surface relative flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors group-hover:border-primary">
                <Sparkles size={20} className="text-primary" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase">Gaia</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-wide">Profile Design</span>
              </div>
            </Link>

            <div className="bg-surface/40 absolute left-1/2 hidden -translate-x-1/2 rounded-2xl border border-border p-1.5 backdrop-blur-md lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group relative font-bold tracking-widest uppercase transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-xl text-on-surface px-5 py-2 text-xs hover:text-primary"
                >
                  <span className="relative z-10">{link.name}</span>
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute -bottom-px left-1/2 h-px w-0 -translate-x-1/2 bg-linear-to-r from-transparent via-primary to-transparent opacity-0 transition-all duration-300 group-hover:w-full group-hover:opacity-100" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <ThemePicker />

              <div className="relative overflow-hidden rounded-2xl p-0.5">
                <div className="absolute inset-0 animate-conic-rotate" style={{ background: "conic-gradient(var(--chart-1), var(--chart-3), var(--chart-5), var(--chart-1))" }} />
                <Link to="/studio" className="relative z-10 flex items-center justify-center px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-2xl bg-background text-foreground transition-all hover:bg-background/90 outline-hidden">
                  Studio
                </Link>
              </div>

              <MenuButton isOpen={isOpen} onClick={handleToggle} />
            </div>
          </div>
        </div>

        <MobileDropdown isOpen={isOpen} onClose={handleClose} />
      </nav>
    </>
  )
}