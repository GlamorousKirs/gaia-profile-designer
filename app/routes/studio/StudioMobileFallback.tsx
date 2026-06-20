import { Monitor } from "lucide-react"

export function StudioMobileFallback() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 text-center bg-background">
      <Monitor className="mb-4 size-12 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground text-sm max-w-xs">The Studio is optimized for desktop only.</p>
    </div>
  )
}