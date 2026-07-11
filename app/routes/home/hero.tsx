import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { motion, type Variants } from "motion/react"

export function Hero() {
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.15,
				delayChildren: 0.1
			}
		}
	}

	const itemVariants: Variants = {
		hidden: { opacity: 0, y: 30 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { type: "spring", stiffness: 100, damping: 20 } as const
		}
	}

	return (
		<section className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-hidden px-4 pt-32 md:pt-40 text-foreground">
			<div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

			<motion.div
				className="z-10 flex w-full max-w-4xl flex-col items-center text-center mb-12 md:mb-16"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<motion.h1
					className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-extrabold tracking-tight leading-[0.9] bg-clip-text text-transparent bg-linear-to-b from-foreground to-primary/70 pb-5"
					variants={itemVariants}
				>
					GAIA PROFILE<br />DESIGNER
				</motion.h1>

				<motion.p
					className="mt-8 mx-auto max-w-150 text-base md:text-lg text-muted-foreground tracking-wide"
					variants={itemVariants}
				>
					A code editor for Gaia Online profiles.
				</motion.p>

				<motion.div
					className="flex flex-wrap items-center justify-center gap-4 mt-8"
					variants={itemVariants}
				>
					<Button size="lg" variant="outline" className="px-8">
						<Link to="/gallery">
							Browse Presets
						</Link>
					</Button>
					<Button size="lg" className="px-8">
						<Link to="/studio">
							Go to Studio
						</Link>
					</Button>
				</motion.div>
			</motion.div>

			<motion.div
				className="relative w-full max-w-6xl z-10 px-2 mb-20"
				initial={{ opacity: 0, y: 60, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
			>
				<div className="absolute -inset-2 rounded-2xl bg-linear-to-tr from-primary/10 via-sky-500/5 to-secondary/10 opacity-40 blur-xl" />

				<div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
					<div className="flex h-9 w-full items-center justify-start gap-1.5 border-b border-border bg-muted/40 px-4">
						<div className="h-2.5 w-2.5 rounded-full bg-border" />
						<div className="h-2.5 w-2.5 rounded-full bg-border" />
						<div className="h-2.5 w-2.5 rounded-full bg-border" />
					</div>

					<div className="w-full aspect-1905/943 relative bg-muted">
						<img
							src="/public/optimized-assets/studioshowcase.webp"
							alt="Gaia Studio Interface"
							className="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</div>
			</motion.div>
		</section>
	)
}