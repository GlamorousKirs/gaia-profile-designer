import { memo } from "react"
import CodeMirror from "@uiw/react-codemirror"
import type { Extension } from "@codemirror/state"

interface IsolatedEditorProps {
  code: string
  onChange: (value: string) => void
  extensions: Extension[]
  onCreateEditor: (view: any) => void
}

export const IsolatedEditor = memo(function IsolatedEditor({
  code,
  onChange,
  extensions,
  onCreateEditor,
}: IsolatedEditorProps) {
  return (
    <CodeMirror
      value={code}
      extensions={extensions}
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