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
		showLink: false,
		className: "md:col-span-2",
	},
	{
		name: "Color Libraries",
		desc: "Create and manage up to 100 folders to curate your own color schemes.",
		image: `${baseUrl}optimized-assets/color-libraries.webp`,
		to: "#",
		showLink: false,
		className: "md:col-span-1",
	},
	{
		name: "Gaia Logo Recoloring",
		desc: "Recolor the Gaia logo.",
		image: `${baseUrl}optimized-assets/logo-recolor-preview.webp`,
		to: "/logo-recolor",
		showLink: true,
		className: "md:col-span-1",
	},
	{
		name: "Avatar Decoration",
		desc: "Stylize your avatar for your profile.",
		image: `${baseUrl}optimized-assets/avatar-animator.webp`,
		to: "/avatar-animation",
		showLink: true,
		className: "md:col-span-2",
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

	const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
		if (!ref.current) return
		const rect = ref.current.getBoundingClientRect()
		x.set((e.clientX - rect.left) / rect.width - 0.5)
		y.set((e.clientY - rect.top) / rect.height - 0.5)
	}

	return (
		<div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={() => { x.set(0); y.set(0) }} className="relative w-full aspect-16/10 rounded-3xl border overflow-hidden perspective-distant shadow-lg">
			<motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="w-full h-full">
				<img src={src} alt={alt} className="w-full h-full object-cover" style={{ transform: "translateZ(40px)" }} />
			</motion.div>
		</div>
	)
}

export function Features() {
	return (
		<section className="relative py-30 overflow-hidden">
			<div className="container mx-auto px-4 relative z-10">
				<div className="text-center mb-10">
					<motion.h2 
						className="text-4xl font-extrabold tracking-tight sm:text-5xl" 
						style={{ fontFamily: "Philosopher, sans-serif" }}
						initial={{ opacity: 0, y: 20 }} 
						whileInView={{ opacity: 1, y: 0 }} 
						viewport={{ once: true }}
					>
						Features
					</motion.h2>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min grid-flow-dense max-w-7xl mx-auto">
					{FEATURES_DATA.map((feature) => (
						<motion.div
							key={feature.name}
							className={`p-6 rounded-3xl border border-border/50 bg-card/50 flex flex-col ${feature.className}`}
							initial={{ opacity: 0, scale: 0.95 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
						>
							<div className="flex-shrink-0">
								<TiltImage src={feature.image} alt={feature.name} />
							</div>
							
							<div className="mt-6 space-y-2 flex-grow">
								<h3 className="text-xl font-bold">{feature.name}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{feature.desc}
								</p>
							</div>

							{feature.showLink && (
								<div className="mt-6 pt-4 border-t border-border/50">
									<Link to={feature.to} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
										Explore &rarr;
									</Link>
								</div>
							)}
						</motion.div>
					))}
				</div>
			</div>
		</section>
	)
}