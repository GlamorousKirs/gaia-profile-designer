import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "lucide-react";

export function FAQ() {
	const faqs = [
    { q: "Is this officially affiliated with GaiaOnline?", a: "Gaia Profile Designer is not officially part of Gaia Online. This is a hobby project that I made to share my profile themes for everyone to use and to also help our coders make themes a bit more easy!" },
    { q: "Is this free to use?", a: "Everything you see here is completely free for everyone to use!" },
    { q: "Do I need to know how to code?", a: "To get the most out of this, yes. Having a bit of CSS knowledge is definitely the way to go. Since this is primarily a CSS editor, you’ll be writing your own code to bring your customizations to life. That said, even if you're a pro, I think you'll find this a massive breath of fresh air. While I’ve included a few handy tools like sliders and color pickers for the basics, the environment is really built for speed and convenience." },
    { q: "Why did you build this?", a: "Making profile themes has been a hobby of mine for years. I've been wanting to create a tool that would make it easy for me and anybody else to customize their Gaia profile." },
	];

	return (
		<section className="py-24">
			<div className="max-w-6xl mx-auto px-6">
				<div className="flex flex-col md:flex-row gap-12">
					<div className="md:w-1/3">
						<h2 className="text-6xl font-heading tracking-tighter leading-none text-foreground sticky top-24">
							<span className="block bg-clip-text text-transparent bg-linear-to-br from-white to-blue-200">
								ASKED
							</span>
							<span className="text-muted-foreground/20 italic font-light">
								FREQUENTLY
							</span>
						</h2>
					</div>
					<div className="md:w-2/3 space-y-2">
						{faqs.map((faq, i) => (
							<FAQItem key={i} {...faq} index={i + 1} />
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
	const [active, setActive] = useState(false);

	return (
		<motion.div
			className="relative border-b border-white/10"
			initial={false}
		>
			<button
				onClick={() => setActive(!active)}
				className="w-full flex items-center justify-between py-8 group text-left relative"
			>
				<div className="flex items-baseline gap-6">
					<span className="text-[10px] font-mono text-primary tracking-[0.2em]">
						0{index}
					</span>
					<span className={`text-xl font-light transition-all duration-500 ${active ? "text-primary" : "text-foreground group-hover:text-blue-200"}`}>
						{q}
					</span>
				</div>
				
				<div className="relative flex items-center justify-center w-8 h-8">
					<motion.div
						animate={{ 
							rotate: active ? 45 : 0, 
							scale: active ? 1.1 : 1 
						}}
						transition={{ type: "spring", stiffness: 200, damping: 15 }}
						className="text-primary z-10 relative"
					>
						<Sparkle 
							size={20} 
							strokeWidth={active ? 1.5 : 1} 
							fill={active ? "currentColor" : "transparent"} 
						/>
					</motion.div>
					
					{active && (
						<motion.div
							initial={{ scale: 0.5, opacity: 1 }}
							animate={{ scale: 2.5, opacity: 0 }}
							transition={{ duration: 0.8, ease: "easeOut" }}
							className="absolute inset-0 border border-primary/30 rounded-full"
						/>
					)}
				</div>
			</button>
			
			<AnimatePresence>
				{active && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="overflow-hidden"
					>
						<div className="pb-8 pl-12 border-l border-primary/20 ml-2">
							<p className="text-muted-foreground font-light leading-relaxed max-w-xl">
								{a}
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}