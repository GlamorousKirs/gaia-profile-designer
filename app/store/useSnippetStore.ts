import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

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

const customIndexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string>(name)
    return value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export const useSnippetStore = create<SnippetStore>()(
  persist<SnippetStore>(
    (setActions) => ({
      snippets: [],
      showDefaults: true,
      setShowDefaults: (show) => setActions({ showDefaults: show }),
      addSnippet: (title, code) =>
        setActions((state) => ({
          snippets: [
            ...state.snippets,
            { id: crypto.randomUUID(), title, code, isDefault: false },
          ],
        })),
      updateSnippet: (id, code) =>
        setActions((state) => ({
          snippets: state.snippets.map((s) => (s.id === id ? { ...s, code } : s)),
        })),
      renameSnippet: (id, title) =>
        setActions((state) => ({
          snippets: state.snippets.map((s) => (s.id === id ? { ...s, title } : s)),
        })),
      deleteSnippet: (id) =>
        setActions((state) => ({
          snippets: state.snippets.filter((s) => s.id !== id),
        })),
    }),
    {
      name: 'gstudio-snippets-storage',
      storage: createJSONStorage(() => customIndexedDbStorage),
      partialize: (state) => ({
        snippets: state.snippets.filter((s) => !s.isDefault),
      }) as any,
    }
  )
)

export const useFilteredSnippets = () => {
  const snippets = useSnippetStore((state) => state.snippets)
  const showDefaults = useSnippetStore((state) => state.showDefaults)

  return useMemo(() => {
    return showDefaults ? [...DYNAMIC_SYSTEM_DEFAULTS, ...snippets] : snippets
  }, [showDefaults, snippets])
}