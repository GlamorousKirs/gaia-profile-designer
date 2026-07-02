import { memo, useRef, useEffect, useMemo } from "react"
import rawGaiaScript from "@/presets/gaia.js?raw"
import gaiaHtml from "@/presets/gaia.html?raw"
import gaiaCss from "@/presets/gaia.css?raw"
import canvasIframeController from "@/presets/canvas-iframe-controller.js?raw" 
import { type ColumnState } from "@/components/ColumnManager"
import { useProfileStore } from "~/store/useProfileStore"

const TARGET_WIDTH = 1920
const TARGET_HEIGHT = 1080
const DEFAULT_AVATAR = "https://a1cdn.gaiaonline.com/dress-up/avatar/ava/0e/6e/6255ead32c36e0e_flip.png"
const DEFAULT_USERNAME = "Sunkirs"

const presetCssModules = import.meta.glob("/app/presets/**/preset.css", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const presetTomlModules = import.meta.glob("/app/presets/**/preset.toml", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const panelHtmlModules = import.meta.glob("/app/presets/panels_html/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>

interface CanvasProps {
  isMaximized: boolean
  activeTool: "select" | null
  rootCss?: string
  cssCode?: string
  presetId?: string | null
  category?: string | null
  activePanels?: string[]
  columnLayout?: ColumnState | null
  selectedSelector?: string
  onElementSelected?: (selector: string) => void
}

export const Canvas = memo(function Canvas({
  isMaximized,
  activeTool,
  rootCss = "",
  cssCode = "",
  presetId = null,
  category = null,
  activePanels = [],
  columnLayout = null,
  selectedSelector = "",
  onElementSelected,
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isSelectionMode = activeTool === "select"

  const avatarUrl = useProfileStore((state) => state.avatarUrl)
  const username = useProfileStore((state) => state.username)

  const loadedPresetCss = useMemo(() => {
    if (!presetId || !category) return ""
    return presetCssModules[`/app/presets/${category}/${presetId}/preset.css`] || ""
  }, [presetId, category])

  const parsedTomlLayout = useMemo(() => {
    if (!presetId || !category) return null
    const rawToml = presetTomlModules[`/app/presets/${category}/${presetId}/preset.toml`]
    if (!rawToml) return null

    const layout = {
      column1: [] as string[],
      column2: [] as string[],
      column3: [] as string[],
      showHeader: true 
    }

    const arrayRegex = /(column[1-3])\s*=\s*\[([\s\S]*?)\]/g
    let match
    while ((match = arrayRegex.exec(rawToml)) !== null) {
      layout[match[1] as "column1" | "column2" | "column3"] = match[2]
        .replace(/["']/g, ' ')
        .replace(/,/g, ' ')
        .split(/\s+/)
        .filter(name => name.trim().length > 0)
    }

    if (/header\s*=\s*true/.test(rawToml)) layout.showHeader = true
    else if (/header\s*=\s*false/.test(rawToml)) layout.showHeader = false
    return layout
  }, [presetId, category])

  const shouldCenterPanel = useMemo(() => category === "wishlist", [category])

  const integratedHtml = useMemo(() => {
    if (shouldCenterPanel) return category ? panelHtmlModules[`/app/presets/panels_html/${category}.html`] || "" : ""

    let currentHtml = gaiaHtml
    let globalHeaderHtml = ""
    const layoutToUse = columnLayout || parsedTomlLayout

    if (layoutToUse && ((layoutToUse.column1?.length ?? 0) > 0 || (layoutToUse.column2?.length ?? 0) > 0 || (layoutToUse.column3?.length ?? 0) > 0)) {
      const showHeader = !("showHeader" in layoutToUse) || layoutToUse.showHeader !== false;

      if (showHeader) {
        globalHeaderHtml = panelHtmlModules["/app/presets/panels_html/header.html"] || ""
      }
      ; (["column1", "column2", "column3"] as const).forEach((colKey, index) => {
        const targetColumnString = `id="column_${index + 1}" class="column focus_column">`
        const compiled = (layoutToUse[colKey] || [])
          .filter(id => id !== "columns" && id !== "header")
          .map(id => panelHtmlModules[`/app/presets/panels_html/${id}.html`] || "")
          .join("\n")

        currentHtml = currentHtml.replace(targetColumnString, `${targetColumnString}\n${compiled}`)
      })
    } else if (category === "profile" || !category) {
      globalHeaderHtml = panelHtmlModules["/app/presets/panels_html/header.html"] || ""
      Object.entries(panelHtmlModules)
        .filter(([k]) => !k.endsWith("header.html"))
        .forEach(([_, html], i) => {
          const target = `id="column_${(i % 3) + 1}" class="column focus_column">`
          currentHtml = currentHtml.replace(target, `${target}\n${html}`)
        })
    } else if (activePanels.length > 0) {
      activePanels.forEach((id, i) => {
        const content = panelHtmlModules[`/app/presets/panels_html/${id}.html`] || ""
        if (id === "header") globalHeaderHtml = content
        else {
          const target = `id="column_${(i % 3) + 1}" class="column focus_column">`
          currentHtml = currentHtml.replace(target, `${target}\n${content}`)
        }
      })
    } else if (category) {
      globalHeaderHtml = panelHtmlModules["/app/presets/panels_html/header.html"] || ""
      const content = panelHtmlModules[`/app/presets/panels_html/${category}.html`] || ""
      if (category !== "header") {
        currentHtml = gaiaHtml.replace(`id="column_2" class="column focus_column">`, `id="column_2" class="column focus_column">\n${content}`)
      }
    }

    return globalHeaderHtml ? currentHtml.replace('<div id="columns">', `${globalHeaderHtml}\n<div id="columns">`) : currentHtml
  }, [category, activePanels, shouldCenterPanel, parsedTomlLayout, columnLayout])

  const finalAvatarUrl = avatarUrl || DEFAULT_AVATAR
  const finalUsername = username || DEFAULT_USERNAME

  const initialSrcDoc = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style id="base-styles">${gaiaCss}</style>
        <style id="active-preset-styles">${loadedPresetCss}</style>
        <style id="user-overrides"></style>
        <style id="avatar-styles"></style>
        <style>
          html, body {
            overflow-x: hidden !important;
          }
          .highlight-hover {
            outline: 2px dashed #ffbf00 !important;
            outline-offset: -2px;
            cursor: crosshair !important;
          }
          .highlight-selected {
            outline: 2px solid #ffbf00 !important;
            outline-offset: -2px;
          }
          body { box-sizing: border-box; }
          html.highlight-selected body {
            outline: 2px solid #ffbf00 !important;
            outline-offset: -2px;
          }
          * {
            user-select: none !important;
          }
          ${shouldCenterPanel ? "html,body{overflow:hidden}body > *{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);margin:0;}" : ""}
        </style>
      </head>
      <body id="viewer">
        <script>
          ${rawGaiaScript}
          ${canvasIframeController}
        </script>
      </head>
    </html>`, [loadedPresetCss, shouldCenterPanel])

  useEffect(() => {
    (window as any).isSelectionModeActive = isSelectionMode
  }, [isSelectionMode])

  // 1. Stream structural markup changes directly on state update or load
  useEffect(() => {
    const pushStateToIframe = () => {
      const win = iframeRef.current?.contentWindow
      if (!win) return

      win.postMessage({ type: 'init-html', html: integratedHtml }, '*')
      win.postMessage({ type: 'update-css', css: `${rootCss}\n${cssCode}` }, '*')
      win.postMessage({ type: 'update-identity', avatarUrl: finalAvatarUrl, username: finalUsername }, '*')
      win.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*')
      win.postMessage({ type: 'sync-selected-element', selector: selectedSelector }, '*')
    }

    // Run immediately if the iframe structure changes in state
    pushStateToIframe()

    // Also register the handler on native loader transitions
    const iframe = iframeRef.current
    iframe?.addEventListener('load', pushStateToIframe)
    return () => iframe?.removeEventListener('load', pushStateToIframe)
  }, [integratedHtml]) // Fires reliably whenever activePanels / columnLayout recalculates integratedHtml

  // 2. Stream CSS changes without re-rendering HTML
  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (win) {
      win.postMessage({ type: 'update-css', css: `${rootCss}\n${cssCode}` }, '*')
    }
  }, [rootCss, cssCode])

  // 3. Stream Selection updates smoothly
  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (win) {
      win.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*')
      win.postMessage({ type: 'sync-selected-element', selector: selectedSelector }, '*')
    }
  }, [isSelectionMode, selectedSelector])

  // 4. Stream Identity updates without a full redraw
  useEffect(() => {
    const win = iframeRef.current?.contentWindow
    if (win) {
      win.postMessage({ type: 'update-identity', avatarUrl: finalAvatarUrl, username: finalUsername }, '*')
    }
  }, [finalAvatarUrl, finalUsername])

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'element-selected' && onElementSelected) {
        onElementSelected(e.data.selector)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onElementSelected])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || isMaximized) return
    const observer = new ResizeObserver((entries) => {
      const scale = Math.min(1, entries[0].contentRect.width / TARGET_WIDTH, entries[0].contentRect.height / TARGET_HEIGHT)
      wrapper.style.setProperty('--canvas-scale', `${scale}`)
    })
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [isMaximized])

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center overflow-hidden bg-transparent contain-strict">
      <iframe
        ref={iframeRef}
        title="Gaia Preview"
        srcDoc={initialSrcDoc}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: isMaximized ? "100%" : `${TARGET_WIDTH}px`,
          height: isMaximized ? "100%" : `${TARGET_HEIGHT}px`,
          transform: isMaximized ? "none" : "scale(var(--canvas-scale, 1))",
          transformOrigin: "center center",
          willChange: "transform",
          background: "white"
        }}
        className="block border-none shrink-0 bg-background"
      />
    </div>
  )
})
Canvas.displayName = "Canvas"