import { useState, useEffect, useMemo } from "react"
import { fetchLogosFromCloudinary, type CloudinaryLogo } from "@/lib/cloudinary"
import { Search, Image as ImageIcon, Palette, Heart, List, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { LogoRecolor } from "./LogoRecolor"
import { useLogoStore } from "@/store/logoStore"

interface GaiaLogoPanelProps {
	tagName?: string | string[]
	onSelectLogo?: (cssUrlValue: string) => void
}

export function GaiaLogoPanel({ tagName = "gaia-logo", onSelectLogo }: GaiaLogoPanelProps) {
	const [logos, setLogos] = useState<CloudinaryLogo[]>([])
	const { logos: savedRecolors, initializeLogos, deleteLogo, addLogo } = useLogoStore()

	const [viewMode, setViewMode] = useState<"gallery" | "saved">("gallery")
	const [searchQuery, setSearchQuery] = useState<string>("")
	const [rawSvgContent, setRawSvgContent] = useState<string>("")
	const [isSvgLoading, setIsSvgLoading] = useState(false)

	const TARGET_SVG_URL = "https://res.cloudinary.com/dowqfxgfe/image/upload/v1783043322/gaiaonline-svg-logo_zfldzp.svg"

	useEffect(() => {
		initializeLogos()
	}, [initializeLogos])

	useEffect(() => {
		const fetchAndSanitizeSvg = async () => {
			setIsSvgLoading(true)
			try {
				const response = await fetch(TARGET_SVG_URL)
				const text = await response.text()
				setRawSvgContent(text)
			} catch (err) { console.error("SVG fetch failed", err) } finally { setIsSvgLoading(false) }
		}
		fetchAndSanitizeSvg()
	}, [])

	useEffect(() => {
		async function loadLogos() {
			try {
				const data = await fetchLogosFromCloudinary(tagName)
				setLogos(data)
			} catch (err) { console.error("Logo fetch failed", err) }
		}
		loadLogos()
	}, [tagName])

	const items = useMemo(() => {
		return viewMode === "gallery"
			? logos.map(l => ({ id: l.id, name: l.name, url: l.url }))
			: Object.values(savedRecolors).map((l) => ({ id: l.id, name: l.name, url: l.svgContent }))
	}, [viewMode, logos, savedRecolors])

	const filteredItems = useMemo(() => {
		const query = searchQuery.toLowerCase().trim()
		return query ? items.filter((item) => item.name.toLowerCase().includes(query)) : items
	}, [items, searchQuery])

	return (
		<div className="flex flex-col h-full w-full bg-background p-3 gap-3 overflow-hidden">
			<div className="flex flex-col gap-2 border-b border-border/50 pb-3">
				<div className="flex items-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
					<ImageIcon className="size-3.5 text-sky-500 mr-2" />
					<span>Gaia Logo</span>
				</div>
				<div className="flex gap-1">
					<Dialog>
						<DialogTrigger>
							<Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 flex-1"><Palette className="size-3" /> Recolor</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-3xl overflow-hidden p-0 shadow-2xl">
							<DialogHeader className="p-5 border-b"><DialogTitle>Gaia Logo Recolor</DialogTitle></DialogHeader>
							<LogoRecolor
								rawSvgContent={rawSvgContent}
								isSvgLoading={isSvgLoading}
								onSave={async (url) => {
									await addLogo("Custom Logo", url);
									onSelectLogo?.(url);
								}}
							/>
						</DialogContent>
					</Dialog>
					<Button variant={viewMode === "gallery" ? "secondary" : "ghost"} size="sm" className="h-7 text-[10px] px-2" onClick={() => setViewMode("gallery")}><List className="size-3" /></Button>
					<Button variant={viewMode === "saved" ? "secondary" : "ghost"} size="sm" className="h-7 text-[10px] px-2" onClick={() => setViewMode("saved")}><Heart className="size-3" /></Button>
				</div>
			</div>
			<InputGroup className="w-full">
				<InputGroupInput placeholder="Search assets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="text-[11px] h-8" />
				<InputGroupAddon><Search className="size-3 text-muted-foreground" /></InputGroupAddon>
			</InputGroup>

			<div className="flex-1 overflow-y-auto pr-1">
				<div className="grid grid-cols-2 gap-2">
					{filteredItems.map((item) => (
						<div
							key={item.id}
							className="group relative flex items-center justify-center border border-border/50 hover:border-sky-500/50 rounded-lg p-2 h-12 cursor-pointer transition-all hover:bg-sky-500/5"
							onClick={() => {
								const cssUrl = item.url.startsWith("<svg")
									? `url('data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(item.url)))}')`
									: (item.url.startsWith('url') ? item.url : `url('${item.url}')`);
								onSelectLogo?.(cssUrl);
							}}
						>
							{item.url.startsWith("<svg") ? (
								<div
									className="w-12 h-6 [&>svg]:w-full [&>svg]:h-full"
									dangerouslySetInnerHTML={{ __html: item.url }}
								/>
							) : (
								<img
									src={item.url.startsWith('url') ? item.url.replace(/url\('(.*)'\)/, '$1') : item.url}
									className="w-12 h-6 object-contain"
									alt={item.name}
								/>
							)}

							{viewMode === "saved" && (
								<button
									className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={(e) => { e.stopPropagation(); deleteLogo(item.id); }}
								>
									<Trash2 className="size-3 text-destructive" />
								</button>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}