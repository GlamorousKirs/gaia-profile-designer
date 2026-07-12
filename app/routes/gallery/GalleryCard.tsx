import { useState, memo } from "react"
import { Link } from "react-router"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useColor } from "color-thief-react"

interface PresetCardProps {
	preset: any
	isPriority?: boolean
	onPreview: (preset: any) => void
}

export const PresetCard = memo(function PresetCard({ preset, isPriority = false, onPreview }: PresetCardProps) {
	const [imageError, setImageError] = useState(false)

	const rawThumbnail = preset.meta.thumbnail
	const isRemote = rawThumbnail?.startsWith("http")

	let imageSrc = ""

	if (isRemote) {
		imageSrc = `https://wsrv.nl/?url=${encodeURIComponent(rawThumbnail)}&w=800&output=webp&q=75`
	} else if (rawThumbnail) {
		const webpThumbnail = rawThumbnail.replace(/\.(png|jpg|jpeg)$/i, '.webp')
		const safeCategory = encodeURIComponent(preset.category)
		const safeId = encodeURIComponent(preset.id)

		imageSrc = `/premade/${safeCategory}/${safeId}/${webpThumbnail}`
	}

	const { data: extractedColor, loading } = useColor(
		rawThumbnail && !imageError ? imageSrc : "",
		"hex",
		{
			crossOrigin: "anonymous",
			quality: 20
		}
	)

	const bgColor = !loading && extractedColor ? extractedColor : "hsl(var(--secondary))"

	return (
		<Link
			to={`/studio?id=${preset.id}&category=${preset.category}`}
			className="group block relative w-full"
		>
			<Card className="relative flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-card p-2 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20">
				<div
					className="relative aspect-16/10 w-full overflow-hidden rounded-2xl flex items-center justify-center transition-opacity duration-300"
					style={{ backgroundColor: bgColor }}
				>
					{rawThumbnail && !imageError ? (
						<img
							src={imageSrc}
							alt={preset.meta.title}
							crossOrigin="anonymous"
							className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-700 group-hover:scale-105"
							loading={isPriority ? "eager" : "lazy"}
							fetchPriority={isPriority ? "high" : "low"}
							onError={() => setImageError(true)}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
							<span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
						</div>
					)}

					<div className="absolute top-3 left-3">
						<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-transparent text-[10px] font-semibold uppercase tracking-wider text-foreground/80">
							{preset.category}
						</Badge>
					</div>
				</div>

				<div className="flex items-center justify-between p-3 gap-2">
					<div className="space-y-0.5 overflow-hidden">
						<h3 className="text-sm font-semibold text-foreground truncate">
							{preset.meta.title}
						</h3>
						<p className="text-[11px] text-muted-foreground font-medium truncate">
							by {preset.meta.author.name}
						</p>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault()
								onPreview(preset)
							}}
							className="flex items-center justify-center h-8 px-4 rounded-xl bg-secondary text-[11px] font-medium text-foreground hover:bg-secondary/80 transition-colors cursor-pointer select-none"
						>
							Preview
						</button>

						<div className="flex items-center justify-center w-8 h-8 rounded-xl bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								className="w-4 h-4"
							>
								<path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
							</svg>
						</div>
					</div>
				</div>
			</Card>
		</Link>
	)
})
PresetCard.displayName = "PresetCard"