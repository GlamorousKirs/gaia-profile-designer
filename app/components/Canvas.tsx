import { memo, useRef, useEffect, useMemo } from "react"
import rawGaiaScript from "@/presets/gaia.js?raw"
import gaiaHtml from "@/presets/gaia.html?raw"
import gaiaCss from "@/presets/gaia.css?raw"
import { type ColumnState } from "@/components/ColumnManager"

const TARGET_WIDTH = 1920
const TARGET_HEIGHT = 1080

const presetCssModules = import.meta.glob("/app/presets/**/preset.css", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const presetTomlModules = import.meta.glob("/app/presets/**/preset.toml", { query: "?raw", import: "default", eager: true }) as Record<string, string>
const panelHtmlModules = import.meta.glob("/app/presets/panels_html/*.html", { query: "?raw", import: "default", eager: true }) as Record<string, string>

interface CanvasProps {
  isMaximized: boolean
  activeTool: "select" | "hand"
  rootCss?: string
  cssCode?: string
  presetId?: string | null
  category?: string | null
  activePanels?: string[]
  columnLayout?: ColumnState | null
}

export const Canvas = memo(function Canvas({
  isMaximized,
  activeTool,
  rootCss = "",
  cssCode = "",
  presetId = null,
  category = null,
  activePanels = [],
  columnLayout = null
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isSelectionMode = activeTool === "select"

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
      showHeader: category === "profile"
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

  const shouldCenterPanel = useMemo(() => category === "avatar_menu" || category === "wishlist", [category])

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
    } else if (category === "profile") {
      globalHeaderHtml = panelHtmlModules["/app/presets/panels_html/header.html"] || ""
      Object.entries(panelHtmlModules)
        .filter(([k]) => !k.endsWith("avatar_menu.html") && !k.endsWith("header.html"))
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
      const content = panelHtmlModules[`/app/presets/panels_html/${category}.html`] || ""
      if (category !== "header") {
        currentHtml = gaiaHtml.replace(`id="column_2" class="column focus_column">`, `id="column_2" class="column focus_column">\n${content}`)
      }
    }

    return globalHeaderHtml ? currentHtml.replace('<div id="columns">', `${globalHeaderHtml}\n<div id="columns">`) : currentHtml
  }, [category, activePanels, shouldCenterPanel, parsedTomlLayout, columnLayout])

  const initialSrcDoc = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style id="base-styles">${gaiaCss}</style>
        <style id="active-preset-styles">${loadedPresetCss}</style>
        <style id="user-overrides"></style>
        <style>.highlight-hover{outline:2px solid #94a3b8 !important;cursor:crosshair !important}.highlight-selected{outline:2px solid #3b82f6 !important}html,body{margin:0 !important;padding:0 !important;width:100% !important;height:100% !important}#base-layer{width:100% !important;height:100% !important;box-sizing:border-box !important;position:relative !important;margin:0 !important;padding:0 !important;}${shouldCenterPanel ? "html,body{overflow:hidden !important}#base-layer > *{position:absolute !important;top:50% !important;left:50% !important;transform:translate(-50%,-50%) !important;margin:0 !important;}" : ""}</style>
      </head>
      <body>
        <div id="base-layer"></div>
        <script>
          ${rawGaiaScript}
          const userStyleTag = document.getElementById('user-overrides');
          window.addEventListener('message', (e) => {
            if (e.data.type === 'init-html' || e.data.type === 'update-html') document.getElementById('base-layer').innerHTML = e.data.html;
            if (e.data.type === 'update-css') userStyleTag.textContent = e.data.css;
            if (e.data.type === 'toggle-selection-mode') window.isSelectionActive = e.data.active;
          });
          document.addEventListener('click', (e) => { if (!window.isSelectionActive) return; e.preventDefault(); e.stopPropagation(); const target = e.target; window.parent.postMessage({ type: 'element-selected', selector: target.id ? '#' + target.id : 'body' }, '*'); });
        </script>
      </body>
    </html>`, [loadedPresetCss, shouldCenterPanel])

  useEffect(() => {
    const handler = () => iframeRef.current?.contentWindow?.postMessage({ type: 'init-html', html: integratedHtml }, '*')
    iframeRef.current?.addEventListener('load', handler)
    handler()
    return () => iframeRef.current?.removeEventListener('load', handler)
  }, [integratedHtml])

  useEffect(() => { iframeRef.current?.contentWindow?.postMessage({ type: 'update-css', css: `${rootCss}\n${cssCode}` }, '*') }, [rootCss, cssCode])
  useEffect(() => { iframeRef.current?.contentWindow?.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*') }, [isSelectionMode])

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
        }}
        className="block border-none shrink-0 bg-background"
      />
    </div>
  )
})
Canvas.displayName = "Canvas"