import { create } from "zustand";
import { db, type Logo } from "@/lib/db";

interface LogoStore {
	logos: Record<string, Logo>;
	addLogo: (name: string, svgContent: string) => Promise<void>;
	deleteLogo: (id: string) => Promise<void>;
	initializeLogos: () => Promise<void>;
}

export const useLogoStore = create<LogoStore>((set) => ({
	logos: {},

	initializeLogos: async () => {
		const allLogos = await db.logos.toArray();
		const logoMap = allLogos.reduce((acc, logo) => {
			acc[logo.id] = logo;
			return acc;
		}, {} as Record<string, Logo>);
		set({ logos: logoMap });
	},

	addLogo: async (name, svgContent) => {
		const id = `logo-${Date.now()}`;
		const newLogo: Logo = { id, name, svgContent };
		await db.logos.put(newLogo);
		set((state) => ({ logos: { ...state.logos, [id]: newLogo } }));
	},

	deleteLogo: async (id) => {
		await db.logos.delete(id);
		set((state) => {
			const { [id]: _, ...remaining } = state.logos;
			return { logos: remaining };
		});
	},
}));