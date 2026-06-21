import { MousePointer, Braces, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="flex items-center gap-1.5 p-1.5 bg-card/90 backdrop-blur-md border border-border rounded-full shadow-lg pointer-events-auto">
        
        {/* Select Tool */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant={activeTool === "select" ? "default" : "ghost"}
              size="icon"
              className="rounded-full size-9 shrink-0"
              onClick={() => setActiveTool(activeTool === "select" ? null : "select")}
            >
              <MousePointer className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Select Tool (V)</TooltipContent>
        </Tooltip>

        <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />

        {/* Code Toggle */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant={isCodeOpen ? "secondary" : "ghost"}
              size="icon"
              className={`rounded-full size-9 shrink-0 ${
                isCodeOpen ? "text-primary border border-primary/20 bg-secondary" : ""
              }`}
              onClick={() => setIsCodeOpen((prev) => !prev)}
            >
              <Braces className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Code</TooltipContent>
        </Tooltip>
        <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />

        {/* Maximize Toggle */}
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full size-9 shrink-0"
              onClick={() => setIsMaximized((prev) => !prev)}
            >
              {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {isMaximized ? "Exit Fullscreen Focus" : "Enter Fullscreen Focus"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}