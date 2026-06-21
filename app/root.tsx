import { Suspense, useState, useEffect } from "react"
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
} from "react-router"

import type { Route } from "./+types/root"
import { ThemeProvider } from "next-themes"
import Navbar from "@/components/Navbar"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./app.css"
import "@/themes/import-themes"

export function meta() {
  return [
    { title: "Gaia Profile Designer" },
    { name: "description", content: "Create and customize your unique profile designs with Gaia." },
  ]
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isStudio = isMounted && location.pathname === '/studio'
  const isHome = isMounted && location.pathname === '/'

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
          <TooltipProvider>
            <main className="w-full min-h-screen flex flex-col">
              <Navbar />
              <Suspense fallback={null}>
                <div className={(!isStudio && !isHome) ? "w-full container mx-auto py-20" : "w-full"}>
                  {children}
                </div>
              </Suspense>
            </main>
          </TooltipProvider>
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