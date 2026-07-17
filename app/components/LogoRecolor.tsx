import { useState, useCallback, useMemo, useEffect, memo } from "react"
import { useLocation } from "react-router"
import { toast } from "sonner"
import { Loader2, Download, Check, Copy, Save, FileType } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/colorpicker/ColorPicker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLogoStore } from "@/store/logoStore"

interface LogoRecolorProps {
	onSave: (cssUrl: string) => void
	rawSvgContent: string
	isSvgLoading: boolean
}

const LOGO_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1783043322/gaiaonline-svg-logo_zfldzp.svg"
const EQUALIZER_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1784253658/gaia-profile-designer_equalizer.svg"
const EQUALIZER_PIXEL_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1784256820/gaia-profile-designer_equalizer-pixel_njnodo.svg"

const SVGDisplay = memo(({ content }: { content: string }) => (
	<div 
		className="max-w-full max-h-full flex justify-center items-center [&>svg]:max-w-full [&>svg]:max-h-full" 
		dangerouslySetInnerHTML={{ __html: content }} 
	/>
))

export function LogoRecolor({ onSave, rawSvgContent, isSvgLoading }: LogoRecolorProps) {
	const location = useLocation()
	const isLogoRecolorPage = location.pathname.includes("logo-recolor")
	const isStudioPage = location.pathname.includes("studio")

	const [activeRecolorTab, setActiveRecolorTab] = useState<"logo" | "equalizer">("logo")
	const [equalizerStyle, setEqualizerStyle] = useState<"standard" | "pixel">("standard")
	const [logoColor, setLogoColor] = useState("#605270")
	const [exportName, setExportName] = useState("gaia-header-logo")
	const [scale, setScale] = useState<string>("1")
	const addLogo = useLogoStore((state) => state.addLogo)

	const [svgs, setSvgs] = useState({ logo: rawSvgContent, equalizer: "", equalizerPixel: "" })
	const [loading, setLoading] = useState({ logo: isSvgLoading, equalizer: false, equalizerPixel: false })

	useEffect(() => {
		const controller = new AbortController()
		const fetchAsset = async (key: keyof typeof svgs, url: string) => {
			if (svgs[key]) return
			setLoading(prev => ({ ...prev, [key]: true }))
			try {
				const res = await fetch(url, { signal: controller.signal })
				const text = await res.text()
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
			fetchAsset("equalizerPixel", EQUALIZER_PIXEL_SVG_URL)
		}
		return () => controller.abort()
	}, [activeRecolorTab, rawSvgContent])

	const currentSvgContent = useMemo(() => {
		if (activeRecolorTab === "logo") return svgs.logo
		return equalizerStyle === "standard" ? svgs.equalizer : svgs.equalizerPixel
	}, [activeRecolorTab, equalizerStyle, svgs])

	const dimensions = useMemo(() => {
		const h = scale === "16" ? 16 : scale === "20" ? 20 : 57 * parseFloat(scale)
		return { height: h, width: h * (121 / 57) }
	}, [scale])

	const getColoredSvg = useCallback((content: string, width: number, height: number, color: string) => {
		if (!content) return ""
		const parser = new DOMParser()
		const doc = parser.parseFromString(content, "image/svg+xml")
		const svg = doc.documentElement

		const isGradient = color.includes("linear-gradient")
		let defs = svg.querySelector("defs")
		if (!defs) {
			defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs")
			svg.insertBefore(defs, svg.firstChild)
		}

		if (isGradient) {
			const angleMatch = color.match(/(\d+)deg/)
			const angle = angleMatch ? parseInt(angleMatch[1]) : 90
			const stopMatches = Array.from(color.matchAll(/(#[a-fA-F0-9]{6})\s*(\d+)?%/g))
			const stops = stopMatches.length > 0
				? stopMatches.map((m, i) => ({ color: m[1], offset: m[2] ? `${m[2]}%` : (i === 0 ? "0%" : "100%") }))
				: [{ color: "#605270", offset: "0%" }, { color: "#605270", offset: "100%" }]

			defs.innerHTML = `
				<linearGradient id="custom-gradient" gradientTransform="rotate(${angle})">
					${stops.map(s => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('')}
				</linearGradient>
			`
			svg.querySelectorAll("path, circle, rect, polygon").forEach(el => {
				el.removeAttribute("style")
				el.setAttribute("fill", `url(#custom-gradient)`)
			})
		} else {
			svg.querySelectorAll("path, circle, rect, polygon").forEach(el => {
				el.removeAttribute("style")
				el.setAttribute("fill", color)
			})
		}

		svg.setAttribute("width", width.toString())
		svg.setAttribute("height", height.toString())
		return new XMLSerializer().serializeToString(svg)
	}, [])

	const memoizedSvg = useMemo(() => getColoredSvg(currentSvgContent, dimensions.width, dimensions.height, logoColor), [getColoredSvg, currentSvgContent, dimensions, logoColor])

	const convertSvgToDataUrl = useCallback((svgContent: string): string => {
		return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`
	}, [])

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text)
		toast.success("Copied to clipboard")
	}

	const handleDownloadPng = useCallback(() => {
		const img = new Image()
		const url = URL.createObjectURL(new Blob([memoizedSvg], { type: "image/svg+xml;charset=utf-8" }))
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

	const handleDownloadSvg = useCallback(() => {
		const blob = new Blob([memoizedSvg], { type: "image/svg+xml;charset=utf-8" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.download = `${exportName}.svg`
		link.href = url
		link.click()
		URL.revokeObjectURL(url)
	}, [memoizedSvg, exportName])

	const cssSelector = activeRecolorTab === "logo" ? `#gaia_header #header_left img` : `.equalizer-asset`

	return (
		<div className="w-full bg-background border rounded-xl shadow-xl overflow-hidden">
			<div className="p-5 border-b flex items-center justify-between">
				<span className="font-semibold">Asset Recolor Panel</span>
				<Tabs 
					value={activeRecolorTab} 
					onValueChange={(val) => {
						setActiveRecolorTab(val as "logo" | "equalizer")
						setExportName(val === "logo" ? "gaia-header-logo" : `equalizer-${equalizerStyle}-recolored`)
					}} 
					className="w-48"
				>
					<TabsList className="grid w-full grid-cols-2 h-8 p-1">
						<TabsTrigger value="logo" className="text-[10px]">Logo</TabsTrigger>
						<TabsTrigger value="equalizer" className="text-[10px]">Equalizer</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			
			<div className="p-6 bg-muted/20 border-b flex justify-center items-center h-48">
				{(activeRecolorTab === "logo" ? loading.logo : (loading.equalizer || loading.equalizerPixel)) ? <Loader2 className="animate-spin size-8" /> :
					!currentSvgContent ? <span className="text-xs italic text-muted-foreground">Click tab to load preview</span> :
					<SVGDisplay content={memoizedSvg} />
				}
			</div>
			<div className="grid grid-cols-2 gap-8 p-6">
				<div className="space-y-4">
					{activeRecolorTab === "equalizer" && (
						<div className="space-y-1.5">
							<Label className="text-[10px] uppercase font-bold tracking-wider">Equalizer Style</Label>
							<div className="grid grid-cols-2 gap-3">
								{["standard", "pixel"].map((style) => (
									<button
										key={style}
										type="button"
										onClick={() => {
											setEqualizerStyle(style as "standard" | "pixel")
											setExportName(`equalizer-${style}-recolored`)
										}}
										className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
											equalizerStyle === style
												? "border-primary bg-primary/5 ring-1 ring-primary"
												: "border-muted bg-transparent hover:bg-muted/30"
										}`}
									>
										<span className="text-[11px] font-medium mt-1">{style === "standard" ? "Standard" : "Pixel"}</span>
									</button>
								))}
							</div>
						</div>
					)}
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase font-bold tracking-wider">Color</Label>
						<div className="flex items-center gap-3">
							<ColorPicker color={logoColor} onChange={setLogoColor} />
							<Input className="h-9 text-xs" value={logoColor} onChange={(e) => setLogoColor(e.target.value)} />
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase font-bold tracking-wider">File Name</Label>
						<Input value={exportName} onChange={(e) => setExportName(e.target.value)} className="h-9 text-xs" />
					</div>
					<div className="space-y-1.5">
						<Label className="text-[10px] uppercase font-bold tracking-wider">Image Size</Label>
						<Select value={scale} onValueChange={(val) => val && setScale(val)}>
							<SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="1">1x</SelectItem>
								<SelectItem value="0.5">0.5x</SelectItem>
								<SelectItem value="1.5">1.5x</SelectItem>
								<SelectItem value="2">2x</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="space-y-6">
					<div className="space-y-1.5">
						<div className="flex justify-between items-center">
							<Label className="text-[10px] uppercase font-bold tracking-wider">Data URI</Label>
							<Button variant="ghost" size="icon" className="size-6" disabled={!currentSvgContent} onClick={() => copyToClipboard(convertSvgToDataUrl(memoizedSvg))}><Copy className="size-3" /></Button>
						</div>
						<div className="relative border rounded-md p-3 bg-secondary/30 h-32 overflow-auto">
							<code className="text-[9px] text-muted-foreground font-mono break-all">
								{currentSvgContent ? convertSvgToDataUrl(memoizedSvg) : "No asset selected."}
							</code>
						</div>
					</div>
					<div className="space-y-1.5">
						<div className="flex justify-between items-center">
							<Label className="text-[10px] uppercase font-bold tracking-wider">CSS</Label>
							<Button variant="ghost" size="icon" className="size-6" disabled={!currentSvgContent} onClick={() => copyToClipboard(`${cssSelector} {\n\tpadding: 0 47px 0 0;\n\theight: 16px;\n\twidth: 0;\n\tbackground: url('${convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;\n}`)}><Copy className="size-3" /></Button>
						</div>
						<div className="relative border rounded-md p-3 bg-secondary/30 h-32 overflow-auto">
							<code className="text-[9px] text-muted-foreground font-mono break-all">
								{currentSvgContent ? (
									<>
										{cssSelector} {'{'}
										{"\n\t"}padding: 0 47px 0 0;
										{"\n\t"}height: 16px;
										{"\n\t"}width: 0;
										{"\n\t"}background: url('{convertSvgToDataUrl(memoizedSvg)}') no-repeat center / contain;
										{"\n}"}
									</>
								) : "No asset selected."}
							</code>
						</div>
					</div>
				</div>
			</div>
			<div className="p-4 border-t bg-secondary/20 flex flex-wrap gap-2">
				<Button
					variant="secondary"
					className="flex-1 gap-2"
					disabled={!currentSvgContent}
					onClick={handleDownloadPng}
				>
					<Download className="size-3.5" /> Export as PNG
				</Button>
				<Button
					variant="secondary"
					className="flex-1 gap-2"
					disabled={!currentSvgContent}
					onClick={handleDownloadSvg}
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