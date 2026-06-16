import { memo } from "react"
import { Folder, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const FileExplorer = memo(() => {
  return (
    <div className="flex flex-col h-full w-64 select-none">
      <div className="p-3 pb-2 border-b border-border/40">
        <h2 className="font-semibold text-[11px] tracking-wider text-muted-foreground uppercase">Explorer</h2>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1 text-xs" aria-label="File system explorer">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 font-medium">
            <Folder className="size-4 text-blue-400 shrink-0" aria-hidden="true" />
            <span>src</span>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 pl-6 px-2 text-muted-foreground hover:text-foreground font-normal">
            <Folder className="size-4 text-blue-400 shrink-0" aria-hidden="true" />
            <span>components</span>
          </Button>
          <Button variant="secondary" size="sm" className="w-full justify-start gap-2 h-8 pl-10 px-2 font-medium" aria-current="page">
            <FileCode className="size-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span className="truncate">Canvas.tsx</span>
          </Button>
        </nav>
      </ScrollArea>
    </div>
  )
})

FileExplorer.displayName = "FileExplorer"
export default FileExplorer