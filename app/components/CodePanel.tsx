import { useState, useRef, useTransition, useMemo } from "react"
import { motion, useDragControls, AnimatePresence } from "motion/react"
import { GripVertical, Copy, Check, Library, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import CodeMirror from "@uiw/react-codemirror"
import { EditorView } from "@codemirror/view"
import { langs } from "@uiw/codemirror-extensions-langs"
import { studioTheme, customSearchTheme } from "@/codemirror/editor"
import { ColorPlugin } from "@/codemirror/color-plugin"
import { SnippetPanel } from "./SnippetPanel" 
import type { SnippetActionType } from "@/store/useSnippetStore"

const EDITOR_WIDTH = 450
const SNIPPETS_WIDTH = 300
const structuralSpring = { type: "spring", stiffness: 450, damping: 45 } as const

interface CodePanelProps {
  isOpen: boolean
  code: string
  setCode: (code: string) => void
}

export default function CodePanel({ isOpen, code, setCode }: CodePanelProps) {
  const [snippetsOpen, setSnippetsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const [, startTransition] = useTransition()
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const cmWrapperRef = useRef<HTMLDivElement>(null)
  
  const editorViewRef = useRef<EditorView | null>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code text: ", err)
    }
  }

  const getInternalScroller = () => {
    return cmWrapperRef.current?.querySelector(".cm-scroller") as HTMLElement | null
  }

  const scrollToTop = () => {
    const scroller = getInternalScroller()
    if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToBottom = () => {
    const scroller = getInternalScroller()
    if (scroller) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" })
  }

  // Memoize handler references to stop child node tree invalidation passes
  const handleSelectSnippet = useMemo(() => (snippetCode: string, action: SnippetActionType) => {
    const cleanSnippet = snippetCode.trim()

    switch (action) {
      case "prepend":
        setCode(code ? `${cleanSnippet}\n\n${code}` : cleanSnippet)
        break

      case "append":
        setCode(code ? `${code}\n\n${cleanSnippet}` : cleanSnippet)
        break

      case "replace":
        setCode(cleanSnippet)
        break

      case "append-cursor":
      default:
        if (editorViewRef.current) {
          const view = editorViewRef.current
          view.focus()
          view.dispatch(view.state.replaceSelection(cleanSnippet))
          setCode(view.state.doc.toString())
        } else {
          setCode(code ? `${code}\n\n${cleanSnippet}` : cleanSnippet)
        }
        break
    }
  }, [code, setCode])

  // FIXED: The conditional check has been safely shifted below all Hook definitions!
  if (!isOpen) return null

  return (
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
          animate={{ width: EDITOR_WIDTH + (snippetsOpen ? SNIPPETS_WIDTH : 0) }}
          transition={structuralSpring}
          className="flex overflow-hidden p-0 pointer-events-auto will-change-[width,transform] bg-background border border-border rounded-xl h-80 contain-layouts text-card-foreground"
        >
          <div className="absolute inset-0 backdrop-blur-md bg-background/95 -z-10 pointer-events-none rounded-xl" />

          {/* Main Editor Section */}
          <div style={{ width: EDITOR_WIDTH }} className="grid grid-rows-[auto_1fr_auto] h-full shrink-0 z-10 bg-transparent">
            <div
              className="h-9 border-b border-border flex items-center justify-between px-3 bg-muted/40 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-1.5 text-foreground/40">
                <GripVertical className="size-4 shrink-0" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Editor</span>
              </div>
              <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-6 text-[11px] px-2 font-medium min-w-64"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-green-500" /> <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" /> <span>Copy Code</span>
                    </>
                  )}
                </Button>
                <Button
                  variant={snippetsOpen ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => startTransition(() => setSnippetsOpen(!snippetsOpen))}
                  className="gap-1 h-6 text-[11px] px-2 font-medium transition-colors"
                >
                  <Library className="size-3" /> Snippets
                </Button>
              </div>
            </div>

            <ScrollArea className="w-full bg-muted/20 overflow-hidden">
              <div ref={cmWrapperRef} className="h-full w-full">
                <CodeMirror
                  value={code}
                  extensions={[
                    langs.css(),
                    customSearchTheme || [],
                    studioTheme || [],
                    ColorPlugin || [],
                    EditorView.lineWrapping
                  ].filter(Boolean)}
                  onChange={(value) => setCode(value)}
                  onCreateEditor={(view) => {
                    editorViewRef.current = view
                  }}
                  className="text-xs font-mono h-full"
                  basicSetup={{ lineNumbers: true, foldGutter: true, dropCursor: true, allowMultipleSelections: false, indentOnInput: true }}
                />
              </div>
            </ScrollArea>

            <div className="h-7 border-t border-border flex items-center justify-end px-2 gap-1 bg-muted/30 select-none">
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

          {/* Separated Snippet Panel Component */}
          <AnimatePresence initial={false}>
            {snippetsOpen && (
              <SnippetPanel 
                dragControls={dragControls} 
                currentCode={code}
                onSelectSnippet={handleSelectSnippet}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}