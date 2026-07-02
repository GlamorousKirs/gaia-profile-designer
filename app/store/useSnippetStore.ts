import { useMemo } from 'react'
import { create } from 'zustand'
import { get, set, del, entries, createStore } from 'idb-keyval'

export interface Snippet {
	id: string
	title: string
	code: string
	isDefault?: boolean
}

export type SnippetActionType = 'prepend' | 'append' | 'replace' | 'append-cursor'

interface SnippetStore {
	snippets: Record<string, Snippet>
	showDefaults: boolean
	isLoading: boolean

	initializeStore: () => Promise<void>
	setShowDefaults: (show: boolean) => Promise<void>
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

export const useSnippetStore = create<SnippetStore>((setActions, getActions) => ({
	snippets: {},
	showDefaults: true,
	isLoading: true,

	initializeStore: async () => {
		try {
			const savedShowDefaults = await get<boolean>('show_defaults_preference', customDbStore)
			const allEntries = await entries<string, Snippet>(customDbStore)
			const customSnippets: Record<string, Snippet> = {}

			for (const [key, value] of allEntries) {
				if (value && value.id && !value.isDefault) {
					customSnippets[value.id] = value
				}
			}

			setActions({ 
				snippets: customSnippets, 
				showDefaults: savedShowDefaults !== undefined ? savedShowDefaults : true,
				isLoading: false 
			})
		} catch (e) {
			console.error("Failed to load snippets", e)
			setActions({ isLoading: false })
		}
	},

	setShowDefaults: async (show) => {
		try {
			await set('show_defaults_preference', show, customDbStore)
			setActions({ showDefaults: show })
		} catch (e) {
			console.error("Failed to save default visibility preference", e)
			setActions({ showDefaults: show })
		}
	},

	addSnippet: async (title, code) => {
		const state = getActions()
		let id = generateShortId()
		while (state.snippets[id]) {
			id = generateShortId()
		}

		const newSnippet: Snippet = { id, title, code, isDefault: false }

		try {
			await set(id, newSnippet, customDbStore)
			setActions((prev) => ({
				snippets: { ...prev.snippets, [id]: newSnippet }
			}))
		} catch (e) {
			console.error("Failed to persist new snippet to IndexedDB", e)
		}
	},

	updateSnippet: async (id, code) => {
		const state = getActions()
		const target = state.snippets[id]
		if (!target) return

		const updated = { ...target, code }

		try {
			await set(id, updated, customDbStore)
			setActions((prev) => ({
				snippets: { ...prev.snippets, [id]: updated }
			}))
		} catch (e) {
			console.error("Failed to update snippet in IndexedDB", e)
		}
	},

	renameSnippet: async (id, title) => {
		const state = getActions()
		const target = state.snippets[id]
		if (!target) return

		const updated = { ...target, title }

		try {
			await set(id, updated, customDbStore)
			setActions((prev) => ({
				snippets: { ...prev.snippets, [id]: updated }
			}))
		} catch (e) {
			console.error("Failed to rename snippet in IndexedDB", e)
		}
	},

	deleteSnippet: async (id) => {
		try {
			await del(id, customDbStore)
			setActions((prev) => {
				const { [id]: _, ...remaining } = prev.snippets
				return { snippets: remaining }
			})
		} catch (e) {
			console.error("Failed to delete snippet from IndexedDB", e)
		}
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