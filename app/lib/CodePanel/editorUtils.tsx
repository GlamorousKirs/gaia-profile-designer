import { EditorView } from "@codemirror/view"
import type { SnippetActionType } from "@/store/useSnippetStore"

export const SCALE_OPTIONS = [
  { label: "1.0x (Default)", value: 1.0 },
  { label: "1.2x", value: 1.2 },
  { label: "1.4x", value: 1.4 },
  { label: "1.6x", value: 1.6 },
  { label: "1.8x", value: 1.8 },
  { label: "2.0x", value: 2.0 },
]

export const scrollToTop = (editorViewRef: React.RefObject<EditorView | null>) => {
  const view = editorViewRef.current
  if (view) {
    view.focus()
    view.dispatch({
      selection: { anchor: 0, head: 0 },
      effects: EditorView.scrollIntoView(0, { y: "start" })
    })
  }
}

export const scrollToBottom = (editorViewRef: React.RefObject<EditorView | null>) => {
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

export const handleCopy = async (
  codeRef: React.RefObject<string>,
  setCopied: (value: boolean) => void
) => {
  try {
    await navigator.clipboard.writeText(codeRef.current)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  } catch (err) {
    console.error("Failed to copy code text: ", err)
  }
}

export const handleSelectSnippet = (
  snippetCode: string,
  action: SnippetActionType,
  editorViewRef: React.RefObject<EditorView | null>,
  setCode: React.Dispatch<React.SetStateAction<string>>
) => {
  const cleanSnippet = snippetCode.trim()
  const view = editorViewRef.current

  switch (action) {
    case "prepend":
      setCode((prev) => (prev ? `${cleanSnippet}\n\n${prev}` : cleanSnippet))
      break
    case "append":
      setCode((prev) => (prev ? `${prev}\n\n${cleanSnippet}` : cleanSnippet))
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
        setCode((prev) => (prev ? `${prev}\n\n${cleanSnippet}` : cleanSnippet))
      }
      break
  }
}