import { useState, memo } from "react"
import { Link } from "react-router"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useColor } from "color-thief-react"

interface PresetCardProps {
    preset: any
    isPriority?: boolean
}

export const PresetCard = memo(function PresetCard({ preset, isPriority = false }: PresetCardProps) {
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

        imageSrc = `/presets/${safeCategory}/${safeId}/${webpThumbnail}`
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
            className="group block relative w-full transition-transform duration-500 ease-out hover:-translate-y-1"
        >
            <div className="absolute inset-x-2 -top-1.5 h-3 rounded-2xl border border-border bg-card/40 transition-transform duration-500 group-hover:-translate-y-0.5" />
            <div className="absolute inset-x-4 -top-3 h-3 rounded-2xl border border-border/60 bg-card/20 transition-transform duration-500 group-hover:-translate-y-1" />

            <Card className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-sm transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-md">

                <div
                    className="relative aspect-[4/3] w-full overflow-hidden rounded-xl transition-colors duration-500 ease-out flex items-center justify-center bg-muted/20"
                    style={{ backgroundColor: bgColor }}
                >
                    {rawThumbnail && !imageError ? (
                        <img
                            src={imageSrc}
                            alt={preset.meta.title}
                            crossOrigin="anonymous"
                            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-103 will-change-transform"
                            loading={isPriority ? "eager" : "lazy"}
                            fetchPriority={isPriority ? "high" : "low"}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                            <span className="text-[10px] font-bold uppercase tracking-widest">No Preview</span>
                        </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 z-10">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur-md border-border text-[9px] font-bold uppercase tracking-wider py-0 px-2 text-foreground shadow-sm">
                            {preset.category}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center justify-between p-2.5 pt-2">
                    <div className="space-y-0.5">
                        <h3 className="text-sm font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
                            {preset.meta.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-medium">
                            {preset.meta.author.name}
                        </p>
                    </div>

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </Card>
        </Link>
    )
})
PresetCard.displayName = "PresetCard"