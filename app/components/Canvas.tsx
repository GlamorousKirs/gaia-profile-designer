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
  selectedSelector = "html, body",
  onElementSelected
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
        <style>
          .highlight-hover {
            outline: 2px dashed #6366f1 !important;
            outline-offset: -2px;
            cursor: crosshair !important;
          }
          .highlight-selected {
            outline: 2px solid #2563eb !important;
            outline-offset: -2px;
          }
          body { box-sizing: border-box; }
          html.highlight-selected body {
            outline: 2px solid #2563eb !important;
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
          const userStyleTag = document.getElementById('user-overrides');
          let currentHovered = null;
          let activeSelectorString = "html, body";

          function getSelector(el) {
            if (!el || el === document.body || el === document.documentElement) return 'html, body';

            const segments = [];
            let current = el;

            while (current && current !== document.body && current !== document.documentElement) {
              let segment = current.id ? ('#' + current.id) : current.tagName.toLowerCase();
              segments.unshift(segment);
              current = current.parentNode;
            }

            return segments.join(' ');
          }

          window.addEventListener('message', (e) => {
            if (e.data.type === 'init-html' || e.data.type === 'update-html') {
              const scriptTag = document.querySelector('script');
              document.body.innerHTML = e.data.html;
              document.body.appendChild(scriptTag);
            }
            if (e.data.type === 'update-css') {
              userStyleTag.textContent = e.data.css;
            }
            if (e.data.type === 'toggle-selection-mode') {
              window.isSelectionActive = e.data.active;
              if (!window.isSelectionActive && currentHovered) {
                currentHovered.classList.remove('highlight-hover');
                currentHovered = null;
              }
            }
            if (e.data.type === 'sync-selected-element') {
              activeSelectorString = e.data.selector || "html, body";
              
              document.documentElement.classList.remove('highlight-selected');
              document.querySelectorAll('.highlight-selected').forEach(el => {
                el.classList.remove('highlight-selected');
              });

              if (e.data.selector) {
                try {
                  if (e.data.selector === "html, body") {
                    document.documentElement.classList.add('highlight-selected');
                  } else {
                    const elements = document.querySelectorAll(e.data.selector);
                    elements.forEach(el => {
                      el.classList.add('highlight-selected');
                    });
                  }
                } catch(err){}
              }
            }
          });

          document.addEventListener('mouseover', (e) => {
            if (!window.isSelectionActive) return;
            if (currentHovered && currentHovered !== e.target) {
              currentHovered.classList.remove('highlight-hover');
            }
            currentHovered = e.target;
            currentHovered.classList.add('highlight-hover');
          });

          document.addEventListener('mouseout', (e) => {
            if (!window.isSelectionActive) return;
            if (currentHovered === e.target) {
              currentHovered.classList.remove('highlight-hover');
              currentHovered = null;
            }
          });

          document.addEventListener('click', (e) => {
            if (!window.isSelectionActive) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            let finalSelector = "html, body";

            if (e.target !== document.body && e.target !== document.documentElement) {
              const baseSelector = getSelector(e.target);
              const hasShift = e.shiftKey;
              const hasCtrl = e.ctrlKey || e.metaKey;

              let segmentToAppend = baseSelector;
              if (hasShift) {
                segmentToAppend = baseSelector + ", " + baseSelector + " *";
                window.getSelection()?.removeAllRanges();
              }

              finalSelector = segmentToAppend;

              if (hasCtrl) {
                if (activeSelectorString && activeSelectorString !== "html, body") {
                  const parts = activeSelectorString.split(',').map(p => p.trim());
                  const incomingParts = segmentToAppend.split(',').map(p => p.trim());
                  const filteredIncoming = incomingParts.filter(p => !parts.includes(p));

                  if (filteredIncoming.length > 0) {
                    finalSelector = activeSelectorString + ", " + filteredIncoming.join(", ");
                  } else {
                    finalSelector = activeSelectorString;
                  }
                }
              }
            }

            window.parent.postMessage({ type: 'element-selected', selector: finalSelector }, '*');
          }, true);
        </script>
      </body>
    </html>`, [loadedPresetCss, shouldCenterPanel])

  useEffect(() => {
    const handler = () => {
      const win = iframeRef.current?.contentWindow
      if (!win) return

      win.postMessage({ type: 'init-html', html: integratedHtml }, '*')
      win.postMessage({ type: 'update-css', css: `${rootCss}\n${cssCode}` }, '*')
      win.postMessage({ type: 'toggle-selection-mode', active: isSelectionMode }, '*')
      win.postMessage({ type: 'sync-selected-element', selector: selectedSelector }, '*')
    }

    iframeRef.current?.addEventListener('load', handler)
    handler()

    return () => iframeRef.current?.removeEventListener('load', handler)
  }, [integratedHtml, rootCss, cssCode, isSelectionMode, selectedSelector])

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