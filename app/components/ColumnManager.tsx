import { useState, useMemo, memo, useCallback, useEffect } from "react";
import {
	DndContext,
	closestCenter,
	useSensor,
	useSensors,
	PointerSensor,
	KeyboardSensor,
	useDroppable,
	DragOverlay,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useColumnStore, type ColumnLayoutState } from "@/store/useColumnStore";
import { useCustomPanelStore } from "@/store/useCustomPanelStore";
import { CreatePanelDialog } from "~/components/CreatePanelDialog";
import { CreateMediaPanelDialog } from "@/components/CreateMediaPanelDialog";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";

const GAIA_ASSETS = Object.keys(import.meta.glob("/app/gaia_assets/panels/*.html")).map((path) =>
	path.split("/").pop()!.replace(".html", "")
);

const DroppableColumn = memo(function DroppableColumn({ id, items, onRemove, onEdit }: { id: string; items: string[]; onRemove: (id: string) => void; onEdit: (id: string) => void }) {
	const { setNodeRef } = useDroppable({ id });
	const [search, setSearch] = useState("");

	const filteredItems = useMemo(() =>
		id === "panels"
			? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
			: items,
		[items, search, id]
	);

	const columnLabels: Record<string, string> = {
		panels: "Panels",
		column1: "Column 1",
		column2: "Column 2",
		column3: "Column 3"
	};

	return (
		<Card className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-1.5 shrink-0 px-1">
				<h3 className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">
					{columnLabels[id]}
				</h3>
			</div>

			{id === "panels" && (
				<div className="mb-2 shrink-0">
					<InputGroup className="w-full">
						<InputGroupInput
							placeholder="Search panels..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="text-[11px] py-1"
						/>
						<InputGroupAddon>
							<Search className="size-3 text-muted-foreground" />
						</InputGroupAddon>
					</InputGroup>
				</div>
			)}

			<CardContent ref={setNodeRef} className="flex-1 px-0 min-h-25">
				<SortableContext id={id} items={filteredItems} strategy={verticalListSortingStrategy}>
					<div className="divide-y divide-border/60">
						{filteredItems.map((item) => <SortableItem key={item} id={item} onRemove={onRemove} onEdit={onEdit} />)}
					</div>
				</SortableContext>
			</CardContent>
		</Card>
	);
});

