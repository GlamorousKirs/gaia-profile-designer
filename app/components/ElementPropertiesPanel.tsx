import { useEffect, useRef, useState } from "react"
import { ColorPicker } from "@/components/ColorPicker"
import { SliderProperty } from "@/components/PropertyControls"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react"

interface ElementPropertiesPanelProps {
    selectedSelector: string
    cssCode: string
    setCssCode: React.Dispatch<React.SetStateAction<string>>
    borderRadius: number
    setBorderRadius: (v: number) => void
    bgColor: string
    setBgColor: (v: string) => void
    textColor: string
    setTextColor: (v: string) => void
    widthVal: number
    setWidthVal: (v: number) => void
    heightVal: number
    setHeightVal: (v: number) => void
    paddingTop: number
    setPaddingTop: (v: number) => void
    paddingBottom: number
    setPaddingBottom: (v: number) => void
    paddingLeft: number
    setPaddingLeft: (v: number) => void
    paddingRight: number
    setPaddingRight: (v: number) => void
    marginTop: number
    setMarginTop: (v: number) => void
    marginBottom: number
    setMarginBottom: (v: number) => void
    marginLeft: number
    setMarginLeft: (v: number) => void
    marginRight: number
    setMarginRight: (v: number) => void
    fontSize: number
    setFontSize: (v: number) => void
    letterSpacing: number
    setLetterSpacing: (v: number) => void
    opacityVal: number
    setOpacityVal: (v: number) => void
    borderWidth: number
    setBorderWidth: (v: number) => void
    borderColor: string
    setBorderColor: (v: string) => void
    updateCssProperty: (property: string, value: string | number, suffix?: string) => void
}

