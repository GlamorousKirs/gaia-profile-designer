import { useState, useRef, useTransition, useCallback, useEffect, lazy, Suspense, useMemo } from "react"
import { motion, useDragControls, AnimatePresence } from "motion/react"
import { Copy, Check, Library, ChevronUp, ChevronDown, Sparkles, MoveDiagonal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditorView, tooltips } from "@codemirror/view"
import { langs } from "@uiw/codemirror-extensions-langs"
import { studioTheme, customSearchTheme } from "@/codemirror/editor"
import { ColorPlugin } from "@/codemirror/color-plugin"
import { SnippetPanel } from "./SnippetPanel"
import type { SnippetActionType } from "@/store/useSnippetStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const BASE_EDITOR_WIDTH = 460
const BASE_SNIPPETS_WIDTH = 300
const BASE_HEIGHT = 340
const STORAGE_KEY = "myapp_v1_autosave_code"

const structuralSpring = { type: "spring", stiffness: 380, damping: 38 } as const

const CodeMirror = lazy(() => import("@uiw/react-codemirror"))

interface CodePanelProps {
  isOpen: boolean
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
}

const SCALE_OPTIONS = [
  { label: "1.0x (Default)", value: 1.0 },
  { label: "1.2x", value: 1.2 },
  { label: "1.4x", value: 1.4 },
  { label: "1.6x", value: 1.6 },
  { label: "1.8x", value: 1.8 },
  { label: "2.0x", value: 2.0 },
]

