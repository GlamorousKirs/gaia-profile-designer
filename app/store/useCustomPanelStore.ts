import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CustomPanel {
	name: string;
	content: string;
}

interface CustomPanelStore {
	panels: Record<string, CustomPanel>;
	addPanel: (id: string, data: CustomPanel) => void;
	removePanel: (id: string) => void;
}

export const useCustomPanelStore = create<CustomPanelStore>()(
	persist(
		(set) => ({
			panels: {},
			addPanel: (id, data) =>
				set((state) => ({
					panels: { ...state.panels, [id]: data },
				})),
			removePanel: (id) =>
				set((state) => {
					const newPanels = { ...state.panels };
					delete newPanels[id];
					return { panels: newPanels };
				}),
		}),
		{
			name: "gstudio-custom-panels",
			storage: createJSONStorage(() => localStorage),
		}
	)
);