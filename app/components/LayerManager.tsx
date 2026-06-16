import { memo } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const LayerManager = memo(() => {
  return (
    <div className="flex flex-col h-full w-64 select-none">
      <div className="p-3 pb-2 border-b border-border/40">
        <h2 className="font-semibold text-[11px] tracking-wider text-muted-foreground uppercase">Layers</h2>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1" role="listbox" aria-label="Layers tracking list">
          <Button variant="secondary" size="sm" role="option" aria-selected="true" className="w-full justify-between h-8 px-2.5 text-xs font-normal border border-border">
            <span className="font-medium truncate mr-2">Hero Section</span>
            <div className="flex items-center gap-1.5 shrink-0 opacity-80">
              <Eye className="size-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-[9px] bg-background text-muted-foreground border border-border px-1 py-0.5 rounded-sm uppercase tracking-tight font-bold scale-90">
                div
              </span>
            </div>
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
})

LayerManager.displayName = "LayerManager"
export default LayerManager