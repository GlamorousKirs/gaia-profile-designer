import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

const ProfileSchema = z.object({
	username: z.string(),
	userId: z.string(),
	avatarUrl: z.string(),
});

interface ProfileState extends z.infer<typeof ProfileSchema> {
	setProfile: (profile: Partial<z.infer<typeof ProfileSchema>>) => void;
}

export const useProfileStore = create<ProfileState>()(
	persist(
		(set) => ({
			username: "",
			userId: "",
			avatarUrl: "",
			setProfile: (newProfile) => set((state) => ({ ...state, ...newProfile })),
		}),
		{
			name: "gstudio-user",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				username: state.username,
				userId: state.userId,
				avatarUrl: state.avatarUrl,
			}),
		}
	)
);