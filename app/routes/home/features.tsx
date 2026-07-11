import { motion, useMotionValue, useSpring, useTransform } from "motion/react"
import { Link } from "react-router"
import { useRef, type MouseEvent } from "react"

const baseUrl = import.meta.env.BASE_URL;

const FEATURES_DATA = [
	{
		name: "Snippets",
		desc: "Save and reuse lines of code instantly.",
		image: `${baseUrl}optimized-assets/snippet-feature.webp`,
		to: "/studio",
	},
	{
		name: "Logo Recolor",
		desc: "Recolor the Gaia logo for your profile header.",
		image: `${baseUrl}optimized-assets/logo-recolor-preview.webp`,
		to: "/logo-recolor",
	},
	{
		name: "Avatar Animator",
		desc: "Stylize your friend's or your avatar for your profile.",
		image: `${baseUrl}optimized-assets/avatar-animator.webp`,
		to: "/avatar-animation",
	},
] as const;

function TiltImage({ src, alt }: { src: string; alt: string }) {
	const ref = useRef<HTMLDivElement>(null)

	const x = useMotionValue(0)
	const y = useMotionValue(0)

	const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 })
	const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 })

	const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"])
	const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"])

	const glowX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"])
	const glowY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"])

	const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
		if (!ref.current) return

		const rect = ref.current.getBoundingClientRect()
		const width = rect.width
		const height = rect.height

		const mouseX = e.clientX - rect.left
		const mouseY = e.clientY - rect.top

		const xPct = mouseX / width - 0.5
		const yPct = mouseY / height - 0.5

		x.set(xPct)
		y.set(yPct)
	}

	const handleMouseLeave = () => {
		x.set(0)
		y.set(0)
	}

	return (
		<div
			ref={ref}
			onMouseMove={handleMouseMove}
			onMouseLeave={handleMouseLeave}
			className="relative w-full aspect-16/10 rounded-3xl border border-border/80 bg-linear-to-br from-card to-muted p-2 overflow-hidden perspective-distant shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-500 group"
		>
			<motion.div
				style={{
					rotateX,
					rotateY,
					transformStyle: "preserve-3d",
				}}
				className="relative w-full h-full rounded-2xl overflow-hidden"
			>
				<div className="absolute inset-0 bg-linear-to-t from-background/40 to-transparent z-10" />
				
				<motion.div
					className="absolute inset-0 opacity-0 group-hover:opacity-100 z-20 transition-opacity duration-500 mix-blend-screen"
					style={{
						background: useTransform(
							[glowX, glowY],
							(latest) => `radial-gradient(circle at ${latest[0]} ${latest[1]}, rgba(var(--primary-rgb), 0.15) 0%, transparent 60%)`
						),
					}}
				/>

				<img
					src={src}
					alt={alt}
					className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
					style={{
						transform: "translateZ(40px)",
					}}
				/>
			</motion.div>
		</div>
	)
}

export function Features() {
	return (
		<section className="relative py-32 overflow-hidden">
			<div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-125 h-125 bg-primary/5 rounded-full blur-[120px]" />

			<div className="container mx-auto px-4 relative z-10">
				<div className="flex flex-col items-center mb-28">
					<motion.h2 
						className="text-center text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
						initial={{ opacity: 0, letterSpacing: "-0.05em" }}
						whileInView={{ opacity: 1, letterSpacing: "-0.02em" }}
						viewport={{ once: true }}
						transition={{ duration: 0.8 }}
					>
						Features
					</motion.h2>
				</div>

				<div className="flex flex-col gap-40 max-w-5xl mx-auto">
					{FEATURES_DATA.map((feature, idx) => {
						const isEven = idx % 2 === 0

						return (
							<motion.div
								key={feature.name}
								className={`flex flex-col gap-12 lg:gap-20 md:items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
								initial={{ opacity: 0, y: 60 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-100px" }}
								transition={{ duration: 0.7, ease: [0.21, 1.02, 0.43, 1.01] }}
							>
								<div className="w-full md:w-1/2">
									<TiltImage src={feature.image} alt={feature.name} />
								</div>

								<div className="w-full md:w-1/2 space-y-6 px-4">
									<div className="space-y-3">
										<h3 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground bg-clip-text transition-all duration-300">
											{feature.name}
										</h3>
										<p className="text-base text-muted-foreground leading-relaxed max-w-md font-medium">
											{feature.desc}
										</p>
									</div>
									
									<div className="pt-2">
										<Link 
											to={feature.to} 
											className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary group relative"
										>
											<span>Explore Tool</span>
											<span className="transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
											<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
										</Link>
									</div>
								</div>
							</motion.div>
						)
					})}
				</div>
			</div>
		</section>
	)
}