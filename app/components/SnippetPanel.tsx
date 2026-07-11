import { useState, memo, useMemo, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { useVirtualizer } from "@tanstack/react-virtual"
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
import CodeMirror from "@uiw/react-codemirror"
import { css } from "@codemirror/lang-css"
import { studioTheme, customSearchTheme } from "@/codemirror/editor"

const structuralSpring = { type: "spring", stiffness: 380, damping: 38 } as const

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
			className={`group relative flex flex-col justify-center items-stretch rounded-lg border p-2.5 text-xs font-mono cursor-pointer transition-all w-full h-full ${snippet.isDefault
					? 'bg-muted/30 border-border/60 hover:bg-muted/50 hover:border-border'
					: 'bg-accent/10 border-accent/30 hover:border-accent hover:bg-accent/20'
				}`}
		>
			<div className="flex items-center justify-between gap-2 w-full">
				<div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
					<FileCode className={`size-3.5 shrink-0 ${snippet.isDefault ? 'text-muted-foreground/60' : 'text-accent-foreground'}`} />
					{isEditing ? (
						<input
							type="text"
							value={editTitle}
							onChange={(e) => setEditTitle(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && saveRename(snippet.id)}
							onMouseDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
							className="bg-muted font-sans border border-border rounded px-1.5 py-0.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring w-full"
							autoFocus
						/>
					) : (
						<span className="truncate font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
								className="size-5 rounded bg-muted/60 border border-border text-muted-foreground hover:text-foreground"
							>
								<MoreHorizontal className="size-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44 bg-popover border-border text-popover-foreground">
							<DropdownMenuItem onClick={() => onSelectSnippet(snippet.code, 'append-cursor')}>
								<FileStack /> Insert at cursor
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onSelectSnippet(snippet.code, 'prepend')}>
								<ArrowUp /> Prepend
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onSelectSnippet(snippet.code, 'append')}>
								<ArrowDown /> Append
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onSelectSnippet(snippet.code, 'replace')}>
								<ArrowRightLeft /> Replace whole code
							</DropdownMenuItem>

							<DropdownMenuSeparator className="bg-border/60" />

							<DropdownMenuItem onClick={(e) => openEditorModal(snippet, e)}>
								<FileCode /> {snippet.isDefault ? "View Snippet" : "Edit Snippet"}
							</DropdownMenuItem>

							{!snippet.isDefault && (
								<>
									<DropdownMenuSeparator className="bg-border/60" />
									<DropdownMenuItem onClick={(e) => startRename(snippet, e)}>
										<Edit2 /> Rename Title
									</DropdownMenuItem>
									<DropdownMenuSeparator className="bg-border/60" />
									<DropdownMenuItem className="gap-2 text-[11px] text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => deleteSnippet(snippet.id)}>
										<Trash2 className="size-3.5" /> Delete Permanently
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<div className="text-[10px] text-muted-foreground/60 truncate mt-1 pointer-events-none pl-5">
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
	width: number
	scaleMultiplier: number
}

export function SnippetPanel({ dragControls, currentCode, onSelectSnippet, width, scaleMultiplier }: SnippetPanelProps) {
	const showDefaults = useSnippetStore((state) => state.showDefaults)
	const setShowDefaults = useSnippetStore((state) => state.setShowDefaults)
	const addSnippet = useSnippetStore((state) => state.addSnippet)
	const updateSnippet = useSnippetStore((state) => state.updateSnippet)
	const deleteSnippet = useSnippetStore((state) => state.deleteSnippet)
	const renameSnippet = useSnippetStore((state) => state.renameSnippet)
	const initializeStore = useSnippetStore((state) => state.initializeStore)
	const isLoading = useSnippetStore((state) => state.isLoading)

	const visibleSnippets = useFilteredSnippets()
	const scrollContainerRef = useRef<HTMLDivElement>(null)

	const [editingId, setEditingId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState("")

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalSnippet, setModalSnippet] = useState<Snippet | null>(null)
	const [modalTitle, setModalTitle] = useState("")
	const [modalCode, setModalCode] = useState("")

	useEffect(() => {
		initializeStore()
	}, [initializeStore])

	const rowVirtualizer = useVirtualizer({
		count: visibleSnippets.length,
		getScrollElement: () => scrollContainerRef.current,
		estimateSize: () => 62,
		overscan: 10,
	})

	const openEditorModal = (snippet?: Snippet, e?: React.MouseEvent) => {
		if (e) e.stopPropagation()
		if (snippet) {
			setModalSnippet(snippet)
			setModalTitle(snippet.title)
			setModalCode(snippet.code)
		} else {
			setModalSnippet(null)
			setModalTitle("Untitled Snippet")
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

	const extensions = useMemo(() => [css(), customSearchTheme], [])

	return (
		<div className="flex shrink-0 h-full relative">
			<div className="w-px h-full bg-border shrink-0 z-20" />
			<motion.div
				initial={{ opacity: 0, width: 0 }}
				animate={{ opacity: 1, width: width }}
				exit={{ opacity: 0, width: 0 }}
				transition={structuralSpring}
				className="h-full overflow-hidden flex flex-col bg-card contain-strict"
			>
				<div style={{ width }} className="h-full flex flex-col select-text overflow-hidden">
					<div
						className="h-10 shrink-0 border-b border-border flex items-center justify-between px-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground bg-muted/40 cursor-grab active:cursor-grabbing select-none"
						onPointerDown={(e) => dragControls.start(e)}
					>
						{isModalOpen ? (
							<div className="flex-1 mr-2 flex items-center" onPointerDown={(e) => e.stopPropagation()}>
								<input
									type="text"
									disabled={!!modalSnippet?.isDefault}
									value={modalTitle}
									onChange={(e) => setModalTitle(e.target.value)}
									className="bg-transparent border-0 text-xs font-medium text-foreground focus:outline-none focus:ring-0 flex-1 disabled:opacity-60 font-sans placeholder-muted-foreground/40 p-0 normal-case tracking-normal"
									placeholder="Snippet Designation"
								/>
							</div>
						) : (
							<span>Library</span>
						)}
						<div className="flex items-center gap-1.5" onPointerDown={(e) => e.stopPropagation()}>
							{!isModalOpen && (
								<Button
									variant="ghost"
									size="icon"
									className={`size-6 rounded-md border transition-all ${showDefaults
											? 'border-accent bg-accent text-accent-foreground hover:bg-accent/80'
											: 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
										}`}
									onClick={() => setShowDefaults(!showDefaults)}
									title={showDefaults ? "Hide System Snippets" : "Show System Snippets"}
									aria-label="Toggle defaults"
								>
									<Database className="size-3.5" />
								</Button>
							)}

							{isModalOpen ? (
								<Button
									variant="ghost"
									size="icon"
									className="size-6 rounded-md border border-border bg-muted/30 text-muted-foreground hover:text-foreground"
									onClick={() => setIsModalOpen(false)}
									title="Close editor"
									aria-label="Close editor"
								>
									<X className="size-3.5" />
								</Button>
							) : (
								<Button
									variant="ghost"
									size="icon"
									className="size-6 rounded-md border border-border bg-muted/30 text-muted-foreground hover:text-foreground"
									onClick={() => openEditorModal()}
									title="Create custom snippet"
									aria-label="Create snippet"
								>
									<Plus className="size-3.5" />
								</Button>
							)}
						</div>
					</div>

					<div
						ref={scrollContainerRef}
						className="flex-1 bg-background/40 overflow-y-auto min-h-0 relative p-2"
					>
						{isModalOpen ? (
							<div className="flex flex-col gap-3 h-full justify-between pb-1">
								<div className="flex flex-col gap-3 flex-1 overflow-hidden border border-border rounded-lg bg-background/50 focus-within:ring-1 focus-within:ring-ring">
									<CodeMirror
										value={modalCode}
										readOnly={!!modalSnippet?.isDefault}
										onChange={(value) => setModalCode(value)}
										theme={studioTheme}
										extensions={extensions}
										basicSetup={{
											lineNumbers: false,
											foldGutter: false,
											highlightActiveLine: false,
											highlightActiveLineGutter: false,
											dropCursor: true,
											allowMultipleSelections: false,
											indentOnInput: true,
										}}
										className="w-full h-full text-[11px] font-mono"
										placeholder="Type or paste CSS styling block rules..."
									/>
								</div>

								<div className="flex items-center justify-end gap-1.5 shrink-0">
									<Button
										variant="ghost"
										className="h-6.5 text-[10px] px-3 font-medium bg-muted/40 hover:bg-muted border border-border text-muted-foreground hover:text-foreground"
										onClick={() => setIsModalOpen(false)}
									>
										Cancel
									</Button>
									{!modalSnippet?.isDefault && (
										<Button
											className="h-6.5 text-[10px] px-3 font-medium bg-primary hover:bg-primary/90 text-primary-foreground gap-1 shadow-sm transition-colors"
											onClick={handleSaveModal}
										>
											<Save className="size-3" /> Save Snippet
										</Button>
									)}
								</div>
							</div>
						) : isLoading ? (
							<div className="text-[11px] font-mono p-6 text-muted-foreground/60 italic text-center">
								Syncing snippets ..
							</div>
						) : visibleSnippets.length === 0 ? (
							<div className="text-[11px] font-mono p-6 text-muted-foreground/60 italic text-center">
								Click the + button to start adding new snippets.
							</div>
						) : (
							<div
								style={{
									height: `${rowVirtualizer.getTotalSize()}px`,
									width: '100%',
									position: 'relative',
								}}
							>
								{rowVirtualizer.getVirtualItems().map((virtualItem) => {
									const snippet = visibleSnippets[virtualItem.index];
									if (!snippet) return null;

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
												paddingBottom: '6px'
											}}
										>
											<SnippetRow
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
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	)
}