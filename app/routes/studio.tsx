import { useState, useTransition, lazy, Suspense, useEffect, useCallback, useRef, useMemo } from "react"
import { useSearchParams } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarPanel } from "@/components/sidebar-panel"
import { useIsTablet } from "@/hooks/use-is-tablet"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { SidebarTab } from "@/components/sidebar-panel"
import ColumnManager from "@/components/ColumnManager"
import CodePanel from "@/components/CodePanel"
import { ElementPropertiesPanel } from "@/components/ElementPropertiesPanel"
import { LocalProfile } from "@/components/LocalProfile"
import { useProfileStore } from "@/store/useProfileStore"
import { useColumnStore } from "@/store/useColumnStore"

import { StudioMobileFallback } from "./studio/StudioMobileFallback"
import { StudioHeader } from "./studio/StudioHeader"
import { StudioToolbar } from "./studio/StudioToolbar"

import { Settings, Move, Hash, Component, Image } from "lucide-react"

const SelectorPanel = lazy(() => import("@/components/SelectorPanel"))
const Canvas = lazy(() => import("~/components/Canvas").then((m) => ({ default: m.Canvas })))
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"))
const InspectorPanel = lazy(() => import("@/components/InspectorPanel"))
const GaiaLogoPanel = lazy(() => import("@/components/GaiaLogoPanel").then((m) => ({ default: m.GaiaLogoPanel })))

const panelFiles = import.meta.glob("/app/presets/panels_html/*.html")
const EXCLUDED_PANELS = ["header", "columns"]

const presetCssFiles = import.meta.glob("/app/presets/**/preset.css", {
	query: "?raw",
	import: "default",
})

const INITIAL_PANELS = Object.keys(panelFiles)
	.map((path) => path.split("/").pop()?.replace(".html", ""))
	.filter((name): name is string => !!name && !EXCLUDED_PANELS.includes(name))

const leftTabs: SidebarTab<"selectors" | "columns">[] = [
	{ id: "columns", icon: Move, label: "Toggle Column Manager" },
	{ id: "selectors", icon: Hash, label: "Toggle Gaia CSS Selectors Panel" },
]

export const STORAGE_KEY = "gstudio-panel-column-assignments"

