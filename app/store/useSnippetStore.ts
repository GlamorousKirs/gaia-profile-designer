import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

export interface Snippet {
  id: string
  title: string
  code: string
  isDefault?: boolean
}

export type SnippetActionType = 'append-cursor' | 'prepend' | 'append' | 'replace'

interface SnippetStore {
  snippets: Snippet[]
  filteredSnippets: Snippet[]
  searchQuery: string
  showDefaults: boolean
  isProcessingSearch: boolean
  worker: Worker | null
  initializeWorker: () => void
  setSearchQuery: (query: string) => void
  setShowDefaults: (show: boolean) => void
  addSnippet: (title: string, code: string) => void
  updateSnippet: (id: string, code: string) => void
  renameSnippet: (id: string, title: string) => void
  deleteSnippet: (id: string) => void
}

// Native Asynchronous IndexedDB Layer Wrapper
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("gaia-snippets-db", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("store")
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction("store", "readonly")
        const req = tx.objectStore("store").get(name)
        req.onsuccess = () => resolve(req.result ? JSON.stringify(req.result) : null)
        req.onerror = () => resolve(null)
      }
      request.onerror = () => resolve(null)
    })
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("gaia-snippets-db", 1)
      request.onupgradeneeded = () => request.result.createObjectStore("store")
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction("store", "readwrite")
        tx.objectStore("store").put(JSON.parse(value), name)
        tx.oncomplete = () => resolve()
      }
    })
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open("gaia-snippets-db", 1)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction("store", "readwrite")
        tx.objectStore("store").delete(name)
        tx.oncomplete = () => resolve()
      }
    })
  },
}

const rawDefaultFiles = import.meta.glob('/app/default-snippets/*.txt', {
  eager: true,
  query: '?raw',
})

// Build system defaults once outside of core operational component scopes
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
    (set, get) => ({
      snippets: [],
      filteredSnippets: [],
      searchQuery: "",
      showDefaults: true,
      isProcessingSearch: false,
      worker: null,

      initializeWorker: () => {
        if (typeof window === "undefined" || get().worker) return

        // Note: Explicit path setup optimized to run within your repo namespace structure on GitHub Pages
        const worker = new Worker("/gaia-profile-designer/search-worker.js")

        worker.onmessage = (e: MessageEvent<Snippet[]>) => {
          set({ filteredSnippets: e.data, isProcessingSearch: false })
        }

        set({ worker })

        // Initial paint populate run
        worker.postMessage({
          snippets: get().snippets,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: get().showDefaults,
        })
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query, isProcessingSearch: true })
        get().worker?.postMessage({
          snippets: get().snippets,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query,
          showDefaults: get().showDefaults,
        })
      },

      setShowDefaults: (show) => {
        set({ showDefaults: show, isProcessingSearch: true })
        get().worker?.postMessage({
          snippets: get().snippets,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: show,
        })
      },

      addSnippet: (title, code) => {
        const newSnippet: Snippet = { id: crypto.randomUUID(), title, code, isDefault: false }
        const updated = [...get().snippets, newSnippet]
        set({ snippets: updated })
        get().worker?.postMessage({
          snippets: updated,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: get().showDefaults,
        })
      },

      updateSnippet: (id, code) => {
        const updated = get().snippets.map((s) => (s.id === id ? { ...s, code } : s))
        set({ snippets: updated })
        get().worker?.postMessage({
          snippets: updated,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: get().showDefaults,
        })
      },

      renameSnippet: (id, title) => {
        const updated = get().snippets.map((s) => (s.id === id ? { ...s, title } : s))
        set({ snippets: updated })
        get().worker?.postMessage({
          snippets: updated,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: get().showDefaults,
        })
      },

      deleteSnippet: (id) => {
        const updated = get().snippets.filter((s) => s.id !== id)
        set({ snippets: updated })
        get().worker?.postMessage({
          snippets: updated,
          systemDefaults: DYNAMIC_SYSTEM_DEFAULTS,
          query: get().searchQuery,
          showDefaults: get().showDefaults,
        })
      },
    }),
    {
      name: 'gaia-snippets-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        snippets: state.snippets.filter((s) => !s.isDefault),
      }),
    }
  )
)

// Optimized atomic selector reference
export const useFilteredSnippets = () => useSnippetStore((state) => state.filteredSnippets)