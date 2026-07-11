import { MousePointer, Braces, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StudioToolbarProps {
	activeTool: "select" | null
	setActiveTool: (tool: "select" | null) => void
	isCodeOpen: boolean
	setIsCodeOpen: (open: boolean | ((prev: boolean) => boolean)) => void
	isMaximized: boolean
	setIsMaximized: (maximized: boolean | ((prev: boolean) => boolean)) => void
}

export function StudioToolbar({
	activeTool,
	setActiveTool,
	isCodeOpen,
	setIsCodeOpen,
	isMaximized,
	setIsMaximized,
}: StudioToolbarProps) {
	const getButtonClasses = (isActive: boolean) =>
		isActive
			? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
			: "bg-transparent text-muted-foreground hover:bg-transparent hover:text-muted-foreground"

	return (
		<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
			<div className="flex items-center gap-1 p-1 bg-card/90 backdrop-blur-md border border-border rounded-full shadow-md pointer-events-auto">
				<Button
					variant="ghost"
					size="sm"
					className={`rounded-full h-7 px-3 flex items-center gap-2 ${getButtonClasses(activeTool === "select")}`}
					onClick={() => setActiveTool(activeTool === "select" ? null : "select")}
				>
					<MousePointer className="size-3.5" />
					<span className="text-xs font-medium">Select Element</span>
				</Button>

				<div className="w-px h-3 bg-border mx-0.5" aria-hidden="true" />

				<Button
					variant="ghost"
					size="sm"
					className={`rounded-full h-7 px-3 flex items-center gap-2 ${getButtonClasses(isCodeOpen)}`}
					onClick={() => setIsCodeOpen((prev) => !prev)}
				>
					<Braces className="size-3.5" />
					<span className="text-xs font-medium">Code Editor</span>
				</Button>

				<div className="w-px h-3 bg-border mx-0.5" aria-hidden="true" />

				<Button
					variant="ghost"
					size="sm"
					className={`rounded-full h-7 px-3 flex items-center gap-2 ${getButtonClasses(isMaximized)}`}
					onClick={() => setIsMaximized((prev) => !prev)}
				>
					{isMaximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
					<span className="text-xs font-medium">
						{isMaximized ? "Exit Focus" : "Enter Focus"}
					</span>
				</Button>
			</div>
		</div>
	)
}