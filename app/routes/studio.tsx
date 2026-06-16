import { useState, useTransition, lazy, Suspense, useEffect } from "react"
import { useSearchParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SidebarPanel } from "@/components/sidebar-panel"
import { useIsTablet } from "@/hooks/use-is-tablet"
import { useIsMobile } from "@/hooks/use-is-mobile"
import type { SidebarTab } from "@/components/sidebar-panel"
import ColumnManager, { type ColumnState } from "@/components/ColumnManager"

// FIXED: Statically importing CodePanel to guarantee it never throws a chunk 404
import CodePanel from "@/components/CodePanel"

import {
  Monitor,
  Folder,
  Layers,
  Settings,
  SlidersHorizontal,
  Braces,
  Share2,
  MousePointer,
  Hand,
  Maximize2,
  Minimize2
} from "lucide-react"
import { ThemePicker } from "~/components/ThemePicker"

const Canvas = lazy(() => import("~/components/Canvas").then(m => ({ default: m.Canvas })))
const FileExplorer = lazy(() => import("@/components/FileExplorer"))
const LayerManager = lazy(() => import("@/components/LayerManager"))
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"))
const InspectorPanel = lazy(() => import("@/components/InspectorPanel"))

const panelFiles = import.meta.glob("/app/presets/panels_html/*.html");
const EXCLUDED_PANELS = ["header", "columns"];

const INITIAL_PANELS = Object.keys(panelFiles)
  .map((path) => path.split("/").pop()?.replace(".html", ""))
  .filter((name): name is string => !!name && !EXCLUDED_PANELS.includes(name));

const leftTabs: SidebarTab<"files" | "layers" | "columns">[] = [
  { id: "files", icon: Folder, label: "Toggle File Explorer Sidepanel" },
  { id: "layers", icon: Layers, label: "Toggle Layer Panel" },
  { id: "columns", icon: SlidersHorizontal, label: "Toggle Column Manager" },
]

const rightTabs: SidebarTab<"settings" | "inspector">[] = [
  { id: "settings", icon: Settings, label: "Toggle Engine Settings Panel" },
  { id: "inspector", icon: SlidersHorizontal, label: "Toggle Properties Inspector Panel" },
]

export default function Studio() {
  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [activeLeftTab, setActiveLeftTab] = useState<"files" | "layers" | "columns">("files")
  const [activeRightTab, setActiveRightTab] = useState<"settings" | "inspector">("settings")
  const [activeTool, setActiveTool] = useState<"select" | "hand">("select")
  const [isCodeOpen, setIsCodeOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [, startTransition] = useTransition()

  const [searchParams] = useSearchParams()
  const presetId = searchParams.get("id")
  const category = searchParams.get("category")

  const [rootCss, setRootCss] = useState("")
  const [cssCode, setCssCode] = useState<string>(() => {
    return localStorage.getItem("autosave_draft_code") || ""
  })
  const [activePanels, setActivePanels] = useState<string[]>([])

  const [columns, setColumns] = useState<ColumnState>({
    panels: INITIAL_PANELS,
    column1: [],
    column2: [],
    column3: []
  })

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
                  <span className="size-1 rounded-full bg-emerald-500" /> v2.4.0
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemePicker />
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
                {activeLeftTab === "files" ? <FileExplorer /> :
                  activeLeftTab === "layers" ? <LayerManager /> :
                    <ColumnManager columns={columns} setColumns={setColumns} />}
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
            <SidebarPanel
              side="right"
              isOpen={rightOpen}
              onToggleOpen={(val) => startTransition(() => setRightOpen(val))}
              activeTab={activeRightTab}
              onTabChange={(tab) => startTransition(() => setActiveRightTab(tab))}
              tabs={rightTabs}
            >
              <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading settings...</div>}>
                {activeRightTab === "settings" ? <SettingsPanel /> : <InspectorPanel />}
              </Suspense>
            </SidebarPanel>
          )}
        </div>

        {/* FIXED: Removed dynamic Suspense context; mounts seamlessly on dock interaction */}
        <CodePanel
          isOpen={isCodeOpen}
          code={cssCode}
          setCode={setCssCode}
        />
      </div>
    </TooltipProvider>
  )
}