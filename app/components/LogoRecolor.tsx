import { useState, useCallback, useMemo } from "react";
import { Palette, Loader2, Download, Check, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorPicker } from "@/components/colorpicker/ColorPicker";
import { useLogoStore } from "@/store/logoStore";

interface LogoRecolorProps {
	rawSvgContent: string;
	isSvgLoading: boolean;
	onSave: (cssUrl: string) => void;
}

export function LogoRecolor({ rawSvgContent, isSvgLoading, onSave }: LogoRecolorProps) {
	const [logoColor, setLogoColor] = useState("#605270");
	const [exportName, setExportName] = useState("gaia-header-logo");
	const [scale, setScale] = useState<string>("1");
	const addLogo = useLogoStore((state) => state.addLogo);

	const ASPECT_RATIO = 121 / 57;
	const BASE_HEIGHT = 57;

	const dimensions = useMemo(() => {
		const h = scale === "16" ? 16 : scale === "20" ? 20 : BASE_HEIGHT * parseFloat(scale);
		return { height: h, width: h * ASPECT_RATIO };
	}, [scale]);

	const getColoredSvg = useCallback((width: number, height: number) => {
		if (!rawSvgContent) return "";
		const parser = new DOMParser();
		const doc = parser.parseFromString(rawSvgContent, "image/svg+xml");
		const svg = doc.documentElement;

		const isGradient = logoColor.includes("linear-gradient");
		let defs = svg.querySelector("defs");
		if (!defs) {
			defs = doc.createElementNS("http://www.w3.org/2000/svg", "defs");
			svg.insertBefore(defs, svg.firstChild);
		}

		if (isGradient) {
			const gradientId = "custom-gradient";
			const angleMatch = logoColor.match(/(\d+)deg/);
			const angle = angleMatch ? parseInt(angleMatch[1]) : 90;

			const stopMatches = Array.from(logoColor.matchAll(/(#[a-fA-F0-9]{6})\s*(\d+)?%/g));
			const stops = stopMatches.length > 0
				? stopMatches.map((m, i) => ({ color: m[1], offset: m[2] ? `${m[2]}%` : (i === 0 ? "0%" : "100%") }))
				: [{ color: "#605270", offset: "0%" }, { color: "#605270", offset: "100%" }];

			defs.innerHTML = `
				<linearGradient id="${gradientId}" gradientTransform="rotate(${angle})">
					${stops.map(s => `<stop offset="${s.offset}" stop-color="${s.color}" />`).join('')}
				</linearGradient>
			`;
			svg.querySelectorAll("path, circle, rect, polygon").forEach((el) => {
				if (el.getAttribute("fill") !== "none") el.setAttribute("fill", `url(#${gradientId})`);
			});
		} else {
			svg.querySelectorAll("path, circle, rect, polygon").forEach((el) => {
				const fill = el.getAttribute("fill");
				if (!fill || fill === "currentColor" || fill.startsWith("#") || fill === "black" || fill.startsWith("url")) {
					el.setAttribute("fill", logoColor);
				}
			});
		}

		svg.setAttribute("width", width.toString());
		svg.setAttribute("height", height.toString());
		return new XMLSerializer().serializeToString(svg);
	}, [rawSvgContent, logoColor]);

	const memoizedSvg = useMemo(() => getColoredSvg(dimensions.width, dimensions.height), [getColoredSvg, dimensions]);

	const convertSvgToDataUrl = useCallback((svgContent: string): string => {
		return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
	}, []);

	const handleDownloadPng = useCallback(() => {
		const img = new Image();
		const svgBlob = new Blob([memoizedSvg], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(svgBlob);
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = dimensions.width;
			canvas.height = dimensions.height;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, dimensions.width, dimensions.height);
				ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);
				const link = document.createElement("a");
				link.download = `${exportName}.png`;
				link.href = canvas.toDataURL("image/png");
				link.click();
			}
			URL.revokeObjectURL(url);
		};
		img.src = url;
	}, [memoizedSvg, exportName, dimensions]);

	const handleSaveToGallery = useCallback(async () => {
		await addLogo(exportName, memoizedSvg);
	}, [addLogo, exportName, memoizedSvg]);

	return (
		<div className="flex flex-col gap-4">
			<div className="p-6 bg-muted/20 border-b flex justify-center items-center">
				{isSvgLoading ? <Loader2 className="animate-spin size-8" /> :
					<div dangerouslySetInnerHTML={{ __html: memoizedSvg }} />
				}
			</div>
			<div className="grid grid-cols-2 gap-8 p-6">
				<div className="space-y-4">
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
						<Label className="text-[10px] uppercase font-bold tracking-wider">Export Dimensions</Label>
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
					<Button className="w-full gap-2" onClick={handleDownloadPng}><Download className="size-3.5" /> Export PNG</Button>
				</div>
				<div className="space-y-1.5">
					<Label className="text-[10px] uppercase font-bold tracking-wider">Data URI</Label>
					<div className="relative border rounded-md p-3 bg-secondary/30 h-40 overflow-auto">
						<code className="text-[9px] text-muted-foreground font-mono break-all">{convertSvgToDataUrl(memoizedSvg)}</code>
						<Button size="icon" variant="ghost" className="absolute top-1 right-1 size-6" onClick={() => navigator.clipboard.writeText(convertSvgToDataUrl(memoizedSvg))}><Copy className="size-3" /></Button>
					</div>
				</div>
			</div>
			<div className="p-4 border-t bg-secondary/20 flex gap-2">
				<Button
					onClick={async () => {
						const dataUrl = convertSvgToDataUrl(memoizedSvg);
						await addLogo(exportName, memoizedSvg);
						onSave(`url('${dataUrl}')`);
					}}
					className="flex-1"
				>
					<Check className="size-3.5 mr-2" /> Apply Header Logo
				</Button>
				<Button variant="outline" onClick={handleSaveToGallery}>
					<Save className="size-3.5 mr-2" /> Save to Gallery
				</Button>
			</div>
		</div>
	);
}