import { useEffect, useState } from "react"
import { Share2, Fullscreen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemePicker } from "~/components/ThemePicker"
import { UserAvatar } from "@/components/UserAvatar"

interface StudioHeaderProps {
  onOpenProfile: () => void
}

export function StudioHeader({ onOpenProfile }: StudioHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Error changing fullscreen mode:", error)
    }
  }

  return (
    <header className="h-10 border-b border-border bg-card px-3 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-2.5">
        <div 
          className="flex items-center justify-center size-6 rounded bg-primary text-primary-foreground font-black text-sm"
          aria-hidden="true"
        >
          Δ
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs block leading-none">Gaia Studio</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 leading-none border-l border-border pl-2">
            <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" /> 
            <span>WIP</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5" role="toolbar" aria-label="Header actions">
        {                                                                   }
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 relative group"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          aria-pressed={isFullscreen}
        >
          <Fullscreen className="size-3.5" aria-hidden="true" />
          
          {                                                                       }
          <span className="sr-only">
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </span>
        </Button>

        <ThemePicker />
        <UserAvatar onOpenProfile={onOpenProfile} />
        
        <Button size="sm" className="h-7 gap-1 text-xs font-medium px-2.5">
          <Share2 className="size-3.5" aria-hidden="true" /> 
          <span>Publish</span>
        </Button>
      </div>
    </header>
  )
}