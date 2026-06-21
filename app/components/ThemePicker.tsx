import { memo, useState, useRef, useTransition, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { THEMES } from "@/data/theme-swatches-data"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

interface ThemeItemProps {
  id: string
  name: string
  primary: string
  bg: string
  isSelected: boolean
  onSelect: (id: string, e: React.MouseEvent) => void
}

const ThemePickerItem = memo(({
  id,
  name,
  primary,
  bg,
  isSelected,
  onSelect
}: ThemeItemProps) => (
  <DropdownMenuItem
    onClick={(e) => onSelect(id, e)}
    className={`flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-xl cursor-pointer transition-colors outline-none ${isSelected
      ? "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary font-bold"
      : "text-foreground hover:bg-surface/60 focus:bg-surface/60"
      }`}
  >
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/40 overflow-hidden"
        style={{ '--item-bg': bg } as React.CSSProperties}
      >
        <div className="absolute inset-0 bg-(--item-bg)" />
        <div
          className="absolute right-0 top-0 h-full w-1/2 rotate-12 translate-x-0.5"
          style={{ '--item-primary': primary } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-(--item-primary)" />
        </div>
      </div>
      <span className="truncate">{name}</span>
    </div>

    {isSelected && <Check size={14} className="text-primary shrink-0 ml-2" />}
  </DropdownMenuItem>
))
ThemePickerItem.displayName = "ThemePickerItem"

export const ThemePicker = memo(() => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [open, setOpen] = useState(false)
  const proxyRef = useRef<HTMLDivElement>(null)
  const pendingThemeRef = useRef<string | null>(null)

  const sortedThemes = useMemo(() => {
    return [...THEMES].sort((a, b) => {
      if (a.id === "light") return -1;
      if (b.id === "light") return 1;
      if (a.id === "dark") return -1;
      if (b.id === "dark") return 1;
      return 0;
    });
  }, []);

  useEffect(() => {
    if (!coords || !pendingThemeRef.current) return

    const toggleBtn = proxyRef.current?.querySelector("button")
    if (toggleBtn) {
      toggleBtn.click()
    }

    const targetTheme = pendingThemeRef.current
    pendingThemeRef.current = null

    let rafId1: number
    let rafId2: number

    rafId1 = requestAnimationFrame(() => {
      rafId2 = requestAnimationFrame(() => {
        startTransition(() => {
          setTheme(targetTheme)
        })
        setCoords(null)
      })
    })

    return () => {
      cancelAnimationFrame(rafId1)
      cancelAnimationFrame(rafId2)
    }
  }, [coords, setTheme])

  const handleThemeChange = (id: string, e?: React.MouseEvent) => {
    setOpen(false)

    if (e) {
      pendingThemeRef.current = id
      setCoords({
        top: e.clientY,
        left: e.clientX
      })
    } else {
      startTransition(() => {
        setTheme(id)
      })
    }
  }

  const currentMode = resolvedTheme === "dark" ? "dark" : "light"

  return (
    <div className="relative flex items-center">
      {coords && (
        <div
          ref={proxyRef}
          className="fixed pointer-events-none z-50 opacity-0 will-change-transform"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translate3d(-50%, -50%, 0)'
          }}
        >
          <AnimatedThemeToggler
            theme={currentMode}
            onThemeChange={() => { }}
          />
        </div>
      )}

      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        { }
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="group h-7 w-7 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shrink-0"
              aria-label="Select color theme"
              disabled={isPending}
            />
          }
        >
          <Palette size={15} className="text-foreground transition-transform group-hover:scale-110" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-56 rounded-2xl border border-border bg-background/95 backdrop-blur-xl p-1 will-change-transform"
        >
          <ScrollArea className="h-72 w-full pr-1">
            <div className="flex flex-col gap-0.5 p-1">
              {sortedThemes.map((t) => (
                <ThemePickerItem
                  key={t.id}
                  {...t}
                  isSelected={theme === t.id || resolvedTheme === t.id}
                  onSelect={handleThemeChange}
                />
              ))}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})

ThemePicker.displayName = "ThemePicker"