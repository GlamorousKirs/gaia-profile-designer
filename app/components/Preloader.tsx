import { useMemo } from "react"
import { motion } from "motion/react"

interface Star {
  id: number
  left: string
  top: string
  size: number
  duration: number
  delay: number
}

export default function Preloader({
  onLoadingComplete
}: {
  loading: boolean
  onLoadingComplete: () => void
}) {
  const stars = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 2,
    }))
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      onAnimationComplete={(definition) => {
        if (definition === "exit" || (typeof definition === "object" && "opacity" in definition && definition.opacity === 0)) {
          onLoadingComplete()
        }
      }}
    >
      <div className="relative flex h-64 w-64 items-center justify-center">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-primary"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
            }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="z-10 flex flex-col items-center gap-1 text-foreground">
          <h1 className="text-xs font-medium uppercase tracking-[0.2em] opacity-90 font-small-caps">
            Gaia Profile Designer
          </h1>
          <motion.p
            className="text-[10px] font-normal uppercase tracking-widest opacity-50 font-small-caps"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            Loading...
          </motion.p>
        </div>
      </div>
    </motion.div>
  )
}