import { Suspense, useEffect } from "react"
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLocation,
} from "react-router"
import { Toaster } from "@/components/ui/sonner"

import type { Route } from "./+types/root"
import { ThemeProvider } from "next-themes"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SmoothScroll } from "@/components/SmoothScroll"
import { migrateGStudioToGaia } from "@/lib/migrate"

import "./app.css"
import "@/themes/import-themes"

export function meta() {
	return [
		{ title: "Gaia Profile Designer" },
		{ name: "description", content: "Create, customize, and preview your unique profile designs with the ultimate Gaia Online profile tool. Build classic and custom BBCode designs effortlessly." },
		{ name: "keywords", content: "gaia online, gaia profile designer, gaia logo recolor, gaia online profiles" },
		{ property: "og:title", content: "Gaia Profile Designer" },
		{ property: "og:description", content: "Code Gaia Online profiles more conveniently with this CSS editor." },
		{ property: "og:type", content: "website" },
	]
}

export function Layout({ children }: { children: React.ReactNode }) {
	const location = useLocation()

	const isStudio = location.pathname === "/studio"
	const isHome = location.pathname === "/"

	const showFooter = !isStudio

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
				<meta httpEquiv="X-Content-Type-Options" content="nosniff" />
				<link href="https://fonts.googleapis.com" />
				<link href="https://fonts.gstatic.com" />
				<link href="https://fonts.googleapis.com/css2?family=Philosopher:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com" />
				<link href="https://fonts.gstatic.com" />
				<link href="https://fonts.googleapis.com/css2?family=Kalnia+Glaze&display=swap" rel="stylesheet" />
				<link href="https://fonts.googleapis.com" />
				<link href="https://fonts.gstatic.com" />
				<link href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap" rel="stylesheet" />
			</head>
			<body>
				<ThemeProvider attribute="data-theme" storageKey="theme" defaultTheme="catppuccin" enableSystem>
					<TooltipProvider>
						<SmoothScroll>
							<main className="w-full min-h-screen flex flex-col">
								<Navbar />
								<Suspense fallback={null}>
									<div className={showFooter ? "w-full container mx-auto py-20 flex-1" : "w-full flex-1"}>
										{children}
									</div>
								</Suspense>
								{showFooter && <Footer />}
							</main>
							<Toaster position="top-center" closeButton />
						</SmoothScroll>
					</TooltipProvider>
				</ThemeProvider>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	useEffect(() => {
		const runMigrations = async () => {
			const migrations = [
				{ oldKey: 'autosave_draft_code', newKey: 'autosave-draft-code' },
				{ oldKey: 'myapp_v1_autosave_code', newKey: 'autosave-code' }
			];

			migrations.forEach(({ oldKey, newKey }) => {
				const data = localStorage.getItem(oldKey);
				if (data && !localStorage.getItem(newKey)) {
					localStorage.setItem(newKey, data);
				}
				if (localStorage.getItem(oldKey) !== null) {
					localStorage.removeItem(oldKey);
				}
			});

			// Run database migration from gstudio to gaia-profile-designer
			await migrateGStudioToGaia();
		};

		runMigrations();
	}, []);

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