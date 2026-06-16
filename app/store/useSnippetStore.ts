import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Snippet {
  id: string
  title: string
  code: string
  isDefault?: boolean
}

export type SnippetActionType = 'append-cursor' | 'prepend' | 'append' | 'replace'

interface SnippetStore {
  snippets: Snippet[]
  showDefaults: boolean
  setShowDefaults: (show: boolean) => void
  addSnippet: (title: string, code: string) => void
  updateSnippet: (id: string, code: string) => void
  renameSnippet: (id: string, title: string) => void
  deleteSnippet: (id: string) => void
}

const rawDefaultFiles = import.meta.glob('/app/default-snippets/*.txt', {
  eager: true,
  query: '?raw',
})

// Build defaults only once outside runtime evaluations
const DYNAMIC_SYSTEM_DEFAULTS: Snippet[] = Object.entries(rawDefaultFiles).map(
  ([filePath, module]) => {
    const fileNameWithExtension = filePath.split('/').pop() || ''
    const rawName = fileNameWithExtension.replace('.txt', '')
    const formattedTitle = rawName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    return {
      id: `default-${rawName}`,
      title: formattedTitle,
      code: (module as any).default || '',
      isDefault: true,
    }
  }
)

export const useSnippetStore = create<SnippetStore>()(
  persist(
    (set) => ({
      snippets: [],
      showDefaults: true,
      setShowDefaults: (show) => set({ showDefaults: show }),
      addSnippet: (title, code) =>
        set((state) => ({
          snippets: [
            ...state.snippets,
            { id: crypto.randomUUID(), title, code, isDefault: false },
          ],
        })),
      updateSnippet: (id, code) =>
        set((state) => ({
          snippets: state.snippets.map((s) => (s.id === id ? { ...s, code } : s)),
        })),
      renameSnippet: (id, title) =>
        set((state) => ({
          snippets: state.snippets.map((s) => (s.id === id ? { ...s, title } : s)),
        })),
      deleteSnippet: (id) =>
        set((state) => ({
          snippets: state.snippets.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'gaia-snippets-storage',
      partialize: (state) => ({
        snippets: state.snippets.filter((s) => !s.isDefault),
      }),
    }
  )
)

// Optimized: This will now properly read atomic slices avoiding trash reference rendering
export const useFilteredSnippets = () => {
  const snippets = useSnippetStore((state) => state.snippets)
  const showDefaults = useSnippetStore((state) => state.showDefaults)

  return useMemo(() => {
    return showDefaults ? [...DYNAMIC_SYSTEM_DEFAULTS, ...snippets] : snippets
  }, [showDefaults, snippets])
}