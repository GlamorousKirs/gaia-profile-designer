import { useMemo, memo, useDeferredValue, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { PRESETS } from "@/lib/presets"
import { GalleryHeader } from "@/routes/gallery/GalleryHeader"
import { PresetCard } from "@/routes/gallery/GalleryCard"
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
import { motion, AnimatePresence } from "motion/react";

interface Preset {
	id: string
	category: string
	meta: { title: string; thumbnail?: string }
}

const PresetList = memo(({ presets, gridClass }: { presets: Preset[], gridClass: string }) => {
	return (
		<motion.section 
			layout
			className={`grid gap-6 ${gridClass}`}
		>
			<AnimatePresence mode="popLayout">
				{presets.map((preset, index) => (
					<motion.div
						key={preset.id}
						layout
						transition={{ 
							layout: {
								type: "spring",
								stiffness: 200,
								damping: 25
							},
							opacity: { duration: 0.2 }
						}}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						<PresetCard preset={preset} isPriority={index < 4} />
					</motion.div>
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
	
	const activeCategory = searchParams.get("category") || "all"
	const searchQuery = searchParams.get("q") || ""
	const currentPage = Number(searchParams.get("page")) || 1
	const gridCols = Number(searchParams.get("cols") || 4) as 1 | 2 | 3 | 4
	
	const itemsPerPage = 16
	const deferredQuery = useDeferredValue(searchQuery)

	useEffect(() => {
		const handleScroll = () => {
			setIsFloating(window.scrollY > 300)
			setIsAtTop(window.scrollY === 0)
			
			const bottomReached = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 100)
			setIsAtBottom(bottomReached)
		}
		window.addEventListener("scroll", handleScroll, { passive: true })
		handleScroll()
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	const updateParams = useCallback((newParams: Record<string, string | number | null>) => {
		const params = new URLSearchParams(searchParams)
		Object.entries(newParams).forEach(([key, value]) => {
			if (value === null) params.delete(key)
			else params.set(key, String(value))
		})
		setSearchParams(params, { preventScrollReset: true })
	}, [searchParams, setSearchParams])

	const filteredPresets = useMemo(() => PRESETS.filter((p: Preset) => {
		const matchesCategory = activeCategory === "all" || p.category === activeCategory
		const matchesSearch = p.meta.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
			p.id.toLowerCase().includes(deferredQuery.toLowerCase())
		return matchesCategory && matchesSearch
	}), [activeCategory, deferredQuery])

	const totalPages = Math.ceil(filteredPresets.length / itemsPerPage)
	const paginatedPresets = useMemo(() => {
		const start = (currentPage - 1) * itemsPerPage
		return filteredPresets.slice(start, start + itemsPerPage)
	}, [filteredPresets, currentPage])

	const gridClass = useMemo(() => ({ 
		1: "grid-cols-1 max-w-5xl mx-auto", 
		2: "grid-cols-1 md:grid-cols-2", 
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", 
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
	})[gridCols], [gridCols])

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
			
			{totalPages > 1 && (
				<div className="h-16 mt-8">
					<nav 
						aria-label="Pagination"
						className={`w-fit mx-auto transition-all duration-300 ${
							isFloating 
								? "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-md p-2 rounded-xl border shadow-lg" 
								: "border p-2 rounded-xl"
						}`}
					>
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious 
										href="#"
										aria-disabled={currentPage === 1}
										onClick={(e) => { e.preventDefault(); if (currentPage > 1) updateParams({ page: currentPage - 1 }); }}
									/>
								</PaginationItem>
								
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<PaginationItem key={page}>
										<PaginationLink 
											href="#" 
											isActive={page === currentPage}
											onClick={(e) => { e.preventDefault(); updateParams({ page }); }}
										>
											{page}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext 
										href="#"
										aria-disabled={currentPage === totalPages}
										onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) updateParams({ page: currentPage + 1 }); }}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</nav>
				</div>
			)}
			
			<div className="mt-8">
				<PresetList presets={paginatedPresets} gridClass={gridClass} />
			</div>

			<div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
				{!isAtTop && (
					<Button
						variant="outline"
						size="icon"
						onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
				)}
				{!isAtBottom && (
					<Button
						variant="outline"
						size="icon"
						onClick={() => document.getElementById("gallery-bottom")?.scrollIntoView({ behavior: "smooth" })}
					>
						<ArrowDown className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	)
}