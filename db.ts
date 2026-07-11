import Dexie, { type EntityTable } from 'dexie';

interface Logo {
	id: string;
	name: string;
	svgContent: string;
	timestamp: number;
}

interface Snippet {
	id: string;
	title: string;
	code: string;
	isDefault?: boolean;
}

interface UserPreference {
	key: string;
	value: any;
}

const db = new Dexie('GaiaProfileDatabase') as Dexie & {
	logos: EntityTable<Logo, 'id'>;
	snippets: EntityTable<Snippet, 'id'>;
	preferences: EntityTable<UserPreference, 'key'>;
};

db.version(1).stores({
	logos: 'id, name, timestamp',
	snippets: 'id, title',
	preferences: 'key'
});

export type { Logo, Snippet };
export { db };