export default function CodePanel({ isOpen, code, setCode }: CodePanelProps) {
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const [dimensions, setDimensions] = useState({ windowWidth: 1200, windowHeight: 800 })

  const codeRef = useRef(code)
  useEffect(() => {
    codeRef.current = code
  }, [code])

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      })
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const currentCode = codeRef.current
    if (!currentCode || currentCode.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, codeRef.current)
    }, 1000)

    return () => clearTimeout(timer)
  }, [code])

  const currentEditorWidth = useMemo(() => {
    const targetWidth = BASE_EDITOR_WIDTH * scaleMultiplier
    const maxAvailable = dimensions.windowWidth - 32
    return Math.min(targetWidth, maxAvailable)
  }, [scaleMultiplier, dimensions.windowWidth])

  const currentSnippetsWidth = useMemo(() => {
    const targetWidth = BASE_SNIPPETS_WIDTH * scaleMultiplier
    const remainingSpace = dimensions.windowWidth - currentEditorWidth - 32
    if (remainingSpace < 200) {
      return Math.min(targetWidth, dimensions.windowWidth - 40)
    }
    return Math.min(targetWidth, remainingSpace)
  }, [scaleMultiplier, dimensions.windowWidth, currentEditorWidth])

  const currentHeight = useMemo(() => {
    const targetHeight = BASE_HEIGHT * scaleMultiplier
    const maxAvailable = dimensions.windowHeight - 80
    return Math.min(targetHeight, maxAvailable)
  }, [scaleMultiplier, dimensions.windowHeight])

  const isFlexColumnLayout = useMemo(() => {
    return currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0) > dimensions.windowWidth - 24
  }, [currentEditorWidth, snippetsOpen, currentSnippetsWidth, dimensions.windowWidth])

  const editorExtensions = useMemo(() => {
    return [
      langs.css(),
      customSearchTheme || [],
      studioTheme || [],
      ColorPlugin || [],
      EditorView.lineWrapping,
      tooltips({
        parent: typeof document !== "undefined" ? document.body : undefined
      })
    ].filter(Boolean)
  }, [customSearchTheme, studioTheme])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeRef.current)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (err) {
      console.error("Failed to copy code text: ", err)
    }
  }

  const scrollToTop = () => {
    const view = editorViewRef.current
    if (view) {
      view.focus()
      view.dispatch({
        selection: { anchor: 0, head: 0 },
        effects: EditorView.scrollIntoView(0, { y: "start" })
      })
    }
  }

  const scrollToBottom = () => {
    const view = editorViewRef.current
    if (view) {
      const docLength = view.state.doc.length
      view.focus()
      view.dispatch({
        selection: { anchor: docLength, head: docLength },
        effects: EditorView.scrollIntoView(docLength, { y: "end" })
      })
    }
  }

  const handleSelectSnippet = useCallback((snippetCode: string, action: SnippetActionType) => {
    const cleanSnippet = snippetCode.trim()
    const view = editorViewRef.current

    switch (action) {
      case "prepend":
        setCode(prev => prev ? `${cleanSnippet}\n\n${prev}` : cleanSnippet)
        break
      case "append":
        setCode(prev => prev ? `${prev}\n\n${cleanSnippet}` : cleanSnippet)
        break
      case "replace":
        setCode(cleanSnippet)
        break
      case "append-cursor":
      default:
        if (view) {
          view.focus()
          view.dispatch(view.state.replaceSelection(cleanSnippet))
          setCode(view.state.doc.toString())
        } else {
          setCode(prev => prev ? `${prev}\n\n${cleanSnippet}` : cleanSnippet)
        }
        break
    }
  }, [setCode])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isDragging && <div className="fixed inset-0 z-40 cursor-grabbing pointer-events-auto" />}

          <div className="fixed bottom-12 left-0 right-0 flex justify-center pointer-events-none z-50 px-4">
            <motion.div
              ref={panelRef}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                width: isFlexColumnLayout ? currentEditorWidth : currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: isFlexColumnLayout && snippetsOpen ? currentHeight * 1.5 : currentHeight
              }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={structuralSpring}
              style={{
                width: isFlexColumnLayout ? currentEditorWidth : currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: isFlexColumnLayout && snippetsOpen ? currentHeight * 1.5 : currentHeight
              }}
              className={`flex ${isFlexColumnLayout ? "flex-col" : "flex-row"} overflow-hidden p-0 pointer-events-auto RegalPanel will-change-[width,height,transform] bg-card border border-border rounded-xl shadow-2xl ring-1 ring-border/20`}
            >
              <div style={{ width: "100%", maxWidth: currentEditorWidth }} className="grid grid-rows-[40px_1fr_36px] h-full flex-1 shrink-0 z-10 bg-transparent">
                <div
                  className="relative flex items-center justify-between px-4 bg-muted/40 border-b border-border cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-8 h-1 rounded-full bg-muted-foreground/20 pointer-events-none" />

                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Styles</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-1" onPointerDown={(e) => e.stopPropagation()}>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger>
                        <Button
                          variant="ghost"
                          className="h-6 text-[11px] px-2 font-medium bg-muted/50 hover:bg-muted border border-border text-foreground rounded-md transition-all gap-1"
                          aria-label={`Open scale menu. Current scale is ${scaleMultiplier}x`}
                        >
                          <MoveDiagonal className="size-2.5 text-muted-foreground/70" />
                          {scaleMultiplier.toFixed(1)}x
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-popover border-border text-popover-foreground">
                        {SCALE_OPTIONS.map((opt) => (
                          <DropdownMenuItem
                            key={opt.value}
                            onClick={() => setScaleMultiplier(opt.value)}
                            className={`text-[11px] focus:bg-accent focus:text-accent-foreground ${scaleMultiplier === opt.value ? "font-bold text-primary bg-muted/40" : ""}`}
                          >
                            {opt.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant={snippetsOpen ? "secondary" : "ghost"}
                      onClick={() => startTransition(() => setSnippetsOpen(!snippetsOpen))}
                      className={`h-6 text-[11px] px-2.5 font-medium border rounded-md transition-all gap-1 ${snippetsOpen
                        ? "bg-accent border-primary text-accent-foreground hover:bg-accent/80"
                        : "bg-muted/50 hover:bg-muted border-border text-foreground"}`}
                      aria-label={snippetsOpen ? "Close snippets panel" : "Open snippets panel"}
                    >
                      <Library className="size-3" /> Snippets
                    </Button>
                  </div>
                </div>

                <ScrollArea className="w-full bg-background/40 overflow-hidden">
                  <div className="h-full w-full">
                    <Suspense fallback={
                      <div className="flex items-center justify-center h-full text-xs font-mono text-muted-foreground animate-pulse">
                        Loading ecosystem...
                      </div>
                    }>
                      <CodeMirror
                        value={code}
                        extensions={editorExtensions}
                        onChange={setCode}
                        onCreateEditor={(view) => {
                          editorViewRef.current = view
                        }}
                        className="text-xs font-mono h-full bg-transparent text-foreground"
                        basicSetup={{
                          lineNumbers: true,
                          foldGutter: true,
                          dropCursor: true,
                          allowMultipleSelections: false,
                          indentOnInput: true
                        }}
                      />
                    </Suspense>
                  </div>
                </ScrollArea>

                <div className="h-9 border-t border-border flex items-center justify-between px-3 bg-muted/20 select-none">
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      className="gap-1.5 h-6 px-2.5 font-medium border border-border bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-500">Copied payload</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span className="text-[10px]">Copy CSS</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 rounded-md bg-muted/30 border border-border text-muted-foreground hover:text-foreground transition-colors"
                      onClick={scrollToTop}
                      aria-label="Scroll to top of code"
                    >
                      <ChevronUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-6 rounded-md bg-muted/30 border border-border text-muted-foreground hover:text-foreground transition-colors"
                      onClick={scrollToBottom}
                      aria-label="Scroll to bottom of code"
                    >
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {snippetsOpen && (
                  <SnippetPanel
                    dragControls={dragControls}
                    currentCode={code}
                    onSelectSnippet={handleSelectSnippet}
                    width={currentSnippetsWidth}
                    scaleMultiplier={scaleMultiplier}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}