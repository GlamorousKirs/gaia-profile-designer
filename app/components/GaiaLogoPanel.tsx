import { useState, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { fetchLogosFromCloudinary, type CloudinaryLogo } from "@/lib/cloudinary"
import { Search, Image, Copy, Check, Loader2, AlertCircle, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GaiaLogoPanelProps {
    tagName?: string | string[]
    onSelectLogo?: (cssUrlValue: string) => void
}

export function GaiaLogoPanel({ tagName = "gaia-logo", onSelectLogo }: GaiaLogoPanelProps) {
    const [logos, setLogos] = useState<CloudinaryLogo[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const parentRef = useRef<HTMLDivElement>(null)

    const normalizedTag = useMemo(() => {
        return Array.isArray(tagName) ? [...tagName].sort().join(",") : tagName
    }, [tagName])

    useEffect(() => {
        let isMounted = true
        async function loadLogos() {
            try {
                setLoading(true)
                setError(null)
                const data = await fetchLogosFromCloudinary(tagName)
                if (isMounted) setLogos(data)
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to load logos.")
            } finally {
                if (isMounted) setLoading(false)
            }
        }
        loadLogos()

        return () => {
            isMounted = false
        }
    }, [normalizedTag])

    const filteredLogos = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return logos
        return logos.filter(
            (logo) =>
                logo.name.toLowerCase().includes(query) ||
                logo.id.toLowerCase().includes(query)
        )
    }, [logos, searchQuery])

    const ITEMS_PER_ROW = 2;
    const logoRows = useMemo(() => {
        const rows: CloudinaryLogo[][] = []
        for (let i = 0; i < filteredLogos.length; i += ITEMS_PER_ROW) {
            rows.push(filteredLogos.slice(i, i + ITEMS_PER_ROW))
        }
        return rows
    }, [filteredLogos])

    const rowVirtualizer = useVirtualizer({
        count: logoRows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 110,
        overscan: 4,
    })

    const handleCopyUrl = async (e: React.MouseEvent, url: string, id: string) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(url)
            setCopiedId(id)
            setTimeout(() => setCopiedId(null), 2000)
        } catch (err) {
            console.error("Failed to copy asset URL", err)
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-background select-text">
            <div className="h-9 shrink-0 border-b border-border flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 select-none">
                <div className="flex items-center gap-1.5">
                    <Image className="size-3.5 text-sky-400" />
                    <span>Gaia Logo Assets</span>
                </div>
                <span className="text-[10px] font-mono lowercase bg-muted px-1.5 py-0.5 rounded border border-border/60 truncate max-w-[100px]">
                    tag: {normalizedTag}
                </span>
            </div>

            <div className="p-2 border-b border-border bg-background shrink-0">
                <div className="relative flex items-center">
                    <Search className="absolute left-2 size-3.5 text-muted-foreground/70 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search logos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-7 bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-md pl-7 pr-2 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 transition-colors"
                    />
                </div>
            </div>

            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto bg-muted/10 min-h-0 relative contain-strict"
            >
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10"
                        >
                            <Loader2 className="size-5 animate-spin text-sky-500" />
                            <span className="text-[11px] font-mono italic">Syncing assets...</span>
                        </motion.div>
                    )}

                    {error && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="m-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-start gap-2 text-xs"
                        >
                            <AlertCircle className="size-4 shrink-0 mt-0.5" />
                            <div className="font-sans">
                                <p className="font-semibold">Fetch Error</p>
                                <p className="text-[11px] text-destructive/80 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {!loading && !error && filteredLogos.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[11px] font-mono text-muted-foreground italic text-center py-12"
                        >
                            No cloud logos found matching criteria.
                        </motion.div>
                    )}

                    {!loading && !error && logoRows.length > 0 && (
                        <div
                            style={{
                                height: `${rowVirtualizer.getTotalSize()}px`,
                                width: '100%',
                                position: 'relative',
                            }}
                        >
                            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                                const currentRowItems = logoRows[virtualItem.index]
                                if (!currentRowItems) return null

                                return (
                                    <div
                                        key={virtualItem.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: `${virtualItem.size}px`,
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                        className="grid grid-cols-2 gap-2 px-2.5 py-1"
                                    >
                                        {currentRowItems.map((logo) => (
                                            <div
                                                key={logo.id}
                                                onClick={() => onSelectLogo?.(`url("${logo.url}")`)}
                                                className={`group relative flex flex-col bg-background border border-border/60 hover:border-primary/50 rounded-md p-2 transition-all h-[102px] justify-between ${onSelectLogo ? 'cursor-pointer active:scale-[0.98]' : ''}`}
                                            >
                                                <div className="h-12 w-full bg-muted/30 border border-border/30 rounded flex items-center justify-center p-1.5 overflow-hidden group-hover:bg-muted/10 transition-colors relative">
                                                    <img
                                                        src={logo.url}
                                                        alt={logo.name}
                                                        loading="lazy"
                                                        decoding="async"
                                                        style={{ width: "47px", height: "23px" }}
                                                        className="object-contain pointer-events-none content-visibility-auto"
                                                    />
                                                    {onSelectLogo && (
                                                        <ArrowUpRight className="absolute top-1 right-1 size-3 text-muted-foreground/0 group-hover:text-muted-foreground/70 transition-colors pointer-events-none" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex flex-col pr-6 mt-1">
                                                    <span className="text-[11px] font-medium text-foreground/90 truncate font-sans" title={logo.name}>
                                                        {logo.name}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground/50 font-mono truncate" title={logo.id}>
                                                        {logo.id}
                                                    </span>
                                                </div>

                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={(e) => handleCopyUrl(e, logo.url, logo.id)}
                                                    className="absolute bottom-1.5 right-1.5 size-6 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 rounded border border-border shadow-sm text-muted-foreground hover:text-foreground shrink-0"
                                                >
                                                    {copiedId === logo.id ? (
                                                        <Check className="size-3 text-emerald-500" />
                                                    ) : (
                                                        <Copy className="size-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}