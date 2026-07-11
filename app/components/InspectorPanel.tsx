import { memo } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

const InspectorPanel = memo(() => {
  return (
    <div className="flex flex-col h-full w-64 text-xs">
      <div className="p-3 pb-2 border-b border-border/40">
        <h2 className="font-semibold text-[11px] tracking-wider text-muted-foreground uppercase">Inspector</h2>
      </div>
      <ScrollArea className="flex-1 p-3">
        <p className="text-muted-foreground text-[11px] italic">Select elements to view layouts.</p>
      </ScrollArea>
    </div>
  )
})

InspectorPanel.displayName = "InspectorPanel"
export default InspectorPanel