import Dexie, { type EntityTable } from 'dexie';

export interface Logo {
	id: string;
	name: string;
	svgContent: string;
}

export interface Snippet {
	id: string
	title: string
	code: string
	isReadOnly?: boolean
}

export interface ColorLibrary {
	id: string;
	colors: string[];
}

const db = new Dexie('gaia-profile-designer') as Dexie & {
	panels: EntityTable<{ id: string; content: string }, 'id'>;
	logos: EntityTable<Logo, 'id'>;
	snippets: EntityTable<Snippet, 'id'>;
	colorLibraries: EntityTable<ColorLibrary, 'id'>; 
};

db.version(1).stores({
	panels: 'id',
	logos: 'id',
	snippets: 'id',
	colorLibraries: 'id',
});

export { db };