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
  library: string[]
  col1: string[]
  col2: string[]
  col3: string[]
}

interface ColumnManagerProps {
  columns: ColumnState
  setColumns: React.Dispatch<React.SetStateAction<ColumnState>>
}

// 1. Memoize the Column to prevent unnecessary re-renders
const DroppableColumn = memo(function DroppableColumn({ id, items }: { id: keyof ColumnState, items: string[] }) {
  const { setNodeRef } = useDroppable({ id })
  
  return (
    <div className="flex flex-col">
      <h3 className="text-[9px] font-bold uppercase text-muted-foreground mb-2 px-1 tracking-wider">{id}</h3>
      <div
        ref={setNodeRef}
        className="border border-border/50 rounded-md p-2 bg-muted/10 min-h-15 transition-colors hover:bg-muted/20"
      >
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {items.map((item) => <SortableItem key={item} id={item} />)}
          </div>
        </SortableContext>
      </div>
    </div>
  )
})

// 2. Memoize individual items. This stops un-shifted items from wasting CPU cycles.
const SortableItem = memo(function SortableItem({ id }: { id: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  
  // Using transform instead of translate speeds up painting via GPU acceleration
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
      className="flex items-center gap-2 p-1.5 bg-card border border-border rounded shadow-sm text-xs cursor-grab active:cursor-grabbing hover:border-primary/50 touch-none w-full"
    >
      <div className="opacity-50 pointer-events-none">
        <GripVertical className="size-3" />
      </div>
      <span className="truncate">{id}</span>
    </div>
  )
})

export default function ColumnManager({ columns, setColumns }: ColumnManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Keep sensors stable
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const findContainer = (id: string) => {
    return (Object.keys(columns) as (keyof ColumnState)[]).find(k => columns[k].includes(id))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // OPTIMIZATION: Debounce or safeguard your Over state. Only change state if 
  // container boundaries are actually crossed to minimize layout thrashing.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const overId = over.id as string
    const activeContainer = findContainer(active.id as string)
    const overContainer = findContainer(overId) || (overId as keyof ColumnState)

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setColumns((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer as keyof ColumnState]
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

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId) || (overId as keyof ColumnState)

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

  // Prevent parent map from parsing keys on every single mini-interaction
  const columnEntries = useMemo(() => Object.entries(columns) as [keyof ColumnState, string[]][], [columns])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto">
        {columnEntries.map(([id, items]) => (
          <DroppableColumn key={id} id={id} items={items} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="flex items-center gap-2 p-1.5 bg-card border border-primary shadow-xl rounded text-xs cursor-grabbing opacity-90 w-full raw-overlay">
            <GripVertical className="size-3 opacity-50" />
            <span className="truncate">{activeId}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}