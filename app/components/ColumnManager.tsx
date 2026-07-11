import { useState, useMemo, memo } from "react"
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
	type DragStartEvent,
	type DragOverEvent
} from "@dnd-kit/core"
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
	arrayMove
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Search } from "lucide-react"

import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group"
import { Card, CardContent } from "@/components/ui/card"
import { useColumnStore, type ColumnLayoutState } from "@/store/useColumnStore"

interface ColumnManagerProps {
	columns: ColumnLayoutState
	setColumns: (columns: ColumnLayoutState | ((prev: ColumnLayoutState) => ColumnLayoutState)) => void
}

const DroppableColumn = memo(function DroppableColumn({ id, items }: { id: keyof ColumnLayoutState; items: string[] }) {
	const { setNodeRef } = useDroppable({ id })
	const [search, setSearch] = useState("")

	const filteredItems = useMemo(() =>
		id === "panels"
			? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
			: items,
		[items, search, id]
	)

	const columnLabels: Record<keyof ColumnLayoutState, string> = {
		panels: "Panels",
		column1: "Column 1",
		column2: "Column 2",
		column3: "Column 3"
	}

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
	)
})

const SortableItem = memo(function SortableItem({ id }: { id: string }) {
	const { attributes, listeners, setNodeRef, transform } = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: "none"
	}

	const excluded = ["avatar_menu", "media_panel"]
	const displayId = (excluded.includes(id) || id.startsWith("#id_")) ? id : `#id_${id}`

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className="group flex items-center gap-2 px-2 py-2 hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing touch-none w-full font-mono text-[11px] rounded-md"
		>
			<div className="opacity-40 pointer-events-none shrink-0 text-muted-foreground group-hover:text-accent-foreground">
				<GripVertical className="size-3" />
			</div>
			<span className="truncate text-foreground group-hover:text-accent-foreground">{displayId}</span>
		</div>
	)
})

export default function ColumnManager({ columns, setColumns }: ColumnManagerProps) {
	const [activeId, setActiveId] = useState<string | null>(null)

	const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
	const keyboardSensor = useSensor(KeyboardSensor)
	const sensors = useSensors(pointerSensor, keyboardSensor)

	const findContainer = (id: string, targetState: ColumnLayoutState) => {
		if (id in targetState) return id as keyof ColumnLayoutState
		return (Object.keys(targetState) as (keyof ColumnLayoutState)[]).find(k => targetState[k].includes(id))
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string)
	}

	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event
		if (!over) return

		const overId = over.id as string
		const activeContainer = findContainer(active.id as string, columns)
		const overContainer = findContainer(overId, columns)

		if (!activeContainer || !overContainer || activeContainer === overContainer) return

		setColumns((prev) => {
			const activeItems = prev[activeContainer]
			const overItems = prev[overContainer]
			const activeIndex = activeItems.indexOf(active.id as string)
			const overIndex = overItems.indexOf(overId)

			let newIndex
			if (overId in prev) {
				newIndex = overItems.length
			} else {
				newIndex = overIndex >= 0 ? overIndex : overItems.length
			}

			return {
				...prev,
				[activeContainer]: activeItems.filter((i) => i !== active.id),
				[overContainer]: [
					...overItems.slice(0, newIndex),
					active.id as string,
					...overItems.slice(newIndex)
				]
			}
		})
	}

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event

		if (!over) {
			setActiveId(null)
			return
		}

		const activeId = active.id as string
		const overId = over.id as string

		const activeContainer = findContainer(activeId, columns)
		const overContainer = findContainer(overId, columns)

		if (activeContainer && overContainer && activeContainer === overContainer) {
			const oldIndex = columns[activeContainer].indexOf(activeId)
			const newIndex = columns[overContainer].indexOf(overId)

			if (oldIndex !== newIndex) {
				setColumns((prev) => ({
					...prev,
					[overContainer]: arrayMove(prev[overContainer], oldIndex, newIndex)
				}))
			}
		}

		setActiveId(null)
	}

	const columnEntries = useMemo(() => Object.entries(columns) as [keyof ColumnLayoutState, string[]][], [columns])

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
		>
			<div className="flex flex-col gap-4 p-3">
				{columnEntries.map(([id, items]) => (
					<DroppableColumn key={id} id={id} items={items} />
				))}
			</div>

			<DragOverlay dropAnimation={null}>
				{activeId ? (
					<div className="flex items-center gap-2 px-2 py-2 bg-accent text-accent-foreground cursor-grabbing opacity-90 w-full font-mono text-[11px] rounded-md border border-border/40">
						<GripVertical className="size-3 opacity-60 shrink-0" />
						<span className="truncate">
							{(["avatar_menu", "media_panel"].includes(activeId) || activeId.startsWith("#id_")) ? activeId : `#id_${activeId}`}
						</span>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}