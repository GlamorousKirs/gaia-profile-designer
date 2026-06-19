import { useState, useTransition, lazy, Suspense, useEffect, useCallback, useRef, useMemo } from "react"
import { useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SidebarPanel } from "@/components/sidebar-panel"
import { useIsTablet } from "@/hooks/use-is-tablet"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { SidebarTab } from "@/components/sidebar-panel"
import ColumnManager, { type ColumnState } from "@/components/ColumnManager"
import CodePanel from "@/components/CodePanel"
import { ElementPropertiesPanel } from "@/components/ElementPropertiesPanel"

import { UserAvatar } from "@/components/UserAvatar"
import { LocalProfile } from "@/components/LocalProfile"

const SelectorPanel = lazy(() => import("@/components/SelectorPanel"))

import {
  Monitor,
  Layers,
  Settings,
  Move,
  Braces,
  Share2,
  MousePointer,
  Hand,
  Maximize2,
  Minimize2,
  Hash,
  Component,
  Image
} from "lucide-react"
import { ThemePicker } from "~/components/ThemePicker"

const Canvas = lazy(() => import("~/components/Canvas").then(m => ({ default: m.Canvas })))
const LayerManager = lazy(() => import("@/components/LayerManager"))
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"))
const InspectorPanel = lazy(() => import("@/components/InspectorPanel"))
const GaiaLogoPanel = lazy(() => import("@/components/GaiaLogoPanel").then(m => ({ default: m.GaiaLogoPanel })))

const panelFiles = import.meta.glob("/app/presets/panels_html/*.html");
const EXCLUDED_PANELS = ["header", "columns"];

const INITIAL_PANELS = Object.keys(panelFiles)
  .map((path) => path.split("/").pop()?.replace(".html", ""))
  .filter((name): name is string => !!name && !EXCLUDED_PANELS.includes(name));

const leftTabs: SidebarTab<"selectors" | "layers" | "columns">[] = [
  { id: "columns", icon: Move, label: "Toggle Column Manager" },
  { id: "selectors", icon: Hash, label: "Toggle Gaia CSS Selectors Panel" },
  { id: "layers", icon: Layers, label: "Toggle Layer Panel" },
]

