import { memo, useMemo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { EditorView, tooltips } from "@codemirror/view"
import { langs } from "@uiw/codemirror-extensions-langs"
import { studioTheme, customSearchTheme } from "@/codemirror/editor"
import { ColorPlugin } from "@/codemirror/color-plugin"

interface IsolatedEditorProps {
  code: string
  onChange: (value: string) => void
  onCreateEditor: (view: any) => void
}

export const IsolatedEditor = memo(function IsolatedEditor({
  code,
  onChange,
  onCreateEditor,
}: IsolatedEditorProps) {
  
  // OPTIMIZATION: Bundled internal extensions array initialization 
  // safely keeps heavy dependencies out of the main execution thread.
  const internalExtensions = useMemo(() => {
    return [
      langs.css(),
      customSearchTheme,
      studioTheme,
      ColorPlugin,
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { backgroundColor: "transparent !important" },
        ".cm-scroller": { backgroundColor: "transparent !important" },
        ".cm-gutters": { 
          backgroundColor: "transparent !important", 
          borderRight: "1px solid var(--border)" 
        }
      }),
      tooltips({
        parent: typeof document !== "undefined" ? document.body : undefined
      })
    ].filter(Boolean)
  }, [])

  return (
    <CodeMirror
      value={code}
      extensions={internalExtensions}
      onChange={onChange}
      onCreateEditor={onCreateEditor}
      className="text-xs font-mono h-full bg-transparent"
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        dropCursor: true,
        allowMultipleSelections: false,
        indentOnInput: true,
      }}
    />
  )
})