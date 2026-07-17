import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ColumnLayoutState {
	column1: string[];
	column2: string[];
	column3: string[];
}

interface ColumnLayoutStore {
	columns: ColumnLayoutState;
	setColumns: (updater: ColumnLayoutState | ((prev: ColumnLayoutState) => ColumnLayoutState)) => void;
}

export const useColumnStore = create<ColumnLayoutStore>()(
	persist(
		(set) => ({
			columns: {
				column1: [],
				column2: [],
				column3: []
			},
			setColumns: (updater) => set((state) => ({
				columns: typeof updater === 'function' ? updater(state.columns) : updater
			})),
		}),
		{
			name: "panel-column-assignments",
			storage: createJSONStorage(() => localStorage),
		}
	)
);