import { useState, useCallback, useMemo, useEffect, memo, useRef } from "react"
import { useLocation } from "react-router"
import { toast } from "sonner"
import { Loader2, Download, Check, Copy, Save, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ColorPicker } from "@/components/colorpicker/ColorPicker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLogoStore } from "@/store/logoStore"
import { Slider } from "@/components/ui/slider"

interface LogoRecolorProps {
	onSave: (cssUrl: string) => void
	rawSvgContent: string
	isSvgLoading: boolean
}

const svgCache: Record<string, string> = {}
const LOGO_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1783043322/gaiaonline-svg-logo_zfldzp.svg"
const EQUALIZER_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1784253658/gaia-profile-designer_equalizer.svg"
const EQUALIZER_style2_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1784256820/gaia-profile-designer_equalizer-pixel_njnodo.svg"

const SVGDisplay = memo(({ content }: { content: string }) => (
	<div
		className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full"
		dangerouslySetInnerHTML={{ __html: content }}
	/>
))

export function LogoRecolor({ onSave, rawSvgContent, isSvgLoading }: LogoRecolorProps) {
	const location = useLocation()
	const parserRef = useRef(new DOMParser())
	const isLogoRecolorPage = location.pathname.includes("logo-recolor")
	const isStudioPage = location.pathname.includes("studio")

	const [activeRecolorTab, setActiveRecolorTab] = useState<"logo" | "equalizer">("logo")
	const [equalizerStyle, setEqualizerStyle] = useState<"style1" | "style2">("style1")
	const [logoColor, setLogoColor] = useState("#6a8fff")
	const [animateGradient, setAnimateGradient] = useState(false)
	const [animateColors, setAnimateColors] = useState(false)
	const [animationSpeed, setAnimationSpeed] = useState(3)
	const [exportName, setExportName] = useState("gaia-header-logo")
	const [scale, setScale] = useState<string>("1")
	const addLogo = useLogoStore((state) => state.addLogo)

	const [svgs, setSvgs] = useState({ logo: rawSvgContent, equalizer: "", equalizerstyle2: "" })
	const [loading, setLoading] = useState({ logo: isSvgLoading, equalizer: false, equalizerstyle2: false })

	useEffect(() => {
		const controller = new AbortController()
		const fetchAsset = async (key: keyof typeof svgs, url: string) => {
			if (svgs[key] || svgCache[key]) {
				if (!svgs[key]) setSvgs(prev => ({ ...prev, [key]: svgCache[key] }))
				return
			}
			setLoading(prev => ({ ...prev, [key]: true }))
			try {
				const res = await fetch(url, { signal: controller.signal })
				const text = await res.text()
				svgCache[key] = text
				setSvgs(prev => ({ ...prev, [key]: text }))
			} catch (err) {
				if (err instanceof Error && err.name !== 'AbortError') console.error(err)
			} finally {
				setLoading(prev => ({ ...prev, [key]: false }))
			}
		}

		if (activeRecolorTab === "logo") {
			if (!rawSvgContent) fetchAsset("logo", LOGO_SVG_URL)
		} else {
			fetchAsset("equalizer", EQUALIZER_SVG_URL)
			fetchAsset("equalizerstyle2", EQUALIZER_style2_SVG_URL)
		}
		return () => controller.abort()
	}, [activeRecolorTab, rawSvgContent])

	const currentSvgContent = useMemo(() => {
		if (activeRecolorTab === "logo") return svgs.logo
		return equalizerStyle === "style1" ? svgs.equalizer : svgs.equalizerstyle2
	}, [activeRecolorTab, equalizerStyle, svgs])

	const dimensions = useMemo(() => {
		const baseSize = 57
		const h = scale === "16" ? 16 : scale === "20" ? 20 : baseSize * parseFloat(scale)
		return { height: h, width: h * (121 / 57) }
	}, [scale])

	const getColoredSvg = useCallback((content: string, width: number, height: number, color: string, rotate: boolean, cycle: boolean, speed: number) => {
		if (!content) return ""
		const doc = parserRef.current.parseFromString(content, "image/svg+xml")
		const svg = doc.documentElement

		const isGradient = color.includes("linear-gradient")
		let defs = svg.querySelector("defs")
		if (!defs) {
			defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs")
			svg.insertBefore(defs, svg.firstChild)
		}

		if (isGradient) {
			const angleMatch = color.match(/(\d+)deg/)
			const angle = angleMatch ? parseInt(angleMatch[1]) : 0
			const stopMatches = Array.from(color.matchAll(/(#[a-fA-F0-9]{6})\s*(\d+)?%/g))
			const stops = stopMatches.length > 0
				? stopMatches.map((m, i) => ({ color: m[1], offset: m[2] ? `${m[2]}%` : (i === 0 ? "0%" : "100%") }))
				: [{ color: "#6a8fff", offset: "0%" }, { color: "#6a8fff", offset: "100%" }]

			const viewBox = svg.getAttribute("viewBox")?.split(" ") || [0, 0, width, height]
			const x = viewBox[0]
			const y = viewBox[1]
			const w = viewBox[2]
			const h = viewBox[3]

			defs.innerHTML = `
			<linearGradient id="custom-gradient" 
				gradientUnits="userSpaceOnUse" 
				x1="${x}" y1="${y}" x2="${Number(x) + Number(w)}" y2="${Number(y) + Number(h)}"
				gradientTransform="rotate(${angle - 115}, ${Number(x) + Number(w) / 2}, ${Number(y) + Number(h) / 2})">
				${stops.map((s) => {
				const colorList = stops.map(stop => stop.color)
				const values = [...colorList, ...colorList.slice().reverse()].join(';')
				return `
						<stop offset="${s.offset}" stop-color="${s.color}">
							${cycle ? `<animate attributeName="stop-color" values="${values}" dur="${speed}s" repeatCount="indefinite" calcMode="linear" />` : ""}
						</stop>
					`
			}).join('')}
			</linearGradient>
			${rotate ? `
				<style>
					@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
					#custom-gradient { animation: rotate ${speed}s linear infinite; transform-origin: center; }
				</style>
			` : ""}
		`
			svg.querySelectorAll("*").forEach(el => el.setAttribute("fill", "url(#custom-gradient)"))
		} else {
			svg.querySelectorAll("*").forEach(el => el.setAttribute("fill", color))
		}

		svg.setAttribute("width", width.toString())
		svg.setAttribute("height", height.toString())
		return new XMLSerializer().serializeToString(svg)
	}, [])

	const memoizedSvg = useMemo(() => getColoredSvg(currentSvgContent, dimensions.width, dimensions.height, logoColor, animateGradient, animateColors, animationSpeed), [getColoredSvg, currentSvgContent, dimensions, logoColor, animateGradient, animateColors, animationSpeed])

	const convertSvgToDataUrl = useCallback((svgContent: string): string => {
		return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`
	}, [])

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		toast.success("Copied to clipboard")
	}

	const handleDownload = useCallback((isPng: boolean) => {
		const img = new Image()
		const url = URL.createObjectURL(new Blob([memoizedSvg], { type: "image/svg+xml;charset=utf-8" }))

		if (!isPng) {
			const link = document.createElement("a")
			link.download = `${exportName}.svg`
			link.href = url
			link.click()
			URL.revokeObjectURL(url)
			return
		}

		img.onload = () => {
			const canvas = document.createElement("canvas")
			canvas.width = dimensions.width
			canvas.height = dimensions.height
			const ctx = canvas.getContext("2d")
			if (ctx) {
				ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
				const link = document.createElement("a")
				link.download = `${exportName}.png`
				link.href = canvas.toDataURL("image/png")
				link.click()
			}
			URL.revokeObjectURL(url)
		}
		img.src = url
	}, [memoizedSvg, exportName, dimensions])

	const cssSelector = activeRecolorTab === "logo" ? `#gaia_header #header_left img` : `.equalizer-asset`

	return (
		<div className="w-full rounded-xl border bg-background shadow-xl">
			<div className="flex items-center justify-between border-b p-5">
				<div>
					<h2 className="text-lg font-semibold">{activeRecolorTab === "logo" ? "Gaia Logo" : "Equalizer"}</h2>
					<p className="text-sm text-muted-foreground">{activeRecolorTab === "logo" ? "Recolor Gaia logo for your profile gaia header." : "Recolor equalizers for your media panel."}</p>
				</div>
				<Tabs
					value={activeRecolorTab}
					onValueChange={(val) => {
						setActiveRecolorTab(val as "logo" | "equalizer")
						setExportName(val === "logo" ? "gaia-header-logo" : `equalizer-${equalizerStyle}-recolored`)
					}}
					className="w-48"
				>
					<TabsList className="grid h-8 w-full grid-cols-2 p-1">
						<TabsTrigger value="logo" className="text-[10px]">Logo</TabsTrigger>
						<TabsTrigger value="equalizer" className="text-[10px]">Equalizer</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="flex h-48 items-center justify-center border-b bg-muted/20 p-6">
				{(activeRecolorTab === "logo" ? loading.logo : (loading.equalizer || loading.equalizerstyle2)) ? <Loader2 className="size-8 animate-spin" /> :
					!currentSvgContent ? <span className="text-xs italic text-muted-foreground">Click tab to load preview</span> :
						<SVGDisplay content={memoizedSvg} />
				}
			</div>

			<div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
				<div className="space-y-4">
					{activeRecolorTab === "equalizer" && (
						<div className="space-y-1.5">
							<Label className="text-[10px] font-bold uppercase tracking-wider">Styles</Label>
							<div className="flex gap-2">
								{[{ id: "style1", content: svgs.equalizer }, { id: "style2", content: svgs.equalizerstyle2 }].map((style) => {
									const previewSvg = getColoredSvg(style.content, 57, 57, logoColor, false, false, 0)
									return (
										<button
											key={style.id}
											type="button"
											onClick={() => {
												setEqualizerStyle(style.id as "style1" | "style2")
												setExportName(`equalizer-${style.id}-recolored`)
											}}
											className={`flex size-10 items-center justify-center rounded-lg border transition-all ${equalizerStyle === style.id
												? "border-primary bg-primary/5 ring-1 ring-primary"
												: "border-muted bg-transparent hover:bg-muted/30"
												}`}
										>
											<div
												className="size-4 opacity-70 pointer-events-none [&>svg]:h-full [&>svg]:w-full"
												dangerouslySetInnerHTML={{ __html: previewSvg }}
											/>
										</button>
									)
								})}
							</div>
						</div>
					)}
					<div className="space-y-1.5">
						<Label className="text-[10px] font-bold uppercase tracking-wider">Color</Label>
						<div className="flex items-center gap-3">
							<ColorPicker color={logoColor} onChange={setLogoColor} />
							<Input className="h-9 text-xs" value={logoColor} onChange={(e) => setLogoColor(e.target.value)} />
						</div>
					</div>
					{logoColor.includes("linear-gradient") && (
						<div className="space-y-3">
							<div className="flex items-center space-x-2">
								<Switch id="animate-grad" checked={animateGradient} onCheckedChange={setAnimateGradient} />
								<Label htmlFor="animate-grad" className="text-[10px] font-bold uppercase tracking-wider">Animate Angle</Label>
							</div>
							<div className="flex items-center space-x-2">
								<Switch id="animate-colors" checked={animateColors} onCheckedChange={setAnimateColors} />
								<Label htmlFor="animate-colors" className="text-[10px] font-bold uppercase tracking-wider">Cycle Colors</Label>
							</div>
							{(animateGradient || animateColors) && (
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<Label className="text-[10px] font-bold uppercase tracking-wider">Animation Speed</Label>
										<span className="font-mono text-[10px] text-muted-foreground">{animationSpeed}s</span>
									</div>
									<Slider
										min={0.5}
										max={10}
										step={0.5}
										value={[animationSpeed]}
										onValueChange={(val) => {
											const newValue = Array.isArray(val) ? val[0] : val
											setAnimationSpeed(newValue)
										}}
									/>
								</div>
							)}
						</div>
					)}
					<div className="space-y-1.5">
						<div className="flex gap-2">
							<div className="flex-1 space-y-1.5">
								<Label>File Name</Label>
								<Input
									value={exportName}
									onChange={(e) => setExportName(e.target.value)}
								/>
							</div>
							<div className="w-24 space-y-1.5">
								<Label>Image Size</Label>
								<Select value={scale} onValueChange={(val) => val && setScale(val)}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0.3">0.3</SelectItem>
										<SelectItem value="0.5">0.5</SelectItem>
										<SelectItem value="1">1</SelectItem>
										<SelectItem value="1.5">1.5</SelectItem>
										<SelectItem value="2">2</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-[10px] font-bold uppercase tracking-wider">Data URI</Label>
							<Button variant="ghost" size="icon" className="size-6" disabled={!currentSvgContent} onClick={() => copyToClipboard(convertSvgToDataUrl(memoizedSvg))}><Copy className="size-3" /></Button>
						</div>
						<div className="relative h-32 overflow-auto rounded-md border bg-secondary/30 p-3">
							<code className="break-all font-mono text-[9px] text-muted-foreground">
								{currentSvgContent ? convertSvgToDataUrl(memoizedSvg) : "No asset selected."}
							</code>
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-[10px] font-bold uppercase tracking-wider">CSS</Label>
							<Button variant="ghost" size="icon" className="size-6" disabled={!currentSvgContent} onClick={() => copyToClipboard(activeRecolorTab === "logo" ? `${cssSelector} {\n\tbackground: url('${convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;\n}` : `background: url('${convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;`)}><Copy className="size-3" /></Button>
						</div>
						<div className="relative h-32 overflow-auto rounded-md border bg-secondary/30 p-3">
							<code className="break-all font-mono text-[9px] text-muted-foreground">
								{currentSvgContent ? (
									activeRecolorTab === "logo" ? (
										<>
											{cssSelector} {'{'}
											{"\n\t"}background: url('{convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;
											{"\n}"}
										</>
									) : (
										<>background: url('{convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;</>
									)
								) : "No asset selected."}
							</code>
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 border-t bg-secondary/20 p-4">
				<Button
					variant="secondary"
					className="flex-1 gap-2"
					disabled={!currentSvgContent}
					onClick={() => handleDownload(true)}
				>
					<Download className="size-3.5" /> Export as PNG
				</Button>
				<Button
					variant="secondary"
					className="flex-1 gap-2"
					disabled={!currentSvgContent}
					onClick={() => handleDownload(false)}
				>
					<FileType className="size-3.5" /> Export as SVG
				</Button>
				{!isLogoRecolorPage && (
					<Button
						onClick={async () => {
							const dataUrl = convertSvgToDataUrl(memoizedSvg)
							onSave(`url('${dataUrl}')`)
						}}
						variant="default"
						className="flex-1 gap-2"
						disabled={!currentSvgContent}
					>
						<Check className="size-3.5" /> Apply Recolored Asset
					</Button>
				)}
				{!isStudioPage && (
					<Button variant="outline" className="flex-1 gap-2" disabled={!currentSvgContent} onClick={async () => {
						await addLogo(exportName, memoizedSvg)
						toast.success("Saved to gallery")
					}}>
						<Save className="size-3.5" /> Save Asset
					</Button>
				)}
			</div>
		</div>
	)
}