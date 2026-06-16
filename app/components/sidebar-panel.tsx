import { memo } from "react"
import { Button } from "~/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export interface SidebarTab<T extends string> {
  id: T
  icon: LucideIcon
  label: string
}

interface SidebarPanelProps<T extends string> {
  side: "left" | "right"
  isOpen: boolean
  onToggleOpen: (openState: boolean) => void
  activeTab: T
  onTabChange: (tab: T) => void
  tabs: SidebarTab<T>[]
  children: ReactNode
}

export function SidebarPanel<T extends string>({
  side,
  isOpen,
  onToggleOpen,
  activeTab,
  onTabChange,
  tabs,
  children,
}: SidebarPanelProps<T>) {
  const isLeft = side === "left"

  const handleTabClick = (tabId: T) => {
    if (activeTab === tabId && isOpen) {
      onToggleOpen(false)
    } else {
      onTabChange(tabId)
      onToggleOpen(true)
    }
  }

  const ToggleChevron = isLeft
    ? isOpen ? ChevronLeft : ChevronRight
    : isOpen ? ChevronRight : ChevronLeft

  const controlActionRail = (
    <div className={`flex flex-col items-center justify-between w-12 py-3 bg-muted/30 select-none ${isLeft ? "border-r" : "border-l"}`}>
      <div className="flex flex-col gap-2 items-center w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id && isOpen
          return (
            <Button
              key={tab.id}
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className="size-8 rounded-md transition-none will-change-transform"
              onClick={() => handleTabClick(tab.id)}
              aria-label={tab.label}
            >
              <Icon className="size-4" />
            </Button>
          )
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground transition-none will-change-transform"
        onClick={() => onToggleOpen(!isOpen)}
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${side} Panel`}
      >
        <ToggleChevron className="size-3.5" />
      </Button>
    </div>
  )

  return (
    <div className="flex h-full z-10 bg-card overflow-hidden select-none">
      {isLeft && controlActionRail}

      <div
        className={`h-full bg-card overflow-hidden relative flex shrink-0 transition-[width] ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-[width] ${isOpen ? "w-64 duration-220" : "w-0 duration-180"
          } ${isLeft ? "border-r" : "border-l"}`}
      >
        {                                                             }
        <div className="w-64 h-full absolute top-0 left-0 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>

      {!isLeft && controlActionRail}
    </div>
  )
}

export const MemoizedSidebarPanel = memo(SidebarPanel) as typeof SidebarPanel