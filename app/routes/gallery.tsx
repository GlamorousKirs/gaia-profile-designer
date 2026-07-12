import { useMemo, memo, useDeferredValue, useCallback, useEffect, useState, useTransition } from "react"
import { useSearchParams } from "react-router"
import { PRESETS } from "@/lib/presets"
import { GalleryHeader } from "@/routes/gallery/GalleryHeader"
import { PresetCard } from "@/routes/gallery/GalleryCard"
import { PreviewCanvas } from "@/components/PreviewCanvas"
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "motion/react"

const GRID_CONFIG = {
	1: "grid-cols-1 max-w-5xl mx-auto",
	2: "grid-cols-1 md:grid-cols-2",
	3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
	4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
} as const

const PresetItem = memo(({ preset, index, onPreview }: { preset: any, index: number, onPreview: (p: any) => void }) => (
	<motion.div
		layout
		initial={{ opacity: 0, scale: 0.95 }}
		animate={{ opacity: 1, scale: 1 }}
		exit={{ opacity: 0, scale: 0.95 }}
		transition={{
			layout: { type: "spring", stiffness: 300, damping: 30 },
			opacity: { duration: 0.2 }
		}}
	>
		<PresetCard preset={preset} isPriority={index < 4} onPreview={onPreview} />
	</motion.div>
))
PresetItem.displayName = "PresetItem"

const PresetList = memo(({ presets, gridClass, onPreview }: { presets: any[], gridClass: string, onPreview: (p: any) => void }) => {
	return (
		<motion.section layout className={`grid gap-6 ${gridClass} items-start`}>
			<AnimatePresence mode="popLayout" initial={false}>
				{presets.map((preset, index) => (
					<PresetItem key={preset.id} preset={preset} index={index} onPreview={onPreview} />
				))}
			</AnimatePresence>
			<div id="gallery-bottom" />
		</motion.section>
	)
})
PresetList.displayName = "PresetList"

export default function GalleryPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [isFloating, setIsFloating] = useState(false)
	const [isAtTop, setIsAtTop] = useState(true)
	const [isAtBottom, setIsAtBottom] = useState(false)
	const [activePreview, setActivePreview] = useState<any | null>(null)
	const [cssCode, setCssCode] = useState<string>("")
	const [, startTransition] = useTransition()

	const activeCategory = searchParams.get("category") || "all"
	const searchQuery = searchParams.get("q") || ""
	const currentPage = Number(searchParams.get("page")) || 1
	const gridCols = (Number(searchParams.get("cols")) || 4) as keyof typeof GRID_CONFIG

	const deferredQuery = useDeferredValue(searchQuery)

	const handleOpenPreview = useCallback(async (preset: any) => {
		try {
			const module = await import(`../premade/${preset.category}/${preset.id}/preset.css?raw`)
			setCssCode(module.default)
			setActivePreview(preset)
		} catch (err) {
			console.error("Failed to load preset:", err)
		}
	}, [])

	const filteredPresets = useMemo(() => PRESETS.filter((p: any) => {
		const matchesCategory = activeCategory === "all" || p.category === activeCategory
		const matchesSearch = p.meta.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
			p.id.toLowerCase().includes(deferredQuery.toLowerCase())
		return matchesCategory && matchesSearch
	}), [activeCategory, deferredQuery])

	const handleNavigate = useCallback((direction: 'next' | 'prev') => {
		const currentIndex = filteredPresets.findIndex(p => p.id === activePreview?.id)
		const newIndex = direction === 'next'
			? (currentIndex + 1) % filteredPresets.length
			: (currentIndex - 1 + filteredPresets.length) % filteredPresets.length
		handleOpenPreview(filteredPresets[newIndex])
	}, [activePreview, filteredPresets, handleOpenPreview])

	useEffect(() => {
		const handleScroll = () => {
			requestAnimationFrame(() => {
				const scrollY = window.scrollY
				setIsFloating(scrollY > 300)
				setIsAtTop(scrollY === 0)
				setIsAtBottom((window.innerHeight + scrollY) >= (document.body.offsetHeight - 100))
			})
		}
		window.addEventListener("scroll", handleScroll, { passive: true })
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	const updateParams = useCallback((newParams: Record<string, string | number | null>) => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams)
			Object.entries(newParams).forEach(([key, value]) => {
				if (value === null) params.delete(key)
				else params.set(key, String(value))
			})
			setSearchParams(params, { preventScrollReset: true })
		})
	}, [searchParams, setSearchParams])

	const paginatedPresets = useMemo(() => {
		const start = (currentPage - 1) * 16
		return filteredPresets.slice(start, start + 16)
	}, [filteredPresets, currentPage])

	return (
		<div className="container mx-auto py-20 px-4 relative">
			<GalleryHeader
				searchQuery={searchQuery}
				onSearchChange={(q) => updateParams({ q: q || null, page: 1 })}
				activeCategory={activeCategory}
				onCategoryChange={(c) => updateParams({ category: c === "all" ? null : c, page: 1 })}
				gridCols={gridCols}
				onGridChange={(c) => updateParams({ cols: c })}
			/>

			{Math.ceil(filteredPresets.length / 16) > 1 && (
				<div className="h-16 mt-8">
					<nav className={`w-fit mx-auto transition-all duration-300 ${isFloating ? "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-md p-2 rounded-xl border shadow-lg" : "border p-2 rounded-xl"}`}>
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) updateParams({ page: currentPage - 1 }); }} />
								</PaginationItem>
								{Array.from({ length: Math.ceil(filteredPresets.length / 16) }, (_, i) => i + 1).map((page) => (
									<PaginationItem key={page}>
										<PaginationLink href="#" isActive={page === currentPage} onClick={(e) => { e.preventDefault(); updateParams({ page }); }}>{page}</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem>
									<PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < Math.ceil(filteredPresets.length / 16)) updateParams({ page: currentPage + 1 }); }} />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</nav>
				</div>
			)}

			<div className="mt-8">
				<PresetList presets={paginatedPresets} gridClass={GRID_CONFIG[gridCols]} onPreview={handleOpenPreview} />
			</div>

			{activePreview && (
				<PreviewCanvas
					preset={activePreview}
					cssCode={cssCode}
					onClose={() => setActivePreview(null)}
					onNext={() => handleNavigate('next')}
					onPrev={() => handleNavigate('prev')}
				/>
			)}

			<div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
				{!isAtTop && (
					<Button variant="outline" size="icon" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
						<ArrowUp className="h-4 w-4" />
					</Button>
				)}
				{!isAtBottom && (
					<Button variant="outline" size="icon" onClick={() => document.getElementById("gallery-bottom")?.scrollIntoView({ behavior: "smooth" })}>
						<ArrowDown className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}