import { db as newDb } from "@/lib/db";
import Dexie from "dexie";

export async function migrateGStudioToGaia() {
	try {
		// 1. Check if legacy gstudio database exists
		const dbs = await indexedDB.databases();
		if (dbs.some(db => db.name === 'gstudio')) {
			const oldDb = new Dexie('gstudio');
			oldDb.version(2).stores({
				panels: 'id',
				logos: 'id'
			});
			await oldDb.open();

			const oldPanels = await oldDb.table('panels').toArray();
			const oldLogos = await oldDb.table('logos').toArray();

			if (oldPanels.length > 0) await newDb.panels.bulkPut(oldPanels);
			if (oldLogos.length > 0) await newDb.logos.bulkPut(oldLogos);

			oldDb.close();
			await indexedDB.deleteDatabase('gstudio');
			console.log("Migration complete: gstudio transferred to gaia-profile-designer.");
		}

		// 2. Migrate local storage libraries to Dexie
		const libraryData = localStorage.getItem("gstudio-libraries");
		if (libraryData) {
			const libraries = JSON.parse(libraryData);
			for (const [libName, colors] of Object.entries(libraries)) {
				await newDb.colorLibraries.put({
					id: libName,
					colors: colors as string[]
				});
			}
			localStorage.removeItem("gstudio-libraries");
			console.log("Migration complete: color libraries transferred to Dexie.");
		}

		// 3. Automatically delete legacy keyval-store database
		if (dbs.some(db => db.name === 'keyval-store')) {
			await indexedDB.deleteDatabase('keyval-store');
			console.log("Legacy database deleted: keyval-store.");
		}
	} catch (e) {
		console.error("Migration or cleanup failed:", e);
	}
}