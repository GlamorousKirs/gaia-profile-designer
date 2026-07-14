import { db } from "../lib/db";

const STORES = ["snippets", "colorLibraries", "logos", "panels"];

export const migrationService = {
	importSystemData: async (data: any) => {
		if (data.gstudioLocalStorage) {
			Object.entries(data.gstudioLocalStorage).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
		}

		if (data.indexedDB) {
			for (const storeName of STORES) {
				const storeData = data.indexedDB[storeName];
				if (storeData) {
					const table = (db as any)[storeName];
					if (table) {
						const items = Array.isArray(storeData) ? storeData : Object.values(storeData);
						await table.bulkPut(items);
					}
				}
			}
		} 

		else {
			const values = Object.values(data);
			if (values.length > 0) {
				const firstItem = values[0] as any;
				let targetStore = "";

				if ("code" in firstItem) {
					targetStore = "snippets";
				} else if ("colors" in firstItem) {
					targetStore = "colorLibraries";
				} else if ("url" in firstItem) {
					targetStore = "logos";
				}

				if (targetStore && (db as any)[targetStore]) {
					await (db as any)[targetStore].bulkPut(values);
				}
			}
		}
	},

	purgeSystemData: async () => {
		localStorage.clear();
		await db.delete();
		await db.open();
	}
};