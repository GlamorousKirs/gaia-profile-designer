import { memo, useRef, useEffect, useState } from "react"
import { Canvas } from "@/components/Canvas"
import { X, Copy, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const TARGET_WIDTH = 1920
const TARGET_HEIGHT = 1080

export const PreviewCanvas = memo(function PreviewCanvas({ preset, cssCode, onClose, onNext, onPrev }: any) {
	const [isFocused, setIsFocused] = useState(false)
	const wrapperRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const wrapper = wrapperRef.current
		if (!wrapper) return
		
		const observer = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect
			const scale = Math.min(1, width / TARGET_WIDTH, height / TARGET_HEIGHT)
			wrapper.style.setProperty('--canvas-scale', `${scale}`)
		})
		
		observer.observe(wrapper)
		return () => observer.disconnect()
	}, [])

	const handleCopyCss = () => {
		navigator.clipboard.writeText(cssCode)
	}

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 md:p-8">
			<div className="relative w-full h-full bg-card rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col">
				<div className="flex items-center justify-between p-4 border-b">
					<div className="flex items-center gap-4">
						<h2 className="font-semibold text-lg">{preset.meta.title}</h2>
						<span className="text-xs font-mono bg-secondary px-2 py-1 rounded-md text-muted-foreground">{preset.category}</span>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" onClick={() => setIsFocused(!isFocused)}>
							<Maximize2 className="w-5 h-5" />
						</Button>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="w-5 h-5" />
						</Button>
					</div>
				</div>

				<div ref={wrapperRef} className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-muted/20">
					{!isFocused && (
						<>
							<Button 
								variant="secondary" 
								size="icon" 
								className="absolute left-4 z-10 h-12 w-12 rounded-full shadow-lg" 
								onClick={onPrev}
							>
								<ChevronLeft className="w-6 h-6" />
							</Button>
							
							<Button 
								variant="secondary" 
								size="icon" 
								className="absolute right-4 z-10 h-12 w-12 rounded-full shadow-lg" 
								onClick={onNext}
							>
								<ChevronRight className="w-6 h-6" />
							</Button>
						</>
					)}

					<Canvas
						isMaximized={isFocused} 
						activeTool={null}
						cssCode={cssCode}
						presetId={preset.id}
						category={preset.category}
						version="v2"
					/>
				</div>

				<div className="h-16 border-t flex items-center justify-end px-4 bg-background">
					<Button onClick={handleCopyCss} className="gap-2">
						<Copy className="w-4 h-4" />
						Copy CSS
					</Button>
				</div>
			</div>
		</div>
	)
})
PreviewCanvas.displayName = "PreviewCanvas"