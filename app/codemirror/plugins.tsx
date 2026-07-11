import { keymap } from "@codemirror/view"

export const blockDoubleQuote = keymap.of([
	{
		key: '"',
		run: () => true
	}
])