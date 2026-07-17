import { memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

const ImageCollectionTab = memo(() => {
  return (
    <div className="flex flex-col h-full w-64 text-xs">
      <div className="p-3 pb-2 border-b border-border/40">
        <h2 className="font-semibold text-[11px] tracking-wider text-muted-foreground uppercase">Canvas Settings</h2>
      </div>
      <ScrollArea className="flex-1 p-3">
        <p className="text-muted-foreground text-[11px] italic">No active layer modifications selected.</p>
      </ScrollArea>
    </div>
  )
})

ImageCollectionTab.displayName = "ImageCollectionTab"
export default ImageCollectionTab