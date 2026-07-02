import { create } from "zustand"

export interface ColumnLayoutState {
	panels: string[]
	column1: string[]
	column2: string[]
	column3: string[]
}

interface ColumnStore {
	columns: ColumnLayoutState
	setColumns: (columns: ColumnLayoutState | ((prev: ColumnLayoutState) => ColumnLayoutState)) => void
}

export const useColumnStore = create<ColumnStore>((set) => ({
	columns: {
		panels: [],
		column1: [],
		column2: [],
		column3: [],
	},
	setColumns: (updater) =>
		set((state) => {
			const nextColumns = typeof updater === "function" ? updater(state.columns) : updater
			
			localStorage.setItem("gstudio-panel-column-assignments", JSON.stringify({
				column1: nextColumns.column1,
				column2: nextColumns.column2,
				column3: nextColumns.column3,
			}))

			return { columns: nextColumns }
		}),
}))