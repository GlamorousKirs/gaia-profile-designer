import { Hero } from "./home/hero"
import { Features } from "./home/features"
import { FAQ } from "./home/faq"
import { AnimatedBackground } from "@/components/AnimatedBackground"

export default function Home() {
  return (
    <AnimatedBackground>
      <Hero />
      <Features />
      <FAQ />
    </AnimatedBackground>
  )
}