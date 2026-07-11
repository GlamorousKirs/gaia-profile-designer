import { motion } from "framer-motion"
import { Hero } from "./home/hero"
import { Features } from "./home/features"
import { FAQ } from "./home/faq"
import { AnimatedBackground } from "@/components/AnimatedBackground"

export default function Home() {
	return (
		<AnimatedBackground>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.6 }}
			>
				<Hero />
			</motion.div>

			<motion.section 
				id="features" 
				className="p-5"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-100px" }}
				transition={{ duration: 0.8, ease: "easeOut" }}
			>
				<Features />
			</motion.section>

			<motion.section 
				id="faq" 
				className="m-10"
				initial={{ opacity: 0, y: 40 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true, margin: "-100px" }}
				transition={{ duration: 0.8, ease: "easeOut" }}
			>
				<FAQ />
			</motion.section>

			<motion.section 
				style={{ display: "flex", justifyContent: "center", padding: "20px" }}
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once: true }}
				transition={{ delay: 0.2, duration: 0.6 }}
			>
			</motion.section>
		</AnimatedBackground>
	)
}