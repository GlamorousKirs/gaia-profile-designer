import { useState, memo, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useSnippetStore, useFilteredSnippets } from "@/store/useSnippetStore"
import type { Snippet, SnippetActionType } from "@/store/useSnippetStore"
import {
    Plus, Trash2, Edit2, FileCode, X, Save, Database,
    MoreHorizontal, ArrowUp, ArrowDown, FileStack, ArrowRightLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SNIPPETS_WIDTH = 300
const structuralSpring = { type: "spring", stiffness: 450, damping: 45 } as const

const SnippetRow = memo(({
    snippet,
    editingId,
    editTitle,
    setEditTitle,
    saveRename,
    startRename,
    openEditorModal,
    deleteSnippet,
    onSelectSnippet
}: {
    snippet: Snippet
    editingId: string | null
    editTitle: string
    setEditTitle: (val: string) => void
    saveRename: (id: string) => void
    startRename: (snippet: Snippet, e: React.MouseEvent) => void
    openEditorModal: (snippet: Snippet, e: React.MouseEvent) => void
    deleteSnippet: (id: string) => void
    onSelectSnippet: (code: string, action: SnippetActionType) => void
}) => {
    const codePreview = useMemo(() => {
        return snippet.code.replace(/\s+/g, ' ').substring(0, 35) + '...';
    }, [snippet.code]);

    const isEditing = editingId === snippet.id;

    const handleRowClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('[role="combobox"]') || target.closest('button') || target.closest('[data-state]') || target.closest('input')) {
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        onSelectSnippet(snippet.code, 'append-cursor');
    };

    return (
        <div
            onClick={handleRowClick}
            className={`group relative flex flex-col justify-between items-stretch rounded-md border p-2 text-xs font-mono cursor-pointer transition-all [contain-intrinsic-size:52px] ${snippet.isDefault
                    ? 'bg-muted/30 border-dashed border-border/40 hover:bg-muted/50 hover:border-sky-500/30'
                    : 'border-transparent hover:border-border/60 hover:bg-background/60'
                }`}
        >
            <div className="flex items-center justify-between gap-2 w-full">
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <FileCode className={`size-3.5 shrink-0 ${snippet.isDefault ? 'text-sky-400/80' : 'text-muted-foreground'}`} />
                    {isEditing ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveRename(snippet.id)}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-transparent font-sans border-b border-primary/50 text-foreground text-xs focus:outline-none w-full py-0 px-0.5"
                            autoFocus
                        />
                    ) : (
                        <span className="truncate font-medium text-foreground/90">
                            {snippet.title}
                        </span>
                    )}
                </div>

                <div
                    className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 shrink-0"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 h-5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                <MoreHorizontal className="size-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-sans text-xs">
                            <DropdownMenuItem className="gap-2 text-[11px]" onClick={() => onSelectSnippet(snippet.code, 'append-cursor')}>
                                <FileStack className="size-3.5 text-muted-foreground" /> Insert at Cursor
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-[11px]" onClick={() => onSelectSnippet(snippet.code, 'prepend')}>
                                <ArrowUp className="size-3.5 text-muted-foreground" /> Prepend to File
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-[11px]" onClick={() => onSelectSnippet(snippet.code, 'append')}>
                                <ArrowDown className="size-3.5 text-muted-foreground" /> Append to File
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-[11px]" onClick={() => onSelectSnippet(snippet.code, 'replace')}>
                                <ArrowRightLeft className="size-3.5 text-muted-foreground" /> Replace Whole File
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem className="gap-2 text-[11px]" onClick={(e) => openEditorModal(snippet, e)}>
                                <FileCode className="size-3.5 text-sky-500" /> {snippet.isDefault ? "View Code" : "Edit Code"}
                            </DropdownMenuItem>

                            {!snippet.isDefault && (
                                <>
                                    <DropdownMenuItem className="gap-2 text-[11px]" onClick={(e) => startRename(snippet, e)}>
                                        <Edit2 className="size-3.5 text-muted-foreground" /> Rename Title
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2 text-[11px] text-destructive focus:text-destructive" onClick={() => deleteSnippet(snippet.id)}>
                                        <Trash2 className="size-3.5" /> Delete Permanently
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="text-[10px] text-muted-foreground/60 truncate mt-0.5 pointer-events-none pl-5">
                {codePreview}
            </div>
        </div>
    )
});
SnippetRow.displayName = "SnippetRow";

interface SnippetPanelProps {
    dragControls: any
    currentCode: string
    onSelectSnippet: (code: string, action: SnippetActionType) => void
}

