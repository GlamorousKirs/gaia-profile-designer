import { EditorView } from "@codemirror/view"
import { createTheme } from "@uiw/codemirror-themes"
import { tags as t } from "@lezer/highlight"

export const studioTheme = createTheme({
  theme: "dark",
  settings: {
    background: "transparent",
    foreground: "var(--foreground)",
    caret: "var(--foreground)",
    selection: "color-mix(in srgb, var(--primary), transparent 90%)",
    lineHighlight: "color-mix(in srgb, var(--primary), transparent 90%)",
    gutterBackground: "transparent",
    gutterForeground: "color-mix(in srgb, var(--foreground), transparent 60%)",
  },
  styles: [
    { tag: [t.keyword, t.modifier], color: "var(--chart-2)" },
    { tag: [t.variableName, t.tagName], color: "var(--chart-1)" },
    { tag: [t.string, t.url], color: "var(--chart-3)" },
    { tag: [t.number, t.bool, t.unit], color: "var(--chart-4)" },
    { tag: t.comment, color: "var(--chart-5)" },
    { tag: [t.propertyName, t.attributeName], color: "var(--chart-2)" },
    { tag: [t.className], color: "var(--chart-1)" },
    { tag: t.atom, color: "var(--chart-4)" },
  ],
})

export const customSearchTheme = EditorView.theme({
  "&.cm-editor": { backgroundColor: "transparent" },
  
  "&": { height: "100%" },
  ".cm-scroller": { 
    backgroundColor: "transparent",
    overflowY: "auto !important", 
    overflowX: "hidden !important", 
    maxHeight: "100%" 
  },
  
  ".cm-line": { 
    whiteSpace: "pre-wrap !important", 
    wordBreak: "break-all !important" 
  },

  ".cm-panel.cm-search": {
    backgroundColor: "var(--muted)",
    color: "var(--foreground)",
    borderBottom: "none",
    fontSize: "0.90rem",
    padding: ".70rem"
  },
  ".cm-search input": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    border: "1px solid var(--primary)",
    borderRadius: "var(--radius)",
    fontSize: "0.60rem"
  },
  ".cm-search .cm-button": {
    backgroundColor: "var(--primary)",
    backgroundImage: "none",
    color: "var(--primary-foreground)",
    fontSize: "0.60rem",
    border: "1px solid var(--primary)",
    borderRadius: "var(--radius)"
  },
  ".cm-search .cm-button:hover": {
    backgroundColor: "var(--secondary)",
    color: "var(--secondary-foreground)"
  },
  ".cm-search button[name=close]": {
    color: "var(--primary)",
    background: "var(--primary)"
  },
  ".cm-search input[type='checkbox']": {
    accentColor: "var(--chart-1)",
    cursor: "pointer",
    width: "0.60rem",
    height: "0.60rem"
  },

  ".cm-tooltip": {
    position: "absolute",
    zIndex: "100000 !important",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    backgroundColor: "var(--background)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    padding: "0.25rem",
    overflow: "hidden",
    minWidth: "200px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },

  ".cm-tooltip.cm-tooltip-autocomplete ul": {
    maxHeight: "250px",
    overflowY: "auto",
    padding: "0",
    margin: "0",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "var(--border)",
      borderRadius: "9999px",
      transition: "background 0.2s",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "var(--muted-foreground)",
    },
  },

  ".cm-tooltip.cm-tooltip-autocomplete ul li": {
    borderRadius: "var(--radius)",
    padding: "0.4rem 0.6rem",
    color: "var(--secondary-foreground)",
    cursor: "pointer",
  },
  ".cm-tooltip.cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  },
  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    border: "none",
    padding: "0 4px",
  },
  "&.cm-editor.cm-focused": {
    outline: "none"
  }
})