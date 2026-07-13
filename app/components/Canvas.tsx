import { memo, useRef, useEffect, useMemo, useState } from "react"
import bbobHTML from '@bbob/html'
import presetHTML5 from '@bbob/preset-html5'
import GaiaScript from '@/gaia_assets/js/gaia.js?raw'
import canvasIframeController from "@/components/canvas-iframe-controller.js?raw"
import { type ColumnLayoutState as ColumnState } from "@/store/useColumnStore"
import { useProfileStore } from "~/store/useProfileStore"
import { useCustomPanelStore } from "~/store/useCustomPanelStore"
import { customPreset } from '@/lib/bbob-presets';

const TARGET_WIDTH = 1920
const TARGET_HEIGHT = 1080
const DEFAULT_AVATAR = "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/f3/77/5e4a907513377f3_flip.png"
const DEFAULT_USERNAME = "Your Username"

const presetCssModules = import.meta.glob("/app/premade/**/preset.css", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const presetTomlModules = import.meta.glob("/app/premade/**/preset.toml", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const panelHtmlModules = import.meta.glob("/app/gaia_assets/panels/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>

const myPreset = presetHTML5.extend((tags: any) => ({
	...tags,
	spoiler: (node: any) => ({
		tag: 'details',
		content: [
			{ tag: 'summary', content: 'Spoiler' },
			...node.content
		]
	})
}));

interface CanvasProps {
	isMaximized: boolean
	activeTool: "select" | null
	rootCss?: string
	cssCode?: string
	presetId?: string | null
	category?: string | null
	activePanels?: string[]
	columnLayout?: ColumnState | null
	selectedSelector?: string
	onElementSelected?: (selector: string) => void
	version?: "v1" | "v2"
	[key: string]: any
}

export const Canvas = memo(function Canvas({
	isMaximized,
	activeTool,
	rootCss = "",
	cssCode = "",
	presetId = null,
	category = null,
	activePanels = [],
	columnLayout = null,
	selectedSelector = "",
	onElementSelected,
	version = "v2"
}: CanvasProps) {
	const [versionData, setVersionData] = useState<{ html: string; css: string } | null>(null)
	const [loading, setLoading] = useState(true)

	const wrapperRef = useRef<HTMLDivElement>(null)
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const isSelectionMode = activeTool === "select"
	const customPanels = useCustomPanelStore((state) => state.panels);

	const avatarUrl = useProfileStore((state) => state.avatarUrl)
	const username = useProfileStore((state) => state.username)

	useEffect(() => {
		setLoading(true)
		const loadVersion = async () => {
			let html, css
			if (version === "v1") {
				html = (await import('@/gaia_assets/html/v1-classic.html?raw')).default
				css = (await import('@/gaia_assets/css/v1-classic.css?raw')).default
			} else {
				html = (await import('@/gaia_assets/html/v2-current.html?raw')).default
				css = (await import('@/gaia_assets/css/v2-current.css?raw')).default
			}
			setVersionData({ html, css })
			setLoading(false)
		}
		loadVersion()
	}, [version])

	const loadedPresetCss = useMemo(() => {
		if (!presetId || !category) return ""
		return presetCssModules[`/app/premade/${category}/${presetId}/preset.css`] || ""
	}, [presetId, category])

	const parsedTomlLayout = useMemo(() => {
		if (!presetId || !category) return null
		const rawToml = presetTomlModules[`/app/premade/${category}/${presetId}/preset.toml`]
		if (!rawToml) return null

		const layout = {
			column1: [] as string[],
			column2: [] as string[],
			column3: [] as string[],
			panels: [] as string[]
		}

		const arrayRegex = /(column[1-3])\s*=\s*\[([\s\S]*?)\]/g
		let match
		while ((match = arrayRegex.exec(rawToml)) !== null) {
			layout[match[1] as "column1" | "column2" | "column3"] = match[2]
				.replace(/["']/g, ' ')
				.replace(/,/g, ' ')
				.split(/\s+/)
				.filter(name => name.trim().length > 0)
		}

		return layout
	}, [presetId, category])

	const shouldCenterPanel = useMemo(() => category === "wishlist", [category])

	const integratedHtml = useMemo(() => {
		if (!versionData) return "";
		if (shouldCenterPanel) return category ? panelHtmlModules[`/app/gaia_assets/panels/${category}.html`] || "" : "";

		let currentHtml = versionData.html;
		const layoutToUse = columnLayout || parsedTomlLayout;

		(["column1", "column2", "column3"] as const).forEach((colKey, index) => {
			const targetColumnString = `id="column_${index + 1}" class="column focus_column">`;

			const compiled = (layoutToUse?.[colKey] ?? [])
				.filter((id: string) => id !== "columns")
				.map((id: string) => {
					if (customPanels[id]) {
						const processedContent = customPanels[id].content.replace(/\n/g, '<br>');
						const htmlContent = bbobHTML(processedContent, customPreset());

						return `
						<div id="#id_${id}" class="panel custom_panel postcontent">
							<h2 id="${id}_title">${customPanels[id].name}</h2>
							<div id="${id}_content">${htmlContent}</div>
							<div class="clear"></div>
						</div>`.trim();
					}
					return panelHtmlModules[`/app/gaia_assets/panels/${id}.html`] || "";
				})
				.join("\n");

			currentHtml = currentHtml.replace(targetColumnString, `${targetColumnString}\n${compiled}`);
		});

		return currentHtml;
	}, [category, shouldCenterPanel, parsedTomlLayout, columnLayout, versionData, customPanels]);

	const finalAvatarUrl = avatarUrl || DEFAULT_AVATAR
	const finalUsername = username || DEFAULT_USERNAME

	const initialSrcDoc = useMemo(() => {
		if (!versionData) return ""
		return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<style id="base-styles">${versionData.css}</style>
				<style id="active-preset-styles"></style>
				<style id="user-overrides"></style>
				<style id="extension-features-styles"></style>
				<style>
					.highlight-hover { outline: 2px dashed #ff4500 !important; outline-offset: 4px; cursor: crosshair !important; }
					.highlight-selected { outline: 2px solid #ff4500 !important; outline-offset: 4px; }
					body { box-sizing: border-box; }
					html.highlight-selected body { outline: 2px solid #ff4500 !important; outline-offset: 4px; }
					* { user-select: none !important; }
					
					.iframe-selection-shield {
						position: absolute;
						background: transparent;
						z-index: 999999;
						cursor: crosshair;
					}
					details { background: #f0f0f0; padding: 10px; border: 1px solid #ccc; }
					summary { cursor: pointer; font-weight: bold; }
				</style>
			</head>
			<body id="viewer">
				<script>
					${GaiaScript}
					${canvasIframeController}
				</script>
			</body>
		</html>`
	}, [versionData])

	useEffect(() => {
		(window as any).isSelectionModeActive = isSelectionMode
	}, [isSelectionMode])

	useEffect(() => {
		if (loading || !integratedHtml) return
		const pushStateToIframe = () => {
			const win = iframeRef.current?.contentWindow
			if (!win) return

			win.postMessage({ type: 'init-html', html: integratedHtml }, '*')
			win.postMessage({ type: 'update-identity', avatarUrl: finalAvatarUrl, username: finalUsername }, '*')
			win.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*')
			win.postMessage({ type: 'sync-selected-element', selector: selectedSelector }, '*')

			try {
				const doc = win.document
				const styleTag = doc.getElementById('user-overrides') as HTMLStyleElement | null
				if (styleTag) {
					styleTag.textContent = `${rootCss}\n${cssCode}`
				}
			} catch (e) {
				console.error(e)
			}
		}

		pushStateToIframe()

		const iframe = iframeRef.current
		iframe?.addEventListener('load', pushStateToIframe)
		return () => iframe?.removeEventListener('load', pushStateToIframe)
	}, [integratedHtml, loading, finalAvatarUrl, finalUsername])

	useEffect(() => {
		if (loading) return
		const win = iframeRef.current?.contentWindow
		if (!win) return

		try {
			const doc = win.document
			const layoutStyle = doc.getElementById('active-preset-styles') as HTMLStyleElement | null
			if (layoutStyle) {
				layoutStyle.textContent = loadedPresetCss
			}

			const centerStylesId = "center-panel-layout-rules"
			let centerStyles = doc.getElementById(centerStylesId) as HTMLStyleElement | null
			if (shouldCenterPanel) {
				if (!centerStyles) {
					centerStyles = doc.createElement("style")
					centerStyles.id = centerStylesId
					doc.head.appendChild(centerStyles)
				}
				centerStyles.textContent = "html,body{overflow:hidden}body > *{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);margin:0;}"
			} else if (centerStyles) {
				centerStyles.remove()
			}
		} catch (error) {
			console.error("Failed to dynamically sync preset layout modifications:", error)
		}
	}, [loading, loadedPresetCss, shouldCenterPanel])

	useEffect(() => {
		if (loading) return
		const win = iframeRef.current?.contentWindow
		if (win) {
			win.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*')
			win.postMessage({ type: 'sync-selected-element', selector: selectedSelector }, '*')

			try {
				const doc = win.document
				if (isSelectionMode) {
					doc.querySelectorAll("iframe, embed, object").forEach((el) => {
						const iframeEl = el as HTMLIFrameElement
						if (iframeEl.id === "viewer") return

						const parent = iframeEl.parentElement
						if (parent) {
							if (getComputedStyle(parent).position === "static") {
								parent.style.position = "relative"
							}

							let shield = parent.querySelector(".iframe-selection-shield") as HTMLDivElement | null
							if (!shield) {
								shield = doc.createElement("div")
								shield.className = "iframe-selection-shield"
								parent.appendChild(shield)
							}

							shield.style.left = `${iframeEl.offsetLeft}px`
							shield.style.top = `${iframeEl.offsetTop}px`
							shield.style.width = `${iframeEl.offsetWidth || iframeEl.width || 470}px`
							shield.style.height = `${iframeEl.offsetHeight || iframeEl.height || 264}px`
						}
					})
				} else {
					doc.querySelectorAll(".iframe-selection-shield").forEach(el => el.remove())
				}
			} catch (error) {
				console.error("Failed to update selection mode shields:", error)
			}
		}
	}, [loading, isSelectionMode, selectedSelector])

	useEffect(() => {
		if (loading) return;
		const iframe = iframeRef.current;
		if (!iframe?.contentWindow) return;

		try {
			const win = iframe.contentWindow;
			const styleTag = win.document.getElementById('user-overrides') as HTMLStyleElement | null;

			if (styleTag) {
				styleTag.textContent = `${rootCss}\n${cssCode}`;
			}
		} catch (error) {
			console.error("Failed to inject styles into iframe:", error);
		}
	}, [loading, rootCss, cssCode]);

	useEffect(() => {
		const handleMessage = (e: MessageEvent) => {
			if (e.data?.type === 'element-selected' && onElementSelected) {
				let selector = e.data.selector as string
				if (selector.includes(".iframe-selection-shield")) {
					selector = selector.replace(/\.iframe-selection-shield/g, "iframe")
				}
				onElementSelected(selector)
			}
		}
		window.addEventListener('message', handleMessage)
		return () => window.removeEventListener('message', handleMessage)
	}, [onElementSelected])

	useEffect(() => {
		const wrapper = wrapperRef.current
		if (!wrapper || isMaximized) return
		const observer = new ResizeObserver((entries) => {
			const scale = Math.min(1, entries[0].contentRect.width / TARGET_WIDTH, entries[0].contentRect.height / TARGET_HEIGHT)
			wrapper.style.setProperty('--canvas-scale', `${scale}`)
		})
		observer.observe(wrapper)
		return () => observer.disconnect()
	}, [isMaximized])

	return (
		<div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent contain-strict">
			{loading ? (
				<div className="text-white">Loading Version...</div>
			) : (
				<iframe
					ref={iframeRef}
					title="Gaia Preview"
					srcDoc={initialSrcDoc}
					sandbox="allow-scripts allow-same-origin"
					style={{
						width: isMaximized ? "100%" : `${TARGET_WIDTH}px`,
						height: isMaximized ? "100%" : `${TARGET_HEIGHT}px`,
						transform: isMaximized ? "none" : "scale(var(--canvas-scale, 1))",
						transformOrigin: "center center",
						willChange: "transform",
						background: "white"
					}}
					className="block border-none shrink-0 bg-background"
				/>
			)}
		</div>
	)
})
Canvas.displayName = "Canvas"