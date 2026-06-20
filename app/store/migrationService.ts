import { clear, createStore } from 'idb-keyval'
import { useSnippetStore } from './useSnippetStore'
import type { Snippet } from './useSnippetStore'
import { useProfileStore } from './useProfileStore'
import { z } from 'zod'

const SnippetValidationSchema = z.object({
    id: z.string().max(100),
    name: z.string().max(200),
    code: z.string().max(50000),
    updatedAt: z.string().datetime().optional()
}).strict()

interface MigrationSchema {
    version: string
    timestamp: string
    gstudioLocalStorage: Record<string, string>
    snippetsState: Record<string, Snippet>
}

const DATABASE_NAME = 'gaia-profile-designer'
const STORE_NAME = 'snippets'
const PREFIX = 'gstudio-'

const migrationDbStore = createStore(DATABASE_NAME, STORE_NAME)

// Helper utility to scan and collect all localStorage keys matching our global studio workspace prefix
const getGStudioLocalStorageData = (): Record<string, string> => {
    const data: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(PREFIX)) {
            data[key] = localStorage.getItem(key) || ''
        }
    }
    return data
}

export const migrationService = {
    exportSystemData: async (): Promise<MigrationSchema> => {
        const localStorageData = getGStudioLocalStorageData()

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DATABASE_NAME)
            request.onerror = () => reject(new Error("Failed to read database container"))
            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.close()
                    return resolve({
                        version: "2.0.0",
                        timestamp: new Date().toISOString(),
                        gstudioLocalStorage: localStorageData,
                        snippetsState: {}
                    })
                }

                const transaction = db.transaction(STORE_NAME, 'readonly')
                const store = transaction.objectStore(STORE_NAME)
                const cursorRequest = store.openCursor()
                const customSnippets: Record<string, Snippet> = {}

                cursorRequest.onsuccess = (e) => {
                    const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
                    if (cursor) {
                        const key = String(cursor.key)
                        if (key.length === 6) {
                            customSnippets[cursor.value.id] = cursor.value
                        }
                        cursor.continue()
                    } else {
                        db.close()
                        resolve({
                            version: "2.0.0",
                            timestamp: new Date().toISOString(),
                            gstudioLocalStorage: localStorageData,
                            snippetsState: customSnippets,
                        })
                    }
                }
                cursorRequest.onerror = () => {
                    db.close()
                    reject(new Error("Cursor read failure inside store context"))
                }
            }
        })
    },

    importSystemData: async (data: any): Promise<void> => {
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid import payload structure")
        }
        if (!data.gstudioLocalStorage || !data.snippetsState) {
            throw new Error("Invalid migration schema structural signature")
        }

        // Clean out existing localized configurations safely before writing values down
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith(PREFIX)) {
                localStorage.removeItem(key)
            }
        }

        // Restore completely dynamic key mappings via incoming object tracking
        for (const [key, value] of Object.entries(data.gstudioLocalStorage)) {
            if (key.startsWith(PREFIX)) {
                localStorage.setItem(key, String(value))
            }
        }

        // Force reload state indicators for global React stores to catch current LocalStorage attributes safely bypassing exact type specifications
        const profileStoreState = useProfileStore.getState() as Record<string, any>
        if (profileStoreState && typeof profileStoreState.initializeStore === 'function') {
            await profileStoreState.initializeStore()
        } else {
            // Fallback manual hydration mapping values directly from the dynamic namespace parsing if state hooks lack structural bootstrap variants
            try {
                const rawUser = localStorage.getItem(`${PREFIX}user`)
                if (rawUser) {
                    const parsedUser = JSON.parse(rawUser)
                    useProfileStore.setState({
                        username: String(parsedUser.username || '').slice(0, 100),
                        userId: String(parsedUser.userId || '').slice(0, 100),
                        avatarUrl: String(parsedUser.avatarUrl || '').slice(0, 500),
                    })
                }
            } catch (e) {
                console.warn("Failed back-channel client store update sequence:", e)
            }
        }

        await clear(migrationDbStore)

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DATABASE_NAME)
            request.onerror = () => reject(new Error("Unable to access database context during restore operation"))

            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result

                try {
                    const transaction = db.transaction(STORE_NAME, 'readwrite')
                    const store = transaction.objectStore(STORE_NAME)

                    transaction.oncomplete = async () => {
                        db.close()
                        try {
                            await useSnippetStore.getState().initializeStore()
                            resolve()
                        } catch (err) {
                            reject(err)
                        }
                    }

                    transaction.onerror = () => {
                        db.close()
                        reject(new Error("Atomic payload transaction write routine rolled back"))
                    }

                    for (const key of Object.keys(data.snippetsState)) {
                        if (key === '__proto__' || key === 'constructor') continue

                        const rawSnippet = data.snippetsState[key]
                        const cleanSnippet = SnippetValidationSchema.parse(rawSnippet)

                        store.put(cleanSnippet, key)
                    }
                } catch (parseOrTxErr) {
                    db.close()
                    reject(new Error("Validation failure encountered inside target snippet schema fields"))
                }
            }
        })
    },

    purgeSystemData: async (): Promise<void> => {
        // Purely wipe gstudio scoped entries to maintain sandbox isolation environments
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith(PREFIX)) {
                localStorage.removeItem(key)
            }
        }
        
        sessionStorage.clear()

        try {
            await clear(migrationDbStore)
        } catch (e) {
        }

        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(DATABASE_NAME)

            deleteRequest.onsuccess = () => resolve()
            deleteRequest.onblocked = () => resolve()
            deleteRequest.onerror = () => {
                reject(new Error("Failed to drop localized database signature"))
            }
        })
    }
}