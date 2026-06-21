import { useState, useEffect } from "react"
import { extend } from "colord"
import namesPlugin from "colord/plugins/names"
import { HexAlphaColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2 } from "lucide-react"

extend([namesPlugin])

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

const STORAGE_KEY = "gstudio-saved-colors"

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const validColor = color || "#000000";
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  // Empty array default fallback
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedColors))
  }, [savedColors])

  const handleSaveColor = () => {
    if (!savedColors.includes(validColor)) {
      setSavedColors((prev) => [...prev, validColor])
    }
  }

  const handleSwatchClick = (savedColor: string) => {
    if (isDeleteMode) {
      setSavedColors((prev) => prev.filter((c) => c !== savedColor))
    } else {
      onChange(savedColor)
    }
  }

  return (
    <Popover onOpenChange={(open) => { if (!open) setIsDeleteMode(false) }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-5 rounded-full border border-border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ backgroundColor: validColor }}
          aria-label="Pick a color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
        <div className="custom-layout p-0 rounded-xl backdrop-blur-md bg-background border flex flex-col">
          <HexAlphaColorPicker color={validColor} onChange={onChange} />

          {/* Action Row */}
          <div className="relative flex items-center bg-muted rounded-b">
            <input
              type="text"
              className="w-full pl-3 pr-8 py-1.5 bg-transparent text-foreground text-xs font-mono focus:outline-none"
              value={validColor}
              onChange={(e) => onChange(e.target.value)}
              placeholder="hex"
            />
            <button
              type="button"
              onClick={handleSaveColor}
              className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              title="Save current color"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Saved Colors Swatches Row */}
          {savedColors.length > 0 && (
            <div className="flex flex-col gap-1.5 p-2.5 border-t border-border max-w-[200px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Saved</span>
                
                <button
                  type="button"
                  onClick={() => setIsDeleteMode(!isDeleteMode)}
                  className={`p-0.5 rounded transition-colors cursor-pointer ${
                    isDeleteMode 
                      ? "text-destructive bg-destructive/10" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="Toggle Delete Mode"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {savedColors.map((savedColor, index) => (
                  <button 
                    key={`${savedColor}-${index}`} 
                    type="button"
                    className={`relative size-3 rounded-full border border-border/40 cursor-pointer transition-transform hover:scale-110 focus:outline-none ${
                      isDeleteMode ? "ring-1 ring-destructive/50 ring-offset-1 ring-offset-background" : ""
                    }`}
                    style={{ backgroundColor: savedColor }}
                    onClick={() => handleSwatchClick(savedColor)}
                    title={isDeleteMode ? "Click to delete" : savedColor}
                  >
                    {isDeleteMode && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[7px] text-white rounded-full font-bold">
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}