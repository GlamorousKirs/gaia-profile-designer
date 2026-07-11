import { create } from "zustand";
import { z } from "zod";

const ColumnLayoutSchema = z.object({
	panels: z.array(z.string()),
	column1: z.array(z.string()),
	column2: z.array(z.string()),
	column3: z.array(z.string()),
});

export type ColumnLayoutState = z.infer<typeof ColumnLayoutSchema>;

interface ColumnStore {
	columns: ColumnLayoutState;
	setColumns: (updater: ColumnLayoutState | ((prev: ColumnLayoutState) => ColumnLayoutState)) => void;
}

const STORAGE_KEY = "gstudio-panel-column-assignments";

const getInitialState = (): ColumnLayoutState => {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) {
		return {
			panels: [],
			column1: [],
			column2: [],
			column3: [],
		};
	}

	try {
		const parsed = JSON.parse(stored);
		return ColumnLayoutSchema.parse({
			panels: parsed.panels ?? [],
			column1: parsed.column1 ?? [],
			column2: parsed.column2 ?? [],
			column3: parsed.column3 ?? [],
		});
	} catch (error) {
		return {
			panels: [],
			column1: [],
			column2: [],
			column3: [],
		};
	}
};

export const useColumnStore = create<ColumnStore>((set) => ({
	columns: getInitialState(),
	setColumns: (updater) =>
		set((state) => {
			const nextColumns = typeof updater === "function" ? updater(state.columns) : updater;

			const validated = ColumnLayoutSchema.safeParse(nextColumns);
			if (!validated.success) {
				return state;
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify(validated.data));

			return { columns: validated.data };
		}),
}));