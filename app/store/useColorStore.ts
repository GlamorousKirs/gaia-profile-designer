import { create } from "zustand";
import { db, type ColorLibrary } from "@/lib/db";

interface ColorStore {
	libraries: Record<string, string[]>;
	loadLibraries: () => Promise<void>;
	saveLibrary: (name: string, colors: string[]) => Promise<void>;
	deleteLibrary: (name: string) => Promise<void>;
}

export const useColorStore = create<ColorStore>((set) => ({
	libraries: {},
	loadLibraries: async () => {
		const all = await db.colorLibraries.toArray();
		const map = all.reduce((acc, lib) => ({ ...acc, [lib.id]: lib.colors }), {});
		set({ libraries: map });
	},
	saveLibrary: async (name, colors) => {
		await db.colorLibraries.put({ id: name, colors });
		set((state) => ({ libraries: { ...state.libraries, [name]: colors } }));
	},
	deleteLibrary: async (name) => {
		await db.colorLibraries.delete(name);
		set((state) => {
			const { [name]: _, ...rest } = state.libraries;
			return { libraries: rest };
		});
	},
}));