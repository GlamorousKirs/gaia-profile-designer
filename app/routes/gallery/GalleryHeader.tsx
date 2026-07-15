import { memo } from "react"
import { Search, Square, Columns2, Columns3, Columns4 } from "lucide-react"
import { CATEGORIES } from "@/lib/presets"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface GalleryHeaderProps {
	searchQuery: string
	onSearchChange: (query: string) => void
	activeCategory: string
	onCategoryChange: (category: string) => void
	gridCols: 1 | 2 | 3 | 4
	onGridChange: (cols: 1 | 2 | 3 | 4) => void
}

export const GalleryHeader = memo(function GalleryHeader({
	searchQuery,
	onSearchChange,
	activeCategory,
	onCategoryChange,
	gridCols,
	onGridChange
}: GalleryHeaderProps) {
	return (
		<header className="mb-16 text-center">
			<h1 className="text-4xl font-bold tracking-tighter text-foreground mb-4">
				Gallery
			</h1>
			<p className="text-muted-foreground max-w-lg mx-auto mb-8">
				Work in progress..
			</p>

			<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<InputGroup className="max-w-xs">
					<InputGroupInput
						placeholder="Search presets..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
					/>
					<InputGroupAddon>
						<Search className="w-4 h-4" />
					</InputGroupAddon>
				</InputGroup>

				<Select
					value={activeCategory}
					onValueChange={(value) => {
						if (value) onCategoryChange(value)
					}}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="Category" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{CATEGORIES.filter((c) => c !== "all").map((category) => (
							<SelectItem key={category} value={category}>
								{category.charAt(0).toUpperCase() + category.slice(1)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex items-center gap-1">
					{[1, 2, 3, 4].map((col) => {
						const Icon = col === 1 ? Square : col === 2 ? Columns2 : col === 3 ? Columns3 : Columns4
						return (
							<Button
								key={col}
								variant={gridCols === col ? "default" : "outline"}
								size="icon"
								onClick={() => onGridChange(col as 1 | 2 | 3 | 4)}
							>
								<Icon className="w-4 h-4" />
							</Button>
						)
					})}
				</div>
			</div>
		</header>
	)
})