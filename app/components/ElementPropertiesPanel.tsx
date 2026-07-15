import { useEffect, useRef, useState } from "react"
import { ColorPicker } from "@/components/colorpicker/ColorPicker"
import { SliderProperty } from "@/components/PropertyControls"
import { Button } from "@/components/ui/button"
import { Minus, Plus, RotateCcw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PROPERTY_SECTIONS } from "../types/property-panel"

interface ElementPropertiesPanelProps {
	selectedSelector: string
	cssCode: string
	setCssCode: React.Dispatch<React.SetStateAction<string>>
	updateCssProperty: (property: string, value: string | number, suffix?: string) => void
}

export function ElementPropertiesPanel({
	selectedSelector,
	cssCode,
	setCssCode,
	updateCssProperty,
}: ElementPropertiesPanelProps) {
	const isUpdatingRef = useRef(false)
	const [values, setValues] = useState<Record<string, any>>({})
	const [isIframe, setIsIframe] = useState(false)
	const [collapsibles, setCollapsibles] = useState({
		showPadding: false,
		showMargin: false,
	})

	useEffect(() => {
		if (!selectedSelector || isUpdatingRef.current) return

		let domElement: HTMLElement | null = null
		let computed: CSSStyleDeclaration | null = null

		try {
			const iframe = document.querySelector("iframe[title='Gaia Preview']") as HTMLIFrameElement | null
			if (iframe && iframe.contentDocument) {
				domElement = iframe.contentDocument.querySelector(selectedSelector) as HTMLElement
				if (domElement) {
					setIsIframe(domElement.tagName === "IFRAME")
					computed = iframe.contentWindow?.getComputedStyle(domElement) || null
				}
			}
		} catch (e) {
			console.error("Invalid selector or element not found in iframe DOM:", e)
		}

		const GlenSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		const regex = new RegExp(`${GlenSelector}\\s*{([^}]*)}`, "i")
		const match = cssCode.match(regex)
		const cssBlock = match && match[1] ? match[1] : ""

		const getNum = (p: string, fallback = 0): number => {
			const m = cssBlock.match(new RegExp(`(?<!-)${p}\\s*:\\s*(-?\\d+)(?:px|%)?`, "i"))
			if (m) return parseInt(m[1], 10)
			if (computed) {
				const val = computed.getPropertyValue(p)
				const parsed = parseInt(val, 10)
				if (!isNaN(parsed)) return parsed
			}
			return fallback
		}

		const getStr = (p: string, fallback = ""): string => {
			const m = cssBlock.match(new RegExp(`(?<!-)${p}\\s*:\\s*([^;}\\s]+)`, "i"))
			if (m) return m[1]
			if (computed) {
				const val = computed.getPropertyValue(p)
				if (val && val !== "initial") return val
			}
			return fallback
		}

		isUpdatingRef.current = true
		const nextValues: Record<string, any> = {}

		PROPERTY_SECTIONS.forEach((section) => {
			section.properties?.forEach((prop) => {
				if (prop.property === "opacity") {
					const opMatch = cssBlock.match(/opacity\s*:\s*([0-9.]+)/i)
					if (opMatch) {
						nextValues["opacity"] = Math.round(parseFloat(opMatch[1]) * 100)
					} else if (computed) {
						const compOp = parseFloat(computed.getPropertyValue("opacity"))
						nextValues["opacity"] = !isNaN(compOp) ? Math.round(compOp * 100) : (prop.fallback ?? 100)
					} else {
						nextValues["opacity"] = prop.fallback ?? 100
					}
				} else if (prop.type === "slider") {
					nextValues[prop.property] = getNum(prop.property, prop.fallback ?? 0)
				} else if (prop.type === "color") {
					nextValues[prop.property] = getStr(prop.property, prop.fallback ?? "#ffffff")
				} else if (prop.type === "text" || prop.type === "select") {
					nextValues[prop.property] = getStr(prop.property, prop.fallback ?? "")
				}
			})
			section.groups?.forEach((group) => {
				if (group.type === "axis") {
					group.propertiesX.forEach((p) => { nextValues[p] = getNum(p, 0) })
					group.propertiesY.forEach((p) => { nextValues[p] = getNum(p, 0) })
				}
			})
			section.gridProperties?.forEach((prop) => {
				nextValues[prop.property] = getNum(prop.property, prop.fallback ?? 0)
			})
		})

		nextValues["position"] = getStr("position", "static")
		const positionProps = ["top", "right", "bottom", "left"]
		positionProps.forEach((p) => {
			nextValues[p] = getNum(p, 0)
		})

		setValues(nextValues)
		setTimeout(() => { isUpdatingRef.current = false }, 0)
	}, [selectedSelector, cssCode])

	const handleResetStyles = () => {
		if (!selectedSelector) return
		isUpdatingRef.current = true
		setValues({})
		const GlenSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		const regex = new RegExp(`${GlenSelector}\\s*{[^}]*}\\s*\\n?`, "gi")
		setCssCode(cssCode.replace(regex, ""))
		setTimeout(() => { isUpdatingRef.current = false }, 50)
	}

	const handleValueChange = (property: string, val: string | number, suffix?: string) => {
		isUpdatingRef.current = true
		setValues(prev => ({ ...prev, [property]: val }))
		if (property === "background-color" && typeof val === "string" && val.includes("gradient")) {
			updateCssProperty("background", val)
		} else if (property === "opacity" && typeof val === "number") {
			updateCssProperty("opacity", val / 100)
		} else {
			if (property === "border-width" && typeof val === "number" && val > 0) updateCssProperty("border-style", "solid")
			updateCssProperty(property, val, suffix)
		}
		setTimeout(() => { isUpdatingRef.current = false }, 50)
	}

	const handleAxisChange = (properties: string[], val: number) => {
		isUpdatingRef.current = true
		setValues(prev => ({ ...prev, ...properties.reduce((acc, p) => ({ ...acc, [p]: val }), {}) }))
		properties.forEach(p => updateCssProperty(p, val, "px"))
		setTimeout(() => { isUpdatingRef.current = false }, 50)
	}

	return (
		<div className="flex flex-col h-full w-full overflow-hidden">
			<div className="flex-1 overflow-y-auto p-3 bg-background/50">
				<Card>
					<CardContent className="flex flex-col gap-1.5 p-0">
						<div className="flex items-center justify-between px-1">
							<h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">Selected Element</h3>
							<Button variant="ghost" size="sm" onClick={handleResetStyles} className="h-4 px-1 text-[9px] text-muted-foreground hover:text-destructive gap-0.5"><RotateCcw className="size-2.5" />Reset</Button>
						</div>
						<Card className="p-2 w-full font-mono text-[11px] break-all text-primary select-text">
							<CardContent className="p-0">{selectedSelector || "None selected"}</CardContent>
						</Card>
					</CardContent>
				</Card>

				<Card className="mt-4">
					<CardContent className="flex flex-col gap-5 p-0">
						{PROPERTY_SECTIONS.map((section) => {
							if (section.title === "Clip Path" && !isIframe) return null

							return (
								<div key={section.title} className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between px-1">
										<h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">{section.title}</h3>
										{section.hasCollapsibleSide && section.collapsibleKey && (
											<Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground" onClick={() => setCollapsibles(prev => ({ ...prev, [section.collapsibleKey!]: !prev[section.collapsibleKey as keyof typeof collapsibles] }))}>
												{collapsibles[section.collapsibleKey as keyof typeof collapsibles] ? <Minus className="size-3" /> : <Plus className="size-3" />}
											</Button>
										)}
									</div>

									{section.title === "Position" && (
										<div className="flex flex-col gap-2.5 px-1">
											<select value={values["position"] || "static"} onChange={(e) => handleValueChange("position", e.target.value)} className="bg-background border border-input rounded-md p-1 text-[11px] w-full">
												<option value="static">Static</option>
												<option value="relative">Relative</option>
												<option value="absolute">Absolute</option>
												<option value="fixed">Fixed</option>
												<option value="sticky">Sticky</option>
											</select>
											<div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
												{section.gridProperties?.map((p) => (
													<SliderProperty key={p.id} label={p.label.charAt(0)} value={values[p.property] ?? 0} suffix={p.suffix} min={p.min} max={p.max} onChange={(v) => handleValueChange(p.property, v, p.suffix)} />
												))}
											</div>
										</div>
									)}

									<div className="space-y-2.5">
										{section.groups?.map((group, idx) => (
											<div key={idx} className="flex gap-3">
												<div className="flex-1">
													<SliderProperty label={group.labelX} value={values[group.propertiesX[0]] ?? 0} suffix="px" onChange={(v) => handleAxisChange(group.propertiesX, v)} />
												</div>
												<div className="flex-1">
													<SliderProperty label={group.labelY} value={values[group.propertiesY[0]] ?? 0} suffix="px" onChange={(v) => handleAxisChange(group.propertiesY, v)} />
												</div>
											</div>
										))}

										{section.properties && section.properties.filter(p => p.type === "slider").length > 0 && (
											<div className="flex gap-3">
												{section.properties.filter(p => p.type === "slider").map((p) => (
													<div key={p.id} className="flex-1">
														<SliderProperty label={p.label} value={values[p.property] ?? p.fallback ?? 0} suffix={p.suffix} min={p.min} max={p.max} onChange={(v) => handleValueChange(p.property, v, p.suffix)} />
													</div>
												))}
											</div>
										)}

										{section.properties?.filter(p => p.type === "color").map((p) => (
											<div key={p.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-accent/40 rounded-md transition-colors w-full font-mono text-[11px]">
												<span className="text-[9px] font-bold text-muted-foreground uppercase pl-1 truncate">{p.label}</span>
												<ColorPicker color={values[p.property] ?? p.fallback ?? "#ffffff"} onChange={(v) => handleValueChange(p.property, v)} />
											</div>
										))}

										{section.properties?.filter(p => p.type === "select").map((p) => {
											if (section.title !== "Clip Path") return null;

											return (
												<div key={p.id} className="flex flex-col gap-2 p-1">
													<select
														value={values[p.property] ?? "none"}
														onChange={(e) => handleValueChange(p.property, e.target.value)}
														className="w-full bg-background border border-input rounded-md p-1.5 text-[11px] font-mono"
													>
														<option value="none">None</option>
														<option value="circle(50%)">Circle</option>
														<option value="inset(10% 10% 10% 10%)">Inset</option>
														<option value="ellipse(50% 50% at 50% 50%)">Ellipse</option>
													</select>
												</div>
											);
										})}

										{section.collapsibleKey && collapsibles[section.collapsibleKey as keyof typeof collapsibles] && section.gridProperties && (
											<div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pt-2 border-t border-dashed border-border/40">
												{section.gridProperties.map((p) => (
													<SliderProperty key={p.id} label={p.label} value={values[p.property] ?? 0} suffix={p.suffix} min={p.min} max={p.max} onChange={(v) => handleValueChange(p.property, v, p.suffix)} />
												))}
											</div>
										)}
									</div>
								</div>
							)
						})}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}