const SortableItem = memo(function SortableItem({ id, onRemove, onEdit }: { id: string; onRemove: (id: string) => void; onEdit: (id: string) => void }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
	const style = { transform: CSS.Transform.toString(transform), transition };

	const isCustom = useCustomPanelStore((state) => Object.keys(state.panels).includes(id));
	const displayId = id.startsWith("#id_") ? id : `#id_${id}`;

	const itemContent = (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="group flex items-center justify-between gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing touch-none w-full font-mono text-[11px] rounded-md"
		>
			<div className="flex items-center gap-2 truncate">
				<GripVertical className="size-3 opacity-40 shrink-0" />
				<span className="truncate">{displayId}</span>
			</div>
		</div>
	);

	if (!isCustom) return itemContent;

	return (
		<ContextMenu>
			<ContextMenuTrigger>{itemContent}</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onClick={() => onEdit(id)}>Edit</ContextMenuItem>
				<ContextMenuItem onClick={() => onRemove(id)} className="text-destructive focus:text-destructive">Remove</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});

const DragOverlayWrapper = memo(({ activeId }: { activeId: string | null }) => (
	<DragOverlay>
		{activeId ? (
			<div className="flex items-center gap-2 px-2 py-2 bg-accent cursor-grabbing w-full font-mono text-[11px] rounded-md border shadow-lg">
				<GripVertical className="size-3 opacity-60" />
				{activeId.startsWith("#id_") ? activeId : `#id_${activeId}`}
			</div>
		) : null}
	</DragOverlay>
));

export default function ColumnManager() {
	const { columns, setColumns } = useColumnStore();
	const customPanels = useCustomPanelStore((state) => state.panels);
	const loadPanels = useCustomPanelStore((state) => state.loadPanels);
	const addPanel = useCustomPanelStore((state) => state.addPanel);
	const removePanel = useCustomPanelStore((state) => state.removePanel);
	const updatePanel = useCustomPanelStore((state) => state.updatePanel);
	const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const handleRemovePanel = useCallback((id: string) => {
		removePanel(id);
		setColumns((prev: ColumnLayoutState) => ({
			column1: prev.column1.filter((i: string) => i !== id),
			column2: prev.column2.filter((i: string) => i !== id),
			column3: prev.column3.filter((i: string) => i !== id),
		}));
	}, [removePanel, setColumns]);

	const handleEditPanel = useCallback((id: string) => {
		setEditingId(id);
		if (id.startsWith("#id_media_")) setIsMediaDrawerOpen(true);
		else setIsDrawerOpen(true);
	}, []);

	const handleCreateClick = useCallback(() => {
		setEditingId(null);
		setIsDrawerOpen(true);
	}, []);

	useEffect(() => { loadPanels(); }, [loadPanels]);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor)
	);

	const viewColumns = useMemo(() => {
		const assigned = [...columns.column1, ...columns.column2, ...columns.column3];
		const available = [...GAIA_ASSETS, ...Object.keys(customPanels)].filter(id => !assigned.includes(id));
		return { panels: available, ...columns };
	}, [columns, customPanels]);

	const findContainer = useCallback((id: string) => {
		if (id in viewColumns) return id;
		return Object.keys(viewColumns).find((key) => viewColumns[key as keyof typeof viewColumns].includes(id));
	}, [viewColumns]);

	const handleDragStart = useCallback((event: DragStartEvent) => setActiveId(event.active.id as string), []);

	const handleDragOver = useCallback((event: DragOverEvent) => {
		const { active, over } = event;
		const activeId = active.id as string;
		const overId = over?.id as string;
		if (!overId || activeId === overId) return;
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(overId);
		if (!activeContainer || !overContainer || activeContainer === overContainer) return;
		setColumns((prev) => {
			const activeItems = prev[activeContainer as keyof ColumnLayoutState] || [];
			const overItems = prev[overContainer as keyof ColumnLayoutState] || [];
			if (activeContainer !== 'panels' && overContainer !== 'panels') {
				return { ...prev, [activeContainer]: activeItems.filter((i) => i !== activeId), [overContainer]: [...overItems, activeId] };
			}
			if (activeContainer !== 'panels' && overContainer === 'panels') {
				return { ...prev, [activeContainer]: activeItems.filter((i) => i !== activeId) };
			}
			if (activeContainer === 'panels' && overContainer !== 'panels') {
				return { ...prev, [overContainer]: [...overItems, activeId] };
			}
			return prev;
		});
	}, [findContainer, setColumns]);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) {
			setActiveId(null);
			return;
		}
		const activeId = active.id as string;
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(over.id as string);
		if (activeContainer && overContainer && activeContainer === overContainer && activeContainer !== 'panels') {
			const items = columns[activeContainer as keyof ColumnLayoutState];
			const oldIndex = items.indexOf(activeId);
			const newIndex = items.indexOf(over.id as string);
			if (oldIndex !== newIndex) {
				setColumns((prev) => ({ ...prev, [activeContainer]: arrayMove(items, oldIndex, newIndex) }));
			}
		}
		setActiveId(null);
	}, [columns, findContainer, setColumns]);

	const handleDrawerChange = useCallback((open: boolean) => {
		setIsDrawerOpen(open);
		if (!open) setEditingId(null);
	}, []);

	const handleMediaDrawerChange = useCallback((open: boolean) => {
		setIsMediaDrawerOpen(open);
		if (!open) setEditingId(null);
	}, []);

	const handlePanelConfirm = useCallback((d: any) => {
		const panelId = editingId === "about" ? "about" : d.id;
		if (editingId && editingId !== panelId) {
			removePanel(editingId);
			addPanel(panelId, { ...d, id: panelId });
			setColumns((prev: ColumnLayoutState) => {
				const updateCol = (col: string[]) => col.map(id => id === editingId ? panelId : id);
				return { column1: updateCol(prev.column1), column2: updateCol(prev.column2), column3: updateCol(prev.column3) };
			});
		} else if (editingId) {
			updatePanel(editingId, { ...d, id: panelId });
		} else if (d.id) {
			addPanel(panelId, { ...d, id: panelId });
		}
		setEditingId(null);
	}, [editingId, updatePanel, addPanel, removePanel, setColumns]);

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
			<div className="flex flex-col gap-4 p-3">
				<div className="flex gap-2">
					<Button onClick={handleCreateClick} variant="outline" className="flex-1 text-[11px] h-8">Create Custom</Button>
					<Button onClick={() => setIsMediaDrawerOpen(true)} variant="outline" className="flex-1 text-[11px] h-8">Create Media</Button>
				</div>
				{(Object.entries(viewColumns) as [string, string[]][]).map(([id, items]) => (
					<DroppableColumn key={id} id={id} items={items} onRemove={handleRemovePanel} onEdit={handleEditPanel} />
				))}
			</div>
			<CreatePanelDialog open={isDrawerOpen} onOpenChange={handleDrawerChange} defaultValues={editingId ? customPanels[editingId] : undefined} onConfirm={handlePanelConfirm} />
			<CreateMediaPanelDialog open={isMediaDrawerOpen} onOpenChange={handleMediaDrawerChange} defaultValues={editingId && editingId.startsWith("#id_media_") ? customPanels[editingId] : undefined} onConfirm={handlePanelConfirm} />
			<DragOverlayWrapper activeId={activeId} />
		</DndContext>
	);
}