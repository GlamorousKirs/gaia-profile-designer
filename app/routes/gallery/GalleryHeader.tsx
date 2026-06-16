import { memo } from "react"
import { Search } from "lucide-react"
import { CATEGORIES } from "@/lib/presets"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GalleryHeaderProps {
    searchQuery: string
    onSearchChange: (query: string) => void
    activeCategory: string
    onCategoryChange: (category: string) => void
}

export const GalleryHeader = memo(function GalleryHeader({
    searchQuery,
    onSearchChange,
    activeCategory,
    onCategoryChange
}: GalleryHeaderProps) {
    return (
        <header className="mb-16 text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground mb-4">
                Design Presets
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                Explore our library of handcrafted design configurations. Select a category to filter the collection.
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
                        // Only call the handler if the value is a valid string
                        if (value) onCategoryChange(value);
                    }}
                >
                    <SelectTrigger className="w-45">
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
            </div>
        </header>
    )
})