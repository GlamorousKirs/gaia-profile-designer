import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  username: string
  userId: string
  avatarUrl: string
  setProfile: (profile: Partial<Omit<ProfileState, 'setProfile'>>) => void
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
      name: 'gstudio-user',
    }
  )
)