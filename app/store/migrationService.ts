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
                        profileState: {
                            username: profile.username || '',
                            userId: profile.userId || '',
                            avatarUrl: profile.avatarUrl || '',
                        },
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
                            profileState: {
                                username: profile.username,
                                userId: profile.userId,
                                avatarUrl: profile.avatarUrl,
                            },
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
        if (!data.profileState || !data.snippetsState) {
            throw new Error("Invalid migration schema structural signature")
        }

        useProfileStore.setState({
            username: String(data.profileState.username || '').slice(0, 100),
            userId: String(data.profileState.userId || '').slice(0, 100),
            avatarUrl: String(data.profileState.avatarUrl || '').slice(0, 500),
        })

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
        localStorage.clear()
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