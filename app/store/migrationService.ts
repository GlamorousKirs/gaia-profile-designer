import { clear, createStore } from "idb-keyval";
import { useSnippetStore } from "./useSnippetStore";
import type { Snippet } from "./useSnippetStore";
import { useProfileStore } from "./useProfileStore";
import { z } from "zod";

const SnippetValidationSchema = z.object({
	id: z.string().max(100),
	title: z.string().max(200),
	code: z.string().max(50000),
	isDefault: z.boolean().optional(),
	updatedAt: z.string().datetime().optional(),
});

const MigrationSchema = z.object({
	timestamp: z.string().datetime(),
	gstudioLocalStorage: z.record(z.string(), z.string()),
	snippetsState: z.record(z.string(), SnippetValidationSchema),
});

type MigrationData = z.infer<typeof MigrationSchema>;

const DATABASE_NAME = "gaia-profile-designer";
const STORE_NAME = "snippets";
const PREFIX = "gstudio-";

const migrationDbStore = createStore(DATABASE_NAME, STORE_NAME);

const getGStudioLocalStorageData = (): Record<string, string> => {
	const data: Record<string, string> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && key.startsWith(PREFIX)) {
			data[key] = localStorage.getItem(key) || "";
		}
	}
	return data;
};

export const migrationService = {
	exportSystemData: async (): Promise<MigrationData> => {
		const localStorageData = getGStudioLocalStorageData();

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DATABASE_NAME);
			request.onerror = () => reject(new Error("Failed to read database container"));
			request.onsuccess = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.close();
					return resolve({
						timestamp: new Date().toISOString(),
						gstudioLocalStorage: localStorageData,
						snippetsState: {},
					});
				}

				const transaction = db.transaction(STORE_NAME, "readonly");
				const store = transaction.objectStore(STORE_NAME);
				const cursorRequest = store.openCursor();
				const customSnippets: Record<string, Snippet> = {};

				cursorRequest.onsuccess = (e) => {
					const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
					if (cursor) {
						customSnippets[cursor.value.id] = cursor.value;
						cursor.continue();
					} else {
						db.close();
						resolve({
							timestamp: new Date().toISOString(),
							gstudioLocalStorage: localStorageData,
							snippetsState: customSnippets,
						});
					}
				};
				cursorRequest.onerror = () => {
					db.close();
					reject(new Error("Cursor read failure inside store context"));
				};
			};
		});
	},

	importSystemData: async (data: unknown): Promise<void> => {
		const parsedData = MigrationSchema.parse(data);

		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith(PREFIX)) {
				localStorage.removeItem(key);
			}
		}

		for (const [key, value] of Object.entries(parsedData.gstudioLocalStorage)) {
			if (key.startsWith(PREFIX)) {
				localStorage.setItem(key, String(value));
			}
		}

		await clear(migrationDbStore);

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DATABASE_NAME);
			request.onerror = () => reject(new Error("Unable to access database context"));

			request.onsuccess = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				try {
					const transaction = db.transaction(STORE_NAME, "readwrite");
					const store = transaction.objectStore(STORE_NAME);

					transaction.oncomplete = async () => {
						db.close();
						try {
							await useSnippetStore.getState().initializeStore();
							resolve();
						} catch (err) {
							reject(err);
						}
					};

					for (const [key, value] of Object.entries(parsedData.snippetsState)) {
						store.put(value, key);
					}
				} catch (err) {
					db.close();
					reject(err);
				}
			};
		});
	},

	purgeSystemData: async (): Promise<void> => {
		for (let i = localStorage.length - 1; i >= 0; i--) {
			const key = localStorage.key(i);
			if (key && key.startsWith(PREFIX)) {
				localStorage.removeItem(key);
			}
		}
		sessionStorage.clear();
		try {
			await clear(migrationDbStore);
		} catch (e) {}

		return new Promise((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(DATABASE_NAME);
			deleteRequest.onsuccess = () => resolve();
			deleteRequest.onerror = () => reject(new Error("Failed to drop database"));
		});
	},
};