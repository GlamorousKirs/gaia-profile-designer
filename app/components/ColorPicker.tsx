import { extend } from "colord"
import namesPlugin from "colord/plugins/names"
import { HexAlphaColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

extend([namesPlugin])

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const validColor = color || "#000000";

  return (
    <Popover>
      <PopoverTrigger>
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

          <input
            type="text"
            className="w-full px-3 py-1.5 rounded bg-muted text-foreground text-xs font-mono focus:outline-none"
            value={validColor}
            onChange={(e) => onChange(e.target.value)}
            placeholder="hex"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}