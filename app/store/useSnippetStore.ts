import { create } from "zustand";
import { useMemo } from "react";
import { db, type Snippet } from "@/lib/db";

export type { Snippet };
export type SnippetActionType = "prepend" | "append" | "replace" | "append-cursor";

interface SnippetStore {
	snippets: Record<string, Snippet>;
	showDefaults: boolean;
	isLoading: boolean;
	initializeStore: () => Promise<void>;
	setShowDefaults: (show: boolean) => void;
	addSnippet: (title: string, code: string) => Promise<void>;
	updateSnippet: (id: string, code: string) => Promise<void>;
	renameSnippet: (id: string, title: string) => Promise<void>;
	deleteSnippet: (id: string) => void;
}

export const useSnippetStore = create<SnippetStore>((set) => ({
	snippets: {},
	showDefaults: true,
	isLoading: true,

	initializeStore: async () => {
		const snippetFiles = import.meta.glob("/app/default-snippets/*.txt", { query: "?raw", import: "default" });
		
		const defaultSnippets: Snippet[] = [];
		for (const path in snippetFiles) {
			const content = await snippetFiles[path]() as string;
			const fileName = path.split('/').pop()?.replace('.txt', '') || "Untitled";
			const title = fileName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
			
			defaultSnippets.push({
				id: `default-${fileName}`,
				title,
				code: content,
				isReadOnly: true,
			});
		}

		const existingSnippets = await db.snippets.toArray();
		const allSnippets = [...defaultSnippets, ...existingSnippets.filter(s => !s.isReadOnly)];
		
		const snippetMap = allSnippets.reduce((acc, s) => {
			acc[s.id] = s;
			return acc;
		}, {} as Record<string, Snippet>);

		set({ snippets: snippetMap, isLoading: false });
	},

	setShowDefaults: (show) => set({ showDefaults: show }),

	addSnippet: async (title, code) => {
		const id = Math.random().toString(36).substring(2, 8);
		const newSnippet: Snippet = { id, title, code, isReadOnly: false };
		await db.snippets.put(newSnippet);
		set((state) => ({ snippets: { ...state.snippets, [id]: newSnippet } }));
	},

	updateSnippet: async (id, code) => {
		const existing = await db.snippets.get(id) || useSnippetStore.getState().snippets[id];
		if (!existing || existing.isReadOnly) return;
		const updated = { ...existing, code };
		await db.snippets.put(updated);
		set((state) => ({ snippets: { ...state.snippets, [id]: updated } }));
	},

	renameSnippet: async (id, title) => {
		const existing = await db.snippets.get(id) || useSnippetStore.getState().snippets[id];
		if (!existing || existing.isReadOnly) return;
		const updated = { ...existing, title };
		await db.snippets.put(updated);
		set((state) => ({ snippets: { ...state.snippets, [id]: updated } }));
	},

	deleteSnippet: async (id) => {
		const existing = await db.snippets.get(id) || useSnippetStore.getState().snippets[id];
		if (existing?.isReadOnly) return;
		await db.snippets.delete(id);
		set((state) => {
			const { [id]: _, ...remaining } = state.snippets;
			return { snippets: remaining };
		});
	},
}));

export const useFilteredSnippets = () => {
	const snippets = useSnippetStore((state) => state.snippets);
	const showDefaults = useSnippetStore((state) => state.showDefaults);

	return useMemo(() => {
		const all = Object.values(snippets);
		return showDefaults ? all : all.filter(s => !s.isReadOnly);
	}, [snippets, showDefaults]);
};