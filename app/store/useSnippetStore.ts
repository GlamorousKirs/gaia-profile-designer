import { useMemo } from 'react'
import { create } from 'zustand'
import { get, set, del, entries, createStore } from 'idb-keyval'

export interface Snippet {
  id: string
  title: string
  code: string
  isDefault?: boolean
}

interface SnippetStore {
  snippets: Record<string, Snippet>
  showDefaults: boolean
  isLoading: boolean

  initializeStore: () => Promise<void>
  setShowDefaults: (show: boolean) => void
  addSnippet: (title: string, code: string) => Promise<void>
  updateSnippet: (id: string, code: string) => Promise<void>
  renameSnippet: (id: string, title: string) => Promise<void>
  deleteSnippet: (id: string) => Promise<void>
}

const rawDefaultFiles = import.meta.glob('/app/default-snippets/*.txt', {
  eager: true,
  query: '?raw',
})
const DYNAMIC_SYSTEM_DEFAULTS: Snippet[] = Object.entries(rawDefaultFiles).map(([filePath, module]) => {
  const rawName = (filePath.split('/').pop() || '').replace('.txt', '')
  return {
    id: `default-${rawName}`,
    title: rawName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    code: (module as any).default || '',
    isDefault: true,
  }
})

const customDbStore = createStore('gaia-profile-designer', 'snippets')

const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 8)
}

export const useSnippetStore = create<SnippetStore>((setActions) => ({
  snippets: {},
  showDefaults: true,
  isLoading: true,

  initializeStore: async () => {
    try {
      const allEntries = await entries<string, Snippet>(customDbStore)
      const customSnippets: Record<string, Snippet> = {}

      for (const [key, value] of allEntries) {
        if (key.length === 6) {
          customSnippets[value.id] = value
        }
      }

      setActions({ snippets: customSnippets, isLoading: false })
    } catch (e) {
      console.error("Failed to load snippets", e)
      setActions({ isLoading: false })
    }
  },

  setShowDefaults: (show) => setActions({ showDefaults: show }),

  addSnippet: async (title, code) => {
    setActions((state) => {
      let id = generateShortId()
      while (state.snippets[id]) {
        id = generateShortId()
      }

      const newSnippet: Snippet = { id, title, code, isDefault: false }

      set(id, newSnippet, customDbStore)

      return {
        snippets: { ...state.snippets, [id]: newSnippet }
      }
    })
  },

  updateSnippet: async (id, code) => {
    setActions((state) => {
      const target = state.snippets[id]
      if (!target) return state

      const updated = { ...target, code }
      set(id, updated, customDbStore)

      return {
        snippets: { ...state.snippets, [id]: updated }
      }
    })
  },

  renameSnippet: async (id, title) => {
    setActions((state) => {
      const target = state.snippets[id]
      if (!target) return state

      const updated = { ...target, title }
      set(id, updated, customDbStore)

      return {
        snippets: { ...state.snippets, [id]: updated }
      }
    })
  },

  deleteSnippet: async (id) => {
    await del(id, customDbStore)

    setActions((state) => {
      const { [id]: _, ...remaining } = state.snippets
      return { snippets: remaining }
    })
  },
}))

export const useFilteredSnippets = () => {
  const snippets = useSnippetStore((state) => state.snippets)
  const showDefaults = useSnippetStore((state) => state.showDefaults)

  return useMemo(() => {
    const customSnippetsArray = Object.values(snippets)
    return showDefaults ? [...DYNAMIC_SYSTEM_DEFAULTS, ...customSnippetsArray] : customSnippetsArray
  }, [showDefaults, snippets])
}