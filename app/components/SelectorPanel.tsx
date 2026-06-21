import { useState } from "react"
import { Search, Plus } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Card, CardContent } from "@/components/ui/card"

import gaiaSelectors from "@/data/gaia-selectors.json"

const DYNAMIC_PSEUDOS = [
  "::before",
  "::after",
  ":hover",
  ":focus",
  ":active",
]

interface SelectorPanelProps {
  onSelectSelector: (selector: string) => void
}

export default function SelectorPanel({ onSelectSelector }: SelectorPanelProps) {
  const [search, setSearch] = useState("")

  const filteredSelectors = gaiaSelectors.filter((selector) =>
    selector.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-background p-3 gap-3 overflow-hidden">
      {/* Search Bar matching ColumnManager layout without container */}
      <InputGroup className="w-full shrink-0">
        <InputGroupInput
          id="selector-search"
          type="search"
          aria-label="Search CSS selectors"
          placeholder="Search selectors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-[11px] py-1"
        />
        <InputGroupAddon>
          <Search className="size-3 text-muted-foreground" aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>

      {/* Selectors List wrapped with unstylized Card element */}
      <Card>
        <CardContent className="h-full overflow-y-auto px-0 py-0">
          <div className="divide-y divide-border/60">
            {filteredSelectors.length > 0 ? (
              filteredSelectors.map((selector) => (
                <ContextMenu key={selector}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => onSelectSelector(selector)}
                      className="w-full text-left px-2.5 py-2.5 hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none group flex items-center justify-between gap-2 font-mono text-[11px] rounded-md first:rounded-t-md last:rounded-b-md transition-colors"
                    >
                      <span className="truncate text-foreground group-hover:text-accent-foreground">
                        {selector}
                      </span>
                      <span className="text-[9px] shrink-0 font-sans opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60 transition-opacity">
                        + Add
                      </span>
                    </button>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-48 text-[11px] font-sans">
                    {DYNAMIC_PSEUDOS.map((pseudo) => (
                      <ContextMenuItem
                        key={pseudo}
                        onClick={() => onSelectSelector(`${selector}${pseudo}`)}
                        className="flex items-center justify-between gap-2 cursor-pointer py-2 px-2.5"
                      >
                        <span>
                          <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{pseudo}</code>
                        </span>
                        <Plus className="h-3 w-3 opacity-60" aria-hidden="true" />
                      </ContextMenuItem>
                    ))}
                  </ContextMenuContent>
                </ContextMenu>
              ))
            ) : (
              <div className="text-center py-8 text-[11px] text-muted-foreground border-none" role="status">
                No selectors match.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}