const rgbToHex = (rgbStr: string): string => {
    if (!rgbStr || rgbStr.startsWith("#")) return rgbStr || "#ffffff"
    const match = rgbStr.match(/\d+/g)
    if (!match) return "#ffffff"
    const r = parseInt(match[0], 10)
    const g = parseInt(match[1], 10)
    const b = parseInt(match[2], 10)
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

export function ElementPropertiesPanel({
    selectedSelector,
    cssCode,
    setCssCode,
    borderRadius,
    setBorderRadius,
    bgColor,
    setBgColor,
    textColor,
    setTextColor,
    widthVal,
    setWidthVal,
    heightVal,
    setHeightVal,
    paddingTop,
    setPaddingTop,
    paddingBottom,
    setPaddingBottom,
    paddingLeft,
    setPaddingLeft,
    paddingRight,
    setPaddingRight,
    marginTop,
    setMarginTop,
    marginBottom,
    setMarginBottom,
    marginLeft,
    setMarginLeft,
    marginRight,
    setMarginRight,
    fontSize,
    setFontSize,
    letterSpacing,
    setLetterSpacing,
    opacityVal,
    setOpacityVal,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
    updateCssProperty,
}: ElementPropertiesPanelProps) {
    const isUpdatingRef = useRef(false)

    const [showIndividualPadding, setShowIndividualPadding] = useState(false)
    const [showIndividualMargin, setShowIndividualMargin] = useState(false)

    useEffect(() => {
        if (!selectedSelector || isUpdatingRef.current) return

        let domElement: HTMLElement | null = null
        let computed: CSSStyleDeclaration | null = null
        try {
            domElement = document.querySelector(selectedSelector) as HTMLElement
            if (domElement) {
                computed = window.getComputedStyle(domElement)
            }
        } catch (e) {
            console.error("Invalid selector or element not found in DOM:", e)
        }

        const escapedSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`${escapedSelector}\\s*{([^}]*)}`, "i")
        const match = cssCode.match(regex)
        const cssBlock = match && match[1] ? match[1] : ""

        const getNum = (p: string, fallback = 0): number => {
            const m = cssBlock.match(new RegExp(`(?<!-)${p}\\s*:\\s*(-?\\d+)(?:px|%)?`, "i"))
            if (m) return parseInt(m[1], 10)
            
            if (p === "width" && domElement) return domElement.offsetWidth
            if (p === "height" && domElement) return domElement.offsetHeight

            if (computed) {
                const val = computed.getPropertyValue(p)
                const parsed = parseInt(val, 10)
                if (!isNaN(parsed)) return parsed
            }
            return fallback
        }

        const getStr = (p: string, fallback = "#ffffff"): string => {
            const m = cssBlock.match(new RegExp(`(?<!-)${p}\\s*:\\s*([^;}\\s]+)`, "i"))
            if (m) return m[1]
            if (computed) {
                const val = computed.getPropertyValue(p)
                if (val && val !== "initial" && val !== "none" && val !== "rgba(0, 0, 0, 0)") {
                    return p.includes("color") ? rgbToHex(val) : val
                }
            }
            return fallback
        }

        isUpdatingRef.current = true

        setBorderRadius(getNum("border-radius"))
        setBgColor(getStr("background-color", "#ffffff"))
        setTextColor(getStr("color", "#000000"))

        setWidthVal(getNum("width"))
        setHeightVal(getNum("height"))

        setPaddingTop(getNum("padding-top"))
        setPaddingBottom(getNum("padding-bottom"))
        setPaddingLeft(getNum("padding-left"))
        setPaddingRight(getNum("padding-right"))

        setMarginTop(getNum("margin-top"))
        setMarginBottom(getNum("margin-bottom"))
        setMarginLeft(getNum("margin-left"))
        setMarginRight(getNum("margin-right"))

        setFontSize(getNum("font-size", 14))
        setLetterSpacing(getNum("letter-spacing"))

        const opMatch = cssBlock.match(/opacity\s*:\s*([0-9.]+)/i)
        if (opMatch) {
            setOpacityVal(Math.round(parseFloat(opMatch[1]) * 100))
        } else if (computed) {
            const compOp = parseFloat(computed.getPropertyValue("opacity"))
            setOpacityVal(!isNaN(compOp) ? Math.round(compOp * 100) : 100)
        } else {
            setOpacityVal(100)
        }

        setBorderWidth(getNum("border-width"))
        setBorderColor(getStr("border-color", "#000000"))

        setTimeout(() => {
            isUpdatingRef.current = false
        }, 0)

    }, [selectedSelector, cssCode, setBorderRadius, setBgColor, setTextColor, setWidthVal, setHeightVal, setPaddingTop, setPaddingBottom, setPaddingLeft, setPaddingRight, setMarginTop, setMarginBottom, setMarginLeft, setMarginRight, setFontSize, setLetterSpacing, setOpacityVal, setBorderWidth, setBorderColor])

    const resetLocalStates = () => {
        setBorderRadius(0); setBgColor("#ffffff"); setTextColor("#000000")
        setWidthVal(0); setHeightVal(0)
        setPaddingTop(0); setPaddingBottom(0); setPaddingLeft(0); setPaddingRight(0)
        setMarginTop(0); setMarginBottom(0); setMarginLeft(0); setMarginRight(0)
        setFontSize(14); setLetterSpacing(0); setOpacityVal(100)
        setBorderWidth(0); setBorderColor("#000000")
    }

    const handleResetStyles = () => {
        if (!selectedSelector) return

        isUpdatingRef.current = true
        resetLocalStates()

        const escapedSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const regex = new RegExp(`${escapedSelector}\\s*{[^}]*}\\s*\\n?`, "gi")

        const clearedCss = cssCode.replace(regex, "")
        setCssCode(clearedCss)

        setTimeout(() => {
            isUpdatingRef.current = false
        }, 50)
    }

    const handleColorUpdate = (property: string, setter: (val: string) => void, val: string) => {
        isUpdatingRef.current = true
        setter(val)
        updateCssProperty(property, val)
        setTimeout(() => {
            isUpdatingRef.current = false
        }, 50)
    }

    const handlePaddingAxisX = (val: number) => {
        isUpdatingRef.current = true
        setPaddingLeft(val); setPaddingRight(val)
        updateCssProperty("padding-left", val, "px")
        updateCssProperty("padding-right", val, "px")
        setTimeout(() => { isUpdatingRef.current = false }, 50)
    }

    const handlePaddingAxisY = (val: number) => {
        isUpdatingRef.current = true
        setPaddingTop(val); setPaddingBottom(val)
        updateCssProperty("padding-top", val, "px")
        updateCssProperty("padding-bottom", val, "px")
        setTimeout(() => { isUpdatingRef.current = false }, 50)
    }

    const handleMarginAxisX = (val: number) => {
        isUpdatingRef.current = true
        setMarginLeft(val); setMarginRight(val)
        updateCssProperty("margin-left", val, "px")
        updateCssProperty("margin-right", val, "px")
        setTimeout(() => { isUpdatingRef.current = false }, 50)
    }

    const handleMarginAxisY = (val: number) => {
        isUpdatingRef.current = true
        setMarginTop(val); setMarginBottom(val)
        updateCssProperty("margin-top", val, "px")
        updateCssProperty("margin-bottom", val, "px")
        setTimeout(() => { isUpdatingRef.current = false }, 50)
    }

    return (
        <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto min-h-0 bg-background/50">
            {/* SECTION 1: SELECTED ELEMENT HEADER */}
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/40 border border-border/60 shadow-xs">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                        Selected Element
                    </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetStyles}
                        className="h-4 px-1 text-[9px] text-muted-foreground hover:text-destructive gap-0.5 transition-colors"
                        title="Reset active selector styles to default"
                    >
                        <RotateCcw className="size-2.5" />
                        Reset
                    </Button>
                </div>
                <div className="bg-card border border-border rounded-lg shadow-sm p-2 flex items-center w-full font-mono text-[11px] break-all text-primary select-text">
                    {selectedSelector || "None selected"}
                </div>
            </div>

            {/* PROPERTIES WRAPPER WITH DISTINCT BACKGROUND */}
            <div className="flex flex-col gap-5 p-3 rounded-xl bg-muted/20 border border-border/40 shadow-xs">
                {/* Dimensions */}
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-[9px] font-bold uppercase text-muted-foreground px-1 tracking-wider">
                        Dimensions
                    </h3>
                    <div className="flex gap-3">
                        <div className="flex-1"><SliderProperty label="W" value={widthVal} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setWidthVal(v); updateCssProperty("width", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                        <div className="flex-1"><SliderProperty label="H" value={heightVal} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setHeightVal(v); updateCssProperty("height", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                    </div>
                </div>

                {/* Padding */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                            Padding
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 text-[9px] text-muted-foreground hover:text-foreground gap-0.5"
                            onClick={() => setShowIndividualPadding(!showIndividualPadding)}
                        >
                            {showIndividualPadding ? <ChevronDown className="size-2.5" /> : <ChevronRight className="size-2.5" />}
                            Per Side
                        </Button>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex gap-3">
                            <div className="flex-1"><SliderProperty label="P-X" value={paddingLeft === paddingRight ? paddingLeft : 0} suffix="px" onChange={handlePaddingAxisX} /></div>
                            <div className="flex-1"><SliderProperty label="P-Y" value={paddingTop === paddingBottom ? paddingTop : 0} suffix="px" onChange={handlePaddingAxisY} /></div>
                        </div>
                        {showIndividualPadding && (
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2 border-t border-dashed border-border/40">
                                <SliderProperty label="P-T" value={paddingTop} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setPaddingTop(v); updateCssProperty("padding-top", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="P-B" value={paddingBottom} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setPaddingBottom(v); updateCssProperty("padding-bottom", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="P-L" value={paddingLeft} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setPaddingLeft(v); updateCssProperty("padding-left", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="P-R" value={paddingRight} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setPaddingRight(v); updateCssProperty("padding-right", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Margin */}
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
                            Margin
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 px-1 text-[9px] text-muted-foreground hover:text-foreground gap-0.5"
                            onClick={() => setShowIndividualMargin(!showIndividualMargin)}
                        >
                            {showIndividualMargin ? <ChevronDown className="size-2.5" /> : <ChevronRight className="size-2.5" />}
                            Per Side
                        </Button>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex gap-3">
                            <div className="flex-1"><SliderProperty label="M-X" value={marginLeft === marginRight ? marginLeft : 0} suffix="px" onChange={handleMarginAxisX} /></div>
                            <div className="flex-1"><SliderProperty label="M-Y" value={marginTop === marginBottom ? marginTop : 0} suffix="px" onChange={handleMarginAxisY} /></div>
                        </div>
                        {showIndividualMargin && (
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2 border-t border-dashed border-border/40">
                                <SliderProperty label="M-T" value={marginTop} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setMarginTop(v); updateCssProperty("margin-top", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="M-B" value={marginBottom} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setMarginBottom(v); updateCssProperty("margin-bottom", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="M-L" value={marginLeft} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setMarginLeft(v); updateCssProperty("margin-left", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                                <SliderProperty label="M-R" value={marginRight} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setMarginRight(v); updateCssProperty("margin-right", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Typography */}
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-[9px] font-bold uppercase text-muted-foreground px-1 tracking-wider">
                        Typography
                    </h3>
                    <div className="flex gap-3">
                        <div className="flex-1"><SliderProperty label="Size" value={fontSize} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setFontSize(v); updateCssProperty("font-size", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                        <div className="flex-1"><SliderProperty label="Kern" value={letterSpacing} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setLetterSpacing(v); updateCssProperty("letter-spacing", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                    </div>
                </div>

                {/* Borders & Shapes */}
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-[9px] font-bold uppercase text-muted-foreground px-1 tracking-wider">
                        Borders & Shapes
                    </h3>
                    <div className="space-y-2.5">
                        <div className="flex gap-3">
                            <div className="flex-1"><SliderProperty label="Rad" value={borderRadius} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setBorderRadius(v); updateCssProperty("border-radius", v, "px"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                            <div className="flex-1"><SliderProperty label="Thick" value={borderWidth} suffix="px" onChange={(v) => { isUpdatingRef.current = true; setBorderWidth(v); updateCssProperty("border-width", v, "px"); updateCssProperty("border-style", "solid"); setTimeout(() => { isUpdatingRef.current = false }, 50) }} /></div>
                        </div>
                        <div className="flex items-center gap-2 p-1.5 hover:bg-accent/40 rounded-md transition-colors w-full font-mono text-[11px]">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase pl-1 shrink-0 w-12">Color</span>
                            <ColorPicker color={borderColor} onChange={(v) => handleColorUpdate("border-color", setBorderColor, v)} />
                            <span className="truncate text-foreground pl-1 uppercase font-mono tracking-wide">{borderColor}</span>
                        </div>
                    </div>
                </div>

                {/* Fills & Appearance */}
                <div className="flex flex-col gap-1.5">
                    <h3 className="text-[9px] font-bold uppercase text-muted-foreground px-1 tracking-wider">
                        Fills & Appearance
                    </h3>
                    <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div id="tutorial-4" className="flex items-center gap-2 p-1.5 hover:bg-accent/40 rounded-md transition-colors font-mono text-[11px]">
                                <ColorPicker color={bgColor} onChange={(v) => handleColorUpdate("background-color", setBgColor, v)} />
                                <span className="truncate text-foreground uppercase tracking-wide">{bgColor}</span>
                            </div>
                            <div className="flex items-center gap-2 p-1.5 hover:bg-accent/40 rounded-md transition-colors font-mono text-[11px]">
                                <ColorPicker color={textColor} onChange={(v) => handleColorUpdate("color", setTextColor, v)} />
                                <span className="truncate text-foreground uppercase tracking-wide">{textColor}</span>
                            </div>
                        </div>
                        <div className="pt-0.5">
                            <SliderProperty label="Opac" value={opacityVal} suffix="%" onChange={(v) => { isUpdatingRef.current = true; setOpacityVal(v); updateCssProperty("opacity", v / 100); setTimeout(() => { isUpdatingRef.current = false }, 50) }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}