import { useState, useEffect, lazy, Suspense } from "react"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router"

import type { Route } from "./+types/root"
import { ThemeProvider } from "next-themes"
import "./app.css"
import "@/themes/import-themes"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AnimatePresence } from "motion/react"

const Navbar = lazy(() => import("@/components/Navbar"))
const Preloader = lazy(() => import("@/components/Preloader"))

export function meta() {
  return [
    { title: "Gaia Profile Designer" },
    { name: "description", content: "Create and customize your unique profile designs with Gaia." },
  ]
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const MINIMUM_DELAY = 2000

    const startTime = Date.now()

    const deactivatePreloader = () => {
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, MINIMUM_DELAY - elapsedTime)

      setTimeout(() => {
        setLoading(false)
      }, remainingTime)
    }

    if (document.readyState === "complete") {
      deactivatePreloader()
    } else {
      window.addEventListener("load", deactivatePreloader)
      return () => window.removeEventListener("load", deactivatePreloader)
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" storageKey="theme" defaultTheme="system" enableSystem>
          <Suspense fallback={null}>
            <AnimatePresence>
              {loading && <Preloader loading={loading} onLoadingComplete={() => console.log("Done!")} />}
            </AnimatePresence>

            <main className={`w-full transition-opacity duration-700 ${!loading ? "opacity-100" : "opacity-0"}`}>
              <TooltipProvider>
                <Navbar />
                {children}
              </TooltipProvider>
            </main>
          </Suspense>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}
export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!"
  let details = "An unexpected error occurred."

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error"
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1 className="text-2xl font-bold">{message}</h1>
      <p>{details}</p>
    </main>
  )
}