export default function Studio() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [activeLeftTab, setActiveLeftTab] = useState<"selectors" | "layers" | "columns">("columns")
  const [activeRightTab, setActiveRightTab] = useState<"settings" | "inspector" | "elements" | "logos">("elements")
  const [activeTool, setActiveTool] = useState<"select" | "hand">("select")
  const [isCodeOpen, setIsCodeOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [, startTransition] = useTransition()

  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [searchParams] = useSearchParams()
  const presetId = searchParams.get("id")
  const category = searchParams.get("category")

  const [rootCss] = useState("")
  const [cssCode, setCssCode] = useState<string>(() => {
    return localStorage.getItem("autosave_draft_code") || ""
  })
  const [activePanels, setActivePanels] = useState<string[]>([])
  const [selectedSelector, setSelectedSelector] = useState<string>("body")

  const [borderRadius, setBorderRadius] = useState<number>(0)
  const [bgColor, setBgColor] = useState<string>("#ffffff")
  const [textColor, setTextColor] = useState<string>("#ffffff")

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
  const [borderColor, setBorderColor] = useState<string>("#ffffff")

  const isUpdatingRef = useRef(false)

  const [columns, setColumns] = useState<ColumnState>({
    panels: INITIAL_PANELS,
    column1: [],
    column2: [],
    column3: []
  })

  const isLogoSelected = useMemo(() => {
    if (!selectedSelector) return false
    return /gaia-logo/i.test(selectedSelector) || (/#header_left.*img/i.test(selectedSelector))
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

  const updateCssProperty = useCallback((property: string, value: string | number, suffix = "") => {
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
            return `${openTag}\n  ${property}: ${fullValue};${body}${closeTag}`
          }
        })
      } else {
        return `${prevCode}\n${selectedSelector} {\n  ${property}: ${fullValue};\n}\n`
      }
    })

    setTimeout(() => {
      isUpdatingRef.current = false
    }, 0)
  }, [selectedSelector])

  useEffect(() => {
    const cleanPanels = INITIAL_PANELS.filter(p => !EXCLUDED_PANELS.includes(p));

    if (category === "profile") {
      const newCols = { column1: [] as string[], column2: [] as string[], column3: [] as string[] };
      cleanPanels.forEach((panel, i) => {
        const col = (i % 3) + 1;
        newCols[`column${col}` as keyof typeof newCols].push(panel);
      });
      setColumns({ panels: [], ...newCols });
      setActivePanels(cleanPanels);
    } else if (category && !EXCLUDED_PANELS.includes(category)) {
      setActivePanels([category]);
      setColumns({
        panels: cleanPanels.filter(p => p !== category),
        column1: [category],
        column2: [],
        column3: []
      });
    } else {
      setActivePanels([]);
      setColumns({ panels: cleanPanels, column1: [], column2: [], column3: [] });
    }
  }, [category])

  const { isMobile } = useIsMobile()
  const { isTablet } = useIsTablet()

  useEffect(() => {
    localStorage.setItem("autosave_draft_code", cssCode)
  }, [cssCode])

  const handleLeftSelectorAppend = (selector: string) => {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const blockRegex = new RegExp(`(?:^|\\s)${escapedSelector}\\s*{`, "i")

    if (!blockRegex.test(cssCode)) {
      const codeSnippet = `\n${selector} {\n  \n}\n`
      setCssCode((prev) => prev + codeSnippet)
    }
    setIsCodeOpen(true)
  }

  const handleCanvasElementSelected = useCallback((selector: string) => {
    setSelectedSelector(selector)
    startTransition(() => {
      if (/gaia-logo/i.test(selector) || /#header_left.*img/i.test(selector)) {
        setActiveRightTab("logos")
      } else {
        setActiveRightTab("elements")
      }
      setRightOpen(true)
    })
  }, [])

  if (isMobile || isTablet) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center p-4 text-center bg-background">
        <Monitor className="mb-4 size-12 text-muted-foreground" aria-hidden="true" />
        <p className="text-muted-foreground text-sm max-w-xs">The Studio is optimized for desktop only.</p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col w-screen h-screen bg-background overflow-hidden select-none text-foreground relative">
        {!isMaximized && (
          <header className="h-10 border-b border-border bg-card px-3 flex items-center justify-between z-20 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center size-6 rounded bg-primary text-primary-foreground font-black text-sm">Δ</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs block leading-none">Gaia Studio</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 leading-none border-l border-border pl-2">
                  <span className="size-1 rounded-full bg-emerald-500" /> WIP
                </span>
              </div>
            </div>

            { }
            <div className="flex items-center gap-1.5">
              <ThemePicker />
              <UserAvatar onOpenProfile={() => setIsProfileOpen(true)} />
              <Button size="sm" className="h-7 gap-1 text-[11px] font-medium px-2.5">
                <Share2 className="size-3.5" /> Publish
              </Button>
            </div>
          </header>
        )}

        <div className="flex flex-1 w-full overflow-hidden relative">
          {!isMaximized && (
            <SidebarPanel
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
                ) : activeLeftTab === "layers" ? (
                  <LayerManager />
                ) : (
                  <ColumnManager columns={columns} setColumns={setColumns} />
                )}
              </Suspense>
            </SidebarPanel>
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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="flex items-center gap-1.5 p-1.5 bg-card/90 backdrop-blur-md border border-border rounded-full shadow-lg pointer-events-auto">
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant={activeTool === "select" ? "default" : "ghost"}
                      size="icon"
                      className="rounded-full size-9 shrink-0"
                      onClick={() => setActiveTool("select")}
                    >
                      <MousePointer className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Select Tool (V)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant={activeTool === "hand" ? "default" : "ghost"}
                      size="icon"
                      className="rounded-full size-9 shrink-0"
                      onClick={() => setActiveTool("hand")}
                    >
                      <Hand className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Hand Tool (H)</TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant={isCodeOpen ? "secondary" : "ghost"}
                      size="icon"
                      className={`rounded-full size-9 shrink-0 ${isCodeOpen ? "text-primary border border-primary/20 bg-secondary" : ""}`}
                      onClick={() => setIsCodeOpen(prev => !prev)}
                    >
                      <Braces className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Code</TooltipContent>
                </Tooltip>
                <div className="w-px h-4 bg-border mx-1" aria-hidden="true" />
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-9 shrink-0"
                      onClick={() => setIsMaximized(prev => !prev)}
                    >
                      {isMaximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isMaximized ? "Exit Fullscreen Focus" : "Enter Fullscreen Focus"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
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
                    setBorderColor={setBorderColor}
                    updateCssProperty={updateCssProperty}
                  />
                ) : activeRightTab === "logos" && isLogoSelected ? (
                  <GaiaLogoPanel
                    tagName="gaia-logo"
                    onSelectLogo={(cssUrl) => {
                      if (!selectedSelector) return;

                      setCssCode((prevCode) => {
                        const escapedSelector = selectedSelector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        const blockRegex = new RegExp(`(${escapedSelector}\\s*{)([^}]*)(})`, "i");

                        const exactInnerBlock = `\n  padding: 0 47px 0 0;\n  height: 16px;\n  width: 0;\n  background: ${cssUrl} no-repeat center / contain;\n`;

                        if (blockRegex.test(prevCode)) {
                          return prevCode.replace(blockRegex, `$1${exactInnerBlock}$3`);
                        } else {
                          return `${prevCode}\n${selectedSelector} {${exactInnerBlock}}\n`;
                        }
                      });
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

        <CodePanel
          isOpen={isCodeOpen}
          code={cssCode}
          setCode={setCssCode}
        />

        { }
        <LocalProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    </TooltipProvider>
  )
}