import { useEffect } from "react"

export function useDockControls(
  onToggleDock: () => void,
  onToggleCode: () => void,
  onToggleMaximize: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (key === 'd') {
        onToggleDock()
      } else if (key === 'c') {
        onToggleCode()
      } else if (key === 'f') {
        onToggleMaximize()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleDock, onToggleCode, onToggleMaximize])
}