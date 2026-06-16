import { useState, useEffect, useRef, useMemo, memo, useDeferredValue, useCallback } from "react"
import { PRESETS } from "@/lib/presets"
import { GalleryHeader } from "@/routes/gallery/GalleryHeader"
import { PresetCard } from "@/routes/gallery/GalleryCard"
import { Button } from "@/components/ui/button"
import { Square, Columns2, Columns3, Columns4 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-is-mobile"

const SCROLL_THRESHOLD_REM = 25

// Performance optimization: Preload the top critical path image straight out of the router strategy 
export function meta() {
    const topPreset = PRESETS[0]
    if (!topPreset || !topPreset.meta.thumbnail) return [{ title: "Gaia Profile Designer - Gallery" }]
    
    const imageSrc = topPreset.meta.thumbnail.startsWith("http")
        ? topPreset.meta.thumbnail
        : `/presets/${topPreset.category}/${topPreset.id}/${topPreset.meta.thumbnail}`

    return [
        { title: "Gaia Profile Designer - Gallery" },
        { tagName: "link", rel: "preload", as: "image", href: imageSrc }
    ]
}

// 1. Static optimized card wrapper utilizing hardware accelerated CSS
const PresetList = memo(({ presets, gridClass }: { presets: any[], gridClass: string }) => {
    return (
        <section 
            className={`grid gap-6 ${gridClass}`}
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}
        >
            {presets.map((preset: any, index: number) => {
                const isAboveFold = index < 4
                return (
                    <div
                        key={preset.id}
                        // Tailwind fade-in and scale shift without the heavy weight of JS Framer hooks
                        className="transition-all duration-300 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                        style={{ 
                            animationDelay: `${Math.min(index * 40, 300)}ms`,
                            animationFillMode: 'both'
                        }}
                    >
                        <PresetCard preset={preset} isPriority={isAboveFold} />
                    </div>
                )
            })}
        </section>
    )
})
PresetList.displayName = "PresetList"

export default function GalleryPage() {
    const [activeCategory, setActiveCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    
    // Drop execution viewport scope down from 20 to 8 to achieve instantaneous paints
    const [visibleCount, setVisibleCount] = useState(8)
    const [gridCols, setGridCols] = useState<1 | 2 | 3 | 4>(3)
    const observerTarget = useRef<HTMLDivElement>(null)
    const deferredQuery = useDeferredValue(searchQuery)
    const isMobile = useIsMobile()

    const handleSearchChange = useCallback((query: string) => setSearchQuery(query), [])
    const handleCategoryChange = useCallback((category: string) => setActiveCategory(category), [])

    const filteredPresets = useMemo(() => PRESETS.filter((p: any) => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory
        const matchesSearch = p.meta.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
            p.id.toLowerCase().includes(deferredQuery.toLowerCase())
        return matchesCategory && matchesSearch
    }), [activeCategory, deferredQuery])

    const gridClass = useMemo(() => {
        const maps = { 
            1: "grid-cols-1 max-w-2xl mx-auto", 
            2: "grid-cols-1 md:grid-cols-2", 
            3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 
            4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
        }
        return maps[gridCols]
    }, [gridCols])

    useEffect(() => { setVisibleCount(8) }, [activeCategory, deferredQuery])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    // Pull full sizing metrics downstream once the user scans downward
                    setVisibleCount((prev) => Math.min(prev + 16, filteredPresets.length))
                }
            },
            { threshold: 0, rootMargin: `${SCROLL_THRESHOLD_REM * 16}px` }
        )
        
        const currentTarget = observerTarget.current
        if (currentTarget) observer.observe(currentTarget)
        return () => {
            if (currentTarget) observer.unobserve(currentTarget)
        }
    }, [filteredPresets.length])

    return (
        <div className="container mx-auto py-20 px-4">
            <GalleryHeader searchQuery={searchQuery} onSearchChange={handleSearchChange} activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
            {!isMobile && (
                <div className="flex justify-center mb-12 gap-2">
                    {[1, 2, 3, 4].map((col) => (
                        <Button key={col} variant={gridCols === col ? "default" : "outline"} size="icon" onClick={() => setGridCols(col as 1|2|3|4)}>
                            {col === 1 ? <Square className="w-4 h-4" /> : col === 2 ? <Columns2 className="w-4 h-4" /> : col === 3 ? <Columns3 className="w-4 h-4" /> : <Columns4 className="w-4 h-4" />}
                        </Button>
                    ))}
                </div>
            )}
            <PresetList presets={filteredPresets.slice(0, visibleCount)} gridClass={gridClass} />
            {visibleCount < filteredPresets.length && (
                <div ref={observerTarget} className="h-20 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Loading more...</p>
                </div>
            )}
        </div>
    )
}