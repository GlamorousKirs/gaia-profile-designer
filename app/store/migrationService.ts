import { entries, clear, set, createStore } from 'idb-keyval'
import { useSnippetStore } from './useSnippetStore'
import type { Snippet } from './useSnippetStore'
import { useProfileStore } from './useProfileStore'

interface MigrationSchema {
    version: string
    timestamp: string
    profileState: {
        username: string
        userId: string
        avatarUrl: string
    }
    snippetsState: Record<string, Snippet>
}

const DATABASE_NAME = 'gaia-profile-designer'
const STORE_NAME = 'snippets'

const migrationDbStore = createStore(DATABASE_NAME, STORE_NAME)

export const migrationService = {
    exportSystemData: async (): Promise<MigrationSchema> => {
        const profile = useProfileStore.getState()

        const allEntries = await entries<string, Snippet>(migrationDbStore)
        const customSnippets: Record<string, Snippet> = {}

        for (const [key, value] of allEntries) {
            if (key.length === 6) {
                customSnippets[value.id] = value
            }
        }

        return {
            version: "2.0.0",
            timestamp: new Date().toISOString(),
            profileState: {
                username: profile.username,
                userId: profile.userId,
                avatarUrl: profile.avatarUrl,
            },
            snippetsState: customSnippets,
        }
    },

    importSystemData: async (data: any): Promise<void> => {
        if (!data.profileState || !data.snippetsState) {
            throw new Error("Invalid migration schema structural signature")
        }

        useProfileStore.setState({
            username: data.profileState.username,
            userId: data.profileState.userId,
            avatarUrl: data.profileState.avatarUrl,
        })

        await clear(migrationDbStore)
        for (const [id, snippet] of Object.entries(data.snippetsState)) {
            await set(id, snippet, migrationDbStore)
        }

        await useSnippetStore.getState().initializeStore()
    },

    purgeSystemData: async (): Promise<void> => {
        localStorage.clear()
        sessionStorage.clear()

        try {
            await clear(migrationDbStore)
        } catch (e) {
        }

        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(DATABASE_NAME)

            deleteRequest.onsuccess = () => {
                resolve()
            }

            deleteRequest.onerror = () => {
                reject(new Error("Failed to drop localized database signature"))
            }

            deleteRequest.onblocked = () => {
                resolve()
            }
        })
    }
}