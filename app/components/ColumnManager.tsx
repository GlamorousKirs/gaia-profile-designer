import { useState, useMemo, memo } from "react";
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
	type DragOverEvent
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search } from "lucide-react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useColumnStore, type ColumnLayoutState } from "@/store/useColumnStore";
import { useCustomPanelStore } from "@/store/useCustomPanelStore";
import { CreatePanelDialog } from "@/components/CreatePanelDialog";

const GAIA_ASSETS = ["about", "badges", "comments", "contact", "details", "equipment", "footprints", "forum", "friends", "gifts", "interests", "journal", "media", "signature", "store", "wishlist"];

const DroppableColumn = memo(function DroppableColumn({ id, items }: { id: string; items: string[] }) {
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
		<Card>
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

			<CardContent ref={setNodeRef} className="min-h-12 px-0">
				<SortableContext id={id} items={filteredItems} strategy={verticalListSortingStrategy}>
					<div className="divide-y divide-border/60">
						{filteredItems.map((item) => <SortableItem key={item} id={item} />)}
					</div>
				</SortableContext>
			</CardContent>
		</Card>
	);
});

const SortableItem = memo(function SortableItem({ id }: { id: string }) {
	const { attributes, listeners, setNodeRef, transform } = useSortable({ id });
	const style = { transform: CSS.Transform.toString(transform), transition: "none" };
	const displayId = (id.startsWith("#id_") || id.startsWith("custom_")) ? id : `#id_${id}`;

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing touch-none w-full font-mono text-[11px] rounded-md">
			<div className="opacity-40 pointer-events-none shrink-0 text-muted-foreground group-hover:text-accent-foreground"><GripVertical className="size-3" /></div>
			<span className="truncate text-foreground group-hover:text-accent-foreground">{displayId}</span>
		</div>
	);
});

export default function ColumnManager() {
	const { columns, setColumns } = useColumnStore();
	const customPanels = useCustomPanelStore((state) => state.panels);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const addPanel = useCustomPanelStore((state) => state.addPanel);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor));

	const viewColumns = useMemo(() => {
		const assigned = [...columns.column1, ...columns.column2, ...columns.column3];
		const available = [...GAIA_ASSETS, ...Object.keys(customPanels)].filter(id => !assigned.includes(id));
		return { panels: available, ...columns };
	}, [columns, customPanels]);

	const findContainer = (id: string) => {
		if (id in viewColumns) return id as keyof typeof viewColumns;
		const container = (Object.keys(viewColumns) as Array<keyof typeof viewColumns>).find(
			(k) => (viewColumns[k] as string[]).includes(id)
		);
		return container;
	};

const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) return;
		const activeId = active.id as string;
		const overId = over.id as string;
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(overId);

		// Only handle drags between the defined columns
		if (!activeContainer || !overContainer || activeContainer === overContainer || activeContainer === 'panels') return;

		setColumns((prev) => {
			const activeItems = prev[activeContainer as keyof ColumnLayoutState] || [];
			const overItems = prev[overContainer as keyof ColumnLayoutState] || [];
			const overIndex = overItems.indexOf(overId);
			const newIndex = overIndex >= 0 ? overIndex : overItems.length;

			return {
				...prev,
				[activeContainer]: activeItems.filter((i) => i !== activeId),
				[overContainer]: [...overItems.slice(0, newIndex), activeId, ...overItems.slice(newIndex)]
			};
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over) return;
		const activeId = active.id as string;
		const overId = over.id as string;
		const activeContainer = findContainer(activeId);
		const overContainer = findContainer(overId);

		if (!activeContainer || !overContainer) return;

		// Handle moving into a column from the panels list
		if (activeContainer === 'panels' && overContainer !== 'panels') {
			setColumns((prev) => ({
				...prev,
				[overContainer]: [...(prev[overContainer as keyof ColumnLayoutState] || []), activeId]
			}));
		} 
		// Handle reordering within a column
		else if (activeContainer === overContainer && activeContainer !== 'panels') {
			const items = (prevColumns as any)[activeContainer];
			const oldIndex = items.indexOf(activeId);
			const newIndex = items.indexOf(overId);
			if (oldIndex !== newIndex) {
				setColumns((prev) => ({
					...prev,
					[overContainer]: arrayMove(prev[overContainer as keyof ColumnLayoutState], oldIndex, newIndex)
				}));
			}
		}
		setActiveId(null);
	};

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
			<div className="flex flex-col gap-4 p-3">
				{(Object.entries(viewColumns) as [string, string[]][]).map(([id, items]) => (
					<DroppableColumn key={id} id={id} items={items} />
				))}
				<div className="p-1">
					<Button onClick={() => setIsDialogOpen(true)} className="w-full text-[11px] h-8" variant="outline">Create Custom Panel</Button>
				</div>
			</div>
			<CreatePanelDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onConfirm={(d) => addPanel(d.id || `custom_${Date.now()}`, { name: d.name, content: d.content })} />
			<DragOverlay dropAnimation={null}>
				{activeId ? (
					<div className="flex items-center gap-2 px-2 py-2 bg-accent text-accent-foreground cursor-grabbing opacity-90 w-full font-mono text-[11px] rounded-md border border-border/40">
						<GripVertical className="size-3 opacity-60 shrink-0" />
						<span className="truncate">{activeId}</span>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}