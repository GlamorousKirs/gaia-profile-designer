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
import { GripVertical } from "lucide-react"

export interface ColumnState {
  panels: string[]
  column1: string[]
  column2: string[]
  column3: string[]
}

interface ColumnManagerProps {
  columns: ColumnState
  setColumns: React.Dispatch<React.SetStateAction<ColumnState>>
}

const DroppableColumn = memo(function DroppableColumn({ id, items }: { id: keyof ColumnState; items: string[] }) {
  const { setNodeRef } = useDroppable({ id })

  const columnLabels: Record<keyof ColumnState, string> = {
    panels: "Panels",
    column1: "Column 1",
    column2: "Column 2",
    column3: "Column 3"
  }

  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-[9px] font-bold uppercase text-muted-foreground px-1 tracking-wider">
        {columnLabels[id]}
      </h3>
      <div
        ref={setNodeRef}
        className="bg-card border border-border rounded-lg shadow-sm p-1.5 min-h-12"
      >
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
          <div className="divide-y divide-border/60">
            {items.map((item) => <SortableItem key={item} id={item} />)}
          </div>
        </SortableContext>
      </div>
    </div>
  )
})

const SortableItem = memo(function SortableItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 px-2.5 py-2.5 hover:bg-accent hover:text-accent-foreground cursor-grab active:cursor-grabbing touch-none w-full font-mono text-[11px] rounded-md"
    >
      <div className="opacity-40 pointer-events-none shrink-0">
        <GripVertical className="size-3" />
      </div>
      <span className="truncate text-foreground group-hover:text-accent-foreground">{id}</span>
    </div>
  )
})

export default function ColumnManager({ columns, setColumns }: ColumnManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, keyboardSensor)

  const findContainer = (id: string, targetState: ColumnState) => {
    return (Object.keys(targetState) as (keyof ColumnState)[]).find(k => targetState[k].includes(id))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = over.id as string
    const activeContainer = findContainer(active.id as string, columns)

    // Check if the over target is an explicitly registered DroppableContainer object rather than an item string string matches
    const isContainer = over.data.current?.type === "container" || (overId in columns && !findContainer(overId, columns))
    const overContainer = isContainer ? (overId as keyof ColumnState) : findContainer(overId, columns)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setColumns((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const activeIndex = activeItems.indexOf(active.id as string)
      const overIndex = overItems.indexOf(overId)

      let newIndex
      if (isContainer) {
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
    const isContainer = over.data.current?.type === "container" || (overId in columns && !findContainer(overId, columns))
    const overContainer = isContainer ? (overId as keyof ColumnState) : findContainer(overId, columns)

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const oldIndex = columns[activeContainer].indexOf(activeId)
      const newIndex = columns[overContainer].indexOf(overId)

      if (oldIndex !== newIndex && !isContainer) {
        setColumns((prev) => ({
          ...prev,
          [overContainer]: arrayMove(prev[overContainer], oldIndex, newIndex)
        }))
      }
    }

    setActiveId(null)
  }

  const columnEntries = useMemo(() => Object.entries(columns) as [keyof ColumnState, string[]][], [columns])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto min-h-0">
        {columnEntries.map(([id, items]) => (
          <DroppableColumn key={id} id={id} items={items} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="flex items-center gap-2 px-2.5 py-2.5 bg-accent text-accent-foreground cursor-grabbing opacity-90 w-full font-mono text-[11px] rounded-md shadow-md border border-border/40">
            <GripVertical className="size-3 opacity-60 shrink-0" />
            <span className="truncate">{activeId}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}