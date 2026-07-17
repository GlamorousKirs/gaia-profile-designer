import { useState, useTransition, lazy, Suspense, useEffect, useCallback, useMemo } from "react"
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
import { useColumnStore } from "@/store/useColumnStore"

import { StudioMobileFallback } from "./studio/StudioMobileFallback"
import { StudioHeader } from "./studio/StudioHeader"
import { StudioToolbar } from "./studio/StudioToolbar"

import { Settings, Move, Hash, Component, Image } from "lucide-react"

const SelectorPanel = lazy(() => import("@/components/SelectorPanel"))
const Canvas = lazy(() => import("~/components/Canvas").then((m) => ({ default: m.Canvas })))
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"))
const GaiaLogoPanel = lazy(() => import("@/components/GaiaLogoPanel").then((m) => ({ default: m.GaiaLogoPanel })))
import { updateCssValue, injectBlock } from "@/lib/CodePanel/cssProcessor";

const presetCssFiles = import.meta.glob("/app/premade/**/preset.css", {
	query: "?raw",
	import: "default",
})

const leftTabs: SidebarTab<"selectors" | "columns">[] = [
	{ id: "columns", icon: Move, label: "Toggle Column Manager" },
	{ id: "selectors", icon: Hash, label: "Toggle Gaia CSS Selectors Panel" },
]

export default function Studio() {
	const [leftOpen, setLeftOpen] = useState(true)
	const [rightOpen, setRightOpen] = useState(true)
	const [version, setVersion] = useState<"v1" | "v2">("v2")
	const [activeLeftTab, setActiveLeftTab] = useState<"selectors" | "columns">("columns")
	const [activeRightTab, setActiveRightTab] = useState<"settings" | "elements" | "logos">("elements")
	const [activeTool, setActiveTool] = useState<"select" | null>(null)
	const [isCodeOpen, setIsCodeOpen] = useState(false)
	const [isMaximized, setIsMaximized] = useState(false)
	const [, startTransition] = useTransition()
	const [isProfileOpen, setIsProfileOpen] = useState(false)

	const columns = useColumnStore((state) => state.columns);

	const [searchParams] = useSearchParams()
	const presetId = searchParams.get("id")
	const category = searchParams.get("category")

	const [rootCss] = useState("")
	const [cssCode, setCssCode] = useState<string>("")
	const [activePanels, setActivePanels] = useState<string[]>([])
	const [selectedSelector, setSelectedSelector] = useState<string>("")

	useEffect(() => {
		if (!searchParams.get("id")) {
			const savedDraft = localStorage.getItem("autosave-draft-code")
			if (savedDraft) {
				setCssCode(savedDraft)
			}
		}
	}, [searchParams])

	useEffect(() => {
		const hasVisited = localStorage.getItem("has-visited-studio")
		if (!hasVisited) {
			setIsProfileOpen(true)
		}
	}, [])

	const handleCloseProfile = () => {
		localStorage.setItem("has-visited-studio", "true")
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

	const dynamicRightTabs = useMemo<SidebarTab<"settings" | "elements" | "logos">[]>(() => {
		const baseTabs: SidebarTab<"settings" | "elements" | "logos">[] = [
			{ id: "elements", icon: Component, label: "Toggle Elements Menu" },
			{ id: "settings", icon: Settings, label: "Toggle Engine Settings Panel" },
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
			const fullValue = typeof value === "string" && value.includes("gradient")
				? value
				: `${value}${suffix}`;
			setCssCode((prevCode) => updateCssValue(prevCode, selectedSelector, property, fullValue));
		},
		[selectedSelector]
	);

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
		const targetPath = `/app/premade/${category}/${presetId}/preset.css`
		const fetchPresetString = presetCssFiles[targetPath]
		if (fetchPresetString) {
			fetchPresetString()
				.then((rawCss) => {
					const cleanCss = typeof rawCss === "string" ? rawCss : ""
					setCssCode(cleanCss)
					localStorage.setItem("autosave-code", cleanCss)
				})
				.catch((err) => {
					console.error(`Failed to dynamically evaluate configuration at ${targetPath}:`, err)
				})
		}
	}, [presetId, category])

	useEffect(() => {
		if (cssCode) {
			localStorage.setItem("autosave-draft-code", cssCode)
		}
	}, [cssCode])

	const handleLeftSelectorAppend = (selector: string) => {
		setCssCode((prev) => updateCssValue(prev, selector, '', ''));
		setIsCodeOpen(true);
	};
	
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
			<div className="flex flex-col w-screen h-screen bg-background overflow-hidden select-none text-foreground relative bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
				{!isMaximized && (
					<StudioHeader
						onOpenProfile={() => setIsProfileOpen(true)}
						version={version}
						onVersionChange={setVersion}
					/>
				)}
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
										<ColumnManager 
											onAddToCode={(selector) => {
												setCssCode((prev) => updateCssValue(prev, selector, '', ''));
												setIsCodeOpen(true);
											}} 
										/>
									)}
								</Suspense>
							</SidebarPanel>
						</div>
					)}
					<div className="flex-1 flex flex-col h-full relative overflow-hidden">
						<div className="relative flex-1 w-full h-full">
							<Suspense fallback={<div className="w-full h-full flex items-center justify-center text-sm">Initializing Studio Canvas...</div>}>
								<Canvas
									version={version}
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
						<div className="absolute inset-0 z-50 pointer-events-none flex items-end justify-center pb-14">
							<CodePanel isOpen={isCodeOpen} code={cssCode} setCode={setCssCode} />
						</div>
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
						<SidebarPanel<"settings" | "elements" | "logos">
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
										updateCssProperty={updateCssProperty}
									/>
								) : activeRightTab === "logos" && isLogoSelected ? (
									<GaiaLogoPanel
										onSelectLogo={(cssUrl) => {
											if (!selectedSelector) return;
											setCssCode((prevCode) => injectBlock(prevCode, selectedSelector, {
												'padding': '0 47px 0 0',
												'height': '16px',
												'width': '0',
												'background': `${cssUrl} no-repeat center / contain`
											}));
										}}
									/>
								) : activeRightTab === "settings" ? (
									<SettingsPanel />
								) : null}
							</Suspense>
						</SidebarPanel>
					)}
				</div>
				<LocalProfile isOpen={isProfileOpen} onClose={handleCloseProfile} />
			</div>
		</TooltipProvider>
	)
}