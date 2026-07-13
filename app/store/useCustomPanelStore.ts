import { create } from "zustand";
import { db, type CustomPanel } from "@/lib/db";

interface CustomPanelStore {
    panels: Record<string, CustomPanel>;
    loadPanels: () => Promise<void>;
    addPanel: (id: string, data: CustomPanel) => Promise<void>;
    removePanel: (id: string) => Promise<void>;
    updatePanel: (id: string, data: CustomPanel) => Promise<void>;
}

export const useCustomPanelStore = create<CustomPanelStore>((set) => ({
    panels: {},
    loadPanels: async () => {
        const allPanels = await db.panels.toArray();
        const panelMap = allPanels.reduce((acc: Record<string, CustomPanel>, panel: CustomPanel) => {
            acc[panel.id] = panel;
            return acc;
        }, {});
        set({ panels: panelMap });
    },
    addPanel: async (id, data) => {
        await db.panels.put({ ...data, id });
        set((state) => ({ panels: { ...state.panels, [id]: { ...data, id } } }));
    },
    removePanel: async (id) => {
        await db.panels.delete(id);
        set((state) => {
            const newPanels = { ...state.panels };
            delete newPanels[id];
            return { panels: newPanels };
        });
    },
    updatePanel: async (id, data) => {
        await db.panels.put({ ...data, id });
        set((state) => ({ panels: { ...state.panels, [id]: { ...data, id } } }));
    },
}));