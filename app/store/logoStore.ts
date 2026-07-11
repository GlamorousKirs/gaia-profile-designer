import { create } from "zustand";
import { get, set, del, entries, createStore } from "idb-keyval";
import { z } from "zod";

const LogoSchema = z.object({
	id: z.string(),
	name: z.string(),
	svgContent: z.string(),
	timestamp: z.number(),
});

export type Logo = z.infer<typeof LogoSchema>;

interface LogoStore {
	logos: Record<string, Logo>;
	addLogo: (name: string, svgContent: string) => Promise<void>;
	deleteLogo: (id: string) => Promise<void>;
	initializeLogos: () => Promise<void>;
}

const logoDbStore = createStore("gaia-profile-designer", "logos");

export const useLogoStore = create<LogoStore>((setActions) => ({
	logos: {},

	initializeLogos: async () => {
		const allEntries = await entries<string, Logo>(logoDbStore);
		const logos: Record<string, Logo> = {};
		for (const [key, value] of allEntries) {
			const result = LogoSchema.safeParse(value);
			if (result.success) {
				logos[key] = result.data;
			}
		}
		setActions({ logos });
	},

	addLogo: async (name, svgContent) => {
		const id = `logo-${Date.now()}`;
		const newLogo: Logo = { id, name, svgContent, timestamp: Date.now() };
		await set(id, newLogo, logoDbStore);
		setActions((prev) => ({
			logos: { ...prev.logos, [id]: newLogo },
		}));
	},

	deleteLogo: async (id) => {
		await del(id, logoDbStore);
		setActions((prev) => {
			const { [id]: _, ...remaining } = prev.logos;
			return { logos: remaining };
		});
	},
}));