export default function Studio() {
	const [leftOpen, setLeftOpen] = useState(true)
	const [rightOpen, setRightOpen] = useState(true)
	const [activeLeftTab, setActiveLeftTab] = useState<"selectors" | "columns">("columns")
	const [activeRightTab, setActiveRightTab] = useState<"settings" | "inspector" | "elements" | "logos">("elements")

	const [activeTool, setActiveTool] = useState<"select" | null>(null)

	const [isCodeOpen, setIsCodeOpen] = useState(false)
	const [isMaximized, setIsMaximized] = useState(false)
	const [, startTransition] = useTransition()

	const [isProfileOpen, setIsProfileOpen] = useState(false)

	const profileUsername = useProfileStore((state) => state.username)
	const profileUserId = useProfileStore((state) => state.userId)
	const profileAvatarUrl = useProfileStore((state) => state.avatarUrl)

	const columns = useColumnStore((state) => state.columns)
	const setColumns = useColumnStore((state) => state.setColumns)

	const [searchParams] = useSearchParams()
	const presetId = searchParams.get("id")
	const category = searchParams.get("category")

	const [rootCss] = useState("")

	const [cssCode, setCssCode] = useState<string>("")
	const [activePanels, setActivePanels] = useState<string[]>([])

	const [selectedSelector, setSelectedSelector] = useState<string>("")

	const [borderRadius, setBorderRadius] = useState<number>(0)
	const [bgColor, setBgColor] = useState<string>(`#ffffff`)
	const [textColor, setTextColor] = useState<string>(`#ffffff`)

	const [widthVal, setWidthVal] = useState<number>(0)
	const [heightVal, setHeightVal] = useState<number>(0)

	const [paddingTop, setPaddingTop] = useState<number>(0)
	const [paddingBottom, setPaddingBottom] = useState<number>(0)
	const [paddingLeft, setPaddingLeft] = useState<number>(0)
	const [paddingRight, setPaddingRight] = useState<number>(0)

	const [marginTop, setMarginTop] = useState<number>(0)
	const [marginBottom, setMarginBottom] = useState<number>(0)
	const [marginLeft, setMarginLeft] = useState<number>(0)
	const [marginRight, setMarginRight] = useState<number>(0)

	const [fontSize, setFontSize] = useState<number>(14)
	const [letterSpacing, setLetterSpacing] = useState<number>(0)
	const [opacityVal, setOpacityVal] = useState<number>(100)

	const [borderWidth, setBorderWidth] = useState<number>(0)
	const [borderColor, setBorderColor] = useState<string>(`#ffffff`)

	const isUpdatingRef = useRef(false)

	useEffect(() => {
		if (typeof window === "undefined") return

		const cleanPanels = INITIAL_PANELS.filter((p) => !EXCLUDED_PANELS.includes(p))

		let col1: string[] = []
		let col2: string[] = []
		let col3: string[] = []
		let loadedFromStorage = false

		try {
			const saved = localStorage.getItem(STORAGE_KEY)
			if (saved) {
				const parsed = JSON.parse(saved)

				if (parsed && typeof parsed === "object" && ("column1" in parsed || "column2" in parsed || "column3" in parsed)) {
					col1 = Array.isArray(parsed.column1) ? parsed.column1.filter((p: string) => cleanPanels.includes(p)) : []
					col2 = Array.isArray(parsed.column2) ? parsed.column2.filter((p: string) => cleanPanels.includes(p)) : []
					col3 = Array.isArray(parsed.column3) ? parsed.column3.filter((p: string) => cleanPanels.includes(p)) : []
					loadedFromStorage = true
				} else {
					Object.entries(parsed as Record<string, string>).forEach(([panelId, colId]) => {
						if (cleanPanels.includes(panelId)) {
							if (colId === "column1") col1.push(panelId)
							if (colId === "column2") col2.push(panelId)
							if (colId === "column3") col3.push(panelId)
						}
					})
					loadedFromStorage = true
				}
			}
		} catch (e) {
			console.error("Failed parsing storage assignments", e)
		}

		if (!loadedFromStorage) {
			if (category === "profile") {
				cleanPanels.forEach((panel, i) => {
					const col = (i % 3) + 1
					if (col === 1) col1.push(panel)
					if (col === 2) col2.push(panel)
					if (col === 3) col3.push(panel)
				})
			} else if (category && !EXCLUDED_PANELS.includes(category)) {
				col1 = [category]
			}
		}

		const assignedSet = new Set([...col1, ...col2, ...col3])
		const remainingPanels = cleanPanels.filter((p) => !assignedSet.has(p))

		setColumns({
			panels: remainingPanels,
			column1: col1,
			column2: col2,
			column3: col3
		})
	}, [category, setColumns])

	useEffect(() => {
		if (!searchParams.get("id")) {
			const savedDraft = localStorage.getItem("autosave_draft_code")
			if (savedDraft) {
				setCssCode(savedDraft)
			}
		}
	}, [searchParams])

	useEffect(() => {
		const hasVisited = localStorage.getItem("gstudio-has-visited-studio")

		if (!hasVisited) {
			setIsProfileOpen(true)
		}
	}, [])

	const handleCloseProfile = () => {
		localStorage.setItem("gstudio-has-visited-studio", "true")
		setIsProfileOpen(false)
	}

	const handleSetActiveTool = useCallback((tool: "select" | null) => {
		setActiveTool(tool)
		if (tool === null) {
			setSelectedSelector("")
		}
	}, [])

	const isLogoSelected = useMemo(() => {
		if (!selectedSelector) return false
		return /gaia-logo/i.test(selectedSelector) || /#header_left.*img/i.test(selectedSelector)
	}, [selectedSelector])

	const dynamicRightTabs = useMemo<SidebarTab<"settings" | "inspector" | "elements" | "logos">[]>(() => {
		const baseTabs: SidebarTab<"settings" | "inspector" | "elements" | "logos">[] = [
			{ id: "elements", icon: Component, label: "Toggle Elements Menu" },
			{ id: "settings", icon: Settings, label: "Toggle Engine Settings Panel" },
			{ id: "inspector", icon: Move, label: "Toggle Properties Inspector Panel" },
		]

		if (isLogoSelected) {
			baseTabs.splice(1, 0, { id: "logos", icon: Image, label: "Toggle Gaia Logo Assets" })
		}

		return baseTabs
	}, [isLogoSelected])

	useEffect(() => {
		if (!isLogoSelected && activeRightTab === "logos") {
			setActiveRightTab("elements")
		}
	}, [isLogoSelected, activeRightTab])

	const updateCssProperty = useCallback(
		(property: string, value: string | number, suffix = "") => {
			if (!selectedSelector) return

			isUpdatingRef.current = true
			setCssCode((prevCode) => {
				const escapedSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
				const blockRegex = new RegExp(`(${escapedSelector}\\s*{)([^}]*)(})`, "i")
				const propRegex = new RegExp(`(?<!-)(${property}\\s*:\\s*)[^;}\\s]+`, "i")
				const fullValue = `${value}${suffix}`

				if (blockRegex.test(prevCode)) {
					return prevCode.replace(blockRegex, (_, openTag, body, closeTag) => {
						if (propRegex.test(body)) {
							return `${openTag}${body.replace(propRegex, `$1${fullValue}`)}${closeTag}`
						} else {
							return `${openTag}\n\t${property}: ${fullValue};${body}${closeTag}`
						}
					})
				} else {
					return `${prevCode}\n${selectedSelector} {\n\t${property}: ${fullValue};\n}\n`
				}
			})

			setTimeout(() => {
				isUpdatingRef.current = false
			}, 0)
		},
		[selectedSelector]
	)

	useEffect(() => {
		const activeItems: string[] = []
		const keys: (keyof typeof columns)[] = ["column1", "column2", "column3"]
		keys.forEach((key) => {
			activeItems.push(...columns[key])
		})
		setActivePanels(activeItems)
	}, [columns])

	const { isMobile } = useIsMobile()
	const { isTablet } = useIsTablet()

	useEffect(() => {
		if (!presetId || !category) return

		const targetPath = `/app/presets/${category}/${presetId}/preset.css`
		const fetchPresetString = presetCssFiles[targetPath]

		if (fetchPresetString) {
			fetchPresetString()
				.then((rawCss) => {
					const cleanCss = typeof rawCss === "string" ? rawCss : ""
					setCssCode(cleanCss)
					localStorage.setItem("myapp_v1_autosave_code", cleanCss)
				})
				.catch((err) => {
					console.error(`Failed to dynamically evaluate configuration at ${targetPath}:`, err)
				})
		}
	}, [presetId, category])

	useEffect(() => {
		if (cssCode) {
			localStorage.setItem("autosave_draft_code", cssCode)
		}
	}, [cssCode])

	const handleLeftSelectorAppend = (selector: string) => {
		const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		const blockRegex = new RegExp(`(?:^|\\s)${escapedSelector}\\s*{`, "i")

		if (!blockRegex.test(cssCode)) {
			const codeSnippet = `\n${selector} {\n\t\n}\n`
			setCssCode((prev) => prev + codeSnippet)
		}
		setIsCodeOpen(true)
	}

	const handleCanvasElementSelected = useCallback((selector: string) => {
		setSelectedSelector(selector)
		startTransition(() => {
			if (selector && (/gaia-logo/i.test(selector) || /#header_left.*img/i.test(selectedSelector))) {
				setActiveRightTab("logos")
			} else {
				setActiveRightTab("elements")
			}
			setRightOpen(true)
		})
	}, [])

	if (isMobile || isTablet) {
		return <StudioMobileFallback />
	}

	return (
		<TooltipProvider>
			<div className="flex flex-col w-screen h-screen bg-background overflow-hidden select-none text-foreground relative">
				{!isMaximized && <StudioHeader onOpenProfile={() => setIsProfileOpen(true)} />}

				<div className="flex flex-1 w-full overflow-hidden relative">
					{!isMaximized && (
						<div className="flex h-full shrink-0">
							<SidebarPanel<"selectors" | "columns">
								side="left"
								isOpen={leftOpen}
								onToggleOpen={(val) => startTransition(() => setLeftOpen(val))}
								activeTab={activeLeftTab}
								onTabChange={(tab) => startTransition(() => setActiveLeftTab(tab))}
								tabs={leftTabs}
							>
								<Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading panel...</div>}>
									{activeLeftTab === "selectors" ? (
										<SelectorPanel onSelectSelector={handleLeftSelectorAppend} />
									) : (
										<ColumnManager columns={columns} setColumns={setColumns} />
									)}
								</Suspense>
							</SidebarPanel>
						</div>
					)}

					<div className="flex-1 flex flex-col h-full relative overflow-hidden contain-[layout]">
						<div className="relative flex-1 w-full h-full">
							<Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm">Initializing Studio Canvas...</div>}>
								<Canvas
									activeTool={activeTool}
									isMaximized={isMaximized}
									presetId={presetId}
									category={category}
									activePanels={activePanels}
									rootCss={rootCss}
									cssCode={cssCode}
									columnLayout={columns}
									selectedSelector={selectedSelector}
									onElementSelected={handleCanvasElementSelected}
								/>
							</Suspense>
						</div>

						<CodePanel isOpen={isCodeOpen} code={cssCode} setCode={setCssCode} />

						<StudioToolbar
							activeTool={activeTool}
							setActiveTool={handleSetActiveTool}
							isCodeOpen={isCodeOpen}
							setIsCodeOpen={setIsCodeOpen}
							isMaximized={isMaximized}
							setIsMaximized={setIsMaximized}
						/>
					</div>

					{!isMaximized && (
						<SidebarPanel<"settings" | "inspector" | "elements" | "logos">
							side="right"
							isOpen={rightOpen}
							onToggleOpen={(val) => startTransition(() => setRightOpen(val))}
							activeTab={activeRightTab}
							onTabChange={(tab) => startTransition(() => setActiveRightTab(tab))}
							tabs={dynamicRightTabs}
						>
							<Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading right workspace...</div>}>
								{activeRightTab === "elements" ? (
									<ElementPropertiesPanel
										selectedSelector={selectedSelector}
										cssCode={cssCode}
										setCssCode={setCssCode}
										borderRadius={borderRadius}
										setBorderRadius={setBorderRadius}
										bgColor={bgColor}
										setBgColor={setBgColor}
										textColor={textColor}
										setTextColor={setTextColor}
										widthVal={widthVal}
										setWidthVal={setWidthVal}
										heightVal={heightVal}
										setHeightVal={setHeightVal}
										paddingTop={paddingTop}
										setPaddingTop={setPaddingTop}
										paddingBottom={paddingBottom}
										setPaddingBottom={setPaddingBottom}
										paddingLeft={paddingLeft}
										setPaddingLeft={setPaddingLeft}
										paddingRight={paddingRight}
										setPaddingRight={setPaddingRight}
										marginTop={marginTop}
										setMarginTop={setMarginTop}
										marginBottom={marginBottom}
										setMarginBottom={setMarginBottom}
										marginLeft={marginLeft}
										setMarginLeft={setMarginLeft}
										marginRight={marginRight}
										setMarginRight={setMarginRight}
										fontSize={fontSize}
										setFontSize={setFontSize}
										letterSpacing={letterSpacing}
										setLetterSpacing={setLetterSpacing}
										opacityVal={opacityVal}
										setOpacityVal={setOpacityVal}
										borderWidth={borderWidth}
										setBorderWidth={setBorderWidth}
										borderColor={borderColor}
										setBorderColor={(val) => setBorderColor(val)}
										updateCssProperty={updateCssProperty}
									/>
								) : activeRightTab === "logos" && isLogoSelected ? (
									<GaiaLogoPanel
										tagName="gaia-logo"
										onSelectLogo={(cssUrl) => {
											if (!selectedSelector) return

											setCssCode((prevCode) => {
												const escapedSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
												const blockRegex = new RegExp(`(${escapedSelector}\\s*{)([^}]*)(})`, "i")
												const exactInnerBlock = `\n\tpadding: 0 47px 0 0;\n\theight: 16px;\n\twidth: 0;\n\tbackground: ${cssUrl} no-repeat center / contain;\n`

												if (blockRegex.test(prevCode)) {
													return prevCode.replace(blockRegex, `$1${exactInnerBlock}$3`)
												} else {
													return `${prevCode}\n${selectedSelector} {${exactInnerBlock}}\n`
												}
											})
										}}
									/>
								) : activeRightTab === "settings" ? (
									<SettingsPanel />
								) : (
									<InspectorPanel />
								)}
							</Suspense>
						</SidebarPanel>
					)}
				</div>

				<LocalProfile isOpen={isProfileOpen} onClose={handleCloseProfile} />
			</div>
		</TooltipProvider>
	)
}