export function SnippetPanel({ dragControls, currentCode, onSelectSnippet }: SnippetPanelProps) {
    const showDefaults = useSnippetStore((state) => state.showDefaults)
    const setShowDefaults = useSnippetStore((state) => state.setShowDefaults)
    const addSnippet = useSnippetStore((state) => state.addSnippet)
    const updateSnippet = useSnippetStore((state) => state.updateSnippet)
    const deleteSnippet = useSnippetStore((state) => state.deleteSnippet)
    const renameSnippet = useSnippetStore((state) => state.renameSnippet)

    const visibleSnippets = useFilteredSnippets()

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState("")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalSnippet, setModalSnippet] = useState<Snippet | null>(null)
    const [modalTitle, setModalTitle] = useState("")
    const [modalCode, setModalCode] = useState("")

    const openEditorModal = (snippet?: Snippet, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (snippet) {
            setModalSnippet(snippet)
            setModalTitle(snippet.title)
            setModalCode(snippet.code)
        } else {
            setModalSnippet(null)
            setModalTitle("Snippet Name")
            setModalCode(currentCode.trim())
        }
        setIsModalOpen(true)
    }

    const handleSaveModal = () => {
        if (modalSnippet && !modalSnippet.isDefault) {
            updateSnippet(modalSnippet.id, modalCode)
            renameSnippet(modalSnippet.id, modalTitle)
        } else if (!modalSnippet) {
            addSnippet(modalTitle, modalCode)
        }
        setIsModalOpen(false)
    }

    const startRename = (snippet: Snippet, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(snippet.id)
        setEditTitle(snippet.title)
    }

    const saveRename = (id: string) => {
        renameSnippet(id, editTitle)
        setEditingId(null)
    }

    return (
        <div className="flex shrink-0 h-full relative">
            <div className="w-px h-full bg-border shrink-0 z-20" />
            <motion.div
                initial={{ opacity: 0, scaleX: 0.95 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0.95 }}
                transition={structuralSpring}
                style={{ width: SNIPPETS_WIDTH, transformOrigin: "left center" }}
                className="h-full overflow-hidden flex flex-col bg-background will-change-transform contain-strict"
            >
                <div className="h-full flex flex-col select-text overflow-hidden">
                    <div
                        className="h-9 shrink-0 border-b border-border flex items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/40 cursor-grab active:cursor-grabbing select-none"
                        onPointerDown={(e) => dragControls.start(e)}
                    >
                        <span>Snippets Library</span>
                        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={`size-5 rounded-md transition-colors ${showDefaults ? 'text-sky-500 hover:bg-sky-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                                onClick={() => setShowDefaults(!showDefaults)}
                                title={showDefaults ? "Hide built-in snippets" : "Show built-in snippets"}
                                aria-label="Toggle defaults"
                            >
                                <Database className="size-3.5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 rounded-md text-foreground hover:bg-muted"
                                onClick={() => openEditorModal()}
                                title="Create new custom CSS snippet"
                                aria-label="Create snippet"
                            >
                                <Plus className="size-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 bg-muted/20 [content-visibility:auto] overflow-y-auto">
                        <div className="p-2 flex flex-col gap-1 min-h-10">
                            {visibleSnippets.length === 0 ? (
                                <div className="text-[11px] font-mono p-4 text-muted-foreground italic text-center">
                                    No templates found here.
                                </div>
                            ) : (
                                visibleSnippets.map((snippet) => (
                                    <SnippetRow
                                        key={snippet.id}
                                        snippet={snippet}
                                        editingId={editingId}
                                        editTitle={editTitle}
                                        setEditTitle={setEditTitle}
                                        saveRename={saveRename}
                                        startRename={startRename}
                                        openEditorModal={openEditorModal}
                                        deleteSnippet={deleteSnippet}
                                        onSelectSnippet={onSelectSnippet}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            { }
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 p-3 flex flex-col justify-between border-l border-border"
                    >
                        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    disabled={!!modalSnippet?.isDefault}
                                    value={modalTitle}
                                    onChange={(e) => setModalTitle(e.target.value)}
                                    className="bg-transparent border-b border-border text-xs font-semibold text-foreground focus:outline-none focus:border-primary py-0.5 px-1 flex-1 mr-2 disabled:border-transparent disabled:opacity-80"
                                    placeholder="Snippet Name"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-5 rounded"
                                    onClick={() => setIsModalOpen(false)}
                                    aria-label="Close CSS modal"
                                >
                                    <X className="size-3.5" />
                                </Button>
                            </div>

                            <textarea
                                value={modalCode}
                                readOnly={!!modalSnippet?.isDefault}
                                onChange={(e) => setModalCode(e.target.value)}
                                className="w-full flex-1 bg-muted/30 border border-border rounded-md p-2 font-mono text-[11px] text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary overflow-y-auto read-only:opacity-70"
                                placeholder="Type/paste a line of CSS code here."
                                spellCheck={false}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border mt-2 shrink-0">
                            <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => setIsModalOpen(false)}>
                                Close
                            </Button>
                            {!modalSnippet?.isDefault && (
                                <Button size="sm" className="h-6 text-[10px] px-2 gap-1" onClick={handleSaveModal}>
                                    <Save className="size-3" /> Save Changes
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}