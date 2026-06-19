import { useState } from "react";
import { extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { HexAlphaColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

extend([namesPlugin]);

export function EditorColorPicker({
  initialColor,
  onCommit
}: {
  initialColor: string;
  onCommit: (c: string) => void;
}) {
  const [color, setColor] = useState(initialColor);
  const [open, setOpen] = useState(false);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (open && !nextOpen) {
          onCommit(color);
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        className="size-3 mr-1 rounded-full border border-border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ backgroundColor: color }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Pick a color"
      />
      <PopoverContent className="p-0 overflow-hidden w-auto bg-background" sideOffset={8}>
        { }
        <div className="custom-layout p-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <HexAlphaColorPicker
            color={color}
            onChange={setColor}
          />
          <input
            type="text"
            className="w-full mt-2 px-3 py-1.5 rounded bg-muted text-foreground text-xs font-mono focus:outline-none border border-border"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="hex"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}