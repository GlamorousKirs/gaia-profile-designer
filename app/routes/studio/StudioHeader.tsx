import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemePicker } from "~/components/ThemePicker"
import { UserAvatar } from "@/components/UserAvatar"

interface StudioHeaderProps {
  onOpenProfile: () => void
}

export function StudioHeader({ onOpenProfile }: StudioHeaderProps) {
  return (
    <header className="h-10 border-b border-border bg-card px-3 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center size-6 rounded bg-primary text-primary-foreground font-black text-sm">
          Δ
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs block leading-none">Gaia Studio</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none border-l border-border pl-2">
            <span className="size-1 rounded-full bg-emerald-500" /> WIP
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemePicker />
        <UserAvatar onOpenProfile={onOpenProfile} />
        <Button size="sm" className="h-7 gap-1 text-[11px] font-medium px-2.5">
          <Share2 className="size-3.5" /> Publish
        </Button>
      </div>
    </header>
  )
}