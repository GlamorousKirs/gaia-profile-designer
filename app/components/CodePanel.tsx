import { useState, useRef, useCallback, useEffect, lazy, Suspense } from "react"
import { motion, useDragControls, AnimatePresence } from "motion/react"
import { GripVertical, Copy, Check, Library, ChevronRight, Maximize2, Eye, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SnippetPanel } from "./SnippetPanel" 
import type { SnippetActionType } from "@/store/useSnippetStore"

const IsolatedEditor = lazy(() => 
  import("@/codemirror/isolated-editor").then(module => ({ default: module.IsolatedEditor }))
)

const BASE_EDITOR_WIDTH = 450
const BASE_SNIPPETS_WIDTH = 300
const BASE_HEIGHT = 320

const structuralSpring = { type: "spring", stiffness: 500, damping: 50 } as const

// Explicit type assertion guarantees Framer Motion's transition validator recognizes string easing literal values
const layoutSpringTransition = {
  layout: structuralSpring,
  opacity: { duration: 0.12, ease: "linear" as const },
  scale: { type: "spring" as const, stiffness: 450, damping: 35 }
}

interface CodePanelProps {
  isOpen: boolean
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
}

const SCALE_OPTIONS = [
  { label: "1.0x (Default)", value: "1" },
  { label: "1.2x", value: "1.2" },
  { label: "1.4x", value: "1.4" },
  { label: "1.6x", value: "1.6" },
  { label: "1.8x", value: "1.8" },
  { label: "2.0x", value: "2" },
]

const OPACITY_OPTIONS = [
  { label: "100% (Opaque)", value: "1" },
  { label: "80%", value: "0.8" },
  { label: "60%", value: "0.6" },
  { label: "40%", value: "0.4" },
  { label: "20%", value: "0.2" },
  { label: "0% (Translucent)", value: "0" },
]

export default function CodePanel({ isOpen, code, setCode }: CodePanelProps) {
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const [scaleMultiplier, setScaleMultiplier] = useState(1.0)
  const [opacity, setOpacity] = useState(1.0)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false)
  
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<any | null>(null)

  useEffect(() => {
    if (!code) {
      localStorage.removeItem("autosave_draft_code")
      return
    }

    const timer = setTimeout(() => {
      localStorage.setItem("autosave_draft_code", code)
    }, 1000)

    return () => clearTimeout(timer)
  }, [code])

  const currentEditorWidth = BASE_EDITOR_WIDTH * scaleMultiplier
  const currentSnippetsWidth = BASE_SNIPPETS_WIDTH * scaleMultiplier
  const currentHeight = BASE_HEIGHT * scaleMultiplier

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code text: ", err)
    }
  }, [code])

  const scrollToTop = useCallback(() => {
    const view = editorViewRef.current
    if (view) {
      view.focus()
      view.dispatch({
        selection: { anchor: 0, head: 0 },
        scrollIntoView: true
      })
    }
  }, [])

  const scrollToBottom = useCallback(() => {
    const view = editorViewRef.current
    if (view) {
      const docLength = view.state.doc.length
      view.focus()
      view.dispatch({
        selection: { anchor: docLength, head: docLength },
        scrollIntoView: true
      })
    }
  }, [])

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

          <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-50">
            <motion.div
              ref={panelRef}
              layout="position"
              drag
              dragListener={false}
              dragControls={dragControls}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ 
                opacity: 1,
                scale: 1,
                y: 0,
                width: currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: currentHeight
              }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={layoutSpringTransition}
              style={{
                backgroundColor: `rgba(var(--background-rgb, 9, 9, 11), ${opacity})`,
                transform: "translateZ(0)"
              }}
              className="flex overflow-hidden p-0 pointer-events-auto will-change-[width,height,transform] border border-border rounded-xl text-card-foreground shadow-xl bg-background"
            >
              <div style={{ width: currentEditorWidth }} className="grid grid-rows-[auto_1fr_auto] h-full shrink-0 z-10 bg-transparent transform-gpu">
                <div
                  className="h-9 border-b border-border flex items-center justify-between px-3 bg-muted/10 cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="flex items-center gap-1.5 text-foreground/40">
                    <GripVertical className="size-4 shrink-0" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Editor</span>
                  </div>
                  <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                    <DropdownMenu modal={false} onOpenChange={setDropdownMenuOpen}>
                      <DropdownMenuTrigger
                        type="button"
                        className="inline-flex items-center justify-center rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground gap-1 h-6 text-[11px] px-2 font-medium transition-colors text-foreground"
                        aria-label="Open editor preferences"
                      >
                        <Settings2 className="size-3" />
                        <span>Options</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 text-xs z-60">
                        <div className="px-2 py-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                          Preferences
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2 text-xs">
                            <Maximize2 className="size-3 text-muted-foreground" />
                            <span>Layout Scale</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-36">
                            <DropdownMenuRadioGroup 
                              value={scaleMultiplier.toString()} 
                              onValueChange={(v) => setScaleMultiplier(parseFloat(v))}
                            >
                              {SCALE_OPTIONS.map((opt) => (
                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="gap-2 text-xs">
                            <Eye className="size-3 text-muted-foreground" />
                            <span>Transparency</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="w-40">
                            <DropdownMenuRadioGroup 
                              value={opacity.toString()} 
                              onValueChange={(v) => setOpacity(parseFloat(v))}
                            >
                              {OPACITY_OPTIONS.map((opt) => (
                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </DropdownMenuRadioItem>
                              ))}
                            </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      type="button"
                      variant={snippetsOpen ? "secondary" : "ghost"}
                      size="xs"
                      onClick={() => setSnippetsOpen(!snippetsOpen)}
                      className="gap-1 h-6 text-[11px] px-2 font-medium transition-colors"
                      aria-label={snippetsOpen ? "Close snippets panel" : "Open snippets panel"}
                    >
                      <Library className="size-3" /> Snippets
                    </Button>
                  </div>
                </div>

                <div 
                  style={{ height: currentHeight - 64 }}
                  className="w-full overflow-hidden bg-transparent relative"
                >
                  <ScrollArea className="h-full w-full bg-transparent">
                    <div className="h-full w-full relative">
                      <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading Editor...</div>}>
                        <IsolatedEditor
                          code={code}
                          onChange={setCode}
                          onCreateEditor={(view) => {
                            editorViewRef.current = view
                          }}
                        />
                      </Suspense>
                    </div>
                  </ScrollArea>
                </div>

                <div 
                  className="h-7 border-t border-border flex items-center justify-between px-2 bg-muted/10 select-none cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      onClick={handleCopy}
                      variant="ghost"
                      size="xs"
                      className="gap-1 h-5 w-auto px-2 font-medium"
                      aria-label="Copy code snippet to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="size-3 text-green-500" /> <span className="text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> <span className="text-[10px]">Copy Code</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-5 rounded-full flex items-center justify-center p-0.5"
                      onClick={scrollToTop}
                      aria-label="Scroll to top of code"
                    >
                      <ChevronRight className="size-3 -rotate-90 text-foreground" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-5 rounded-full flex items-center justify-center p-0.5"
                      onClick={scrollToBottom}
                      aria-label="Scroll to bottom of code"
                    >
                      <ChevronRight className="size-3 rotate-90 text-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
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