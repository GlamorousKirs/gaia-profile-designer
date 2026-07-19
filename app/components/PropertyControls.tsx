import React, { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { HexAlphaColorPicker } from "react-colorful"

interface SliderInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}

export const SliderProperty = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix = "px",
  className,
  ...props
}: SliderInputProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const startValue = useRef(0)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    startX.current = e.clientX
    startValue.current = value
      ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX.current

    let newValue = startValue.current + deltaX * step

    if (min !== undefined) newValue = Math.max(min, newValue)
    if (max !== undefined) newValue = Math.min(max, newValue)

    onChange(Number(newValue.toFixed(step < 1 ? 2 : 0)))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
      ; (e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }

  return (
    <div className="flex items-center h-7 border border-border rounded bg-background hover:border-muted-foreground/20 focus-within:border-primary group transition-colors">
      <span
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-8 h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground select-none cursor-ew-resize border-r border-border/50 bg-muted/30 group-hover:bg-muted/60 transition-colors"
      >
        {label}
      </span>
      <div className="flex items-center flex-1 min-w-0 px-2">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-full bg-transparent p-0 text-xs font-mono text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...props}
        />
        {suffix && <span className="text-[10px] text-muted-foreground/60 font-mono select-none ml-1">{suffix}</span>}
      </div>
    </div>
  )
}

interface ColorInputProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

export const ColorProperty = ({ color, onChange, label }: ColorInputProps) => {
  const validColor = color || "#000000"
  const [inputValue, setInputValue] = useState(validColor)

  useEffect(() => {
    setInputValue(validColor)
  }, [validColor])

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <span className="text-[10px] font-semibold text-muted-foreground/80 uppercase tracking-wider pl-0.5">{label}</span>}

      <div className="flex items-center h-8 border border-border rounded bg-background hover:border-muted-foreground/20 focus-within:border-primary transition-colors p-1 gap-2">
        <Popover>
          <PopoverTrigger>
            <button
              type="button"
              className="size-5 rounded border border-border/60 cursor-pointer transition-transform active:scale-95 shrink-0 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              style={{ backgroundColor: validColor }}
              aria-label="Toggle picker canvas"
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start" sideOffset={6}>
            <div className="p-0 rounded-xl backdrop-blur-md bg-background border flex flex-col overflow-hidden shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
              <HexAlphaColorPicker color={validColor} onChange={onChange} />
            </div>
          </PopoverContent>
        </Popover>

        <input
          type="text"
          className="w-full h-full bg-transparent p-0 text-xs font-mono text-foreground focus:outline-none uppercase"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            if (/^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(e.target.value)) {
              onChange(e.target.value)
            }
          }}
          onBlur={() => setInputValue(validColor)}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}