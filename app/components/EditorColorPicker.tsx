import { useState } from "react";
import { extend } from "colord";
import namesPlugin from "colord/plugins/names";
import { HexAlphaColorPicker } from "react-colorful";
import { Popover } from "@base-ui/react/popover";

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
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (open && !nextOpen) {
          onCommit(color);
        }
        setOpen(nextOpen);
      }}
    >
      <Popover.Trigger
        className="size-3 mr-1 rounded-full border border-border cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ backgroundColor: color }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Pick a color"
      />
      <Popover.Portal>
        <Popover.Positioner className="z-9999" sideOffset={8}>
          <Popover.Popup
            className="custom-layout p-0 rounded-xl backdrop-blur-md bg-background border flex flex-col shadow-xl"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >

            <HexAlphaColorPicker
              color={color}
              onChange={setColor}
            />
            <input
              type="text"
              className="w-full px-3 py-1.5 rounded bg-muted text-foreground text-xs font-mono focus:outline-none border-t border-border"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="hex"
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}