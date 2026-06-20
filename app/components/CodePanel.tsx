import { useState, useRef, useTransition, useCallback, useEffect, lazy, Suspense, useMemo } from "react"
import { motion, useDragControls, AnimatePresence } from "motion/react"
import { GripVertical, Copy, Check, Library, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EditorView, tooltips } from "@codemirror/view"
import { langs } from "@uiw/codemirror-extensions-langs"
import { studioTheme, customSearchTheme } from "@/codemirror/editor"
import { ColorPlugin } from "@/codemirror/color-plugin"
import { SnippetPanel } from "./SnippetPanel"
import type { SnippetActionType } from "@/store/useSnippetStore"

const BASE_EDITOR_WIDTH = 450
const BASE_SNIPPETS_WIDTH = 300
const BASE_HEIGHT = 320
const STORAGE_KEY = "myapp_v1_autosave_code"

const structuralSpring = { type: "spring", stiffness: 450, damping: 45 } as const

const CodeMirror = lazy(() => import("@uiw/react-codemirror"))

interface CodePanelProps {
  isOpen: boolean
  code: string
  setCode: React.Dispatch<React.SetStateAction<string>>
}

const SCALE_OPTIONS = [
  { label: "1x", value: 1.0 },
  { label: "1.2x", value: 1.2 },
  { label: "1.4x", value: 1.4 },
  { label: "1.6x", value: 1.6 },
  { label: "1.8x", value: 1.8 },
  { label: "2x", value: 2 },
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

  // Keep a stable mutable ref of the code string to prevent heavy re-renders in side-effects
  const codeRef = useRef(code)
  useEffect(() => {
    codeRef.current = code
  }, [code])

  // Debounced autosave with uniquely scoped key namespacing
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

  const currentEditorWidth = BASE_EDITOR_WIDTH * scaleMultiplier
  const currentSnippetsWidth = BASE_SNIPPETS_WIDTH * scaleMultiplier
  const currentHeight = BASE_HEIGHT * scaleMultiplier

  // Included custom themes to dependency tree to ensure extensions reconstruct safely if configuration mutates
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
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code text: ", err)
    }
  }

  const cycleScale = () => {
    setScaleMultiplier((prev) => {
      const currentIndex = SCALE_OPTIONS.findIndex(opt => opt.value === prev)
      const nextIndex = (currentIndex + 1) % SCALE_OPTIONS.length
      return SCALE_OPTIONS[nextIndex].value
    })
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

          <div className="fixed bottom-24 left-0 right-0 flex justify-center pointer-events-none z-50">
            <motion.div
              ref={panelRef}
              drag
              dragListener={false}
              dragControls={dragControls}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              initial={{
                opacity: 0,
                y: 20,
                width: currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: currentHeight
              }}
              animate={{
                opacity: 1,
                y: 0,
                width: currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: currentHeight
              }}
              exit={{ opacity: 0, y: 20 }}
              transition={structuralSpring}
              style={{
                width: currentEditorWidth + (snippetsOpen ? currentSnippetsWidth : 0),
                height: currentHeight
              }}
              className="flex overflow-hidden p-0 pointer-events-auto will-change-[width,height,transform] bg-background border border-border rounded-xl contain-layouts text-card-foreground shadow-xl"
            >
              <div className="absolute inset-0 backdrop-blur-md bg-background/95 -z-10 pointer-events-none rounded-xl" />

              <div style={{ width: currentEditorWidth }} className="grid grid-rows-[auto_1fr_auto] h-full shrink-0 z-10 bg-transparent">
                <div
                  className="h-9 border-b border-border flex items-center justify-between px-3 bg-muted/40 cursor-grab active:cursor-grabbing select-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="flex items-center gap-1.5 text-foreground/40">
                    <GripVertical className="size-4 shrink-0" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Editor</span>
                  </div>
                  <div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cycleScale}
                      className="gap-1 h-6 text-[11px] px-2 font-medium transition-colors"
                      aria-label={`Change layout scale. Current scale: ${scaleMultiplier}x`}
                    >
                      <Maximize2 className="size-3" />
                      <span>{SCALE_OPTIONS.find(opt => opt.value === scaleMultiplier)?.label}</span>
                    </Button>

                    <Button
                      variant={snippetsOpen ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => startTransition(() => setSnippetsOpen(!snippetsOpen))}
                      className="gap-1 h-6 text-[11px] px-2 font-medium transition-colors"
                      aria-label={snippetsOpen ? "Close snippets panel" : "Open snippets panel"}
                    >
                      <Library className="size-3" /> Snippets
                    </Button>
                  </div>
                </div>

                <ScrollArea className="w-full bg-muted/20 overflow-hidden">
                  <div className="h-full w-full">
                    <Suspense fallback={<div className="p-4 text-xs font-mono text-muted-foreground">Loading editor...</div>}>
                      <CodeMirror
                        value={code}
                        extensions={editorExtensions}
                        onChange={setCode}
                        onCreateEditor={(view) => {
                          editorViewRef.current = view
                        }}
                        className="text-xs font-mono h-full"
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

                <div className="h-7 border-t border-border flex items-center justify-between px-2 bg-muted/30 select-none">
                  <div onPointerDown={(e) => e.stopPropagation()}>
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-5 w-auto px-2 font-medium"
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
                      size="icon"
                      variant="ghost"
                      className="size-5 rounded-full"
                      onClick={scrollToTop}
                      aria-label="Scroll to top of code"
                    >
                      <ChevronRight className="size-3 -rotate-90 text-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-5 rounded-full"
                      onClick={scrollToBottom}
                      aria-label="Scroll to bottom of code"
                    >
                      <ChevronRight className="size-3 rotate-90 text-foreground" />
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