import Dexie, { type EntityTable } from 'dexie';

interface CustomPanel {
	id: string;
	name: string;
	content: string;
}

const db = new Dexie('gstudio') as Dexie & {
	panels: EntityTable<CustomPanel, 'id'>;
};

db.version(1).stores({
	panels: 'id, name',
});

export type { CustomPanel };
export { db };